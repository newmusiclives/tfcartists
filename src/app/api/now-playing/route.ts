import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationHour, stationToday, stationNow } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/now-playing
 *
 * Returns what's currently playing based on today's locked playlist.
 * Uses the current Mountain Time minute to determine which song
 * should be on air right now.
 *
 * This is the only reliable source — Railway's now_playing endpoint
 * often gets stuck on stale data when track_played reports fail.
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

    // Parse slots and find the song at the current minute
    const slots = JSON.parse(playlist.slots);
    const songSlots = slots
      .filter((s: { type: string; songTitle?: string }) => s.type === "song" && s.songTitle)
      .sort((a: { minute: number }, b: { minute: number }) => a.minute - b.minute);

    // Find the most recent song that should have started by now
    let currentSong: { songTitle: string; artistName: string; minute: number } | null = null;
    for (const song of songSlots) {
      if (song.minute <= minuteOfHour) {
        currentSong = song;
      }
    }

    // If no song found for current minute, use the first song
    if (!currentSong && songSlots.length > 0) {
      currentSong = songSlots[0];
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
