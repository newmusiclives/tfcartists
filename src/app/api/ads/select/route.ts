import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Dynamic Ad Selection API
 *
 * GET /api/ads/select?stationId=x&daypart=morning&count=3
 *
 * Smart weighted selection algorithm:
 * 1. Filter active ads for the station
 * 2. Boost weight for daypart match (2x)
 * 3. Boost weight by tier (platinum=4x, gold=3x, silver=2x, bronze=1x)
 * 4. Penalize ads near their play cap (if set in metadata)
 * 5. Weighted random selection without replacement
 * 6. Track impressions on selection
 */

const TIER_MULTIPLIER: Record<string, number> = {
  platinum: 4,
  gold: 3,
  silver: 2,
  bronze: 1,
};

const DAYPARTS = ["overnight", "morning", "midday", "afternoon", "evening"] as const;
type Daypart = (typeof DAYPARTS)[number];

interface AdMetadata {
  daypartTargets?: string[];
  maxImpressions?: number;
  frequencyCap?: number; // max plays per hour
  priorityOverride?: number;
}

function getMetadata(ad: { metadata: unknown }): AdMetadata {
  if (ad.metadata && typeof ad.metadata === "object") {
    return ad.metadata as AdMetadata;
  }
  return {};
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const stationId = url.searchParams.get("stationId");
    const daypart = url.searchParams.get("daypart") as Daypart | null;
    const count = Math.min(parseInt(url.searchParams.get("count") || "3"), 10);

    if (!stationId) {
      return NextResponse.json({ error: "stationId required" }, { status: 400 });
    }

    // Fetch all active ads for this station
    const ads = await prisma.sponsorAd.findMany({
      where: {
        stationId,
        isActive: true,
        audioFilePath: { not: null }, // Must have audio ready
      },
      include: {
        musicBed: true,
      },
    });

    if (ads.length === 0) {
      return NextResponse.json({ ads: [], message: "No active ads available" });
    }

    // Calculate effective weight for each ad
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);

    const weightedAds = ads.map((ad) => {
      const meta = getMetadata(ad);
      let effectiveWeight = ad.weight;

      // Tier multiplier
      const tierMult = TIER_MULTIPLIER[ad.tier] || 1;
      effectiveWeight *= tierMult;

      // Daypart match boost (2x if ad targets this daypart or has no daypart preference)
      if (daypart && meta.daypartTargets && meta.daypartTargets.length > 0) {
        if (meta.daypartTargets.includes(daypart)) {
          effectiveWeight *= 2;
        } else {
          // Reduce weight if ad specifically targets other dayparts
          effectiveWeight *= 0.3;
        }
      }

      // Priority override from admin
      if (meta.priorityOverride && meta.priorityOverride > 0) {
        effectiveWeight *= meta.priorityOverride;
      }

      // Penalize if near max impressions
      if (meta.maxImpressions && meta.maxImpressions > 0) {
        const remaining = meta.maxImpressions - ad.playCount;
        if (remaining <= 0) {
          effectiveWeight = 0; // Exhausted budget
        } else {
          const ratio = remaining / meta.maxImpressions;
          // Gentle curve: only penalize heavily when <10% remaining
          effectiveWeight *= Math.max(0.1, ratio);
        }
      }

      // Recency penalty: reduce weight if played very recently (within last 10 min)
      if (ad.lastPlayedAt) {
        const minSinceLast = (now.getTime() - new Date(ad.lastPlayedAt).getTime()) / 60000;
        if (minSinceLast < 10) {
          effectiveWeight *= 0.2;
        } else if (minSinceLast < 30) {
          effectiveWeight *= 0.5;
        }
      }

      return { ad, effectiveWeight: Math.max(0, effectiveWeight) };
    });

    // Weighted random selection without replacement
    const selected: typeof ads = [];
    const pool = [...weightedAds];

    for (let i = 0; i < count && pool.length > 0; i++) {
      const totalWeight = pool.reduce((sum, item) => sum + item.effectiveWeight, 0);

      if (totalWeight <= 0) break;

      let rand = Math.random() * totalWeight;
      let chosenIdx = 0;

      for (let j = 0; j < pool.length; j++) {
        rand -= pool[j].effectiveWeight;
        if (rand <= 0) {
          chosenIdx = j;
          break;
        }
      }

      selected.push(pool[chosenIdx].ad);
      pool.splice(chosenIdx, 1);
    }

    // Track impressions for selected ads
    if (selected.length > 0) {
      await Promise.all(
        selected.map((ad) =>
          prisma.sponsorAd.update({
            where: { id: ad.id },
            data: {
              playCount: { increment: 1 },
              lastPlayedAt: now,
            },
          })
        )
      );
    }

    logger.info("Ad selection completed", {
      stationId,
      daypart: daypart || "none",
      requested: count,
      available: ads.length,
      selected: selected.length,
    });

    return NextResponse.json({
      ads: selected.map((ad) => ({
        id: ad.id,
        sponsorName: ad.sponsorName,
        adTitle: ad.adTitle,
        audioFilePath: ad.audioFilePath,
        durationSeconds: ad.durationSeconds,
        tier: ad.tier,
        weight: ad.weight,
      })),
    });
  } catch (error) {
    logger.error("Ad selection failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Ad selection failed" },
      { status: 500 }
    );
  }
}
