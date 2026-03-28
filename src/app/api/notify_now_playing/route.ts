import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { setLiquidoapNowPlaying } from "@/lib/radio/liquidsoap-state";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/notify_now_playing
 *
 * Called by Liquidsoap on_new_track when a song starts playing.
 * Persists to BOTH in-memory state AND the database Config table
 * so the data survives across serverless function invocations.
 *
 * Query: ?title=Song+Title&artist=Artist+Name
 * Also accepts POST with JSON body.
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

async function handleUpdate(title: string | null, artist_name: string | null) {
  if (!title || !artist_name) {
    return NextResponse.json({ error: "title and artist_name required" }, { status: 400 });
  }

  // Update in-memory state (works within same process)
  setLiquidoapNowPlaying(title, artist_name);

  // Persist to database so it survives across serverless invocations
  try {
    const value = JSON.stringify({
      title,
      artist_name,
      updatedAt: Date.now(),
    });
    await prisma.config.upsert({
      where: { key: "now_playing:current" },
      update: { value },
      create: { key: "now_playing:current", value },
    });
  } catch {
    // DB write failed — in-memory update still happened
  }

  logger.info("Now playing updated by Liquidsoap", { title, artist_name });

  return NextResponse.json({ success: true });
}
