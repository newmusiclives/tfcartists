import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationHour, stationNow, stationToday } from "@/lib/timezone";

const RAILWAY_URL = `${process.env.RAILWAY_BACKEND_URL || "https://tfc-radio-backend-production.up.railway.app"}/api/now_playing`;

export const dynamic = "force-dynamic";

// Default durations (seconds) for non-song elements — matches playout/hour
const DEFAULT_DURATION: Record<string, number> = {
  imaging: 5, sweeper: 5, promo: 10, station_id: 4,
  feature: 45, voice_break: 10, song: 210,
  ad: 20, commercial: 20, transition: 8,
};

/**
 * Derive the currently-playing song from the locked playlist for this hour.
 * Walks through ALL slots (songs, voice breaks, imaging, ads) with their
 * actual durations to compute cumulative time, then finds which song
 * is playing at the current elapsed seconds.
 */
function deriveCurrentSong(
  slots: Array<{ type: string; songTitle?: string; artistName?: string; songId?: string; minute: number; duration?: number }>,
  minuteOfHour: number,
  secondOfMinute: number
) {
  const elapsedSeconds = minuteOfHour * 60 + secondOfMinute;

  // Walk through all slots in order, accumulating time
  let cumulativeSec = 0;
  let currentSong: typeof slots[0] | null = null;

  for (const slot of slots) {
    const slotDuration = slot.duration || DEFAULT_DURATION[slot.type] || 10;

    if (cumulativeSec + slotDuration > elapsedSeconds) {
      // We're currently in this slot
      if (slot.type === "song" && slot.songTitle) {
        return slot;
      }
      // We're in a non-song element — return the most recent song
      return currentSong;
    }

    // Track the most recent song we've passed
    if (slot.type === "song" && slot.songTitle) {
      currentSong = slot;
    }

    cumulativeSec += slotDuration;
  }

  // Past the end of all slots — return last song
  return currentSong;
}

/**
 * GET /api/now-playing
 *
 * Derives now-playing from the locked playlist (source of truth for what
 * Liquidsoap is actually playing). Supplements with Railway data for
 * listener count when available.
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
    const secondOfMinute = now.getUTCSeconds();

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

    const dj = await prisma.dJ.findUnique({
      where: { id: playlist.djId },
      select: { name: true, slug: true },
    });

    const slots = JSON.parse(playlist.slots);
    const currentSong = deriveCurrentSong(slots, minuteOfHour, secondOfMinute);

    // Try to get listener count from Railway (non-blocking, best-effort)
    let listenerCount = 0;
    try {
      const res = await fetch(RAILWAY_URL, {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        listenerCount = data.listener_count || 0;
      }
    } catch {
      // Railway unreachable — continue with 0 listeners
    }

    // Look up artwork from the song record if available
    let artworkUrl: string | null = null;
    if (currentSong?.songId) {
      const song = await prisma.song.findUnique({
        where: { id: currentSong.songId },
        select: { artworkUrl: true },
      });
      artworkUrl = song?.artworkUrl || null;
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
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch now playing" },
      { status: 502 }
    );
  }
}
