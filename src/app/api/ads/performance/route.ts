import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Ad Performance API
 *
 * GET /api/ads/performance?stationId=x
 *
 * Returns performance stats for all active ads:
 * - Per ad: impressions, remaining budget, fill rate, tier
 * - Overall: total impressions today/week/month, fill rate, revenue estimate
 */

const TIER_MONTHLY_RATES: Record<string, number> = {
  bronze: 50,
  silver: 150,
  gold: 350,
  platinum: 750,
};

interface AdMetadata {
  daypartTargets?: string[];
  maxImpressions?: number;
  frequencyCap?: number;
  priorityOverride?: number;
}

function getMetadata(meta: unknown): AdMetadata {
  if (meta && typeof meta === "object") return meta as AdMetadata;
  return {};
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const stationId = url.searchParams.get("stationId");

    if (!stationId) {
      return NextResponse.json({ error: "stationId required" }, { status: 400 });
    }

    const ads = await prisma.sponsorAd.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build per-ad stats
    const adStats = ads.map((ad) => {
      const meta = getMetadata(ad.metadata);
      const maxImpressions = meta.maxImpressions || 0;
      const remaining = maxImpressions > 0 ? Math.max(0, maxImpressions - ad.playCount) : null;
      const fillRate = maxImpressions > 0
        ? Math.round((ad.playCount / maxImpressions) * 100)
        : null;

      const daypartTargets = meta.daypartTargets || [];

      return {
        id: ad.id,
        sponsorName: ad.sponsorName,
        adTitle: ad.adTitle,
        tier: ad.tier,
        isActive: ad.isActive,
        weight: ad.weight,
        impressions: ad.playCount,
        maxImpressions: maxImpressions || null,
        remaining,
        fillRate,
        lastPlayedAt: ad.lastPlayedAt,
        daypartTargets,
        createdAt: ad.createdAt,
        estimatedRevenue: TIER_MONTHLY_RATES[ad.tier] || 0,
      };
    });

    // Overall stats
    const activeAds = ads.filter((a) => a.isActive);
    const totalImpressions = ads.reduce((s, a) => s + a.playCount, 0);

    // For time-bucketed stats, we approximate using lastPlayedAt
    // since we don't have a separate impressions log table
    const impressionsToday = activeAds.filter(
      (a) => a.lastPlayedAt && new Date(a.lastPlayedAt) >= todayStart
    ).length;

    const impressionsThisWeek = activeAds.filter(
      (a) => a.lastPlayedAt && new Date(a.lastPlayedAt) >= weekStart
    ).length;

    // Revenue estimate based on active tiers
    const monthlyRevenueEstimate = activeAds.reduce(
      (sum, ad) => sum + (TIER_MONTHLY_RATES[ad.tier] || 0),
      0
    );

    // Fill rate: ads with budgets that have been used
    const adsWithBudget = adStats.filter((a) => a.maxImpressions !== null);
    const overallFillRate = adsWithBudget.length > 0
      ? Math.round(
          adsWithBudget.reduce((s, a) => s + (a.fillRate || 0), 0) /
            adsWithBudget.length
        )
      : null;

    // Daypart distribution from active ads
    const daypartCounts: Record<string, number> = {
      overnight: 0,
      morning: 0,
      midday: 0,
      afternoon: 0,
      evening: 0,
    };
    activeAds.forEach((ad) => {
      const meta = getMetadata(ad.metadata);
      const targets = meta.daypartTargets || [];
      if (targets.length === 0) {
        // Untargeted ads count toward all dayparts
        Object.keys(daypartCounts).forEach((d) => daypartCounts[d]++);
      } else {
        targets.forEach((d) => {
          if (daypartCounts[d] !== undefined) daypartCounts[d]++;
        });
      }
    });

    logger.info("Ad performance query", { stationId, totalAds: ads.length });

    return NextResponse.json({
      ads: adStats,
      summary: {
        totalAds: ads.length,
        activeAds: activeAds.length,
        totalImpressions,
        activeAdsPlayedToday: impressionsToday,
        activeAdsPlayedThisWeek: impressionsThisWeek,
        overallFillRate,
        monthlyRevenueEstimate,
        daypartDistribution: daypartCounts,
      },
    });
  } catch (error) {
    logger.error("Ad performance query failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Performance query failed" },
      { status: 500 }
    );
  }
}
