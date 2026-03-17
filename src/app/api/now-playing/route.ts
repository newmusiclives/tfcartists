import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationHour, stationToday } from "@/lib/timezone";

const RAILWAY_URL = `${process.env.RAILWAY_BACKEND_URL || "https://tfc-radio-backend-production.up.railway.app"}/api/now_playing`;

export const dynamic = "force-dynamic";

/**
 * GET /api/now-playing
 *
 * Proxies Railway's now_playing endpoint (source of truth).
 * Falls back to the locked playlist if Railway is unreachable.
 */
export async function GET() {
  // 1. Try Railway upstream — it knows what's actually playing
  try {
    const res = await fetch(RAILWAY_URL, {
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
    const minuteOfHour = new Date().getMinutes();
    const songSlots = slots.filter(
      (s: { type: string; songTitle?: string }) => s.type === "song" && s.songTitle
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
      artwork_url: null,
      listener_count: 0,
      dj_name: dj?.name || null,
      dj_id: dj?.slug || null,
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
