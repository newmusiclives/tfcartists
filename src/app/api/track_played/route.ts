import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/track_played
 *
 * Called by Liquidsoap when a song finishes playing.
 * Increments play count and updates rotation tracking.
 *
 * Body: { "artist": "Artist Name", "title": "Song Title" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artist, title } = body;

    if (!artist || !title) {
      return NextResponse.json({ error: "artist and title required" }, { status: 400 });
    }

    // Find the song and increment play count
    const song = await prisma.song.findFirst({
      where: { artistName: artist, title },
      select: { id: true },
    });

    if (song) {
      await prisma.song.update({
        where: { id: song.id },
        data: {
          playCount: { increment: 1 },
          lastPlayedAt: new Date(),
        },
      });
    }

    logger.info("Track played", { artist, title, songId: song?.id || "not_found" });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.warn("track_played error", { error: String(error) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
