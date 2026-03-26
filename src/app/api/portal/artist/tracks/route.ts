import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/artist/tracks?artistId=xxx
 * List tracks with play counts for the artist portal
 */
export async function GET(request: NextRequest) {
  try {
    const artistId = request.nextUrl.searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json({ error: "Missing artistId" }, { status: 400 });
    }

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Get submitted tracks
    const submissions = await prisma.trackSubmission.findMany({
      where: { artistId },
      orderBy: { createdAt: "desc" },
    });

    // Get play counts per track from TrackPlayback
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const tracksWithPlayCounts = await Promise.all(
      submissions.map(async (track) => {
        const totalPlays = track.trackUrl
          ? await prisma.trackPlayback.count({
              where: {
                OR: [
                  { trackId: track.id },
                  { trackTitle: track.trackTitle, artistId },
                ],
              },
            })
          : track.playCount;

        const playsThisMonth = track.trackUrl
          ? await prisma.trackPlayback.count({
              where: {
                OR: [
                  { trackId: track.id },
                  { trackTitle: track.trackTitle, artistId },
                ],
                playedAt: { gte: monthStart },
              },
            })
          : 0;

        return {
          id: track.id,
          trackTitle: track.trackTitle,
          genre: track.genre,
          duration: track.duration,
          status: track.status,
          addedToRotation: track.addedToRotation,
          playCount: totalPlays,
          playsThisMonth,
          submittedAt: track.createdAt,
          reviewedAt: track.reviewedAt,
        };
      })
    );

    logger.info("Fetched artist tracks", { artistId, count: submissions.length });

    return NextResponse.json({ tracks: tracksWithPlayCounts });
  } catch (error) {
    logger.error("Error fetching artist tracks", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
  }
}
