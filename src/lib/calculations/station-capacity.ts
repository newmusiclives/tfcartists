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

// AIRPLAY TIERS (from airplay-system.ts)
export const AIRPLAY_TIER_SHARES = {
  FREE: 1,
  TIER_5: 5,
  TIER_20: 25,
  TIER_50: 75,
  TIER_120: 200,
} as const;

// SPONSOR TIERS (from harper-personality.ts)
export const SPONSOR_AD_SPOTS = {
  BRONZE: 10,
  SILVER: 20,
  GOLD: 40,
  PLATINUM: 60,
} as const;

export const SPONSOR_PRICING = {
  BRONZE: 100,
  SILVER: 250,
  GOLD: 400,
  PLATINUM: 500,
  NEWS_WEATHER: 200, // per month
  SPONSORED_HOUR: 500, // per hour
  WEEK_TAKEOVER: 2000, // per week
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
  TIER_5?: number;
  TIER_20?: number;
  TIER_50?: number;
  TIER_120?: number;
}) {
  const monthly = calculateMonthlyAirtime();

  // Calculate total shares
  const totalShares =
    (tierDistribution.FREE || 0) * AIRPLAY_TIER_SHARES.FREE +
    (tierDistribution.TIER_5 || 0) * AIRPLAY_TIER_SHARES.TIER_5 +
    (tierDistribution.TIER_20 || 0) * AIRPLAY_TIER_SHARES.TIER_20 +
    (tierDistribution.TIER_50 || 0) * AIRPLAY_TIER_SHARES.TIER_50 +
    (tierDistribution.TIER_120 || 0) * AIRPLAY_TIER_SHARES.TIER_120;

  // Plays per share
  const playsPerShare = totalShares > 0 ? monthly.totalMonthlyTracks / totalShares : 0;

  // Calculate plays per artist in each tier
  const playsPerArtist = {
    FREE: playsPerShare * AIRPLAY_TIER_SHARES.FREE,
    TIER_5: playsPerShare * AIRPLAY_TIER_SHARES.TIER_5,
    TIER_20: playsPerShare * AIRPLAY_TIER_SHARES.TIER_20,
    TIER_50: playsPerShare * AIRPLAY_TIER_SHARES.TIER_50,
    TIER_120: playsPerShare * AIRPLAY_TIER_SHARES.TIER_120,
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
 * Assumes minimum plays per artist to maintain quality (e.g., at least 10 plays/month for FREE tier)
 */
export function calculateMaxArtistCapacity(minPlaysPerFreeTierArtist: number = 10) {
  const monthly = calculateMonthlyAirtime();

  // If FREE tier gets minimum plays, calculate max artists
  const maxFreeArtists = Math.floor(monthly.totalMonthlyTracks / minPlaysPerFreeTierArtist);

  // Calculate for mixed tier scenarios
  const scenarios = {
    allFree: {
      artists: maxFreeArtists,
      revenue: 0, // All FREE
    },
    balanced: {
      // Example: 40% FREE, 30% Bronze, 20% Silver, 7% Gold, 3% Platinum
      FREE: Math.floor(maxFreeArtists * 0.4),
      TIER_5: Math.floor(maxFreeArtists * 0.3),
      TIER_20: Math.floor(maxFreeArtists * 0.2),
      TIER_50: Math.floor(maxFreeArtists * 0.07),
      TIER_120: Math.floor(maxFreeArtists * 0.03),
    },
    premium: {
      // Example: 20% FREE, 20% Bronze, 30% Silver, 20% Gold, 10% Platinum
      FREE: Math.floor(maxFreeArtists * 0.2),
      TIER_5: Math.floor(maxFreeArtists * 0.2),
      TIER_20: Math.floor(maxFreeArtists * 0.3),
      TIER_50: Math.floor(maxFreeArtists * 0.2),
      TIER_120: Math.floor(maxFreeArtists * 0.1),
    },
  };

  // Calculate revenue for balanced scenario
  const balancedRevenue =
    scenarios.balanced.TIER_5 * 5 +
    scenarios.balanced.TIER_20 * 20 +
    scenarios.balanced.TIER_50 * 50 +
    scenarios.balanced.TIER_120 * 120;

  // Calculate revenue for premium scenario
  const premiumRevenue =
    scenarios.premium.TIER_5 * 5 +
    scenarios.premium.TIER_20 * 20 +
    scenarios.premium.TIER_50 * 50 +
    scenarios.premium.TIER_120 * 120;

  return {
    maxFreeArtists,
    scenarios: {
      allFree: { ...scenarios.allFree, artists: maxFreeArtists },
      balanced: { ...scenarios.balanced, revenue: balancedRevenue, artists: Object.values(scenarios.balanced).reduce((a, b) => a + b, 0) },
      premium: { ...scenarios.premium, revenue: premiumRevenue, artists: Object.values(scenarios.premium).reduce((a, b) => a + b, 0) },
    },
  };
}

/**
 * Calculate sponsor capacity based on ad spots
 */
export function calculateSponsorCapacity(sponsorDistribution: {
  BRONZE?: number;
  SILVER?: number;
  GOLD?: number;
  PLATINUM?: number;
}) {
  const monthly = calculateMonthlyAirtime();

  // Calculate total ad spots needed
  const totalSpotsNeeded =
    (sponsorDistribution.BRONZE || 0) * SPONSOR_AD_SPOTS.BRONZE +
    (sponsorDistribution.SILVER || 0) * SPONSOR_AD_SPOTS.SILVER +
    (sponsorDistribution.GOLD || 0) * SPONSOR_AD_SPOTS.GOLD +
    (sponsorDistribution.PLATINUM || 0) * SPONSOR_AD_SPOTS.PLATINUM;

  // Calculate revenue
  const revenue =
    (sponsorDistribution.BRONZE || 0) * SPONSOR_PRICING.BRONZE +
    (sponsorDistribution.SILVER || 0) * SPONSOR_PRICING.SILVER +
    (sponsorDistribution.GOLD || 0) * SPONSOR_PRICING.GOLD +
    (sponsorDistribution.PLATINUM || 0) * SPONSOR_PRICING.PLATINUM;

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
 */
export function calculateMaxSponsorCapacity() {
  const monthly = calculateMonthlyAirtime();
  const totalMonthlySpots = monthly.totalMonthlyAdSpots;

  const scenarios = {
    allBronze: {
      sponsors: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.BRONZE), // 1,728
      revenue: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.BRONZE) * SPONSOR_PRICING.BRONZE,
    },
    allSilver: {
      sponsors: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.SILVER), // 864
      revenue: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.SILVER) * SPONSOR_PRICING.SILVER,
    },
    allGold: {
      sponsors: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.GOLD), // 432
      revenue: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.GOLD) * SPONSOR_PRICING.GOLD,
    },
    allPlatinum: {
      sponsors: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.PLATINUM), // 288
      revenue: Math.floor(totalMonthlySpots / SPONSOR_AD_SPOTS.PLATINUM) * SPONSOR_PRICING.PLATINUM,
    },
    balanced: {
      // Realistic mix: 40% Bronze, 35% Silver, 20% Gold, 5% Platinum
      BRONZE: Math.floor((totalMonthlySpots * 0.4) / SPONSOR_AD_SPOTS.BRONZE),
      SILVER: Math.floor((totalMonthlySpots * 0.35) / SPONSOR_AD_SPOTS.SILVER),
      GOLD: Math.floor((totalMonthlySpots * 0.2) / SPONSOR_AD_SPOTS.GOLD),
      PLATINUM: Math.floor((totalMonthlySpots * 0.05) / SPONSOR_AD_SPOTS.PLATINUM),
    },
  };

  // Calculate balanced revenue
  const balancedRevenue =
    scenarios.balanced.BRONZE * SPONSOR_PRICING.BRONZE +
    scenarios.balanced.SILVER * SPONSOR_PRICING.SILVER +
    scenarios.balanced.GOLD * SPONSOR_PRICING.GOLD +
    scenarios.balanced.PLATINUM * SPONSOR_PRICING.PLATINUM;

  scenarios.balanced = {
    ...scenarios.balanced,
    sponsors: Object.values(scenarios.balanced).reduce((a, b) => a + b, 0),
    revenue: balancedRevenue,
  } as any;

  return scenarios;
}

/**
 * Calculate premium sponsor opportunities
 */
export function calculatePremiumSponsorRevenue() {
  const newsWeatherRevenue = STATION_CONSTRAINTS.NEWS_WEATHER_SPONSORS * SPONSOR_PRICING.NEWS_WEATHER; // $400/mo
  const sponsoredHoursRevenue = STATION_CONSTRAINTS.MAX_SPONSORED_HOURS_PER_WEEK * 4 * SPONSOR_PRICING.SPONSORED_HOUR; // $4,000/mo
  const weekTakeoverRevenue = STATION_CONSTRAINTS.MAX_WEEK_TAKEOVERS_PER_MONTH * SPONSOR_PRICING.WEEK_TAKEOVER; // $2,000/mo

  return {
    newsWeather: {
      slots: STATION_CONSTRAINTS.NEWS_WEATHER_SPONSORS,
      pricePerSlot: SPONSOR_PRICING.NEWS_WEATHER,
      monthlyRevenue: newsWeatherRevenue,
    },
    sponsoredHours: {
      slotsPerMonth: STATION_CONSTRAINTS.MAX_SPONSORED_HOURS_PER_WEEK * 4,
      pricePerHour: SPONSOR_PRICING.SPONSORED_HOUR,
      monthlyRevenue: sponsoredHoursRevenue,
    },
    weekTakeover: {
      slotsPerMonth: STATION_CONSTRAINTS.MAX_WEEK_TAKEOVERS_PER_MONTH,
      pricePerWeek: SPONSOR_PRICING.WEEK_TAKEOVER,
      monthlyRevenue: weekTakeoverRevenue,
    },
    totalPremiumRevenue: newsWeatherRevenue + sponsoredHoursRevenue + weekTakeoverRevenue, // $6,400/mo
  };
}

/**
 * Calculate total station revenue potential
 */
export function calculateStationRevenue(
  artistTierDistribution: { FREE?: number; TIER_5?: number; TIER_20?: number; TIER_50?: number; TIER_120?: number },
  sponsorTierDistribution: { BRONZE?: number; SILVER?: number; GOLD?: number; PLATINUM?: number },
  includePremiumSponsors: boolean = true
) {
  // Artist revenue (from paid tiers)
  const artistRevenue =
    (artistTierDistribution.TIER_5 || 0) * 5 +
    (artistTierDistribution.TIER_20 || 0) * 20 +
    (artistTierDistribution.TIER_50 || 0) * 50 +
    (artistTierDistribution.TIER_120 || 0) * 120;

  // Sponsor revenue (from all tiers)
  const sponsorCapacity = calculateSponsorCapacity(sponsorTierDistribution);
  const sponsorRevenue = sponsorCapacity.monthlyRevenue;

  // Premium sponsor revenue
  const premiumRevenue = includePremiumSponsors ? calculatePremiumSponsorRevenue().totalPremiumRevenue : 0;

  // Total revenue
  const totalRevenue = artistRevenue + sponsorRevenue + premiumRevenue;

  // Artist pool (80% of sponsor revenue)
  const artistPool = sponsorRevenue * 0.8;

  // Station operations (20% of sponsor revenue + all artist tier revenue)
  const stationOperations = (sponsorRevenue * 0.2) + artistRevenue + premiumRevenue;

  return {
    artistTierRevenue: artistRevenue,
    sponsorRevenue,
    premiumSponsorRevenue: premiumRevenue,
    totalRevenue,
    artistPool,
    stationOperations,
    breakdown: {
      rileyTeamRevenue: artistRevenue,
      harperTeamRevenue: sponsorRevenue + premiumRevenue,
    },
  };
}
