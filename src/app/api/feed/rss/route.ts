import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * GET /api/feed/rss
 *
 * RSS 2.0 feed of the last 50 played tracks.
 * Pulls from TrackPlayback for accurate play history,
 * falling back to Song.lastPlayedAt if no playback records exist.
 */
export async function GET(request: NextRequest) {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, callSign: true, tagline: true },
    });

    if (!station) {
      return new NextResponse("No active station", { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "https://truefans-radio.netlify.app";

    // Try TrackPlayback first (most accurate play history)
    const playbacks = await prisma.trackPlayback.findMany({
      orderBy: { playedAt: "desc" },
      take: 50,
      select: {
        id: true,
        trackTitle: true,
        artistName: true,
        playedAt: true,
        duration: true,
      },
    });

    let items: string;

    if (playbacks.length > 0) {
      items = playbacks
        .map(
          (pb) => `
    <item>
      <title>${escapeXml(pb.trackTitle)} - ${escapeXml(pb.artistName)}</title>
      <description>Played on ${escapeXml(station.name)} at ${pb.playedAt.toLocaleString("en-US", { timeZone: "America/Denver" })}</description>
      <pubDate>${pb.playedAt.toUTCString()}</pubDate>
      <guid isPermaLink="false">playback-${pb.id}</guid>
    </item>`
        )
        .join("\n");
    } else {
      // Fallback: use Song.lastPlayedAt
      const recentSongs = await prisma.song.findMany({
        where: {
          stationId: station.id,
          lastPlayedAt: { not: null },
          isActive: true,
        },
        orderBy: { lastPlayedAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          artistName: true,
          album: true,
          genre: true,
          lastPlayedAt: true,
        },
      });

      items = recentSongs
        .map(
          (song) => `
    <item>
      <title>${escapeXml(song.title)} - ${escapeXml(song.artistName)}</title>
      <description>${escapeXml(song.album ? `From "${song.album}"` : song.genre || "")}</description>
      <pubDate>${song.lastPlayedAt ? song.lastPlayedAt.toUTCString() : ""}</pubDate>
      <guid isPermaLink="false">song-${song.id}-${song.lastPlayedAt?.getTime()}</guid>
    </item>`
        )
        .join("\n");
    }

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(station.name)} — Recently Played</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(station.tagline || `Recently played tracks on ${station.name}`)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>5</ttl>
    <atom:link href="${baseUrl}/api/feed/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch {
    return new NextResponse("RSS feed unavailable", { status: 500 });
  }
}
