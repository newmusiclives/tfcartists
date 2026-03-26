import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/compliance/licensing/export?period=2026-03&format=bmi|ascap|csv
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const period = searchParams.get("period");
    const format = searchParams.get("format") ?? "csv";

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "period parameter required (format: YYYY-MM)" },
        { status: 400 }
      );
    }

    const [year, mon] = period.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, mon - 1, 1));
    const endDate = new Date(Date.UTC(year, mon, 1));

    // Fetch playbacks
    const playbacks = await prisma.trackPlayback.findMany({
      where: {
        playedAt: { gte: startDate, lt: endDate },
      },
      select: {
        trackTitle: true,
        artistName: true,
        duration: true,
        playedAt: true,
      },
      orderBy: { playedAt: "asc" },
    });

    // Aggregate by song
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

    for (const pb of playbacks) {
      const key = `${pb.trackTitle}|||${pb.artistName}`;
      const existing = songMap.get(key);
      const dur = pb.duration ?? 0;
      if (existing) {
        existing.plays += 1;
        existing.totalSeconds += dur;
      } else {
        songMap.set(key, {
          title: pb.trackTitle,
          artist: pb.artistName,
          album: null,
          plays: 1,
          totalSeconds: dur,
        });
      }
    }

    // Enrich with album data from Song table
    const songTitles = [...new Set(playbacks.map((p) => p.trackTitle))];
    if (songTitles.length > 0) {
      const songs = await prisma.song.findMany({
        where: { title: { in: songTitles } },
        select: { title: true, artistName: true, album: true },
      });
      for (const s of songs) {
        const key = `${s.title}|||${s.artistName}`;
        const entry = songMap.get(key);
        if (entry && s.album) entry.album = s.album;
      }
    }

    const songList = [...songMap.values()].sort((a, b) => b.plays - a.plays);

    let csv = "";
    let filename = "";

    const esc = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const formatDuration = (seconds: number): string => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    };

    switch (format) {
      case "bmi": {
        // BMI Music Use Report format
        filename = `bmi-report-${period}.csv`;
        csv = "Title,Artist,Album,ISRC,Number of Plays,Duration\n";
        for (const s of songList) {
          csv += `${esc(s.title)},${esc(s.artist)},${esc(s.album ?? "")},,${ s.plays},${formatDuration(s.totalSeconds)}\n`;
        }
        break;
      }

      case "ascap": {
        // ASCAP Music Use Report format
        filename = `ascap-report-${period}.csv`;
        csv =
          "Artist,Title,Album,Number of Performances,Duration,ISRC\n";
        for (const s of songList) {
          csv += `${esc(s.artist)},${esc(s.title)},${esc(s.album ?? "")},${s.plays},${formatDuration(s.totalSeconds)},\n`;
        }
        break;
      }

      default: {
        // Generic CSV
        filename = `licensing-report-${period}.csv`;
        csv =
          "Title,Artist,Album,Plays,Total Duration (seconds),Estimated Royalty ($)\n";
        for (const s of songList) {
          const royalty = (s.plays * 0.003).toFixed(4);
          csv += `${esc(s.title)},${esc(s.artist)},${esc(s.album ?? "")},${s.plays},${s.totalSeconds},${royalty}\n`;
        }
        break;
      }
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error("[licensing-export] Error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to export licensing report" },
      { status: 500 }
    );
  }
}
