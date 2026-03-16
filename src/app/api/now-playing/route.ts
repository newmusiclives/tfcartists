import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationHour, stationToday, stationNow } from "@/lib/timezone";

const RAILWAY_BASE = process.env.RAILWAY_BACKEND_URL || "https://tfc-radio-backend-production.up.railway.app";

export const dynamic = "force-dynamic";

/**
 * GET /api/now-playing
 *
 * Returns what's currently playing based on today's locked playlist.
 * Also fetches artwork and listener count from Railway as supplementary data.
 */
export async function GET() {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    if (!station) {
      return NextResponse.json({ error: "No active station" }, { status: 404 });
    }

    const today = stationToday();
    const hour = stationHour();
    const now = stationNow();
    const minuteOfHour = now.getUTCMinutes();

    const playlist = await prisma.hourPlaylist.findFirst({
      where: {
        stationId: station.id,
        airDate: today,
        hourOfDay: hour,
        status: { in: ["locked", "aired"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!playlist) {
      return NextResponse.json({
        station: station.name,
        status: "off-air",
        message: "No playlist available for this hour",
      });
    }

    // Find the DJ
    const dj = await prisma.dJ.findUnique({
      where: { id: playlist.djId },
      select: { name: true, slug: true },
    });

    // Find the current song from the playlist
    const slots = JSON.parse(playlist.slots);
    const songSlots = slots
      .filter((s: { type: string; songTitle?: string }) => s.type === "song" && s.songTitle)
      .sort((a: { minute: number }, b: { minute: number }) => a.minute - b.minute);

    let currentSong: { songTitle: string; artistName: string; songId?: string } | null = null;
    for (const song of songSlots) {
      if (song.minute <= minuteOfHour) {
        currentSong = song;
      }
    }
    if (!currentSong && songSlots.length > 0) {
      currentSong = songSlots[0];
    }

    // Try to get artwork from Railway (non-blocking, best-effort)
    let artworkUrl: string | null = null;
    let listenerCount = 0;
    try {
      const railwayRes = await fetch(`${RAILWAY_BASE}/api/now_playing`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      if (railwayRes.ok) {
        const railwayData = await railwayRes.json();
        artworkUrl = railwayData.artwork_url || null;
        listenerCount = railwayData.listener_count || 0;
      }
    } catch {
      // Railway unreachable — no artwork, that's fine
    }

    return NextResponse.json({
      station: station.name,
      status: "on-air",
      title: currentSong?.songTitle || "Music",
      artist_name: currentSong?.artistName || station.name,
      artwork_url: artworkUrl,
      listener_count: listenerCount,
      dj_name: dj?.name || null,
      dj_id: dj?.slug || null,
      djSlug: dj?.slug || null,
      hourOfDay: hour,
      minuteOfHour,
      source: "playlist",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch now playing" },
      { status: 502 }
    );
  }
}
