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

  // Reject anything that is not an artist's music.
  //
  // This endpoint recorded whatever it was handed, and callers hand it the
  // current now-playing value - which is the literal string "Off Air" when the
  // station is stopped. With the station off it logged one phantom play every
  // ten seconds: 182 rows in half an hour, making the station itself the
  // most-played "artist" at 49% of all airplay.
  //
  // These rows feed royalty reporting and the fairness protocol, where a
  // phantom play dilutes every real artist's share, so this is a data-integrity
  // guard rather than a cosmetic one.
  const NOT_MUSIC_TITLES = new Set(["off air", "offline", "station id", "unknown"]);
  const NOT_MUSIC_ARTISTS = new Set(["north country radio", "truefans radio", "unknown"]);
  if (
    NOT_MUSIC_TITLES.has(title.trim().toLowerCase()) ||
    NOT_MUSIC_ARTISTS.has(artist.trim().toLowerCase())
  ) {
    return NextResponse.json({ ok: true, recorded: false, reason: "not_music" });
  }

  try {
    const song = await prisma.song.findFirst({
      where: { artistName: artist, title },
      select: { id: true, duration: true },
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

    // Persist to TrackPlayback so the public "recently played" feed updates.
    // This was missing — only Song.playCount/lastPlayedAt were being touched,
    // which left /api/whats-playing recentlyPlayed permanently stale.
    const playedAt = new Date();
    const hour = playedAt.getUTCHours(); // close enough — UTC bucket is fine for the categorical timeSlot
    const timeSlot =
      hour >= 6 && hour < 12
        ? "morning"
        : hour >= 12 && hour < 17
          ? "midday"
          : hour >= 17 && hour < 22
            ? "evening"
            : "late_night";
    try {
      // Callers poll rather than fire once per track change, so the same track
      // arrives repeatedly while it is playing. Without this, one three-minute
      // song becomes dozens of plays and the fairness figures follow whoever
      // happens to be on air when a listener has the page open.
      const recent = await prisma.trackPlayback.findFirst({
        where: {
          trackTitle: title,
          artistName: artist,
          playedAt: { gte: new Date(Date.now() - 60_000) },
        },
        select: { id: true },
      });
      if (recent) {
        return NextResponse.json({ ok: true, recorded: false, reason: "duplicate" });
      }

      await prisma.trackPlayback.create({
        data: {
          trackTitle: title,
          artistName: artist,
          duration: song?.duration ?? null,
          timeSlot,
          playedAt,
        },
      });
    } catch (err) {
      logger.warn("trackPlayback insert failed", { error: String(err) });
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
