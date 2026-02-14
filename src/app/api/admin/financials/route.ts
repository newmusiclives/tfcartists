import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get current period
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Artist counts by tier
    const [freeArtists, tier5, tier20, tier50, tier120, totalArtists] = await Promise.all([
      prisma.artist.count({ where: { airplayTier: "FREE", deletedAt: null } }),
      prisma.artist.count({ where: { airplayTier: "TIER_5", deletedAt: null } }),
      prisma.artist.count({ where: { airplayTier: "TIER_20", deletedAt: null } }),
      prisma.artist.count({ where: { airplayTier: "TIER_50", deletedAt: null } }),
      prisma.artist.count({ where: { airplayTier: "TIER_120", deletedAt: null } }),
      prisma.artist.count({ where: { deletedAt: null } }),
    ]);

    // Artist subscription revenue
    const artistSubscriptionRevenue =
      tier5 * 5 + tier20 * 20 + tier50 * 50 + tier120 * 120;

    // Artist shares
    const artistShares =
      freeArtists * 1 + tier5 * 5 + tier20 * 25 + tier50 * 75 + tier120 * 200;

    // Sponsor counts by tier
    const [sponsors, activeSponsorships] = await Promise.all([
      prisma.sponsor.count({ where: { deletedAt: null } }),
      prisma.sponsorship.findMany({
        where: { status: "active" },
        select: { tier: true, monthlyAmount: true },
      }),
    ]);

    const sponsorRevenue = activeSponsorships.reduce(
      (sum, s) => sum + s.monthlyAmount,
      0
    );
    const sponsorsByTier = {
      bronze: activeSponsorships.filter((s) => s.tier === "bronze").length,
      silver: activeSponsorships.filter((s) => s.tier === "silver").length,
      gold: activeSponsorships.filter((s) => s.tier === "gold").length,
      platinum: activeSponsorships.filter((s) => s.tier === "platinum").length,
    };

    // Revenue pool data
    const latestPool = await prisma.radioRevenuePool.findFirst({
      orderBy: { createdAt: "desc" },
    });

    // Listener counts
    const [totalListeners, activeListeners, powerUsers] = await Promise.all([
      prisma.listener.count(),
      prisma.listener.count({ where: { status: "ACTIVE" } }),
      prisma.listener.count({ where: { status: "POWER_USER" } }),
    ]);

    // Scout counts
    const [totalScouts, activeScouts] = await Promise.all([
      prisma.scout.count(),
      prisma.scout.count({ where: { status: "ACTIVE" } }),
    ]);

    // DJ counts
    const [totalDJs, activeDJs] = await Promise.all([
      prisma.dJ.count(),
      prisma.dJ.count({ where: { isActive: true } }),
    ]);

    // Song count
    const totalSongs = await prisma.song.count({ where: { isActive: true } });

    // Recent earnings
    const recentEarnings = await prisma.radioEarnings.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { period: true, tier: true, shares: true, earnings: true, paid: true },
    });

    // Station info
    const station = await prisma.station.findFirst({
      select: {
        name: true,
        genre: true,
        maxArtistCapacity: true,
        maxSponsorCapacity: true,
        targetDAU: true,
        maxTracksPerMonth: true,
        maxAdsPerMonth: true,
      },
    });

    // Calculate financial model
    const totalGrossRevenue = artistSubscriptionRevenue + sponsorRevenue;
    const artistPool = sponsorRevenue * 0.8;
    const stationRetained = sponsorRevenue * 0.2;
    const perShareValue = artistShares > 0 ? artistPool / artistShares : 0;

    // Capacity percentages
    const artistCapacity = station
      ? (totalArtists / station.maxArtistCapacity) * 100
      : 0;
    const sponsorCapacity = station
      ? (sponsors / station.maxSponsorCapacity) * 100
      : 0;
    const listenerCapacity = station
      ? ((activeListeners + powerUsers) / station.targetDAU) * 100
      : 0;

    // Per-tier earnings example
    const tierEarnings = {
      FREE: { cost: 0, shares: 1, poolEarnings: perShareValue * 1, net: perShareValue * 1 },
      TIER_5: { cost: 5, shares: 5, poolEarnings: perShareValue * 5, net: perShareValue * 5 - 5 },
      TIER_20: { cost: 20, shares: 25, poolEarnings: perShareValue * 25, net: perShareValue * 25 - 20 },
      TIER_50: { cost: 50, shares: 75, poolEarnings: perShareValue * 75, net: perShareValue * 75 - 50 },
      TIER_120: { cost: 120, shares: 200, poolEarnings: perShareValue * 200, net: perShareValue * 200 - 120 },
    };

    return NextResponse.json({
      currentPeriod,
      station,
      artists: {
        total: totalArtists,
        byTier: { FREE: freeArtists, TIER_5: tier5, TIER_20: tier20, TIER_50: tier50, TIER_120: tier120 },
        subscriptionRevenue: artistSubscriptionRevenue,
        totalShares: artistShares,
      },
      sponsors: {
        total: sponsors,
        activeSponsorships: activeSponsorships.length,
        byTier: sponsorsByTier,
        revenue: sponsorRevenue,
      },
      listeners: {
        total: totalListeners,
        active: activeListeners,
        powerUsers,
      },
      scouts: { total: totalScouts, active: activeScouts },
      programming: { djs: activeDJs, totalDJs, songs: totalSongs },
      financials: {
        totalGrossRevenue,
        artistSubscriptionRevenue,
        sponsorRevenue,
        artistPool,
        stationRetained,
        perShareValue,
        tierEarnings,
      },
      capacity: {
        artists: { current: totalArtists, max: station?.maxArtistCapacity || 340, pct: artistCapacity },
        sponsors: { current: sponsors, max: station?.maxSponsorCapacity || 125, pct: sponsorCapacity },
        listeners: { current: activeListeners + powerUsers, target: station?.targetDAU || 1250, pct: listenerCapacity },
      },
      latestPool,
      recentEarnings,
    });
  } catch (error) {
    return handleApiError(error, "/api/admin/financials");
  }
}
