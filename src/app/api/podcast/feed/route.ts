import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";
const STATION_NAME = process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio";
const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO";
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "24/7 AI-powered radio championing independent artists. Listen to replays and best-of compilations.";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  const stationId = request.nextUrl.searchParams.get("stationId");

  if (!stationId) {
    return new Response("<error>stationId is required</error>", {
      status: 400,
      headers: { "Content-Type": "application/xml" },
    });
  }

  try {
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: {
        id: true,
        name: true,
        description: true,
        genre: true,
        logoUrl: true,
      },
    });

    if (!station) {
      return new Response("<error>Station not found</error>", {
        status: 404,
        headers: { "Content-Type": "application/xml" },
      });
    }

    const episodes = await prisma.podcastEpisode.findMany({
      where: {
        stationId,
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: "desc" },
      take: 100,
    });

    const podcastTitle = `${station.name || STATION_NAME} Podcast`;
    const podcastDescription = station.description || SITE_DESCRIPTION;
    const podcastImage = station.logoUrl
      ? `${SITE_URL}${station.logoUrl}`
      : `${SITE_URL}/icons/icon-512.png`;
    const feedUrl = `${SITE_URL}/api/podcast/feed?stationId=${stationId}`;

    const itemsXml = episodes
      .map((ep) => {
        const pubDate = ep.publishedAt
          ? new Date(ep.publishedAt).toUTCString()
          : new Date(ep.createdAt).toUTCString();
        const audioUrl = ep.audioFilePath
          ? (ep.audioFilePath.startsWith("http") ? ep.audioFilePath : `${SITE_URL}${ep.audioFilePath}`)
          : "";
        const duration = ep.duration ? formatDuration(ep.duration) : "00:00:00";
        const episodeType = ep.episodeType === "WEEKLY_BEST_OF"
          ? "full"
          : ep.episodeType === "HOURLY_REPLAY"
            ? "bonus"
            : "full";

        return `    <item>
      <title>${escapeXml(ep.title)}</title>
      <description><![CDATA[${ep.description || ""}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${ep.id}</guid>
      ${audioUrl ? `<enclosure url="${escapeXml(audioUrl)}" type="audio/mpeg" length="0" />` : ""}
      <itunes:duration>${duration}</itunes:duration>
      <itunes:episodeType>${episodeType}</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
      })
      .join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(podcastTitle)}</title>
    <link>${SITE_URL}</link>
    <description><![CDATA[${podcastDescription}]]></description>
    <language>en-us</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <itunes:author>${escapeXml(NETWORK_NAME)}</itunes:author>
    <itunes:summary><![CDATA[${podcastDescription}]]></itunes:summary>
    <itunes:owner>
      <itunes:name>${escapeXml(NETWORK_NAME)}</itunes:name>
    </itunes:owner>
    <itunes:image href="${escapeXml(podcastImage)}" />
    <itunes:category text="Music" />
    <itunes:explicit>false</itunes:explicit>
${itemsXml}
  </channel>
</rss>`;

    return new Response(rss, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("[Podcast Feed]", error);
    return new Response("<error>Internal server error</error>", {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
}
