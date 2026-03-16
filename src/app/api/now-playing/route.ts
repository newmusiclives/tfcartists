import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationHour, stationToday, stationNow } from "@/lib/timezone";

const RAILWAY_BASE = process.env.RAILWAY_BACKEND_URL || "https://tfc-radio-backend-production.up.railway.app";
const NOW_PLAYING_URL = process.env.NOW_PLAYING_URL || `${RAILWAY_BASE}/api/now_playing`;

export const dynamic = "force-dynamic";

// Cache the last Railway response so we can detect staleness
let lastRailwayTitle = "";
let lastRailwayChangedAt = 0;

/**
 * GET /api/now-playing
 *
 * Returns what's currently playing. Uses Railway if the data is fresh,
 * otherwise falls back to the locked playlist in the database.
 */
export async function GET() {
  // 1. Try Railway upstream
  if (NOW_PLAYING_URL) {
    try {
      const res = await fetch(NOW_PLAYING_URL, {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const title = data.title || "";

        // Track when the title last changed
        if (title !== lastRailwayTitle) {
          lastRailwayTitle = title;
          lastRailwayChangedAt = Date.now();
        }

        // If Railway data changed in the last 10 minutes, trust it
        const ageMs = Date.now() - lastRailwayChangedAt;
        if (ageMs < 10 * 60 * 1000 && title) {
          // Ensure field names match what the player expects
          return NextResponse.json({
            ...data,
            artist_name: data.artist_name || data.artistName || data.artist,
            dj_name: data.dj_name || data.djName,
          });
        }
        // Stale — fall through to playlist fallback
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

    // Find the DJ name
    const dj = await prisma.dJ.findUnique({
      where: { id: playlist.djId },
      select: { name: true, slug: true },
    });

    // Parse slots and find the song playing at the current minute
    const slots = JSON.parse(playlist.slots);
    const songSlots = slots
      .filter((s: { type: string; songTitle?: string }) => s.type === "song" && s.songTitle)
      .sort((a: { minute: number }, b: { minute: number }) => a.minute - b.minute);

    // Walk through songs by cumulative duration to find what's actually playing
    let currentSong = songSlots[0] || null;
    let elapsed = 0;
    for (const song of songSlots) {
      if (song.minute <= minuteOfHour) {
        currentSong = song;
      }
    }

    return NextResponse.json({
      station: station.name,
      status: "on-air",
      title: currentSong?.songTitle || "Music",
      artist_name: currentSong?.artistName || station.name,
      dj_name: dj?.name || null,
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
