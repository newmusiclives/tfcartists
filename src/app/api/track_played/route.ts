import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/track_played
 *
 * Called by Liquidsoap when a song finishes playing.
 * GET: ?artist=Name&title=Title (CSRF-free for Liquidsoap)
 * POST: JSON body (may be blocked by CSRF on some deployments)
 */
export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get("artist");
  const title = req.nextUrl.searchParams.get("title");
  return handleTrackPlayed(artist, title);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return handleTrackPlayed(body.artist, body.title);
  } catch (error) {
    logger.warn("track_played error", { error: String(error) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function handleTrackPlayed(artist: string | null, title: string | null) {

  if (!artist || !title) {
    return NextResponse.json({ error: "artist and title required" }, { status: 400 });
  }

  try {
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

    // Fire-and-forget webhook
    import("@/lib/webhooks/dispatch").then(({ dispatchWebhook }) => {
      dispatchWebhook("track.played", {
        songId: song?.id || null,
        title,
        artist,
        playedAt: new Date().toISOString(),
      }).catch(() => {});
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.warn("track_played error", { error: String(error) });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
