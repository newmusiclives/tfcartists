import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

/**
 * Revenue Distribution Cron Job
 * Runs on the 1st of every month at 2:00 AM
 *
 * Tasks:
 * 1. Calculate total ad revenue for previous month
 * 2. Determine Artist Pool (80% of ad revenue)
 * 3. Calculate total shares across all artists
 * 4. Distribute revenue proportionally
 * 5. Create payout records
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/revenue-monthly",
 *     "schedule": "0 2 1 * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET || "development-secret";

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/revenue-monthly" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("Starting monthly revenue distribution");

    // Get previous month period (YYYY-MM format)
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, "0")}`;

    logger.info(`Processing revenue for period: ${period}`);

    // Check if already distributed
    const existing = await prisma.radioRevenuePool.findUnique({
      where: { period },
    });

    if (existing && existing.distributionComplete) {
      logger.warn(`Revenue already distributed for period ${period}`);
      return NextResponse.json({
        success: false,
        message: `Revenue already distributed for period ${period}`,
      });
    }

    // 1. Calculate total sponsorship revenue for the period
    const sponsorships = await prisma.sponsorship.findMany({
      where: {
        status: "active",
        startDate: {
          lte: previousMonth,
        },
        OR: [
          { endDate: null },
          {
            endDate: {
              gte: previousMonth,
            },
          },
        ],
      },
    });

    const totalAdRevenue = sponsorships.reduce(
      (sum, s) => sum + s.monthlyAmount,
      0
    );

    // 2. Calculate Artist Pool (80% of ad revenue)
    const artistPoolAmount = totalAdRevenue * 0.8;

    // 3. Get all active artists and their shares
    const artists = await prisma.artist.findMany({
      where: {
        airplayActivatedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        airplayTier: true,
        airplayShares: true,
      },
    });

    // Calculate total shares
    const totalShares = artists.reduce((sum, a) => sum + a.airplayShares, 0);

    // Calculate per-share value
    const perShareValue = totalShares > 0 ? artistPoolAmount / totalShares : 0;

    // Count artists by tier
    const tierCounts = {
      freeArtists: artists.filter((a) => a.airplayTier === "FREE").length,
      tier5Artists: artists.filter((a) => a.airplayTier === "TIER_5").length,
      tier20Artists: artists.filter((a) => a.airplayTier === "TIER_20").length,
      tier50Artists: artists.filter((a) => a.airplayTier === "TIER_50").length,
      tier120Artists: artists.filter((a) => a.airplayTier === "TIER_120").length,
    };

    // 4. Create revenue pool record
    const pool = await prisma.radioRevenuePool.upsert({
      where: { period },
      update: {
        totalAdRevenue,
        artistPoolAmount,
        totalShares,
        perShareValue,
        ...tierCounts,
        distributedAt: new Date(),
        distributionComplete: true,
      },
      create: {
        period,
        totalAdRevenue,
        artistPoolAmount,
        totalShares,
        perShareValue,
        ...tierCounts,
        distributedAt: new Date(),
        distributionComplete: true,
      },
    });

    // 5. Create individual earnings records
    const earningsRecords: Array<{
      artistId: string;
      period: string;
      tier: string;
      shares: number;
      earnings: number;
      paid: boolean;
    }> = [];

    for (const artist of artists) {
      const earnings = artist.airplayShares * perShareValue;

      earningsRecords.push({
        artistId: artist.id,
        period,
        tier: artist.airplayTier,
        shares: artist.airplayShares,
        earnings,
        paid: false,
      });
    }

    // Bulk create earnings records
    // Note: The database has a unique constraint on [artistId, period]
    // so duplicates will be prevented at the DB level
    await prisma.radioEarnings.createMany({
      data: earningsRecords,
    });

    logger.info("Monthly revenue distribution completed", {
      period,
      totalAdRevenue,
      artistPoolAmount,
      totalShares,
      perShareValue,
      artistsCount: artists.length,
    });

    return NextResponse.json({
      success: true,
      message: "Revenue distribution completed",
      data: {
        period,
        totalAdRevenue,
        artistPoolAmount,
        perShareValue,
        totalArtists: artists.length,
        totalShares,
        tierCounts,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error("Monthly revenue distribution failed", { error });

    return NextResponse.json(
      {
        error: "Revenue distribution failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
