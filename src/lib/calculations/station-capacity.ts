/**
 * Station Capacity & Revenue Calculations
 *
 * Calculates how many artists and sponsors each station can support
 * based on airtime constraints
 */

import { AIRPLAY_TERMS_BY_LEGACY_NAME } from "@/lib/radio/airplay-tiers";

// TYPE DEFINITIONS
export interface SponsorScenario {
  sponsors: number;
  revenue: number;
}

export interface SponsorDistribution {
  LOCAL_HERO: number;
  TIER_1: number;
  TIER_2: number;
  TIER_3: number;
  sponsors: number;
  revenue: number;
}

// AIRTIME CONSTRAINTS
//
// The ad clock: five one-minute breaks an hour, four 15-second spots in each,
// so 20 spots an hour and five minutes of advertising - a normal commercial
// load, and the same structure the playout schedules.
//
// Only the twelve daytime hours are SOLD. 6pm-6am airs the same breaks as
// bonus inventory: every sponsor's spots run overnight as well, free, which
// roughly doubles delivered impressions without costing sellable stock. It
// gives a rate card something to be generous with instead of discounting.
//
// The previous constants claimed 24 spots/hour across all 24 hours - 17,280 a
// month. Two things were wrong with that. Nothing sold the night, and the
// playout never aired anything like that volume: streaming.py ran one ad every
// five songs, about 3 an hour. The model was selling six times the station's
// real output, so every sponsor revenue figure built on it was inflated by the
// same factor.
export const STATION_CONSTRAINTS = {
  // Track rotation
  TRACKS_PER_HOUR: 12,
  PRIME_HOURS: { start: 6, end: 18 }, // 6am - 6pm — the sellable day
  SUBPRIME_HOURS: { start: 18, end: 6 }, // 6pm - 6am — bonus airings

  // Ad clock
  AD_BREAKS_PER_HOUR: 5,
  SPOTS_PER_BREAK: 4,
  AD_DURATION_SECONDS: 15,
  MAX_AD_SPOTS_PER_HOUR: 20, // 5 breaks x 4 spots
  MAX_AD_MINUTES_PER_HOUR: 5, // 20 spots x 15 sec

  /** Hours a sponsor can buy. The other twelve are given away. */
  SELLABLE_HOURS_PER_DAY: 12,

  // Premium sponsor opportunities
  MAX_SPONSORED_HOURS_PER_WEEK: 2,
  MAX_WEEK_TAKEOVERS_PER_MONTH: 1,
  NEWS_WEATHER_SPONSORS: 2, // max daily mentions
} as const;

// AIRPLAY TIERS - Team Riley
//
// All three of these now derive from AIRPLAY_TIER_TERMS. They used to be typed
// out here and had drifted from both the page an artist reads and the amount
// the payment provider charges - shares in particular disagreed three ways,
// and shares decide what an artist is paid out of the pool.
//
// Shares and plays-per-month are deliberately the same number: an artist told
// "20 plays a month" who is then weighted as 30 shares has been quoted two
// different promises, and only one of them can be kept.
export const AIRPLAY_TIER_SHARES = {
  FREE: AIRPLAY_TERMS_BY_LEGACY_NAME.FREE.shares,
  BRONZE: AIRPLAY_TERMS_BY_LEGACY_NAME.BRONZE.shares,
  SILVER: AIRPLAY_TERMS_BY_LEGACY_NAME.SILVER.shares,
  GOLD: AIRPLAY_TERMS_BY_LEGACY_NAME.GOLD.shares,
  PLATINUM: AIRPLAY_TERMS_BY_LEGACY_NAME.PLATINUM.shares,
} as const;

export const AIRPLAY_TIER_PRICING = {
  FREE: AIRPLAY_TERMS_BY_LEGACY_NAME.FREE.price,
  BRONZE: AIRPLAY_TERMS_BY_LEGACY_NAME.BRONZE.price,
  SILVER: AIRPLAY_TERMS_BY_LEGACY_NAME.SILVER.price,
  GOLD: AIRPLAY_TERMS_BY_LEGACY_NAME.GOLD.price,
  PLATINUM: AIRPLAY_TERMS_BY_LEGACY_NAME.PLATINUM.price,
} as const;

export const AIRPLAY_TIER_PLAYS_PER_MONTH = AIRPLAY_TIER_SHARES;

// MASTER OVERVIEW ARTIST CAPACITY
export const ARTIST_CAPACITY = {
  FREE: 180,
  BRONZE: 80,
  SILVER: 40,
  GOLD: 30,
  PLATINUM: 10,
  TOTAL: 340,
} as const;

// SPONSOR TIERS - Team Harper (4-tier model with Local Hero entry level)
export const SPONSOR_AD_SPOTS = {
  LOCAL_HERO: 30,  // 1 spot/day × 30 days (ENTRY LEVEL)
  TIER_1: 60,      // 2 spots/day × 30 days
  TIER_2: 150,     // 5 spots/day × 30 days
  TIER_3: 300,     // 10 spots/day × 30 days
} as const;

/**
 * Sponsor pricing — a proper volume ladder.
 *
 * The previous prices were not a ladder at all. Tier 1 charged $1.33 a spot
 * against Local Hero's $1.00, so buying MORE airtime cost more per spot, and
 * Tiers 2 and 3 offered no discount over the entry tier whatsoever. A sponsor
 * doing the arithmetic finds the cheapest way to buy 60 spots is two Local
 * Hero packages, which is a worse outcome for everyone: more invoices, more
 * admin, and no reason to ever move up.
 *
 * Every step now costs less per spot than the one below it:
 *
 *   Local Hero   30 spots   $45   $1.50/spot
 *   Tier 1       60 spots   $79   $1.32/spot
 *   Tier 2      150 spots  $169   $1.13/spot
 *   Tier 3      300 spots  $279   $0.93/spot
 *
 * Absolute level is set for a local advertiser, not a metro buy: $45/month for
 * a daily mention is comparable to a boosted social post, which is the budget
 * this actually competes with. It is deliberately easy to say yes to, because
 * the constraint on this model is sponsor COUNT, not price - see
 * REVENUE_SCENARIOS.
 */
export const SPONSOR_PRICING = {
  LOCAL_HERO: 45,
  TIER_1: 79,
  TIER_2: 169,
  TIER_3: 279,
  NEWS_WEATHER: 350,
  SPONSORED_HOUR: 250,
  WEEK_TAKEOVER: 750,
} as const;

/**
 * What a station realistically sells, not what its inventory could hold.
 *
 * Every revenue figure on this platform has been quoted at FULL capacity - 125
 * sponsors. That is a lot of local businesses; a small commercial station
 * typically carries 20-60 advertisers, and reaching 125 is a multi-year sales
 * outcome, not a launch state. Quoting the ceiling to a prospective operator
 * sets them up to feel misled in month two.
 *
 * These are the numbers to plan and price against.
 */
export const REVENUE_SCENARIOS = {
  LAUNCH:      { label: "Launch (months 1-6)",  sponsorFill: 0.20, artistFill: 0.15 },
  ESTABLISHED: { label: "Established (year 1)", sponsorFill: 0.48, artistFill: 0.45 },
  FULL:        { label: "Full capacity",        sponsorFill: 1.0,  artistFill: 1.0  },
} as const;

// OPERATOR PLANS - TrueFans Platform Pricing
export const OPERATOR_PLANS = {
  STARTER: {
    name: "Launch",
    monthlyPrice: 150,
    platformFeePercent: 15,
    setupFee: 500,
    maxStations: 1,
    // 4, not 2: TIERS.basic is the code that actually gates DJ creation and it
    // grants 4. The agreed product is a 4-DJ basic station, so selling 2 both
    // undersold it and disagreed with what the platform handed over.
    maxDJs: 4,
    maxArtists: 150,
    maxLiveHours: 24,
    features: ["1 station", "4 AI DJs", "150 artists", "24/7 live", "Basic analytics"],
  },
  PRO: {
    name: "Growth",
    monthlyPrice: 250,
    platformFeePercent: 10,
    setupFee: 500,
    maxStations: 1,
    maxDJs: 6,
    maxArtists: 340,
    maxLiveHours: 24,
    features: ["1 station", "6 AI DJs", "340 artists", "24/7 live", "Full analytics", "Priority support"],
  },
  ENTERPRISE: {
    name: "Scale",
    monthlyPrice: 400,
    platformFeePercent: 7,
    setupFee: 1000,
    maxStations: 3,
    maxDJs: 12,
    maxArtists: 500,
    maxLiveHours: 24,
    features: ["3 stations", "12 AI DJs", "500 artists", "24/7 live", "White-label option", "Dedicated support"],
  },
  NETWORK: {
    name: "Network",
    monthlyPrice: 800,
    platformFeePercent: 5,
    setupFee: 0,
    maxStations: 10,
    maxDJs: 50,
    maxArtists: 1000,
    maxLiveHours: 24,
    features: ["10 stations", "Unlimited DJs", "1000 artists", "24/7 live", "Full white-label", "API access", "Network analytics"],
  },
} as const;

/**
 * Calculate daily airtime availability
 */
export function calculateDailyAirtime() {
  const primeHours = STATION_CONSTRAINTS.PRIME_HOURS.end - STATION_CONSTRAINTS.PRIME_HOURS.start; // 12 hours
  const subprimeHours = 24 - primeHours; // 12 hours

  return {
    primeHours,
    subprimeHours,
    primeTracks: primeHours * STATION_CONSTRAINTS.TRACKS_PER_HOUR, // 144 tracks
    subprimeTracks: subprimeHours * STATION_CONSTRAINTS.TRACKS_PER_HOUR, // 144 tracks
    totalDailyTracks: 24 * STATION_CONSTRAINTS.TRACKS_PER_HOUR, // 288 tracks

    /** Sold. 6am-6pm at 20 spots/hour. */
    primeAdSpots: primeHours * STATION_CONSTRAINTS.MAX_AD_SPOTS_PER_HOUR, // 240 spots
    /** Given away as bonus airings. 6pm-6am, same clock. */
    subprimeAdSpots: subprimeHours * STATION_CONSTRAINTS.MAX_AD_SPOTS_PER_HOUR, // 240 spots
    /** What actually goes to air across the day, sold and bonus together. */
    totalDailyAdSpots: 24 * STATION_CONSTRAINTS.MAX_AD_SPOTS_PER_HOUR, // 480 spots
  };
}

/**
 * Calculate monthly airtime availability
 */
export function calculateMonthlyAirtime(daysInMonth: number = 30) {
  const daily = calculateDailyAirtime();

  return {
    totalMonthlyTracks: daily.totalDailyTracks * daysInMonth, // 8,640 tracks
    primeMonthlyTracks: daily.primeTracks * daysInMonth, // 4,320 tracks
    subprimeMonthlyTracks: daily.subprimeTracks * daysInMonth, // 4,320 tracks

    /**
     * What a sponsor can BUY: daytime only. This is the number every capacity
     * and revenue calculation must divide by. Selling against the aired total
     * below is what produced the old six-times-oversold model.
     */
    sellableMonthlyAdSpots: daily.primeAdSpots * daysInMonth, // 7,200 spots
    /** Delivered free on top of every purchase. Never sold, never billed. */
    bonusMonthlyAdSpots: daily.subprimeAdSpots * daysInMonth, // 7,200 spots
    /** Everything that goes to air. Useful for playout, not for pricing. */
    totalMonthlyAdSpots: daily.totalDailyAdSpots * daysInMonth, // 14,400 spots

    primeMonthlyAdSpots: daily.primeAdSpots * daysInMonth, // 7,200 spots
    subprimeMonthlyAdSpots: daily.subprimeAdSpots * daysInMonth, // 7,200 spots
  };
}

/**
 * Calculate artist capacity based on tier distribution
 */
export function calculateArtistCapacity(tierDistribution: {
  FREE?: number;
  BRONZE?: number;
  SILVER?: number;
  GOLD?: number;
  PLATINUM?: number;
}) {
  const monthly = calculateMonthlyAirtime();

  // Calculate total shares
  const totalShares =
    (tierDistribution.FREE || 0) * AIRPLAY_TIER_SHARES.FREE +
    (tierDistribution.BRONZE || 0) * AIRPLAY_TIER_SHARES.BRONZE +
    (tierDistribution.SILVER || 0) * AIRPLAY_TIER_SHARES.SILVER +
    (tierDistribution.GOLD || 0) * AIRPLAY_TIER_SHARES.GOLD +
    (tierDistribution.PLATINUM || 0) * AIRPLAY_TIER_SHARES.PLATINUM;

  // Plays per share
  const playsPerShare = totalShares > 0 ? monthly.totalMonthlyTracks / totalShares : 0;

  // Calculate plays per artist in each tier
  const playsPerArtist = {
    FREE: playsPerShare * AIRPLAY_TIER_SHARES.FREE,
    BRONZE: playsPerShare * AIRPLAY_TIER_SHARES.BRONZE,
    SILVER: playsPerShare * AIRPLAY_TIER_SHARES.SILVER,
    GOLD: playsPerShare * AIRPLAY_TIER_SHARES.GOLD,
    PLATINUM: playsPerShare * AIRPLAY_TIER_SHARES.PLATINUM,
  };

  return {
    totalArtists: Object.values(tierDistribution).reduce((sum, count) => sum + count, 0),
    totalShares,
    playsPerShare,
    playsPerArtist,
    monthlyTracks: monthly.totalMonthlyTracks,
  };
}

/**
 * Calculate maximum artist capacity
 * Uses Master Overview specifications: 340 total artists across 5 tiers
 */
export function calculateMaxArtistCapacity() {
  const monthly = calculateMonthlyAirtime();

  // Master Overview: Exact artist distribution
  const masterOverview = {
    FREE: ARTIST_CAPACITY.FREE,       // 180 artists
    BRONZE: ARTIST_CAPACITY.BRONZE,   // 80 artists
    SILVER: ARTIST_CAPACITY.SILVER,   // 40 artists
    GOLD: ARTIST_CAPACITY.GOLD,       // 30 artists
    PLATINUM: ARTIST_CAPACITY.PLATINUM, // 10 artists
  };

  // Calculate revenue from Master Overview distribution
  const masterRevenue =
    masterOverview.BRONZE * AIRPLAY_TIER_PRICING.BRONZE +
    masterOverview.SILVER * AIRPLAY_TIER_PRICING.SILVER +
    masterOverview.GOLD * AIRPLAY_TIER_PRICING.GOLD +
    masterOverview.PLATINUM * AIRPLAY_TIER_PRICING.PLATINUM;

  // Calculate total shares
  const masterShares =
    masterOverview.FREE * AIRPLAY_TIER_SHARES.FREE +
    masterOverview.BRONZE * AIRPLAY_TIER_SHARES.BRONZE +
    masterOverview.SILVER * AIRPLAY_TIER_SHARES.SILVER +
    masterOverview.GOLD * AIRPLAY_TIER_SHARES.GOLD +
    masterOverview.PLATINUM * AIRPLAY_TIER_SHARES.PLATINUM;

  // If FREE tier gets minimum plays, calculate max artists
  const maxFreeArtists = Math.floor(monthly.totalMonthlyTracks / 1); // 1 play minimum

  return {
    maxFreeArtists,
    scenarios: {
      masterOverview: {
        ...masterOverview,
        revenue: masterRevenue,
        artists: ARTIST_CAPACITY.TOTAL,
        totalShares: masterShares,
      },
      balanced: {
        ...masterOverview,
        revenue: masterRevenue,
        artists: ARTIST_CAPACITY.TOTAL,
        totalShares: masterShares,
      },
      premium: {
        ...masterOverview,
        revenue: masterRevenue,
        artists: ARTIST_CAPACITY.TOTAL,
        totalShares: masterShares,
      },
    },
  };
}

/**
 * Calculate sponsor capacity based on ad spots
 */
export function calculateSponsorCapacity(sponsorDistribution: {
  LOCAL_HERO?: number;
  TIER_1?: number;
  TIER_2?: number;
  TIER_3?: number;
}) {
  const monthly = calculateMonthlyAirtime();

  // Calculate total ad spots needed
  const totalSpotsNeeded =
    (sponsorDistribution.LOCAL_HERO || 0) * SPONSOR_AD_SPOTS.LOCAL_HERO +
    (sponsorDistribution.TIER_1 || 0) * SPONSOR_AD_SPOTS.TIER_1 +
    (sponsorDistribution.TIER_2 || 0) * SPONSOR_AD_SPOTS.TIER_2 +
    (sponsorDistribution.TIER_3 || 0) * SPONSOR_AD_SPOTS.TIER_3;

  // Calculate revenue
  const revenue =
    (sponsorDistribution.LOCAL_HERO || 0) * SPONSOR_PRICING.LOCAL_HERO +
    (sponsorDistribution.TIER_1 || 0) * SPONSOR_PRICING.TIER_1 +
    (sponsorDistribution.TIER_2 || 0) * SPONSOR_PRICING.TIER_2 +
    (sponsorDistribution.TIER_3 || 0) * SPONSOR_PRICING.TIER_3;

  // Sellable, not aired. A sponsor buys daytime; the overnight run is a gift.
  const spotsRemaining = monthly.sellableMonthlyAdSpots - totalSpotsNeeded;
  const capacityUtilization = (totalSpotsNeeded / monthly.sellableMonthlyAdSpots) * 100;

  return {
    totalSponsors: Object.values(sponsorDistribution).reduce((sum, count) => sum + count, 0),
    totalSpotsNeeded,
    totalSpotsAvailable: monthly.sellableMonthlyAdSpots,
    spotsRemaining,
    capacityUtilization,
    monthlyRevenue: revenue,
    /** Free overnight airings the same purchase delivers. */
    bonusSpotsDelivered: totalSpotsNeeded,
    /** What the sponsor actually hears themselves on air: bought plus bonus. */
    totalSpotsDelivered: totalSpotsNeeded * 2,
  };
}

/**
 * Calculate maximum sponsor capacity.
 *
 * The "optimal" mix is 125 sponsors at ~77% of ad inventory, which leaves
 * headroom for premium takeovers. Deliberately NO revenue figure in this
 * comment: the previous one asserted $22,250 and stayed put through a price
 * change, so the code and its own documentation disagreed by 27% while five
 * customer-facing pages quoted the wrong one. Call stationRevenuePotential()
 * instead of writing the number down anywhere.
 */
export function calculateMaxSponsorCapacity() {
  const monthly = calculateMonthlyAirtime();
  const totalMonthlySpots = monthly.sellableMonthlyAdSpots;

  const scenarios = {
    allLocalHero: {
      sponsors: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.LOCAL_HERO), // 576 sponsors
      revenue: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.LOCAL_HERO) * SPONSOR_PRICING.LOCAL_HERO,
    },
    allTier1: {
      sponsors: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.TIER_1), // 288 sponsors
      revenue: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.TIER_1) * SPONSOR_PRICING.TIER_1,
    },
    allTier2: {
      sponsors: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.TIER_2), // 115 sponsors
      revenue: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.TIER_2) * SPONSOR_PRICING.TIER_2,
    },
    allTier3: {
      sponsors: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.TIER_3), // 57 sponsors
      revenue: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.TIER_3) * SPONSOR_PRICING.TIER_3,
    },
    optimal: {
      // 53 sponsors using 5,520 of 7,200 sellable spots (76.7%), leaving
      // headroom for sponsored hours and the week takeover.
      //
      // Was 125 sponsors against 17,280 spots. Both halves of that were wrong:
      // the inventory counted hours nobody sells, and 125 local advertisers is
      // a multi-year outcome quoted as a launch state. A small commercial
      // station carries 20-60, so 53 is the top of a believable range rather
      // than a ceiling nobody reaches.
      //
      // Counts only - revenue is derived, never restated here.
      LOCAL_HERO: 20,
      TIER_1: 12,
      TIER_2: 14,
      TIER_3: 7,
    },
    balanced: {
      LOCAL_HERO: 20,
      TIER_1: 12,
      TIER_2: 14,
      TIER_3: 7,
    },
  };

  // Calculate optimal revenue
  const optimalRevenue =
    scenarios.optimal.LOCAL_HERO * SPONSOR_PRICING.LOCAL_HERO +
    scenarios.optimal.TIER_1 * SPONSOR_PRICING.TIER_1 +
    scenarios.optimal.TIER_2 * SPONSOR_PRICING.TIER_2 +
    scenarios.optimal.TIER_3 * SPONSOR_PRICING.TIER_3;

  // Counted, not asserted. The old literal 125 stayed put through a change to
  // the mix beneath it, and the stale revenue figure in the comment beside it
  // was quoted on customer-facing pages for months.
  const optimalSponsorCount =
    scenarios.optimal.LOCAL_HERO + scenarios.optimal.TIER_1 +
    scenarios.optimal.TIER_2 + scenarios.optimal.TIER_3;

  const optimalWithMetrics: SponsorDistribution = {
    ...scenarios.optimal,
    sponsors: optimalSponsorCount,
    revenue: optimalRevenue,
  };

  const balancedWithMetrics: SponsorDistribution = {
    ...scenarios.balanced,
    sponsors: optimalSponsorCount,
    revenue: optimalRevenue,
  };

  return {
    allLocalHero: scenarios.allLocalHero,
    allTier1: scenarios.allTier1,
    allTier2: scenarios.allTier2,
    allTier3: scenarios.allTier3,
    optimal: optimalWithMetrics,
    balanced: balancedWithMetrics,
  };
}

/**
 * Calculate premium sponsor opportunities.
 *
 * Prices come from SPONSOR_PRICING; they used to be restated here and drifted.
 */
export function calculatePremiumSponsorRevenue() {
  // Master Overview specs
  const newsWeatherRevenue = STATION_CONSTRAINTS.NEWS_WEATHER_SPONSORS * SPONSOR_PRICING.NEWS_WEATHER;
  const sponsoredHoursRevenue = 6 * SPONSOR_PRICING.SPONSORED_HOUR;
  const weekTakeoverRevenue = STATION_CONSTRAINTS.MAX_WEEK_TAKEOVERS_PER_MONTH * SPONSOR_PRICING.WEEK_TAKEOVER;

  return {
    newsWeather: {
      slots: STATION_CONSTRAINTS.NEWS_WEATHER_SPONSORS,
      pricePerSlot: SPONSOR_PRICING.NEWS_WEATHER,
      monthlyRevenue: newsWeatherRevenue,
    },
    sponsoredHours: {
      slotsPerMonth: 6, // Master Overview: 6 sponsored hours per month
      pricePerHour: SPONSOR_PRICING.SPONSORED_HOUR,
      monthlyRevenue: sponsoredHoursRevenue,
    },
    weekTakeover: {
      slotsPerMonth: STATION_CONSTRAINTS.MAX_WEEK_TAKEOVERS_PER_MONTH,
      pricePerWeek: SPONSOR_PRICING.WEEK_TAKEOVER,
      monthlyRevenue: weekTakeoverRevenue,
    },
    totalPremiumRevenue: newsWeatherRevenue + sponsoredHoursRevenue + weekTakeoverRevenue,
  };
}

/**
 * Calculate total station revenue potential
 * OPTIMAL MODEL: Riley $3,900/mo (100% retained), Harper $22,250/mo (80% to artists)
 * Total Artist Pool: $17,800/mo | Total Station Revenue: $8,350/mo
 */
export function calculateStationRevenue(
  artistTierDistribution: { FREE?: number; BRONZE?: number; SILVER?: number; GOLD?: number; PLATINUM?: number },
  sponsorTierDistribution: { LOCAL_HERO?: number; TIER_1?: number; TIER_2?: number; TIER_3?: number },
  includePremiumSponsors: boolean = true
) {
  // Artist revenue (from paid tiers) - Team Riley
  const artistRevenue =
    (artistTierDistribution.BRONZE || 0) * AIRPLAY_TIER_PRICING.BRONZE +
    (artistTierDistribution.SILVER || 0) * AIRPLAY_TIER_PRICING.SILVER +
    (artistTierDistribution.GOLD || 0) * AIRPLAY_TIER_PRICING.GOLD +
    (artistTierDistribution.PLATINUM || 0) * AIRPLAY_TIER_PRICING.PLATINUM;

  // Sponsor revenue (from all tiers) - Team Harper
  const sponsorCapacity = calculateSponsorCapacity(sponsorTierDistribution);
  const sponsorRevenue = sponsorCapacity.monthlyRevenue;

  // Premium sponsor revenue
  const premiumRevenue = includePremiumSponsors ? calculatePremiumSponsorRevenue().totalPremiumRevenue : 0;

  // Total Harper revenue (base + premium)
  const totalHarperRevenue = sponsorRevenue + premiumRevenue;

  // Total revenue
  const totalRevenue = artistRevenue + totalHarperRevenue;

  // Artist pool (80% of ALL sponsor revenue including premium)
  const artistPool = totalHarperRevenue * 0.8;

  // Station operations (20% of sponsor revenue + 100% of artist tier revenue)
  const stationOperations = (totalHarperRevenue * 0.2) + artistRevenue;

  return {
    artistTierRevenue: artistRevenue,
    sponsorRevenue,
    premiumSponsorRevenue: premiumRevenue,
    totalRevenue,
    artistPool,
    stationOperations,
    breakdown: {
      rileyTeamRevenue: artistRevenue,
      harperTeamRevenue: totalHarperRevenue,
    },
  };
}

/**
 * Calculate TrueFans platform revenue from an operator
 * Includes SaaS subscription + platform fee on operator revenue
 */
export function calculatePlatformRevenue(
  plan: keyof typeof OPERATOR_PLANS,
  operatorMonthlyRevenue: number
) {
  const planConfig = OPERATOR_PLANS[plan];
  const subscription = planConfig.monthlyPrice;
  const platformFee = operatorMonthlyRevenue * (planConfig.platformFeePercent / 100);
  const totalPlatformRevenue = subscription + platformFee;

  return {
    plan: planConfig.name,
    subscription,
    platformFeePercent: planConfig.platformFeePercent,
    platformFee: Math.round(platformFee * 100) / 100,
    totalPlatformRevenue: Math.round(totalPlatformRevenue * 100) / 100,
    operatorNetRevenue: Math.round((operatorMonthlyRevenue - platformFee) * 100) / 100,
    setupFee: planConfig.setupFee,
  };
}

/**
 * The station's full-capacity sponsor revenue: base mix plus premium.
 *
 * This is the ONLY place the headline figure should come from. It exists
 * because the number was hard-coded on seven pages and went stale on all of
 * them at once when prices changed.
 */
export function stationRevenuePotential() {
  const sponsors = calculateMaxSponsorCapacity().optimal.revenue;
  const premium = calculatePremiumSponsorRevenue().totalPremiumRevenue;
  return { sponsors, premium, total: sponsors + premium };
}
