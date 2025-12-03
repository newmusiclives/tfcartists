/**
 * Station Capacity & Revenue Calculations
 *
 * Calculates how many artists and sponsors each station can support
 * based on airtime constraints
 */

// AIRTIME CONSTRAINTS
export const STATION_CONSTRAINTS = {
  // Track rotation
  TRACKS_PER_HOUR: 12,
  PRIME_HOURS: { start: 6, end: 18 }, // 6am - 6pm
  SUBPRIME_HOURS: { start: 18, end: 6 }, // 6pm - 6am (next day)

  // Ad constraints
  MAX_AD_MINUTES_PER_HOUR: 6,
  AD_DURATION_SECONDS: 15,
  MAX_AD_SPOTS_PER_HOUR: 24, // 6 min / 15 sec

  // Premium sponsor opportunities
  MAX_SPONSORED_HOURS_PER_WEEK: 2,
  MAX_WEEK_TAKEOVERS_PER_MONTH: 1,
  NEWS_WEATHER_SPONSORS: 2, // max daily mentions
} as const;

// AIRPLAY TIERS - Team Riley
export const AIRPLAY_TIER_SHARES = {
  FREE: 1,
  BRONZE: 5,    // $5/month
  SILVER: 25,   // $20/month
  GOLD: 75,     // $50/month
  PLATINUM: 200, // $120/month
} as const;

export const AIRPLAY_TIER_PRICING = {
  FREE: 0,
  BRONZE: 5,
  SILVER: 20,
  GOLD: 50,
  PLATINUM: 120,
} as const;

export const AIRPLAY_TIER_PLAYS_PER_MONTH = {
  FREE: 1,
  BRONZE: 4,
  SILVER: 16,
  GOLD: 48,
  PLATINUM: 192,
} as const;

// MASTER OVERVIEW ARTIST CAPACITY
export const ARTIST_CAPACITY = {
  FREE: 180,
  BRONZE: 80,
  SILVER: 40,
  GOLD: 30,
  PLATINUM: 10,
  TOTAL: 340,
} as const;

// SPONSOR TIERS - Team Harper (3-tier model)
export const SPONSOR_AD_SPOTS = {
  TIER_1: 60,   // 2 spots/day × 30 days
  TIER_2: 150,  // 5 spots/day × 30 days
  TIER_3: 300,  // 10 spots/day × 30 days
} as const;

export const SPONSOR_PRICING = {
  TIER_1: 100,  // per month
  TIER_2: 200,  // per month
  TIER_3: 400,  // per month
  NEWS_WEATHER: 400, // per month
  SPONSORED_HOUR: 300, // per month (not per hour!)
  WEEK_TAKEOVER: 800, // per month (not per week!)
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

    primeAdSpots: primeHours * STATION_CONSTRAINTS.MAX_AD_SPOTS_PER_HOUR, // 288 spots
    subprimeAdSpots: subprimeHours * STATION_CONSTRAINTS.MAX_AD_SPOTS_PER_HOUR, // 288 spots
    totalDailyAdSpots: 24 * STATION_CONSTRAINTS.MAX_AD_SPOTS_PER_HOUR, // 576 spots
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

    totalMonthlyAdSpots: daily.totalDailyAdSpots * daysInMonth, // 17,280 spots
    primeMonthlyAdSpots: daily.primeAdSpots * daysInMonth, // 8,640 spots
    subprimeMonthlyAdSpots: daily.subprimeAdSpots * daysInMonth, // 8,640 spots
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
  TIER_1?: number;
  TIER_2?: number;
  TIER_3?: number;
}) {
  const monthly = calculateMonthlyAirtime();

  // Calculate total ad spots needed
  const totalSpotsNeeded =
    (sponsorDistribution.TIER_1 || 0) * SPONSOR_AD_SPOTS.TIER_1 +
    (sponsorDistribution.TIER_2 || 0) * SPONSOR_AD_SPOTS.TIER_2 +
    (sponsorDistribution.TIER_3 || 0) * SPONSOR_AD_SPOTS.TIER_3;

  // Calculate revenue
  const revenue =
    (sponsorDistribution.TIER_1 || 0) * SPONSOR_PRICING.TIER_1 +
    (sponsorDistribution.TIER_2 || 0) * SPONSOR_PRICING.TIER_2 +
    (sponsorDistribution.TIER_3 || 0) * SPONSOR_PRICING.TIER_3;

  const spotsRemaining = monthly.totalMonthlyAdSpots - totalSpotsNeeded;
  const capacityUtilization = (totalSpotsNeeded / monthly.totalMonthlyAdSpots) * 100;

  return {
    totalSponsors: Object.values(sponsorDistribution).reduce((sum, count) => sum + count, 0),
    totalSpotsNeeded,
    totalSpotsAvailable: monthly.totalMonthlyAdSpots,
    spotsRemaining,
    capacityUtilization,
    monthlyRevenue: revenue,
  };
}

/**
 * Calculate maximum sponsor capacity
 * Master Overview: Target is 24 sponsors generating $7,800/month
 */
export function calculateMaxSponsorCapacity() {
  const monthly = calculateMonthlyAirtime();
  const totalMonthlySpots = monthly.totalMonthlyAdSpots;

  const scenarios = {
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
    masterOverview: {
      // Master Overview target: $7,800/month from 24 sponsors
      // 8 Tier 1 ($800), 10 Tier 2 ($2,000), 6 Tier 3 ($2,400) = $5,200
      // Plus 6 Sponsored Hours ($1,800) and 1 Week Takeover ($800) = $7,800
      TIER_1: 8,
      TIER_2: 10,
      TIER_3: 6,
    },
    balanced: {
      // Balanced mix using available inventory
      TIER_1: 8,
      TIER_2: 10,
      TIER_3: 6,
    },
  };

  // Calculate master overview revenue
  const masterRevenue =
    scenarios.masterOverview.TIER_1 * SPONSOR_PRICING.TIER_1 +
    scenarios.masterOverview.TIER_2 * SPONSOR_PRICING.TIER_2 +
    scenarios.masterOverview.TIER_3 * SPONSOR_PRICING.TIER_3;

  scenarios.masterOverview = {
    ...scenarios.masterOverview,
    sponsors: 24,
    revenue: masterRevenue, // Base $5,200 (premium adds $2,600 for $7,800 total)
  } as any;

  // Calculate balanced revenue (same as master for now)
  scenarios.balanced = {
    ...scenarios.balanced,
    sponsors: 24,
    revenue: masterRevenue,
  } as any;

  return scenarios;
}

/**
 * Calculate premium sponsor opportunities
 * Master Overview: News & Weather $400, Sponsored Hours $300, Week Takeover $800
 */
export function calculatePremiumSponsorRevenue() {
  // Master Overview specs
  const newsWeatherRevenue = STATION_CONSTRAINTS.NEWS_WEATHER_SPONSORS * SPONSOR_PRICING.NEWS_WEATHER; // 2 × $400 = $800/mo
  const sponsoredHoursRevenue = 6 * SPONSOR_PRICING.SPONSORED_HOUR; // 6 slots × $300 = $1,800/mo
  const weekTakeoverRevenue = STATION_CONSTRAINTS.MAX_WEEK_TAKEOVERS_PER_MONTH * SPONSOR_PRICING.WEEK_TAKEOVER; // 1 × $800 = $800/mo

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
    totalPremiumRevenue: newsWeatherRevenue + sponsoredHoursRevenue + weekTakeoverRevenue, // $3,400/mo
  };
}

/**
 * Calculate total station revenue potential
 * Master Overview: Riley $3,900/mo (100% retained), Harper $7,800/mo (80% to artists)
 */
export function calculateStationRevenue(
  artistTierDistribution: { FREE?: number; BRONZE?: number; SILVER?: number; GOLD?: number; PLATINUM?: number },
  sponsorTierDistribution: { TIER_1?: number; TIER_2?: number; TIER_3?: number },
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
