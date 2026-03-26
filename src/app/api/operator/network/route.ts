import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stations = await prisma.station.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        callSign: true,
        genre: true,
        tagline: true,
        stationCode: true,
        isActive: true,
        logoUrl: true,
        createdAt: true,
        streamUrl: true,
        _count: {
          select: {
            songs: true,
            sponsorAds: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get DJ counts per station via DJShow (distinct djId)
    const stationStats = await Promise.all(
      stations.map(async (station) => {
        // DJShow doesn't have stationId; DJ has stationId. Count DJs on this station.
        const djCount = await prisma.dJ.count({
          where: { stationId: station.id },
        });

        // Get sponsor revenue from active sponsorships linked to ads on this station
        const sponsorAds = await prisma.sponsorAd.findMany({
          where: { stationId: station.id, isActive: true },
          select: { sponsorId: true },
        });

        const sponsorIds = sponsorAds
          .map((a) => a.sponsorId)
          .filter((id): id is string => id !== null);

        let sponsorRevenue = 0;
        if (sponsorIds.length > 0) {
          const sponsorships = await prisma.sponsorship.aggregate({
            where: {
              sponsorId: { in: sponsorIds },
              status: "active",
            },
            _sum: { monthlyAmount: true },
          });
          sponsorRevenue = sponsorships._sum.monthlyAmount || 0;
        }

        return {
          id: station.id,
          name: station.name,
          callSign: station.callSign,
          genre: station.genre,
          tagline: station.tagline,
          stationCode: station.stationCode,
          isActive: station.isActive,
          logoUrl: station.logoUrl,
          createdAt: station.createdAt,
          streamUrl: station.streamUrl,
          songCount: station._count.songs,
          djCount,
          sponsorAdCount: station._count.sponsorAds,
          sponsorRevenue,
        };
      })
    );

    const totalRevenue = stationStats.reduce((s, st) => s + st.sponsorRevenue, 0);
    const totalDJs = stationStats.reduce((s, st) => s + st.djCount, 0);
    const totalSongs = stationStats.reduce((s, st) => s + st.songCount, 0);

    logger.info("Network dashboard fetched", { stationCount: stationStats.length });

    return NextResponse.json({
      stations: stationStats,
      summary: {
        totalStations: stationStats.length,
        activeStations: stationStats.filter((s) => s.isActive).length,
        totalRevenue,
        totalDJs,
        totalSongs,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch network dashboard", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch network data" }, { status: 500 });
  }
}
