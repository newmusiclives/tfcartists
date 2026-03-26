import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationHour, stationToday, stationDayOfWeek } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/whats-playing
 *
 * Returns a combined payload for the public "What's Playing" page:
 *   - nowPlaying: current track (via /api/now-playing logic or most recent TrackPlayback)
 *   - recentlyPlayed: last 10 tracks from TrackPlayback
 *   - upNext: upcoming tracks from the current HourPlaylist slots
 *   - currentShow: DJ show name, host, time slot
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

    const hour = stationHour();
    const today = stationToday();
    const dow = stationDayOfWeek();

    // ---- Now Playing ----
    // Try Liquidsoap push first, then fall back to most recent TrackPlayback
    let nowPlaying: {
      title: string;
      artistName: string;
      artworkUrl: string | null;
      playedAt: string | null;
    } | null = null;

    try {
      const { getLiquidoapNowPlaying } = await import(
        "@/lib/radio/liquidsoap-state"
      );
      const liqNow = getLiquidoapNowPlaying();
      if (liqNow) {
        const song = await prisma.song.findFirst({
          where: {
            title: liqNow.title,
            artistName: liqNow.artist_name,
            stationId: station.id,
          },
          select: { artworkUrl: true },
        });
        nowPlaying = {
          title: liqNow.title,
          artistName: liqNow.artist_name,
          artworkUrl: song?.artworkUrl || null,
          playedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Liquidsoap state not available
    }

    // Fallback: most recent TrackPlayback
    if (!nowPlaying) {
      const latest = await prisma.trackPlayback.findFirst({
        orderBy: { playedAt: "desc" },
      });
      if (latest) {
        const song = await prisma.song.findFirst({
          where: {
            title: latest.trackTitle,
            artistName: latest.artistName,
            stationId: station.id,
          },
          select: { artworkUrl: true },
        });
        nowPlaying = {
          title: latest.trackTitle,
          artistName: latest.artistName,
          artworkUrl: song?.artworkUrl || null,
          playedAt: latest.playedAt.toISOString(),
        };
      }
    }

    // ---- Recently Played (last 10, excluding the current track) ----
    const recentRows = await prisma.trackPlayback.findMany({
      orderBy: { playedAt: "desc" },
      take: 11, // grab 11 so we can skip the first if it matches nowPlaying
    });

    const recentlyPlayed = recentRows
      .filter((r) => {
        if (!nowPlaying) return true;
        // skip the row that matches the current now-playing track
        return !(
          r.trackTitle === nowPlaying.title &&
          r.artistName === nowPlaying.artistName &&
          r.playedAt.toISOString() === nowPlaying.playedAt
        );
      })
      .slice(0, 10);

    // Batch-fetch artwork for recent tracks
    const recentSongs = await prisma.song.findMany({
      where: {
        stationId: station.id,
        OR: recentlyPlayed.map((r) => ({
          title: r.trackTitle,
          artistName: r.artistName,
        })),
      },
      select: { title: true, artistName: true, artworkUrl: true },
    });

    const artworkMap = new Map<string, string>();
    for (const s of recentSongs) {
      if (s.artworkUrl) {
        artworkMap.set(`${s.artistName}::${s.title}`, s.artworkUrl);
      }
    }

    const recentlyPlayedPayload = recentlyPlayed.map((r) => ({
      id: r.id,
      title: r.trackTitle,
      artistName: r.artistName,
      artworkUrl:
        artworkMap.get(`${r.artistName}::${r.trackTitle}`) || null,
      playedAt: r.playedAt.toISOString(),
    }));

    // ---- Up Next (from current HourPlaylist slots) ----
    let upNext: { title: string; artistName: string; artworkUrl: string | null }[] = [];

    const playlist = await prisma.hourPlaylist.findFirst({
      where: {
        stationId: station.id,
        airDate: today,
        hourOfDay: hour,
        status: { in: ["locked", "aired"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (playlist) {
      try {
        const slots = JSON.parse(playlist.slots) as Array<{
          position: number;
          type: string;
          songTitle?: string;
          artistName?: string;
          songId?: string;
        }>;

        // Find upcoming song slots — those that haven't played yet
        // Estimate current position by minutes into the hour
        const now = new Date();
        const minuteOfHour = now.getMinutes();

        const songSlots = slots
          .filter((s) => s.type === "song" && s.songTitle && s.artistName)
          .filter((s) => (s.position ?? 0) > minuteOfHour / 4) // rough heuristic: 4 slots ~= 1 minute each
          .slice(0, 5);

        // Fetch artwork for upcoming songs
        const upcomingSongs = await prisma.song.findMany({
          where: {
            stationId: station.id,
            OR: songSlots.map((s) => ({
              title: s.songTitle!,
              artistName: s.artistName!,
            })),
          },
          select: { title: true, artistName: true, artworkUrl: true },
        });

        const upcomingArtMap = new Map<string, string>();
        for (const s of upcomingSongs) {
          if (s.artworkUrl) {
            upcomingArtMap.set(`${s.artistName}::${s.title}`, s.artworkUrl);
          }
        }

        upNext = songSlots.map((s) => ({
          title: s.songTitle!,
          artistName: s.artistName!,
          artworkUrl:
            upcomingArtMap.get(`${s.artistName}::${s.songTitle}`) || null,
        }));
      } catch {
        // slots parse error — skip
      }
    }

    // ---- Current Show / DJ ----
    let currentShow: {
      djName: string;
      showName: string;
      shiftStart: number;
      shiftEnd: number;
    } | null = null;

    if (playlist?.djId) {
      const dj = await prisma.dJ.findUnique({
        where: { id: playlist.djId },
        select: { name: true, showFormat: true, tagline: true },
      });

      if (dj) {
        // Try to find the clock assignment for the current hour to get shift boundaries
        const dayType =
          dow === 0 ? "sunday" : dow === 6 ? "saturday" : "weekday";
        const hourStr = `${String(hour).padStart(2, "0")}:00`;

        const assignment = await prisma.clockAssignment.findFirst({
          where: {
            stationId: station.id,
            isActive: true,
            dayType,
            timeSlotStart: { lte: hourStr },
            timeSlotEnd: { gt: hourStr },
          },
          select: { timeSlotStart: true, timeSlotEnd: true },
        });

        currentShow = {
          djName: dj.name,
          showName: dj.showFormat || dj.tagline || `${dj.name}'s Show`,
          shiftStart: assignment
            ? parseInt(assignment.timeSlotStart.split(":")[0], 10)
            : hour,
          shiftEnd: assignment
            ? parseInt(assignment.timeSlotEnd.split(":")[0], 10)
            : hour + 1,
        };
      }
    }

    // Also try DJShow model for richer data
    if (!currentShow) {
      const djShow = await prisma.dJShow.findFirst({
        where: {
          isActive: true,
          dayOfWeek: dow,
          startTime: { lte: `${String(hour).padStart(2, "0")}:00` },
          endTime: { gt: `${String(hour).padStart(2, "0")}:00` },
        },
        include: { dj: { select: { name: true } } },
      });

      if (djShow) {
        currentShow = {
          djName: djShow.dj.name,
          showName: djShow.name,
          shiftStart: parseInt(djShow.startTime.split(":")[0], 10),
          shiftEnd: parseInt(djShow.endTime.split(":")[0], 10),
        };
      }
    }

    return NextResponse.json({
      stationName: station.name,
      nowPlaying,
      recentlyPlayed: recentlyPlayedPayload,
      upNext,
      currentShow,
    });
  } catch (err) {
    console.error("whats-playing error", err);
    return NextResponse.json(
      { error: "Failed to fetch what's playing data" },
      { status: 500 }
    );
  }
}
