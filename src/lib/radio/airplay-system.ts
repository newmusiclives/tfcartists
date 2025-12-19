/**
 * TrueFans RADIO Airplay System
 *
 * Manages airplay tiers, revenue pool distribution, and artist shares
 */

import { prisma } from "@/lib/db";

export type AirplayTier = "FREE" | "TIER_5" | "TIER_20" | "TIER_50" | "TIER_120";

/**
 * Airplay tier configuration
 */
export const AIRPLAY_TIERS = {
  FREE: {
    name: "Free Airplay",
    price: 0,
    shares: 1,
    description: "Get your music on TrueFans RADIO for free!",
    features: [
      "Your track in rotation",
      "1 share in the Artist Pool",
      "Monthly revenue distribution",
      "Station promotion",
    ],
  },
  TIER_5: {
    name: "Bronze Airplay",
    price: 5,
    shares: 5,
    description: "5x more airplay and pool shares",
    features: [
      "Everything in Free",
      "5 shares in the Artist Pool (5x earnings)",
      "Priority rotation",
      "Featured artist spotlight",
    ],
  },
  TIER_20: {
    name: "Silver Airplay",
    price: 20,
    shares: 25,
    description: "25x more airplay and pool shares",
    features: [
      "Everything in Bronze",
      "25 shares in the Artist Pool (25x earnings)",
      "Heavy rotation",
      "Social media features",
      "Artist interview segment",
    ],
  },
  TIER_50: {
    name: "Gold Airplay",
    price: 50,
    shares: 75,
    description: "75x more airplay and pool shares",
    features: [
      "Everything in Silver",
      "75 shares in the Artist Pool (75x earnings)",
      "Power rotation",
      "Dedicated show segment",
      "Playlist inclusion",
      "Concert announcements",
    ],
  },
  TIER_120: {
    name: "Platinum Airplay",
    price: 120,
    shares: 200,
    description: "200x more airplay and maximum pool shares",
    features: [
      "Everything in Gold",
      "200 shares in the Artist Pool (200x earnings)",
      "Maximum rotation",
      "Artist takeover hour",
      "Exclusive interviews",
      "VIP event promotion",
      "Direct fan messaging",
    ],
  },
} as const;

/**
 * Get shares for a tier
 */
export function getSharesForTier(tier: AirplayTier): number {
  return AIRPLAY_TIERS[tier].shares;
}

/**
 * Get tier info
 */
export function getTierInfo(tier: AirplayTier) {
  return AIRPLAY_TIERS[tier];
}

/**
 * Calculate revenue pool for a period
 */
export async function calculateRevenuePool(period: string) {
  // Get all active artists for this period
  const artists = await prisma.artist.findMany({
    where: {
      airplayActivatedAt: { not: null },
      status: { notIn: ["DORMANT", "UNRESPONSIVE"] },
    },
    select: {
      id: true,
      airplayTier: true,
      airplayShares: true,
    },
  });

  // Count artists by tier
  const tierCounts = {
    freeArtists: 0,
    tier5Artists: 0,
    tier20Artists: 0,
    tier50Artists: 0,
    tier120Artists: 0,
  };

  let totalShares = 0;

  artists.forEach((artist) => {
    totalShares += artist.airplayShares;

    switch (artist.airplayTier) {
      case "FREE":
        tierCounts.freeArtists++;
        break;
      case "TIER_5":
        tierCounts.tier5Artists++;
        break;
      case "TIER_20":
        tierCounts.tier20Artists++;
        break;
      case "TIER_50":
        tierCounts.tier50Artists++;
        break;
      case "TIER_120":
        tierCounts.tier120Artists++;
        break;
    }
  });

  return {
    totalShares,
    artistCount: artists.length,
    ...tierCounts,
  };
}

/**
 * Distribute revenue pool to artists
 */
export async function distributeRevenuePool(
  period: string,
  totalAdRevenue: number
): Promise<number> {
  // Calculate artist pool (80% of ad revenue)
  const artistPoolAmount = totalAdRevenue * 0.8;

  // Get or create revenue pool record
  let pool = await prisma.radioRevenuePool.findUnique({
    where: { period },
  });

  // IDEMPOTENCY CHECK: Prevent duplicate distribution
  if (pool && pool.distributionComplete) {
    throw new Error(
      `Revenue already distributed for period ${period}. ` +
      `Distribution completed at ${pool.distributedAt?.toISOString()}`
    );
  }

  const poolStats = await calculateRevenuePool(period);

  if (!pool) {
    pool = await prisma.radioRevenuePool.create({
      data: {
        period,
        totalAdRevenue,
        artistPoolAmount,
        totalShares: poolStats.totalShares,
        perShareValue: poolStats.totalShares > 0 ? artistPoolAmount / poolStats.totalShares : 0,
        freeArtists: poolStats.freeArtists,
        tier5Artists: poolStats.tier5Artists,
        tier20Artists: poolStats.tier20Artists,
        tier50Artists: poolStats.tier50Artists,
        tier120Artists: poolStats.tier120Artists,
      },
    });
  } else {
    pool = await prisma.radioRevenuePool.update({
      where: { period },
      data: {
        totalAdRevenue,
        artistPoolAmount,
        totalShares: poolStats.totalShares,
        perShareValue: poolStats.totalShares > 0 ? artistPoolAmount / poolStats.totalShares : 0,
        freeArtists: poolStats.freeArtists,
        tier5Artists: poolStats.tier5Artists,
        tier20Artists: poolStats.tier20Artists,
        tier50Artists: poolStats.tier50Artists,
        tier120Artists: poolStats.tier120Artists,
      },
    });
  }

  const perShareValue = pool.perShareValue;

  // Get all active artists
  const artists = await prisma.artist.findMany({
    where: {
      airplayActivatedAt: { not: null },
      status: { notIn: ["DORMANT", "UNRESPONSIVE"] },
    },
  });

  // Create earnings records for each artist
  let distributedCount = 0;

  for (const artist of artists) {
    const earnings = artist.airplayShares * perShareValue;

    await prisma.radioEarnings.upsert({
      where: {
        artistId_period: {
          artistId: artist.id,
          period,
        },
      },
      create: {
        artistId: artist.id,
        period,
        tier: artist.airplayTier,
        shares: artist.airplayShares,
        earnings,
      },
      update: {
        tier: artist.airplayTier,
        shares: artist.airplayShares,
        earnings,
      },
    });

    distributedCount++;
  }

  // Mark pool as distributed
  await prisma.radioRevenuePool.update({
    where: { period },
    data: {
      distributedAt: new Date(),
      distributionComplete: true,
    },
  });

  return distributedCount;
}

/**
 * Activate airplay for an artist (automatically when contacted)
 */
export async function activateAirplay(artistId: string): Promise<void> {
  await prisma.artist.update({
    where: { id: artistId },
    data: {
      airplayTier: "FREE",
      airplayActivatedAt: new Date(),
      airplayShares: 1,
    },
  });

  // Log Riley's activity
  await prisma.rileyActivity.create({
    data: {
      action: "activated_airplay",
      artistId,
      details: {
        tier: "FREE",
        shares: 1,
      },
    },
  });
}

/**
 * Upgrade artist's airplay tier
 */
export async function upgradeAirplayTier(
  artistId: string,
  newTier: AirplayTier,
  paymentDetails?: {
    amount: number;
    method: string;
    transactionId: string;
  }
): Promise<void> {
  const tierInfo = AIRPLAY_TIERS[newTier];
  const currentPeriod = getCurrentPeriod();

  // Update artist tier
  await prisma.artist.update({
    where: { id: artistId },
    data: {
      airplayTier: newTier,
      airplayShares: tierInfo.shares,
      lastTierUpgrade: new Date(),
    },
  });

  // Record payment if not free tier
  if (newTier !== "FREE" && paymentDetails) {
    await prisma.airplayPayment.create({
      data: {
        artistId,
        tier: newTier,
        amount: paymentDetails.amount,
        period: currentPeriod,
        status: "active",
        paymentMethod: paymentDetails.method,
        transactionId: paymentDetails.transactionId,
      },
    });
  }

  // Log activity
  await prisma.rileyActivity.create({
    data: {
      action: "upgraded_airplay_tier",
      artistId,
      details: {
        tier: newTier,
        shares: tierInfo.shares,
        price: tierInfo.price,
      },
    },
  });
}

/**
 * Get current period (YYYY-MM format)
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get artist's current earnings for a period
 */
export async function getArtistEarnings(artistId: string, period?: string) {
  const targetPeriod = period || getCurrentPeriod();

  return await prisma.radioEarnings.findUnique({
    where: {
      artistId_period: {
        artistId,
        period: targetPeriod,
      },
    },
  });
}

/**
 * Calculate estimated monthly earnings for a tier
 * Based on example: $10,000 monthly ad revenue, 100 active artists
 */
export function estimateMonthlyEarnings(
  tier: AirplayTier,
  options?: {
    monthlyAdRevenue?: number;
    totalArtists?: number;
    averageSharesPerArtist?: number;
  }
): number {
  const monthlyAdRevenue = options?.monthlyAdRevenue || 10000;
  const totalArtists = options?.totalArtists || 100;
  const averageSharesPerArtist = options?.averageSharesPerArtist || 10;

  const artistPool = monthlyAdRevenue * 0.8; // 80% to artists
  const totalShares = totalArtists * averageSharesPerArtist;
  const perShareValue = artistPool / totalShares;

  const tierShares = AIRPLAY_TIERS[tier].shares;

  return tierShares * perShareValue;
}
