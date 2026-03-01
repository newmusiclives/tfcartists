/**
 * Clean up the song library:
 * 1. Delete the 1198 Railway-synced songs (created 2026-03-01), keep original 1203
 * 2. Strip (Radio Edit) and similar suffixes from titles
 * 3. Move all category E songs to B/C/D based on BPM
 *    - BPM >= 120 → B (Heavy/upbeat)
 *    - BPM 90-119 → C (Medium)
 *    - BPM < 90 or null → D (Light/Deep)
 *
 * Run with: npx tsx scripts/cleanup-song-library.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const STATION_ID = "cmm3sum5b00lq7d120drjrew8";

async function main() {
  console.log("=== Song Library Cleanup ===\n");

  // Step 0: Current state
  const totalBefore = await prisma.song.count({ where: { stationId: STATION_ID } });
  console.log(`Total songs before cleanup: ${totalBefore}`);

  // Step 1: Delete the Railway-synced batch (created on 2026-03-01)
  console.log("\n--- Step 1: Remove Railway-synced duplicates ---");

  const marchFirst = new Date("2026-03-01T00:00:00Z");
  const marchSecond = new Date("2026-03-02T00:00:00Z");

  const toDelete = await prisma.song.count({
    where: {
      stationId: STATION_ID,
      createdAt: { gte: marchFirst, lt: marchSecond },
    },
  });
  console.log(`Songs created on 2026-03-01 (Railway sync): ${toDelete}`);

  if (toDelete > 0) {
    const deleted = await prisma.song.deleteMany({
      where: {
        stationId: STATION_ID,
        createdAt: { gte: marchFirst, lt: marchSecond },
      },
    });
    console.log(`Deleted: ${deleted.count} songs`);
  }

  const afterDelete = await prisma.song.count({ where: { stationId: STATION_ID } });
  console.log(`Songs remaining: ${afterDelete}`);

  // Step 2: Strip (Radio Edit) and similar parenthetical suffixes from titles
  console.log("\n--- Step 2: Clean titles ---");

  const allSongs = await prisma.song.findMany({
    where: { stationId: STATION_ID },
    select: { id: true, title: true, bpm: true, rotationCategory: true },
  });

  let titlesCleaned = 0;
  const parenRegex = /\s*\((?:Radio Edit|Single Version|Clean|Explicit|Deluxe|Remaster(?:ed)?|Album Version|Original Mix)\)\s*$/i;

  for (const song of allSongs) {
    const cleaned = song.title.replace(parenRegex, "").trim();
    if (cleaned !== song.title) {
      await prisma.song.update({
        where: { id: song.id },
        data: { title: cleaned },
      });
      console.log(`  "${song.title}" → "${cleaned}"`);
      titlesCleaned++;
    }
  }
  console.log(`Titles cleaned: ${titlesCleaned}`);

  // Step 3: Move all E songs to B/C/D based on BPM
  console.log("\n--- Step 3: Reassign category E songs ---");

  // Re-fetch to get current state after deletes
  const eSongs = await prisma.song.findMany({
    where: { stationId: STATION_ID, rotationCategory: "E" },
    select: { id: true, title: true, artistName: true, bpm: true },
  });

  console.log(`Category E songs to reassign: ${eSongs.length}`);

  const reassignCounts = { B: 0, C: 0, D: 0 };

  for (const song of eSongs) {
    let newCat: string;
    if (song.bpm && song.bpm >= 120) {
      newCat = "B";
    } else if (song.bpm && song.bpm >= 90) {
      newCat = "C";
    } else {
      // BPM < 90 or null
      newCat = "D";
    }

    await prisma.song.update({
      where: { id: song.id },
      data: { rotationCategory: newCat },
    });
    reassignCounts[newCat as keyof typeof reassignCounts]++;
  }

  console.log(`Reassigned: B=${reassignCounts.B}, C=${reassignCounts.C}, D=${reassignCounts.D}`);

  // Final summary
  console.log("\n=== Final Library State ===");
  const finalCount = await prisma.song.count({ where: { stationId: STATION_ID } });
  console.log(`Total songs: ${finalCount}`);

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
    console.log(`  ${cat.rotationCategory}: ${cat._count} songs (${pct}%)`);
  }

  // BPM coverage
  const withBpm = await prisma.song.count({
    where: { stationId: STATION_ID, bpm: { not: null } },
  });
  const withoutBpm = finalCount - withBpm;
  console.log(`\nBPM data: ${withBpm} songs have BPM, ${withoutBpm} do not`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
