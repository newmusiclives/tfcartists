/**
 * Scout Commission Calculator
 *
 * Calculates commissions for scouts based on artist tier payments:
 * - 20% commission for first 3 months
 * - 10% ongoing residual after month 3
 * - $10 bonus per tier upgrade
 * - $2 per tier upgrade influenced by referred listener network
 * - 25% lifetime for prepurchase conversions
 */

import { prisma } from "@/lib/db";
import { AIRPLAY_TIERS } from "@/lib/radio/airplay-system";

export type CommissionCalculation = {
  scoutId: string;
  artistId: string;
  period: string;
  commissionAmount: number;
  bonusAmount: number;
  totalAmount: number;
  commissionRate: number;
  monthsSinceConversion: number;
  hasUpgradeBonus: boolean;
  hasInfluenceBonus: boolean;
  artistTier: string;
  artistPayment: number;
};

export type ScoutCommissionSummary = {
  totalCommissions: number;
  totalBonuses: number;
  totalAmount: number;
  commissionCount: number;
  commissions: CommissionCalculation[];
};

/**
 * Calculate commission for a scout-artist pair for a given period
 */
export async function calculateScoutCommission(
  scoutId: string,
  artistId: string,
  period: string
): Promise<CommissionCalculation | null> {
  // Get the discovery record
  const discovery = await prisma.artistDiscovery.findUnique({
    where: {
      scoutId_artistId: {
        scoutId,
        artistId,
      },
    },
    include: {
      artist: true,
    },
  });

  if (!discovery) {
    return null;
  }

  // Check if artist has converted (has a paid tier)
  if (!discovery.hasConverted || !discovery.convertedAt) {
    return null;
  }

  const artist = discovery.artist;

  // Only calculate commissions for paid tiers
  if (artist.airplayTier === "FREE") {
    return null;
  }

  // Get artist's tier payment amount
  const tierInfo = AIRPLAY_TIERS[artist.airplayTier];
  const artistPayment = tierInfo.price;

  // Calculate months since conversion
  const convertedDate = new Date(discovery.convertedAt);
  const periodDate = parsePeriod(period);
  const monthsSinceConversion = getMonthsDifference(convertedDate, periodDate);

  // Determine commission rate
  const commissionRate = getCommissionRate(discovery, monthsSinceConversion);

  // Calculate base commission
  const commissionAmount = artistPayment * commissionRate;

  // Check for upgrade bonus
  const hasUpgradeBonus = await checkUpgradeBonus(artistId, period);

  // Check for influence bonus
  const hasInfluenceBonus = await checkNetworkInfluenceBonus(
    scoutId,
    artistId,
    period
  );

  // Calculate total bonuses
  let bonusAmount = 0;
  if (hasUpgradeBonus) bonusAmount += 10;
  if (hasInfluenceBonus) bonusAmount += 2;

  const totalAmount = commissionAmount + bonusAmount;

  return {
    scoutId,
    artistId,
    period,
    commissionAmount,
    bonusAmount,
    totalAmount,
    commissionRate,
    monthsSinceConversion,
    hasUpgradeBonus,
    hasInfluenceBonus,
    artistTier: artist.airplayTier,
    artistPayment,
  };
}

/**
 * Determine commission rate based on discovery type and months since conversion
 * - First 3 months: 20%
 * - After month 3: 10%
 * - Prepurchase conversion: 25% lifetime
 */
export function getCommissionRate(
  discovery: { isPrepurchase: boolean },
  monthsSinceConversion: number
): number {
  // Prepurchase conversions get 25% lifetime
  if (discovery.isPrepurchase) {
    return 0.25;
  }

  // First 3 months (0, 1, 2): 20%
  if (monthsSinceConversion < 3) {
    return 0.2;
  }

  // After month 3: 10%
  return 0.1;
}

/**
 * Check if artist upgraded their tier in the given period
 * Returns true if they upgraded (not downgraded) during this period
 */
export async function checkUpgradeBonus(
  artistId: string,
  period: string
): Promise<boolean> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      lastTierUpgrade: true,
      airplayPayments: {
        where: { period },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!artist || !artist.lastTierUpgrade) {
    return false;
  }

  // Check if the upgrade happened in this period
  const upgradeDate = new Date(artist.lastTierUpgrade);
  const periodDate = parsePeriod(period);
  const upgradeYear = upgradeDate.getFullYear();
  const upgradeMonth = upgradeDate.getMonth();
  const periodYear = periodDate.getFullYear();
  const periodMonth = periodDate.getMonth();

  // If the upgrade was in this period
  if (upgradeYear === periodYear && upgradeMonth === periodMonth) {
    // Check if it was an upgrade (not a downgrade or first purchase)
    // We can check if there are 2+ payments in this period indicating a tier change
    const payments = artist.airplayPayments;

    if (payments.length >= 2) {
      // Compare the first and last tier in this period
      const firstPayment = payments[0];
      const lastPayment = payments[payments.length - 1];

      const firstTierPrice = AIRPLAY_TIERS[firstPayment.tier as keyof typeof AIRPLAY_TIERS]?.price || 0;
      const lastTierPrice = AIRPLAY_TIERS[lastPayment.tier as keyof typeof AIRPLAY_TIERS]?.price || 0;

      return lastTierPrice > firstTierPrice;
    }
  }

  return false;
}

/**
 * Check if any of the scout's referred listeners played this artist's tracks
 * before the artist upgraded, indicating network influence
 */
export async function checkNetworkInfluenceBonus(
  scoutId: string,
  artistId: string,
  period: string
): Promise<boolean> {
  // Get all listeners referred by this scout
  const referrals = await prisma.listenerReferral.findMany({
    where: { scoutId },
    select: { listenerId: true },
  });

  if (referrals.length === 0) {
    return false;
  }

  const referredListenerIds = referrals.map((r) => r.listenerId);

  // Get artist's last tier upgrade date
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { lastTierUpgrade: true },
  });

  if (!artist || !artist.lastTierUpgrade) {
    return false;
  }

  // Check if any referred listeners played this artist before the upgrade
  const playbackCount = await prisma.listenerPlayback.count({
    where: {
      listenerId: { in: referredListenerIds },
      artistId,
      playedAt: { lt: artist.lastTierUpgrade },
    },
  });

  return playbackCount > 0;
}

/**
 * Calculate all commissions for a scout in a given period
 */
export async function calculateAllScoutCommissions(
  scoutId: string,
  period: string
): Promise<ScoutCommissionSummary> {
  // Get all discoveries by this scout that have converted
  const discoveries = await prisma.artistDiscovery.findMany({
    where: {
      scoutId,
      hasConverted: true,
      status: "CONVERTED",
    },
    select: {
      artistId: true,
    },
  });

  const commissions: CommissionCalculation[] = [];
  let totalCommissions = 0;
  let totalBonuses = 0;

  for (const discovery of discoveries) {
    const commission = await calculateScoutCommission(
      scoutId,
      discovery.artistId,
      period
    );

    if (commission) {
      commissions.push(commission);
      totalCommissions += commission.commissionAmount;
      totalBonuses += commission.bonusAmount;
    }
  }

  return {
    totalCommissions,
    totalBonuses,
    totalAmount: totalCommissions + totalBonuses,
    commissionCount: commissions.length,
    commissions,
  };
}

/**
 * Helper: Parse period string (YYYY-MM) to Date
 */
function parsePeriod(period: string): Date {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

/**
 * Helper: Calculate months difference between two dates
 * FIXED: Now uses actual elapsed months, not calendar months
 *
 * Examples:
 * - Dec 31, 2024 to Jan 1, 2025 = 0 months (only 1 day)
 * - Dec 15, 2024 to Feb 15, 2025 = 2 months (exactly 2 months)
 * - Dec 15, 2024 to Feb 14, 2025 = 1 month (not quite 2 months)
 */
function getMonthsDifference(startDate: Date, endDate: Date): number {
  const yearDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthDiff = endDate.getMonth() - startDate.getMonth();
  const dayDiff = endDate.getDate() - startDate.getDate();

  // Calculate total months
  let months = yearDiff * 12 + monthDiff;

  // If we haven't reached the same day of month yet, subtract 1
  // Example: Jan 15 to Feb 14 = 0 full months (not 1)
  if (dayDiff < 0) {
    months--;
  }

  return Math.max(0, months); // Never return negative
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
