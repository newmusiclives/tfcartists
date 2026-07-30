import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { incursSocietyRoyalty } from "@/lib/rights";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/compliance/licensing?period=month&month=2026-03
// ---------------------------------------------------------------------------

// Per-performance rate for recordings that DO carry a society obligation.
// Default is the SoundExchange 2026 commercial webcaster non-subscription rate.
// Override with ROYALTY_PER_PLAY when licensing in another territory.
//
// Critically, this is applied ONLY to recordings that actually incur a royalty.
// Previously every play was charged at a flat rate, which materially overstated
// liability for a catalogue that is deliberately owned or directly licensed.
const ROYALTY_PER_PLAY = Number(process.env.ROYALTY_PER_PLAY ?? 0.0025);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const month = searchParams.get("month"); // e.g. "2026-03"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "month parameter required (format: YYYY-MM)" },
        { status: 400 }
      );
    }

    const [year, mon] = month.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, mon - 1, 1));
    const endDate = new Date(Date.UTC(year, mon, 1)); // first of next month

    // Fetch all track playbacks in the period
    const playbacks = await prisma.trackPlayback.findMany({
      where: {
        playedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        trackTitle: true,
        artistName: true,
        duration: true,
        playedAt: true,
      },
      orderBy: { playedAt: "asc" },
    });

    // Aggregate by song (title + artist)
    const songMap = new Map<
      string,
      {
        title: string;
        artist: string;
        album: string | null;
        plays: number;
        totalSeconds: number;
        rightsStatus: string;
      }
    >();

    const artistMap = new Map<
      string,
      { artist: string; plays: number; totalSeconds: number }
    >();

    for (const pb of playbacks) {
      const songKey = `${pb.trackTitle}|||${pb.artistName}`;
      const existing = songMap.get(songKey);
      const dur = pb.duration ?? 0;

      if (existing) {
        existing.plays += 1;
        existing.totalSeconds += dur;
      } else {
        songMap.set(songKey, {
          title: pb.trackTitle,
          artist: pb.artistName,
          album: null,
          plays: 1,
          totalSeconds: dur,
          // Assume the worst until the catalogue says otherwise: an unmatched
          // recording is treated as royalty-bearing, never as free.
          rightsStatus: "unclear",
        });
      }

      // Artist aggregation
      const artistKey = pb.artistName.toLowerCase().trim();
      const existingArtist = artistMap.get(artistKey);
      if (existingArtist) {
        existingArtist.plays += 1;
        existingArtist.totalSeconds += dur;
      } else {
        artistMap.set(artistKey, {
          artist: pb.artistName,
          plays: 1,
          totalSeconds: dur,
        });
      }
    }

    // Try to fill in album info from Song table
    const songTitles = [...new Set(playbacks.map((p) => p.trackTitle))];
    if (songTitles.length > 0) {
      const songs = await prisma.song.findMany({
        where: { title: { in: songTitles } },
        select: { title: true, artistName: true, album: true, rightsStatus: true },
      });

      for (const s of songs) {
        const key = `${s.title}|||${s.artistName}`;
        const entry = songMap.get(key);
        if (entry) {
          if (s.album) entry.album = s.album;
          entry.rightsStatus = s.rightsStatus;
        }
      }
    }

    // Build sorted song list. Owned and directly-licensed recordings owe nothing
    // to a collecting society, so they are reported at zero rather than omitted -
    // an auditor needs to see them and why they were excluded.
    const songList = [...songMap.values()]
      .map((s) => {
        const owed = incursSocietyRoyalty(s.rightsStatus);
        return {
          ...s,
          royaltyBearing: owed,
          estimatedRoyalty: owed
            ? parseFloat((s.plays * ROYALTY_PER_PLAY).toFixed(4))
            : 0,
        };
      })
      .sort((a, b) => b.plays - a.plays);

    const royaltyBearingPlays = songList
      .filter((s) => s.royaltyBearing)
      .reduce((sum, s) => sum + s.plays, 0);
    const clearedPlays = playbacks.length - royaltyBearingPlays;

    // Build sorted artist list
    const royaltyBearingByArtist = new Map<string, number>();
    for (const s of songList) {
      if (!s.royaltyBearing) continue;
      const key = s.artist.toLowerCase().trim();
      royaltyBearingByArtist.set(key, (royaltyBearingByArtist.get(key) ?? 0) + s.plays);
    }

    const artistList = [...artistMap.values()]
      .map((a) => {
        const bearing = royaltyBearingByArtist.get(a.artist.toLowerCase().trim()) ?? 0;
        return {
          ...a,
          royaltyBearingPlays: bearing,
          estimatedRoyalty: parseFloat((bearing * ROYALTY_PER_PLAY).toFixed(4)),
        };
      })
      .sort((a, b) => b.plays - a.plays);

    const uniqueArtists = new Set(
      playbacks.map((p) => p.artistName.toLowerCase().trim())
    );

    return NextResponse.json({
      period: month,
      totalPlays: playbacks.length,
      uniqueSongs: songMap.size,
      uniqueArtists: uniqueArtists.size,
      ratePerPlay: ROYALTY_PER_PLAY,
      royaltyBearingPlays,
      clearedPlays,
      estimatedTotalRoyalty: parseFloat(
        (royaltyBearingPlays * ROYALTY_PER_PLAY).toFixed(2)
      ),
      songs: songList,
      artists: artistList,
    });
  } catch (error) {
    logger.error("[licensing] Error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to generate licensing report" },
      { status: 500 }
    );
  }
}
