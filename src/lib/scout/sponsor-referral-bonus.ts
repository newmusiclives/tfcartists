/**
 * Sponsor Referral Bonus Calculator & Tracker
 *
 * When a listener/scout refers a sponsor, they earn 50% of the first month's fee.
 * Bonuses: $100 for 5+ referrals, $150 extra for 3+ Platinum referrals.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const SPONSOR_TIER_PRICES: Record<string, number> = {
  bronze: 100,
  silver: 250,
  gold: 400,
  platinum: 500,
};

const REFERRAL_BONUS_RATE = 0.5; // 50% of first month

/**
 * Record a sponsor referral bonus when a new sponsor signs up via referral.
 */
export async function recordSponsorReferralBonus(params: {
  referrerId: string;
  referrerType: "listener" | "scout";
  sponsorId: string;
  sponsorTier: string;
}): Promise<{ bonusAmount: number; id: string }> {
  const { referrerId, referrerType, sponsorId, sponsorTier } = params;

  const tierPrice = SPONSOR_TIER_PRICES[sponsorTier.toLowerCase()] || 100;
  const bonusAmount = tierPrice * REFERRAL_BONUS_RATE;

  const bonus = await prisma.sponsorReferralBonus.create({
    data: {
      referrerId,
      referrerType,
      sponsorId,
      sponsorTier: sponsorTier.toLowerCase(),
      bonusAmount,
    },
  });

  logger.info("Sponsor referral bonus recorded", {
    referrerId,
    sponsorId,
    bonusAmount,
    tier: sponsorTier,
  });

  return { bonusAmount, id: bonus.id };
}

/**
 * Check and award milestone bonuses for a referrer.
 * - 5+ referrals: $100 bonus
 * - 3+ Platinum referrals: $150 bonus
 */
export async function checkMilestoneBonuses(referrerId: string): Promise<number> {
  const referrals = await prisma.sponsorReferralBonus.findMany({
    where: { referrerId },
    select: { sponsorTier: true },
  });

  let milestoneBonus = 0;

  // 5+ total referrals bonus
  if (referrals.length >= 5) {
    // Check if already awarded (look for existing milestone record)
    const existing = await prisma.sponsorReferralBonus.findFirst({
      where: { referrerId, sponsorTier: "milestone_5" },
    });
    if (!existing) {
      await prisma.sponsorReferralBonus.create({
        data: {
          referrerId,
          referrerType: "scout",
          sponsorId: "milestone",
          sponsorTier: "milestone_5",
          bonusAmount: 100,
        },
      });
      milestoneBonus += 100;
    }
  }

  // 3+ Platinum referrals bonus
  const platinumCount = referrals.filter(r => r.sponsorTier === "platinum").length;
  if (platinumCount >= 3) {
    const existing = await prisma.sponsorReferralBonus.findFirst({
      where: { referrerId, sponsorTier: "milestone_platinum_3" },
    });
    if (!existing) {
      await prisma.sponsorReferralBonus.create({
        data: {
          referrerId,
          referrerType: "scout",
          sponsorId: "milestone",
          sponsorTier: "milestone_platinum_3",
          bonusAmount: 150,
        },
      });
      milestoneBonus += 150;
    }
  }

  return milestoneBonus;
}

/**
 * Get unpaid bonuses for a referrer (for payout processing).
 */
export async function getUnpaidBonuses(referrerId: string): Promise<{
  total: number;
  bonuses: { id: string; bonusAmount: number; sponsorTier: string }[];
}> {
  const bonuses = await prisma.sponsorReferralBonus.findMany({
    where: { referrerId, status: "pending" },
    select: { id: true, bonusAmount: true, sponsorTier: true },
  });

  const total = bonuses.reduce((sum, b) => sum + b.bonusAmount, 0);
  return { total, bonuses };
}

/**
 * Mark bonuses as paid after payout.
 */
export async function markBonusesPaid(bonusIds: string[]): Promise<void> {
  await prisma.sponsorReferralBonus.updateMany({
    where: { id: { in: bonusIds } },
    data: { status: "paid", paidAt: new Date() },
  });
}
