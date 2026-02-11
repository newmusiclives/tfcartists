import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

/**
 * GET /api/harper/stats
 *
 * Returns Harper team dashboard statistics with real Prisma queries.
 *
 * Response includes:
 * - totalSponsors, byStatus counts
 * - totalMonthlyRevenue (sum of active sponsorship amounts)
 * - activeSponsorships count
 * - callsThisMonth, dealsClosedThisMonth
 * - Plus: byStage, revenueByTier, activity summary
 */
export async function GET(request: NextRequest) {
  try {
    // Date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallel queries for better performance
    const [
      totalSponsors,
      // byStatus counts
      discoveredCount,
      contactedCount,
      interestedCount,
      negotiatingCount,
      closedCount,
      activeStatusCount,
      churnedCount,
      unresponsiveCount,
      // byStage counts
      discoveryStage,
      contactedStage,
      interestedStage,
      negotiatingStage,
      closedStage,
      activeStage,
      churnedStage,
      // Sponsorship-based metrics
      activeSponsorships,
      activeSponsorshipRevenue,
      // Activity metrics
      callsThisMonth,
      dealsClosedThisMonth,
      recentActivity,
      messagesSent,
      // Revenue by tier
      revenueLocalHero,
      revenueBronze,
      revenueSilver,
      revenueGold,
      revenuePlatinum,
    ] = await Promise.all([
      // Total sponsors (excluding soft-deleted)
      prisma.sponsor.count({ where: { deletedAt: null } }),

      // --- byStatus (SponsorStatus enum) ---
      prisma.sponsor.count({
        where: { status: "DISCOVERED", deletedAt: null },
      }),
      prisma.sponsor.count({
        where: { status: "CONTACTED", deletedAt: null },
      }),
      prisma.sponsor.count({
        where: { status: "INTERESTED", deletedAt: null },
      }),
      prisma.sponsor.count({
        where: { status: "NEGOTIATING", deletedAt: null },
      }),
      prisma.sponsor.count({ where: { status: "CLOSED", deletedAt: null } }),
      prisma.sponsor.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.sponsor.count({ where: { status: "CHURNED", deletedAt: null } }),
      prisma.sponsor.count({
        where: { status: "UNRESPONSIVE", deletedAt: null },
      }),

      // --- byStage (pipelineStage string) ---
      prisma.sponsor.count({
        where: { pipelineStage: "discovery", deletedAt: null },
      }),
      prisma.sponsor.count({
        where: { pipelineStage: "contacted", deletedAt: null },
      }),
      prisma.sponsor.count({
        where: { pipelineStage: "interested", deletedAt: null },
      }),
      prisma.sponsor.count({
        where: { pipelineStage: "negotiating", deletedAt: null },
      }),
      prisma.sponsor.count({
        where: { pipelineStage: "closed", deletedAt: null },
      }),
      prisma.sponsor.count({
        where: { pipelineStage: "active", deletedAt: null },
      }),
      prisma.sponsor.count({
        where: { pipelineStage: "churned", deletedAt: null },
      }),

      // --- Sponsorship-based metrics (from Sponsorship table) ---
      prisma.sponsorship.count({ where: { status: "active" } }),

      prisma.sponsorship.aggregate({
        where: { status: "active" },
        _sum: { monthlyAmount: true },
      }),

      // --- Activity metrics ---
      prisma.sponsorCall.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Deals closed this month (sponsorships created this month)
      prisma.sponsorship.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      prisma.harperActivity.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      prisma.sponsorMessage.count({
        where: {
          role: "harper",
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // --- Revenue by tier ---
      prisma.sponsor.aggregate({
        where: {
          sponsorshipTier: "LOCAL_HERO",
          status: "ACTIVE",
          deletedAt: null,
        },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
      prisma.sponsor.aggregate({
        where: {
          sponsorshipTier: "BRONZE",
          status: "ACTIVE",
          deletedAt: null,
        },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
      prisma.sponsor.aggregate({
        where: {
          sponsorshipTier: "SILVER",
          status: "ACTIVE",
          deletedAt: null,
        },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
      prisma.sponsor.aggregate({
        where: {
          sponsorshipTier: "GOLD",
          status: "ACTIVE",
          deletedAt: null,
        },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
      prisma.sponsor.aggregate({
        where: {
          sponsorshipTier: "PLATINUM",
          status: "ACTIVE",
          deletedAt: null,
        },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
    ]);

    const totalMonthlyRevenue =
      activeSponsorshipRevenue._sum.monthlyAmount || 0;

    return NextResponse.json({
      totalSponsors,
      byStatus: {
        DISCOVERED: discoveredCount,
        CONTACTED: contactedCount,
        INTERESTED: interestedCount,
        NEGOTIATING: negotiatingCount,
        CLOSED: closedCount,
        ACTIVE: activeStatusCount,
        CHURNED: churnedCount,
        UNRESPONSIVE: unresponsiveCount,
      },
      totalMonthlyRevenue,
      activeSponsorships,
      callsThisMonth,
      dealsClosedThisMonth,
      // Extended data (preserving useful metrics from original implementation)
      byStage: {
        discovery: discoveryStage,
        contacted: contactedStage,
        interested: interestedStage,
        negotiating: negotiatingStage,
        closed: closedStage,
        active: activeStage,
        churned: churnedStage,
      },
      revenueByTier: {
        localHero: {
          count: revenueLocalHero._count,
          revenue: revenueLocalHero._sum.monthlyAmount || 0,
        },
        bronze: {
          count: revenueBronze._count,
          revenue: revenueBronze._sum.monthlyAmount || 0,
        },
        silver: {
          count: revenueSilver._count,
          revenue: revenueSilver._sum.monthlyAmount || 0,
        },
        gold: {
          count: revenueGold._count,
          revenue: revenueGold._sum.monthlyAmount || 0,
        },
        platinum: {
          count: revenuePlatinum._count,
          revenue: revenuePlatinum._sum.monthlyAmount || 0,
        },
      },
      activity: {
        recentActions: recentActivity,
        callsThisMonth,
        messagesSent,
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/harper/stats");
  }
}
