import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getCurrentPeriod } from "@/lib/radio/airplay-system";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/artist/stats?artistId=xxx
 * Dashboard stats for the artist self-service portal
 */
export async function GET(request: NextRequest) {
  try {
    const artistId = request.nextUrl.searchParams.get("artistId");
    if (!artistId) {
      return NextResponse.json({ error: "Missing artistId" }, { status: 400 });
    }

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        name: true,
        airplayTier: true,
        airplayShares: true,
        xpTotal: true,
        xpLevel: true,
        status: true,
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const currentPeriod = getCurrentPeriod();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Plays this month
    const playsThisMonth = await prisma.trackPlayback.count({
      where: {
        artistId,
        playedAt: { gte: monthStart },
      },
    });

    // Total listener reach this month (sum of listenerCount)
    const reachResult = await prisma.trackPlayback.aggregate({
      where: {
        artistId,
        playedAt: { gte: monthStart },
      },
      _sum: { listenerCount: true },
    });
    const listenerReach = reachResult._sum.listenerCount || 0;

    // Earnings this month
    const currentEarnings = await prisma.radioEarnings.findUnique({
      where: {
        artistId_period: { artistId, period: currentPeriod },
      },
    });

    // Total all-time plays
    const totalPlays = await prisma.trackPlayback.count({
      where: { artistId },
    });

    // Track count
    const trackCount = await prisma.trackSubmission.count({
      where: { artistId },
    });

    // Tracks in rotation
    const tracksInRotation = await prisma.trackSubmission.count({
      where: { artistId, addedToRotation: true },
    });

    logger.info("Fetched artist portal stats", { artistId });

    return NextResponse.json({
      stats: {
        playsThisMonth,
        listenerReach,
        earningsThisMonth: currentEarnings?.earnings || 0,
        earningsPaid: currentEarnings?.paid || false,
        currentTier: artist.airplayTier,
        shares: artist.airplayShares,
        xpTotal: artist.xpTotal,
        xpLevel: artist.xpLevel,
        totalPlays,
        trackCount,
        tracksInRotation,
      },
    });
  } catch (error) {
    logger.error("Error fetching artist portal stats", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
