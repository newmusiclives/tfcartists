import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");
    const search = searchParams.get("search");

    const where: any = {
      deletedAt: null,
      isActive: true,
    };

    if (genre) {
      where.genre = { contains: genre, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { callSign: { contains: search, mode: "insensitive" } },
        { genre: { contains: search, mode: "insensitive" } },
        { tagline: { contains: search, mode: "insensitive" } },
      ];
    }

    const stations = await prisma.station.findMany({
      where,
      select: {
        id: true,
        name: true,
        callSign: true,
        genre: true,
        tagline: true,
        description: true,
        stationCode: true,
        logoUrl: true,
        streamUrl: true,
        _count: {
          select: {
            songs: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    // Get unique DJ counts via DJShow
    const stationsWithCounts = await Promise.all(
      stations.map(async (station) => {
        const djCount = await prisma.dJ.count({
          where: { stationId: station.id },
        });

        return {
          id: station.id,
          name: station.name,
          callSign: station.callSign,
          genre: station.genre,
          tagline: station.tagline,
          description: station.description,
          stationCode: station.stationCode,
          logoUrl: station.logoUrl,
          streamUrl: station.streamUrl,
          djCount,
          songCount: station._count.songs,
        };
      })
    );

    // Collect unique genres for filter options
    const allGenres = new Set<string>();
    stationsWithCounts.forEach((s) => {
      s.genre
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean)
        .forEach((g) => allGenres.add(g));
    });

    logger.info("Station directory fetched", { count: stationsWithCounts.length });

    return NextResponse.json({
      stations: stationsWithCounts,
      genres: Array.from(allGenres).sort(),
    });
  } catch (error) {
    logger.error("Failed to fetch station directory", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch directory" }, { status: 500 });
  }
}
