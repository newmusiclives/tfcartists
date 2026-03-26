import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listenerId = searchParams.get("listenerId");

    if (!listenerId) {
      return NextResponse.json({ error: "listenerId required" }, { status: 400 });
    }

    // Fetch listener
    const listener = await prisma.listener.findUnique({
      where: { id: listenerId },
      select: {
        id: true,
        name: true,
        totalSessions: true,
        totalListeningHours: true,
        lastListenedAt: true,
        favoriteTimeSlot: true,
      },
    });

    if (!listener) {
      return NextResponse.json({ error: "Listener not found" }, { status: 404 });
    }

    // Recent track playbacks (last 20)
    const recentTracks = await prisma.trackPlayback.findMany({
      orderBy: { playedAt: "desc" },
      take: 20,
      select: {
        id: true,
        trackTitle: true,
        artistName: true,
        artistId: true,
        playedAt: true,
        djId: true,
        dj: { select: { name: true, slug: true } },
        duration: true,
      },
    });

    // Top artists by play count
    const topArtists = await prisma.trackPlayback.groupBy({
      by: ["artistName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // Top DJs by play count
    const topDJs = await prisma.trackPlayback.groupBy({
      by: ["djId"],
      where: { djId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    // Resolve DJ names
    const djIds = topDJs.map((d) => d.djId).filter((id): id is string => id !== null);
    const djs = djIds.length > 0
      ? await prisma.dJ.findMany({
          where: { id: { in: djIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];

    const djMap = new Map(djs.map((d) => [d.id, d]));

    const topDJsResolved = topDJs.map((d) => ({
      djId: d.djId,
      djName: djMap.get(d.djId!)?.name || "Unknown",
      djSlug: djMap.get(d.djId!)?.slug || "",
      playCount: d._count.id,
    }));

    const favoriteArtist = topArtists[0]?.artistName || null;
    const favoriteDJ = topDJsResolved[0]?.djName || null;

    logger.info("Listener history fetched", { listenerId });

    return NextResponse.json({
      listener,
      stats: {
        totalListenTime: Math.round(listener.totalListeningHours * 60),
        totalSessions: listener.totalSessions,
        favoriteArtist,
        favoriteDJ,
      },
      recentTracks,
      topArtists: topArtists.map((a) => ({
        artistName: a.artistName,
        playCount: a._count.id,
      })),
      topDJs: topDJsResolved,
    });
  } catch (error) {
    logger.error("Failed to fetch listener history", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
