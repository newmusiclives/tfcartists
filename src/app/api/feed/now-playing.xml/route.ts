import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationHour, stationToday } from "@/lib/timezone";

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
 * GET /api/feed/now-playing.xml
 *
 * Single-item RSS 2.0 feed with the current song.
 * Updates on every request. Designed for WordPress RSS widgets
 * and other embedded feed readers.
 */
export async function GET() {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, tagline: true },
    });

    if (!station) {
      return new NextResponse("No active station", { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    let title = "Music";
    let artistName = station.name;
    let artworkUrl: string | null = null;
    let djName: string | null = null;

    // 1. Check Liquidsoap push data
    try {
      const { getLiquidoapNowPlaying } = await import(
        "@/lib/radio/liquidsoap-state"
      );
      const liqNow = getLiquidoapNowPlaying();
      if (liqNow) {
        title = liqNow.title;
        artistName = liqNow.artist_name;

        const song = await prisma.song.findFirst({
          where: { title, artistName, stationId: station.id },
          select: { artworkUrl: true },
        });
        artworkUrl = song?.artworkUrl || null;
      }
    } catch {
      // Liquidsoap state unavailable
    }

    // 2. Fallback: most recent TrackPlayback
    if (title === "Music") {
      const latest = await prisma.trackPlayback.findFirst({
        orderBy: { playedAt: "desc" },
        select: {
          trackTitle: true,
          artistName: true,
          playedAt: true,
        },
      });

      if (latest) {
        // Only use if played in the last 15 minutes
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (latest.playedAt > fifteenMinAgo) {
          title = latest.trackTitle;
          artistName = latest.artistName;
        }
      }
    }

    // 3. Fallback: current hour playlist
    if (title === "Music") {
      const today = stationToday();
      const hour = stationHour();
      const playlist = await prisma.hourPlaylist.findFirst({
        where: {
          stationId: station.id,
          airDate: today,
          hourOfDay: hour,
          status: { in: ["locked", "aired"] },
        },
        orderBy: { createdAt: "desc" },
        select: { slots: true, djId: true },
      });

      if (playlist) {
        try {
          const slots = JSON.parse(playlist.slots);
          const musicSlot = slots.find(
            (s: { type: string }) => s.type === "song"
          );
          if (musicSlot) {
            title = musicSlot.songTitle || "Music";
            artistName = musicSlot.artistName || station.name;
          }
        } catch {
          // Bad JSON
        }

        if (playlist.djId) {
          const dj = await prisma.dJ.findUnique({
            where: { id: playlist.djId },
            select: { name: true },
          });
          djName = dj?.name || null;
        }
      }
    }

    const nowStr = new Date().toUTCString();
    const description = djName
      ? `Now playing on ${station.name} with ${djName}`
      : `Now playing on ${station.name}`;

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(station.name)} — Now Playing</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(station.tagline || `What's playing on ${station.name}`)}</description>
    <language>en-us</language>
    <lastBuildDate>${nowStr}</lastBuildDate>
    <ttl>1</ttl>
    <atom:link href="${baseUrl}/api/feed/now-playing.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title>${escapeXml(title)} - ${escapeXml(artistName)}</title>
      <description>${escapeXml(description)}</description>
      <pubDate>${nowStr}</pubDate>
      <guid isPermaLink="false">now-playing-${Date.now()}</guid>${artworkUrl ? `\n      <enclosure url="${escapeXml(artworkUrl)}" type="image/jpeg" length="0"/>` : ""}
    </item>
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=10, s-maxage=10",
      },
    });
  } catch {
    return new NextResponse("Now playing feed unavailable", { status: 500 });
  }
}
