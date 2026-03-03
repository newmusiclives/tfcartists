import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";
import { orgWhere } from "@/lib/db-scoped";

export const dynamic = "force-dynamic";

/**
 * GET /api/elliot/stats
 * Returns dashboard statistics for Elliot's listener growth engine
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("elliot");
    if (!session) return unauthorized();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      // Listener counts by status
      totalListeners,
      newCount,
      activeCount,
      powerUserCount,
      atRiskCount,
      churnedCount,
      reactivatedCount,
      // Listener counts by tier
      casualCount,
      regularCount,
      superFanCount,
      evangelistCount,
      // Behavior metrics
      behaviorAggregates,
      // Growth metrics
      newThisWeek,
      newThisMonth,
      churnedThisWeek,
      // Content metrics
      totalContent,
      contentAggregates,
      // Campaign metrics
      activeCampaigns,
      campaignGoalAggregates,
      // Activity metrics
      recentActivities,
      engagementsThisMonth,
      // Community metrics
      communityMembers,
      scoutCount,
    ] = await Promise.all([
      // --- Listener counts by status ---
      prisma.listener.count({ where: { ...orgWhere(session) } }),
      prisma.listener.count({ where: { status: "NEW", ...orgWhere(session) } }),
      prisma.listener.count({ where: { status: "ACTIVE", ...orgWhere(session) } }),
      prisma.listener.count({ where: { status: "POWER_USER", ...orgWhere(session) } }),
      prisma.listener.count({ where: { status: "AT_RISK", ...orgWhere(session) } }),
      prisma.listener.count({ where: { status: "CHURNED", ...orgWhere(session) } }),
      prisma.listener.count({ where: { status: "REACTIVATED", ...orgWhere(session) } }),

      // --- Listener counts by tier ---
      prisma.listener.count({ where: { tier: "CASUAL", ...orgWhere(session) } }),
      prisma.listener.count({ where: { tier: "REGULAR", ...orgWhere(session) } }),
      prisma.listener.count({ where: { tier: "SUPER_FAN", ...orgWhere(session) } }),
      prisma.listener.count({ where: { tier: "EVANGELIST", ...orgWhere(session) } }),

      // --- Behavior aggregates ---
      prisma.listener.aggregate({
        where: { ...orgWhere(session) },
        _sum: { totalSessions: true, totalListeningHours: true },
        _avg: { averageSessionLength: true, listeningStreak: true },
      }),

      // --- Growth metrics ---
      prisma.listener.count({ where: { ...orgWhere(session), createdAt: { gte: startOfWeek } } }),
      prisma.listener.count({ where: { ...orgWhere(session), createdAt: { gte: startOfMonth } } }),
      prisma.listener.count({
        where: { status: "CHURNED", ...orgWhere(session), updatedAt: { gte: startOfWeek } },
      }),

      // --- Content metrics ---
      prisma.viralContent.count(),
      prisma.viralContent.aggregate({
        _sum: { views: true, shares: true, newListeners: true },
      }),

      // --- Campaign metrics ---
      prisma.growthCampaign.count({ where: { status: "active" } }),
      prisma.growthCampaign.aggregate({
        where: { status: "active" },
        _sum: { goalReached: true, goalTarget: true },
      }),

      // --- Activity metrics ---
      prisma.elliotActivity.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.listenerEngagement.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // --- Community metrics ---
      prisma.listener.count({ where: { communityMember: true, ...orgWhere(session) } }),
      prisma.scout.count(),
    ]);

    // Calculate returning listener percentage
    const activeAndPower = activeCount + powerUserCount + reactivatedCount;
    const returningListenerPercent =
      totalListeners > 0
        ? Math.round((activeAndPower / totalListeners) * 100)
        : 0;

    return NextResponse.json({
      totalListeners,
      byStatus: {
        NEW: newCount,
        ACTIVE: activeCount,
        POWER_USER: powerUserCount,
        AT_RISK: atRiskCount,
        CHURNED: churnedCount,
        REACTIVATED: reactivatedCount,
      },
      byTier: {
        CASUAL: casualCount,
        REGULAR: regularCount,
        SUPER_FAN: superFanCount,
        EVANGELIST: evangelistCount,
      },
      behavior: {
        totalSessions: behaviorAggregates._sum.totalSessions || 0,
        totalListeningHours: behaviorAggregates._sum.totalListeningHours || 0,
        avgSessionLength: Math.round((behaviorAggregates._avg.averageSessionLength || 0) * 10) / 10,
        avgStreak: Math.round((behaviorAggregates._avg.listeningStreak || 0) * 10) / 10,
      },
      growth: {
        newThisWeek,
        newThisMonth,
        churnedThisWeek,
        returningListenerPercent,
      },
      content: {
        totalContent,
        totalViews: contentAggregates._sum.views || 0,
        totalShares: contentAggregates._sum.shares || 0,
        totalConversions: contentAggregates._sum.newListeners || 0,
      },
      campaigns: {
        activeCampaigns,
        totalGoalReached: campaignGoalAggregates._sum.goalReached || 0,
        totalGoalTarget: campaignGoalAggregates._sum.goalTarget || 0,
      },
      activity: {
        recentActivities,
        engagementsThisMonth,
      },
      community: {
        communityMembers,
        scoutCount,
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/elliot/stats");
  }
}
