import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationHour, stationToday } from "@/lib/timezone";

const NOW_PLAYING_URL =
  process.env.NOW_PLAYING_URL || process.env.RAILWAY_BACKEND_URL
    ? `${process.env.RAILWAY_BACKEND_URL || "https://tfc-radio-backend-production.up.railway.app"}/api/now_playing`
    : null;

export const dynamic = "force-dynamic";

/**
 * GET /api/now-playing
 *
 * Returns what's currently playing. Tries Railway first, falls back to
 * the locked playlist in the database so now-playing works even when
 * Railway is unreachable.
 */
export async function GET() {
  // 1. Try Railway upstream
  if (NOW_PLAYING_URL) {
    try {
      const res = await fetch(NOW_PLAYING_URL, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Railway unreachable — fall through to DB fallback
    }
  }

  // 2. Fallback: derive now-playing from today's locked playlist
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

    const playlist = await prisma.hourPlaylist.findFirst({
      where: {
        stationId: station.id,
        airDate: today,
        hourOfDay: hour,
        status: { in: ["locked", "aired"] },
      },
      include: {
        voiceTracks: {
          where: { status: "audio_ready" },
          take: 1,
        },
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

    // Find the DJ name
    const dj = await prisma.dJ.findUnique({
      where: { id: playlist.djId },
      select: { name: true, slug: true },
    });

    // Parse slots to find the approximate current song
    const slots = JSON.parse(playlist.slots);
    const now = new Date();
    const minuteOfHour = now.getMinutes();

    // Find the song slot closest to the current minute
    const songSlots = slots.filter((s: { type: string; songTitle?: string }) =>
      s.type === "song" && s.songTitle
    );
    const currentSong = songSlots.reduce(
      (best: { minute: number; songTitle: string; artistName: string } | null, s: { minute: number; songTitle: string; artistName: string }) => {
        if (s.minute <= minuteOfHour && (!best || s.minute > best.minute)) return s;
        return best;
      },
      null
    );

    return NextResponse.json({
      station: station.name,
      status: "on-air",
      title: currentSong?.songTitle || "Music",
      artist_name: currentSong?.artistName || station.name,
      dj_name: dj?.name || null,
      djSlug: dj?.slug || null,
      hourOfDay: hour,
      source: "playlist-fallback",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch now playing" },
      { status: 502 }
    );
  }
}
