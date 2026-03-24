/**
 * Populate song fileUrl from Railway backend.
 *
 * Matches songs by title + artistName and sets fileUrl to the Railway streaming URL.
 *
 * Run with: npx tsx scripts/populate-song-urls.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STATION_ID = "cmm3sum5b00lq7d120drjrew8";
const RAILWAY_API = "https://tfc-radio-backend-production.up.railway.app/api";

interface RailwaySong {
  id: string;
  title: string;
  artist: string;
  album: string;
  file_path?: string;
  filename?: string;
}

async function fetchAllSongs(): Promise<RailwaySong[]> {
  const allSongs: RailwaySong[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const res = await fetch(`${RAILWAY_API}/music/library?page=${page}&limit=${limit}`);
    if (!res.ok) {
      throw new Error(`Railway API returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    const songs = data.songs || [];
    allSongs.push(...songs);
    if (songs.length < limit || allSongs.length >= data.total) break;
    page++;
  }

  return allSongs;
}

/**
 * Probe the Railway API to determine the correct streaming URL pattern.
 * Tries common endpoint patterns and returns the one that responds.
 */
async function detectStreamUrl(sampleSongId: string): Promise<string> {
  const candidates = [
    `${RAILWAY_API}/music/stream/${sampleSongId}`,
    `${RAILWAY_API}/music/${sampleSongId}/stream`,
    `${RAILWAY_API}/music/play/${sampleSongId}`,
    `${RAILWAY_API}/songs/${sampleSongId}/stream`,
    `${RAILWAY_API}/stream/${sampleSongId}`,
  ];

  for (const url of candidates) {
    try {
      // Use HEAD to avoid downloading the entire file
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (res.ok || res.status === 206) {
        const contentType = res.headers.get("content-type") || "";
        console.log(`  Found working stream endpoint: ${url}`);
        console.log(`  Content-Type: ${contentType}`);
        return url.replace(sampleSongId, "{id}");
      }
      // A 401/403 also means the endpoint exists (just auth-protected)
      if (res.status === 401 || res.status === 403) {
        console.log(`  Found stream endpoint (auth-protected): ${url}`);
        return url.replace(sampleSongId, "{id}");
      }
    } catch {
      // Network error — skip
    }
  }

  // Default fallback
  console.log("  No stream endpoint detected, using default pattern: /api/music/stream/{id}");
  return `${RAILWAY_API}/music/stream/{id}`;
}

async function main() {
  console.log("=== Populating Song fileUrl from Railway ===\n");

  // 1. Fetch Railway songs
  console.log("Fetching songs from Railway...");
  const railwaySongs = await fetchAllSongs();
  console.log(`Fetched ${railwaySongs.length} songs from Railway\n`);

  if (railwaySongs.length === 0) {
    console.log("No songs found on Railway — nothing to do.");
    return;
  }

  // 2. Log a sample song to see available fields
  console.log("Sample Railway song fields:", JSON.stringify(railwaySongs[0], null, 2), "\n");

  // 3. Detect the streaming URL pattern
  console.log("Detecting stream URL pattern...");
  const streamPattern = await detectStreamUrl(railwaySongs[0].id);
  console.log(`Using stream URL pattern: ${streamPattern}\n`);

  // 4. Fetch local songs missing fileUrl
  const localSongs = await prisma.song.findMany({
    where: {
      stationId: STATION_ID,
      OR: [
        { fileUrl: null },
        { fileUrl: "" },
      ],
    },
    select: { id: true, title: true, artistName: true },
  });
  console.log(`Local songs missing fileUrl: ${localSongs.length}\n`);

  if (localSongs.length === 0) {
    console.log("All songs already have fileUrl — nothing to do!");
    return;
  }

  // 5. Build Railway lookup map (lowercase title + artist → railway song)
  const railwayMap = new Map<string, RailwaySong>();
  for (const song of railwaySongs) {
    const key = `${song.title.toLowerCase().trim()}|||${song.artist.toLowerCase().trim()}`;
    railwayMap.set(key, song);
  }

  // 6. Match and update
  let updated = 0;
  let notFound = 0;
  const notFoundList: string[] = [];
  const batchUpdates: { id: string; fileUrl: string }[] = [];

  for (const local of localSongs) {
    const key = `${local.title.toLowerCase().trim()}|||${local.artistName.toLowerCase().trim()}`;
    const railwaySong = railwayMap.get(key);

    if (railwaySong) {
      const fileUrl = streamPattern.replace("{id}", railwaySong.id);
      batchUpdates.push({ id: local.id, fileUrl });
      updated++;
    } else {
      notFound++;
      if (notFoundList.length < 20) {
        notFoundList.push(`  "${local.title}" by ${local.artistName}`);
      }
    }
  }

  // 7. Apply updates in batches
  const batchSize = 50;
  for (let i = 0; i < batchUpdates.length; i += batchSize) {
    const batch = batchUpdates.slice(i, i + batchSize);
    await prisma.$transaction(
      batch.map((update) =>
        prisma.song.update({
          where: { id: update.id },
          data: { fileUrl: update.fileUrl },
        })
      )
    );
    console.log(`  Updated ${Math.min(i + batchSize, batchUpdates.length)}/${batchUpdates.length} songs`);
  }

  // 8. Summary
  console.log("\n=== Results ===");
  console.log(`Updated: ${updated}`);
  console.log(`Not found in Railway: ${notFound}`);

  if (notFoundList.length > 0) {
    console.log(`\nFirst ${notFoundList.length} unmatched songs:`);
    for (const line of notFoundList) {
      console.log(line);
    }
    if (notFound > notFoundList.length) {
      console.log(`  ... and ${notFound - notFoundList.length} more`);
    }
  }

  // 9. Verify
  const stillMissing = await prisma.song.count({
    where: {
      stationId: STATION_ID,
      OR: [{ fileUrl: null }, { fileUrl: "" }],
    },
  });
  console.log(`\nSongs still missing fileUrl: ${stillMissing}`);

  const totalWithUrl = await prisma.song.count({
    where: {
      stationId: STATION_ID,
      fileUrl: { not: null },
      NOT: { fileUrl: "" },
    },
  });
  console.log(`Songs with fileUrl: ${totalWithUrl}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
