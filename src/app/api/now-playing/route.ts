import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationHour, stationToday } from "@/lib/timezone";
import https from "https";

const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || "https://tfc-radio.netlify.app/stream/americana-hq.mp3";
const RAILWAY_URL = `${process.env.RAILWAY_BACKEND_URL || "https://tfc-radio-backend-production.up.railway.app"}/api/now_playing`;

export const dynamic = "force-dynamic";

/**
 * Read the Icecast stream metadata to get the actual currently-playing track.
 * Icecast embeds metadata every `icy-metaint` bytes in the audio stream.
 * Returns "Artist - Title" or null if unavailable.
 */
async function readIcecastMetadata(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 4000);

    try {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: "GET",
        headers: {
          "Icy-MetaData": "1",
          "User-Agent": "TrueFans-NowPlaying/1.0",
        },
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        const metaint = parseInt(res.headers["icy-metaint"] as string, 10);
        if (!metaint || isNaN(metaint)) {
          clearTimeout(timeout);
          res.destroy();
          resolve(null);
          return;
        }

        let bytesRead = 0;
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          bytesRead += chunk.length;

          // We need metaint bytes of audio + 1 byte length + up to 4080 bytes metadata
          if (bytesRead > metaint + 1) {
            res.destroy();
            clearTimeout(timeout);

            const fullBuffer = Buffer.concat(chunks);
            // Skip past audio data to the metadata length byte
            const metaLenByte = fullBuffer[metaint];
            const metaLen = metaLenByte * 16;

            if (metaLen > 0 && fullBuffer.length >= metaint + 1 + metaLen) {
              const metaStr = fullBuffer
                .subarray(metaint + 1, metaint + 1 + metaLen)
                .toString("utf-8")
                .replace(/\0+$/, "");

              // Parse StreamTitle='Artist - Title';
              const match = metaStr.match(/StreamTitle='(.+?)'/);
              resolve(match ? match[1] : null);
            } else {
              resolve(null);
            }
          }
        });

        res.on("error", () => {
          clearTimeout(timeout);
          resolve(null);
        });
      });

      req.on("error", () => {
        clearTimeout(timeout);
        resolve(null);
      });

      req.end();
    } catch {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}

/**
 * GET /api/now-playing
 *
 * Reads the Icecast stream metadata for the actual currently-playing track.
 * Falls back to Railway, then to playlist derivation if stream is unreachable.
 */
export async function GET() {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    if (!station) {
      return NextResponse.json({ error: "No active station" }, { status: 404 });
    }

    const hour = stationHour();

    // Get DJ for this hour from the playlist
    const today = stationToday();
    const playlist = await prisma.hourPlaylist.findFirst({
      where: {
        stationId: station.id,
        airDate: today,
        hourOfDay: hour,
        status: { in: ["locked", "aired"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const dj = playlist?.djId
      ? await prisma.dJ.findUnique({
          where: { id: playlist.djId },
          select: { name: true, slug: true },
        })
      : null;

    // 1. Try reading Icecast stream metadata (actual source of truth)
    const streamMeta = await readIcecastMetadata(STREAM_URL);

    if (streamMeta) {
      // Parse "Artist - Title" format
      const dashIndex = streamMeta.indexOf(" - ");
      let title = streamMeta;
      let artistName = station.name;

      if (dashIndex > 0) {
        artistName = streamMeta.substring(0, dashIndex).trim();
        title = streamMeta.substring(dashIndex + 3).trim();
      }

      // Try to find artwork from our song database
      let artworkUrl: string | null = null;
      const song = await prisma.song.findFirst({
        where: { title, artistName, stationId: station.id },
        select: { artworkUrl: true },
      });
      artworkUrl = song?.artworkUrl || null;

      return NextResponse.json({
        station: station.name,
        status: "on-air",
        title,
        artist_name: artistName,
        artwork_url: artworkUrl,
        listener_count: 0,
        dj_name: dj?.name || null,
        dj_id: dj?.slug || null,
        djSlug: dj?.slug || null,
        hourOfDay: hour,
      });
    }

    // 2. Fallback: try Railway backend
    try {
      const res = await fetch(RAILWAY_URL, {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          return NextResponse.json({
            ...data,
            dj_name: dj?.name || data.dj_name,
            dj_id: dj?.slug || data.dj_id,
          });
        }
      }
    } catch {
      // Railway unreachable
    }

    // 3. Final fallback: station info only
    return NextResponse.json({
      station: station.name,
      status: playlist ? "on-air" : "off-air",
      title: "Music",
      artist_name: station.name,
      artwork_url: null,
      listener_count: 0,
      dj_name: dj?.name || null,
      dj_id: dj?.slug || null,
      hourOfDay: hour,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch now playing" },
      { status: 502 }
    );
  }
}
