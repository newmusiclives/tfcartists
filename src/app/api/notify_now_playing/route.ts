import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { setLiquidoapNowPlaying } from "@/lib/radio/liquidsoap-state";

export const dynamic = "force-dynamic";

/**
 * POST /api/notify_now_playing
 *
 * Called by Liquidsoap on_new_track when a song starts playing.
 * Updates the in-memory now-playing state.
 *
 * Query: ?title=Song+Title&artist=Artist+Name
 * Also accepts POST with JSON body for backwards compatibility.
 */
export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  const artist_name = req.nextUrl.searchParams.get("artist");
  return handleUpdate(title, artist_name);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return handleUpdate(body.title, body.artist_name);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

function handleUpdate(title: string | null, artist_name: string | null) {
  if (!title || !artist_name) {
    return NextResponse.json({ error: "title and artist_name required" }, { status: 400 });
  }

  setLiquidoapNowPlaying(title, artist_name);

  logger.info("Now playing updated by Liquidsoap", { title, artist_name });

  return NextResponse.json({ success: true });
}
