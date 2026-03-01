/**
 * Replace Netlify song library with real Railway songs.
 * Deletes all placeholder songs and imports the 1200 real tracks.
 *
 * Run with: npx tsx scripts/replace-netlify-songs.ts
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
  genre: string;
  duration: number;
  plays: number;
  rotation_category: string;
  vocal_gender: string;
  bpm: number | null;
  intro_end_ms: number | null;
  outro_start_ms: number | null;
  song_end_ms: number | null;
  tempo_category: string;
}

async function fetchAllRailwaySongs(): Promise<RailwaySong[]> {
  const all: RailwaySong[] = [];
  let page = 1;
  const limit = 100;
  while (true) {
    const res = await fetch(`${RAILWAY_API}/music/library?page=${page}&limit=${limit}`);
    const data = await res.json();
    const songs = data.songs || [];
    all.push(...songs);
    if (songs.length < limit || all.length >= data.total) break;
    page++;
  }
  return all;
}

async function main() {
  console.log("=== Replace Netlify Songs with Railway Library ===\n");

  // 1. Count existing
  const existingCount = await prisma.song.count({ where: { stationId: STATION_ID } });
  console.log(`Existing Netlify songs: ${existingCount}`);

  // 2. Fetch Railway songs
  console.log("Fetching Railway songs...");
  const railwaySongs = await fetchAllRailwaySongs();
  console.log(`Railway songs: ${railwaySongs.length}`);

  // 3. Delete all existing Netlify songs for this station
  console.log("\nDeleting all existing Netlify songs...");
  const deleted = await prisma.song.deleteMany({ where: { stationId: STATION_ID } });
  console.log(`Deleted: ${deleted.count}`);

  // 4. Import Railway songs
  console.log("\nImporting Railway songs...");
  let imported = 0;
  let errors = 0;
  const batchSize = 50;

  for (let i = 0; i < railwaySongs.length; i += batchSize) {
    const batch = railwaySongs.slice(i, i + batchSize);
    const creates = batch.map(song => ({
      stationId: STATION_ID,
      title: song.title,
      artistName: song.artist,
      album: song.album || null,
      duration: song.duration || 180,
      genre: song.genre || "Americana",
      bpm: song.bpm || null,
      rotationCategory: song.rotation_category || "C",
      vocalGender: song.vocal_gender || null,
      tempoCategory: song.tempo_category || null,
      introEnd: song.intro_end_ms || null,
      outroStart: song.outro_start_ms || null,
      isActive: true,
      playCount: song.plays || 0,
    }));

    try {
      const result = await prisma.song.createMany({
        data: creates,
        skipDuplicates: true,
      });
      imported += result.count;
    } catch {
      // Fallback: insert one by one
      for (const song of creates) {
        try {
          await prisma.song.create({ data: song });
          imported++;
        } catch {
          errors++;
        }
      }
    }

    if ((i + batchSize) % 200 === 0 || i + batchSize >= railwaySongs.length) {
      console.log(`  Progress: ${Math.min(i + batchSize, railwaySongs.length)}/${railwaySongs.length} (${imported} imported, ${errors} errors)`);
    }
  }

  // 5. Final summary
  const finalCount = await prisma.song.count({ where: { stationId: STATION_ID } });
  console.log(`\n=== Done ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total songs in Netlify: ${finalCount}`);

  // Category breakdown
  const categories = await prisma.song.groupBy({
    by: ["rotationCategory"],
    where: { stationId: STATION_ID },
    _count: true,
    orderBy: { rotationCategory: "asc" },
  });
  console.log("\nRotation categories:");
  for (const cat of categories) {
    const pct = ((cat._count / finalCount) * 100).toFixed(1);
    console.log(`  ${cat.rotationCategory}: ${cat._count} (${pct}%)`);
  }

  // Sample
  const sample = await prisma.song.findMany({
    where: { stationId: STATION_ID },
    select: { artistName: true, title: true, rotationCategory: true },
    take: 10,
  });
  console.log("\nSample songs:");
  for (const s of sample) {
    console.log(`  [${s.rotationCategory}] ${s.artistName} - ${s.title}`);
  }
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
