/**
 * Listener Promoter Commission Calculator
 *
 * Calculates the 5 income streams for listener promoters (scouts):
 * 1. Listener Bounties — $0.50 per active referred listener/month (cap $30/mo)
 * 2. Artist Discovery — 8% of referred artist subscriptions (cap $50/mo)
 * 3. Artist Development — 12% of referred artist tier upgrades (cap $40/mo)
 * 4. Sponsor Referrals — 10% of sponsor first-month contract (cap $50/mo)
 * 5. Premium Conversions — $1 per referred listener who becomes a scout (cap $20/mo)
 */

import { prisma } from "@/lib/db";
import { AIRPLAY_TIERS } from "@/lib/radio/airplay-system";

export interface ListenerPromoterEarnings {
  scoutId: string;
  period: string;
  listenerBounty: number;
  artistDiscovery: number;
  artistDevelopment: number;
  sponsorReferral: number;
  premiumConversion: number;
  total: number;
  details: {
    activeListeners: number;
    referredArtists: number;
    artistUpgrades: number;
    sponsorReferrals: number;
    newScoutConversions: number;
  };
}

// Caps per income stream
const CAPS = {
  listenerBounty: 30,
  artistDiscovery: 50,
  artistDevelopment: 40,
  sponsorReferral: 50,
  premiumConversion: 20,
};

// Rates
const LISTENER_BOUNTY_RATE = 0.5; // $0.50 per active listener
const ARTIST_DISCOVERY_RATE = 0.08; // 8% of artist subscription
const ARTIST_DEVELOPMENT_RATE = 0.12; // 12% of upgrade amount
const SPONSOR_REFERRAL_RATE = 0.10; // 10% of monthly contract
const REFERRAL_BONUS_RATE = 0.5; // Used to reverse-calculate from bonus amount
const PREMIUM_CONVERSION_BONUS = 1.0; // $1 per conversion

/**
 * Calculate all 5 income streams for a listener promoter for a given period.
 */
export async function calculateListenerPromoterEarnings(
  scoutId: string,
  period: string
): Promise<ListenerPromoterEarnings> {
  const periodDate = parsePeriod(period);
  const periodStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
  const periodEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59);

  // 1. Listener Bounties — count active referred listeners this month
  const referrals = await prisma.listenerReferral.findMany({
    where: { scoutId },
    select: { listenerId: true },
  });
  const referredListenerIds = referrals.map(r => r.listenerId);

  let activeListeners = 0;
  if (referredListenerIds.length > 0) {
    activeListeners = await prisma.listeningSession.groupBy({
      by: ["listenerId"],
      where: {
        listenerId: { in: referredListenerIds },
        startTime: { gte: periodStart, lte: periodEnd },
      },
    }).then(groups => groups.length);
  }
  const listenerBounty = Math.min(activeListeners * LISTENER_BOUNTY_RATE, CAPS.listenerBounty);

  // 2. Artist Discovery — 8% of subscriptions from referred artists
  const discoveries = await prisma.artistDiscovery.findMany({
    where: { scoutId, hasConverted: true },
    include: { artist: { select: { airplayTier: true } } },
  });

  let artistDiscoveryTotal = 0;
  for (const d of discoveries) {
    const tier = d.artist.airplayTier;
    if (tier && tier !== "FREE" && AIRPLAY_TIERS[tier]) {
      artistDiscoveryTotal += AIRPLAY_TIERS[tier].price * ARTIST_DISCOVERY_RATE;
    }
  }
  const artistDiscovery = Math.min(artistDiscoveryTotal, CAPS.artistDiscovery);

  // 3. Artist Development — 12% of new payments this period (proxy for upgrades)
  const payments = await prisma.airplayPayment.findMany({
    where: {
      artistId: { in: discoveries.map(d => d.artistId) },
      createdAt: { gte: periodStart, lte: periodEnd },
      status: "active",
    },
    select: { amount: true },
  });

  let upgradeTotal = 0;
  for (const p of payments) {
    upgradeTotal += (p.amount || 0) * ARTIST_DEVELOPMENT_RATE;
  }
  const artistDevelopment = Math.min(upgradeTotal, CAPS.artistDevelopment);

  // 4. Sponsor Referrals — 10% of first-month contract
  // Check SponsorListenerReferral for sponsors referred by this scout's listener
  const scout = await prisma.scout.findUnique({
    where: { id: scoutId },
    select: { listenerId: true },
  });

  let sponsorReferralTotal = 0;
  let sponsorReferralCount = 0;
  if (scout?.listenerId) {
    // Count sponsor referral bonuses recorded for this scout in this period
    const bonuses = await prisma.sponsorReferralBonus.findMany({
      where: {
        referrerId: scoutId,
        createdAt: { gte: periodStart, lte: periodEnd },
        sponsorTier: { notIn: ["milestone_5", "milestone_platinum_3"] },
      },
      select: { bonusAmount: true },
    });

    for (const b of bonuses) {
      // The referral bonus is 50% of first month; the SPONSOR_REFERRAL_RATE (10%) is a separate ongoing stream
      const estimatedMonthlyPrice = b.bonusAmount / REFERRAL_BONUS_RATE; // reverse-calculate price
      sponsorReferralTotal += estimatedMonthlyPrice * SPONSOR_REFERRAL_RATE;
      sponsorReferralCount++;
    }
  }
  const sponsorReferral = Math.min(sponsorReferralTotal, CAPS.sponsorReferral);

  // 5. Premium Conversions — $1 per referred listener who became a scout this period
  let newScoutConversions = 0;
  if (referredListenerIds.length > 0) {
    newScoutConversions = await prisma.scout.count({
      where: {
        listenerId: { in: referredListenerIds },
        activatedAt: { gte: periodStart, lte: periodEnd },
      },
    });
  }
  const premiumConversion = Math.min(newScoutConversions * PREMIUM_CONVERSION_BONUS, CAPS.premiumConversion);

  const total = listenerBounty + artistDiscovery + artistDevelopment + sponsorReferral + premiumConversion;

  return {
    scoutId,
    period,
    listenerBounty,
    artistDiscovery,
    artistDevelopment,
    sponsorReferral,
    premiumConversion,
    total,
    details: {
      activeListeners,
      referredArtists: discoveries.length,
      artistUpgrades: payments.length,
      sponsorReferrals: sponsorReferralCount,
      newScoutConversions,
    },
  };
}

/**
 * Calculate earnings for all active listener promoters for a period.
 */
export async function calculateAllListenerPromoterEarnings(
  period: string
): Promise<ListenerPromoterEarnings[]> {
  const scouts = await prisma.scout.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  const results: ListenerPromoterEarnings[] = [];
  for (const scout of scouts) {
    const earnings = await calculateListenerPromoterEarnings(scout.id, period);
    if (earnings.total > 0) {
      results.push(earnings);
    }
  }

  return results;
}

function parsePeriod(period: string): Date {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1);
}
