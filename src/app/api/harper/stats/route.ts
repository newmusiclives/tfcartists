import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * GET /api/harper/stats
 * Get Harper team dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Total sponsors
    const totalSponsors = await prisma.sponsor.count();

    // Sponsors by stage
    const sponsorsByStage = await Promise.all([
      prisma.sponsor.count({ where: { pipelineStage: "discovery" } }),
      prisma.sponsor.count({ where: { pipelineStage: "contacted" } }),
      prisma.sponsor.count({ where: { pipelineStage: "interested" } }),
      prisma.sponsor.count({ where: { pipelineStage: "negotiating" } }),
      prisma.sponsor.count({ where: { pipelineStage: "closed" } }),
      prisma.sponsor.count({ where: { pipelineStage: "active" } }),
      prisma.sponsor.count({ where: { pipelineStage: "churned" } }),
    ]);

    // Active sponsorships
    const activeSponsors = await prisma.sponsor.count({
      where: { pipelineStage: { in: ["ACTIVE", "CLOSED"] } },
    });

    // Calculate MRR (Monthly Recurring Revenue)
    const sponsors = await prisma.sponsor.findMany({
      where: { pipelineStage: { in: ["ACTIVE", "CLOSED"] } },
      select: { monthlyAmount: true },
    });

    const mrr = sponsors.reduce((sum, s) => sum + (s.monthlyAmount || 0), 0);

    // Revenue by tier
    const revenueByTier = await Promise.all([
      prisma.sponsor.aggregate({
        where: { sponsorshipTier: "LOCAL_HERO", pipelineStage: { in: ["ACTIVE", "CLOSED"] } },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
      prisma.sponsor.aggregate({
        where: { sponsorshipTier: "BRONZE", pipelineStage: { in: ["ACTIVE", "CLOSED"] } },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
      prisma.sponsor.aggregate({
        where: { sponsorshipTier: "SILVER", pipelineStage: { in: ["ACTIVE", "CLOSED"] } },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
      prisma.sponsor.aggregate({
        where: { sponsorshipTier: "GOLD", pipelineStage: { in: ["ACTIVE", "CLOSED"] } },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
      prisma.sponsor.aggregate({
        where: { sponsorshipTier: "PLATINUM", pipelineStage: { in: ["ACTIVE", "CLOSED"] } },
        _sum: { monthlyAmount: true },
        _count: true,
      }),
    ]);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await prisma.harperActivity.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    // Calls this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const callsThisMonth = await prisma.sponsorCall.count({
      where: { createdAt: { gte: firstDayOfMonth } },
    });

    // Messages sent
    const messagesSent = await prisma.sponsorMessage.count({
      where: {
        role: "harper",
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Calculate artist pool contribution (80% of MRR)
    const artistPoolContribution = mrr * 0.8;
    const stationRevenue = mrr * 0.2;

    logger.info("Harper stats retrieved", { totalSponsors, mrr, activeSponsors });

    return NextResponse.json({
      success: true,
      stats: {
        totalSponsors,
        activeSponsors,
        mrr,
        artistPoolContribution,
        stationRevenue,
        byStage: {
          discovery: sponsorsByStage[0],
          contacted: sponsorsByStage[1],
          interested: sponsorsByStage[2],
          negotiating: sponsorsByStage[3],
          closed: sponsorsByStage[4],
          active: sponsorsByStage[5],
          churned: sponsorsByStage[6],
        },
        revenueByTier: {
          localHero: {
            count: revenueByTier[0]._count,
            revenue: revenueByTier[0]._sum.monthlyAmount || 0,
          },
          bronze: {
            count: revenueByTier[1]._count,
            revenue: revenueByTier[1]._sum.monthlyAmount || 0,
          },
          silver: {
            count: revenueByTier[2]._count,
            revenue: revenueByTier[2]._sum.monthlyAmount || 0,
          },
          gold: {
            count: revenueByTier[3]._count,
            revenue: revenueByTier[3]._sum.monthlyAmount || 0,
          },
          platinum: {
            count: revenueByTier[4]._count,
            revenue: revenueByTier[4]._sum.monthlyAmount || 0,
          },
        },
        activity: {
          recentActions: recentActivity,
          callsThisMonth,
          messagesSent,
        },
      },
    });
  } catch (error: any) {
    logger.error("Failed to retrieve Harper stats", { error: error.message });
    return NextResponse.json(
      { error: "Failed to retrieve stats", details: error.message },
      { status: 500 }
    );
  }
}
