import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/playback — Log a track play
 * Called by the radio player when the now-playing track changes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      trackTitle,
      artistName,
      artistId,
      trackId,
      djId,
      showId,
      timeSlot,
      listenerId,
      sessionId,
    } = body;

    if (!trackTitle || !artistName) {
      return NextResponse.json(
        { error: "trackTitle and artistName are required" },
        { status: 400 }
      );
    }

    // Determine time slot from current hour if not provided
    const hour = new Date().getHours();
    const slot =
      timeSlot ||
      (hour >= 6 && hour < 12
        ? "morning"
        : hour >= 12 && hour < 18
          ? "midday"
          : hour >= 18 && hour < 24
            ? "evening"
            : "late_night");

    // 1. Log to TrackPlayback (station-wide track log)
    const playback = await prisma.trackPlayback.create({
      data: {
        trackTitle,
        artistName,
        artistId: artistId || null,
        trackId: trackId || null,
        djId: djId || null,
        showId: showId || null,
        timeSlot: slot,
      },
    });

    // 2. If we have a listener, log to ListenerPlayback (per-listener history)
    if (listenerId) {
      await prisma.listenerPlayback.create({
        data: {
          listenerId,
          trackTitle,
          artistName,
          artistId: artistId || "",
          trackId: trackId || null,
          sessionId: sessionId || null,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, id: playback.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to log playback" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/playback — Get recent track plays
 */
export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;

    const plays = await prisma.trackPlayback.findMany({
      orderBy: { playedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ plays });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch playback history" },
      { status: 500 }
    );
  }
}
