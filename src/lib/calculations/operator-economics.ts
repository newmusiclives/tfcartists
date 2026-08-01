import {
  SPONSOR_PRICING,
  SPONSOR_AD_SPOTS,
  AIRPLAY_TIER_PRICING,
  ARTIST_CAPACITY,
  STATION_CONSTRAINTS,
  REVENUE_SCENARIOS,
} from "./station-capacity";

/**
 * What a station actually costs to run, what it earns, and therefore what we
 * can charge a local operator for it.
 *
 * The existing capacity model answers "how much could a station bill at full
 * inventory". That is the wrong question for pricing an operator deal, which
 * needs three things the capacity model does not provide: the cost to SERVE a
 * station, revenue at a realistic fill rather than the ceiling, and the
 * commissions and processing fees that come off the top before anyone is paid.
 */

// --- COST -------------------------------------------------------------------
// Rates as billed. AI script generation dominates; infrastructure is noise.
const CLAUDE_INPUT_PER_M = 3.0;
const CLAUDE_OUTPUT_PER_M = 15.0;
const OPENAI_TTS_PER_1K_CHARS = 0.015;

const HOURS_PER_MONTH = 24 * 30;

/**
 * A voice track is one DJ link: a Claude call to write it, then TTS to speak
 * it. Both scale with how talkative the station is, which is the only real
 * cost lever an operator has.
 */
const SCRIPT_INPUT_TOKENS = 1200;
const SCRIPT_OUTPUT_TOKENS = 800;
const VOICE_TRACK_CHARS = 300;

// Fixed monthly infrastructure attributable to one station.
const VPS_COST = 5;      // Hetzner CX22 running Liquidsoap + Icecast
const STORAGE_COST = 1;  // R2, a few GB of audio
const PLATFORM_SHARE = 4; // share of Netlify/Neon once past free tiers

export type CostBreakdown = {
  scripts: number;
  tts: number;
  features: number;
  infrastructure: number;
  total: number;
};

export function stationCost(voiceTracksPerHour = 3): CostBreakdown {
  const voiceTracks = voiceTracksPerHour * HOURS_PER_MONTH;

  const scripts =
    voiceTracks *
    ((SCRIPT_INPUT_TOKENS / 1_000_000) * CLAUDE_INPUT_PER_M +
      (SCRIPT_OUTPUT_TOKENS / 1_000_000) * CLAUDE_OUTPUT_PER_M);

  const tts = voiceTracks * (VOICE_TRACK_CHARS / 1000) * OPENAI_TTS_PER_1K_CHARS;

  // Daily features, imaging refreshes and sponsor ad reads. Small but real.
  const features = 20 * 30 * ((1500 / 1_000_000) * CLAUDE_INPUT_PER_M + (1000 / 1_000_000) * CLAUDE_OUTPUT_PER_M);

  const infrastructure = VPS_COST + STORAGE_COST + PLATFORM_SHARE;

  return {
    scripts,
    tts,
    features,
    infrastructure,
    total: scripts + tts + features + infrastructure,
  };
}

// --- REVENUE ----------------------------------------------------------------
/** The sponsor mix the capacity model treats as a full station. */
const FULL_MIX = { LOCAL_HERO: 45, TIER_1: 28, TIER_2: 35, TIER_3: 17 } as const;

export function sponsorRevenueAtFill(fill: number) {
  const scale = (n: number) => Math.round(n * fill);
  const counts = {
    LOCAL_HERO: scale(FULL_MIX.LOCAL_HERO),
    TIER_1: scale(FULL_MIX.TIER_1),
    TIER_2: scale(FULL_MIX.TIER_2),
    TIER_3: scale(FULL_MIX.TIER_3),
  };
  const revenue =
    counts.LOCAL_HERO * SPONSOR_PRICING.LOCAL_HERO +
    counts.TIER_1 * SPONSOR_PRICING.TIER_1 +
    counts.TIER_2 * SPONSOR_PRICING.TIER_2 +
    counts.TIER_3 * SPONSOR_PRICING.TIER_3;
  const spots =
    counts.LOCAL_HERO * SPONSOR_AD_SPOTS.LOCAL_HERO +
    counts.TIER_1 * SPONSOR_AD_SPOTS.TIER_1 +
    counts.TIER_2 * SPONSOR_AD_SPOTS.TIER_2 +
    counts.TIER_3 * SPONSOR_AD_SPOTS.TIER_3;

  return { counts, sponsors: Object.values(counts).reduce((a, b) => a + b, 0), revenue, spots };
}

/**
 * Premium inventory scales with fill too. A launching station has not sold its
 * week takeover; treating premium as fixed is what made the old model's
 * early-stage numbers optimistic.
 */
export function premiumRevenueAtFill(fill: number) {
  return Math.round(
    (STATION_CONSTRAINTS.NEWS_WEATHER_SPONSORS * SPONSOR_PRICING.NEWS_WEATHER +
      6 * SPONSOR_PRICING.SPONSORED_HOUR +
      STATION_CONSTRAINTS.MAX_WEEK_TAKEOVERS_PER_MONTH * SPONSOR_PRICING.WEEK_TAKEOVER) *
      fill,
  );
}

export function artistRevenueAtFill(fill: number) {
  return Math.round(
    (ARTIST_CAPACITY.BRONZE * AIRPLAY_TIER_PRICING.BRONZE +
      ARTIST_CAPACITY.SILVER * AIRPLAY_TIER_PRICING.SILVER +
      ARTIST_CAPACITY.GOLD * AIRPLAY_TIER_PRICING.GOLD +
      ARTIST_CAPACITY.PLATINUM * AIRPLAY_TIER_PRICING.PLATINUM) *
      fill,
  );
}

// --- DEDUCTIONS -------------------------------------------------------------
/**
 * Money that leaves before anyone is paid.
 *
 * Scout commissions were modelled nowhere. They are not small: a scout-sourced
 * sponsor pays 20% for three months then 12% ongoing, and prepurchase
 * conversions carry 25% for life. Blended across a book where roughly half of
 * sponsors arrive through scouts, ~8% of gross is a fair planning figure.
 *
 * Payment processing is Manifest's cut on everything collected.
 */
export const SCOUT_COMMISSION_BLENDED = 0.08;
export const PAYMENT_PROCESSING = 0.029;

export type StationEconomics = {
  label: string;
  fill: number;
  sponsors: number;
  grossRevenue: number;
  commissions: number;
  processing: number;
  netRevenue: number;
  cost: number;
  profit: number;
  marginPct: number;
  capacityUsedPct: number;
};

export function stationEconomics(
  scenario: keyof typeof REVENUE_SCENARIOS,
  voiceTracksPerHour = 3,
): StationEconomics {
  const s = REVENUE_SCENARIOS[scenario];
  const sponsor = sponsorRevenueAtFill(s.sponsorFill);
  const premium = premiumRevenueAtFill(s.sponsorFill);
  const artists = artistRevenueAtFill(s.artistFill);

  const grossRevenue = sponsor.revenue + premium + artists;
  const commissions = grossRevenue * SCOUT_COMMISSION_BLENDED;
  const processing = grossRevenue * PAYMENT_PROCESSING;
  const netRevenue = grossRevenue - commissions - processing;

  const cost = stationCost(voiceTracksPerHour).total;
  const profit = netRevenue - cost;

  const monthlySpots = 24 * STATION_CONSTRAINTS.MAX_AD_SPOTS_PER_HOUR * 30;

  return {
    label: s.label,
    fill: s.sponsorFill,
    sponsors: sponsor.sponsors,
    grossRevenue,
    commissions,
    processing,
    netRevenue,
    cost,
    profit,
    marginPct: netRevenue > 0 ? (profit / netRevenue) * 100 : 0,
    capacityUsedPct: (sponsor.spots / monthlySpots) * 100,
  };
}

// --- OPERATOR PRICING -------------------------------------------------------
/**
 * What to charge a local operator.
 *
 * The operator sells to local businesses and keeps that revenue; we supply the
 * station, the DJs, the music rights and the platform. Two constraints:
 *
 *   1. The fee must clear our cost to serve (~$120-150/month) with enough
 *      margin to fund support, or growth makes us poorer.
 *   2. It must be affordable in the operator's WORST month, not their best.
 *      A fee an operator cannot pay while still ramping is a churned operator
 *      and a dead station.
 *
 * A pure revenue share fails (1) at launch; a pure flat fee fails (2). Hybrid:
 * a floor that covers cost, plus a share that scales with their success.
 */
export type OperatorOffer = {
  name: string;
  monthlyFee: number;
  revenueSharePct: number;
  setupFee: number;
};

export const OPERATOR_OFFER: OperatorOffer = {
  name: "Local Operator",
  monthlyFee: 249,
  revenueSharePct: 10,
  setupFee: 0,
};

export function operatorOutcome(
  scenario: keyof typeof REVENUE_SCENARIOS,
  offer: OperatorOffer = OPERATOR_OFFER,
) {
  const e = stationEconomics(scenario);
  const share = e.netRevenue * (offer.revenueSharePct / 100);
  const platformTake = offer.monthlyFee + share;
  const operatorKeeps = e.netRevenue - platformTake;

  return {
    ...e,
    platformFee: offer.monthlyFee,
    platformShare: share,
    platformTake,
    platformProfit: platformTake - e.cost,
    operatorKeeps,
    operatorMarginPct: e.netRevenue > 0 ? (operatorKeeps / e.netRevenue) * 100 : 0,
  };
}
