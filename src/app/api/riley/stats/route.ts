import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/riley/stats
 * Returns dashboard statistics for Riley's artist acquisition team
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalArtists,
      freeCount,
      tier5Count,
      tier20Count,
      tier50Count,
      tier120Count,
      pendingSubmissions,
      approvedThisMonth,
      rejectedThisMonth,
      revenuePool,
    ] = await Promise.all([
      prisma.artist.count({ where: { deletedAt: null } }),
      prisma.artist.count({ where: { airplayTier: "FREE", deletedAt: null } }),
      prisma.artist.count({ where: { airplayTier: "TIER_5", deletedAt: null } }),
      prisma.artist.count({ where: { airplayTier: "TIER_20", deletedAt: null } }),
      prisma.artist.count({ where: { airplayTier: "TIER_50", deletedAt: null } }),
      prisma.artist.count({ where: { airplayTier: "TIER_120", deletedAt: null } }),
      prisma.submission.count({ where: { status: "PENDING" } }),
      prisma.submission.count({
        where: {
          status: "PLACED",
          awardedAt: { gte: startOfMonth },
        },
      }),
      prisma.submission.count({
        where: {
          status: "NOT_PLACED",
          judgingCompletedAt: { gte: startOfMonth },
        },
      }),
      prisma.radioRevenuePool.findFirst({ orderBy: { createdAt: "desc" } }),
    ]);

    // Calculate shares and revenue
    const totalShares =
      freeCount * 1 +
      tier5Count * 5 +
      tier20Count * 25 +
      tier50Count * 75 +
      tier120Count * 200;

    const monthlyRevenue =
      tier5Count * 5 +
      tier20Count * 20 +
      tier50Count * 50 +
      tier120Count * 120;

    return NextResponse.json({
      totalArtists,
      byTier: {
        FREE: freeCount,
        BRONZE: tier5Count,
        SILVER: tier20Count,
        GOLD: tier50Count,
        PLATINUM: tier120Count,
      },
      monthlyRevenue,
      totalShares,
      pendingSubmissions,
      approvedThisMonth,
      rejectedThisMonth,
      latestRevenuePool: revenuePool
        ? {
            period: revenuePool.period,
            totalAdRevenue: revenuePool.totalAdRevenue,
            artistPoolAmount: revenuePool.artistPoolAmount,
            perShareValue: revenuePool.perShareValue,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error, "/api/riley/stats");
  }
}
