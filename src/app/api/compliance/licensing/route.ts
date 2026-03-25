import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/compliance/licensing?period=month&month=2026-03
// ---------------------------------------------------------------------------

const ROYALTY_PER_PLAY = 0.003; // Industry average for streaming

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
        select: { title: true, artistName: true, album: true },
      });

      for (const s of songs) {
        const key = `${s.title}|||${s.artistName}`;
        const entry = songMap.get(key);
        if (entry && s.album) {
          entry.album = s.album;
        }
      }
    }

    // Build sorted song list
    const songList = [...songMap.values()]
      .map((s) => ({
        ...s,
        estimatedRoyalty: parseFloat((s.plays * ROYALTY_PER_PLAY).toFixed(4)),
      }))
      .sort((a, b) => b.plays - a.plays);

    // Build sorted artist list
    const artistList = [...artistMap.values()]
      .map((a) => ({
        ...a,
        estimatedRoyalty: parseFloat((a.plays * ROYALTY_PER_PLAY).toFixed(4)),
      }))
      .sort((a, b) => b.plays - a.plays);

    const uniqueArtists = new Set(
      playbacks.map((p) => p.artistName.toLowerCase().trim())
    );

    return NextResponse.json({
      period: month,
      totalPlays: playbacks.length,
      uniqueSongs: songMap.size,
      uniqueArtists: uniqueArtists.size,
      estimatedTotalRoyalty: parseFloat(
        (playbacks.length * ROYALTY_PER_PLAY).toFixed(2)
      ),
      songs: songList,
      artists: artistList,
    });
  } catch (error) {
    console.error("[licensing] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate licensing report" },
      { status: 500 }
    );
  }
}
