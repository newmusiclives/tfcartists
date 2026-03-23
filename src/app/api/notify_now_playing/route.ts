import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * In-memory now-playing state pushed by Liquidsoap.
 * This is the authoritative source — Liquidsoap knows exactly what's on air.
 */
let currentTrack: {
  title: string;
  artist_name: string;
  updatedAt: number;
} | null = null;

/** Read the current now-playing state (used by /api/now-playing) */
export function getLiquidoapNowPlaying() {
  if (!currentTrack) return null;
  // Stale after 5 minutes — stream may be down
  if (Date.now() - currentTrack.updatedAt > 5 * 60 * 1000) return null;
  return currentTrack;
}

/**
 * POST /api/notify_now_playing
 *
 * Called by Liquidsoap on_new_track when a song starts playing.
 * Updates the in-memory now-playing state.
 *
 * Body: { "title": "Song Title", "artist_name": "Artist Name" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, artist_name } = body;

    if (!title || !artist_name) {
      return NextResponse.json({ error: "title and artist_name required" }, { status: 400 });
    }

    currentTrack = {
      title,
      artist_name,
      updatedAt: Date.now(),
    };

    logger.info("Now playing updated by Liquidsoap", { title, artist_name });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
