/**
 * Re-seed music bed database records from existing files on disk.
 * Run: npx tsx scripts/reseed-music-beds.ts
 *
 * The audio files exist in public/audio/music-beds/ but the DB records
 * were lost. This script re-creates them.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const MUSIC_BEDS_DIR = path.join(process.cwd(), "public", "audio", "music-beds");

// Map filenames to their metadata
const BED_METADATA: Record<string, { name: string; category: string; durationSeconds: number }> = {
  "soft-ambient-pad": { name: "Soft Ambient Pad", category: "soft", durationSeconds: 30 },
  "upbeat-bright-pad": { name: "Upbeat Bright Pad", category: "upbeat", durationSeconds: 30 },
  "country-warmth-pad": { name: "Country Warmth Pad", category: "country", durationSeconds: 30 },
  "general-background-pad": { name: "General Background Pad", category: "general", durationSeconds: 30 },
  "corporate-clean-pad": { name: "Corporate Clean Pad", category: "corporate", durationSeconds: 30 },
};

async function main() {
  // Get station
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) {
    console.error("No active station found");
    process.exit(1);
  }
  console.log(`Station: ${station.name} (${station.id})`);

  // Check existing records
  const existing = await prisma.musicBed.findMany({ where: { stationId: station.id } });
  console.log(`Existing DB records: ${existing.length}`);

  if (!fs.existsSync(MUSIC_BEDS_DIR)) {
    console.error(`Directory not found: ${MUSIC_BEDS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MUSIC_BEDS_DIR).filter(f => f.endsWith(".wav") || f.endsWith(".mp3"));
  console.log(`Audio files found: ${files.length}`);

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = `/audio/music-beds/${file}`;

    // Check if record already exists for this file
    const existingRecord = existing.find(e => e.filePath === filePath || e.fileName === file);
    if (existingRecord) {
      console.log(`  SKIP: ${file} (already in DB)`);
      skipped++;
      continue;
    }

    // Match to metadata by prefix
    const baseName = file.replace(/-\d+\.(wav|mp3)$/, "");
    const meta = BED_METADATA[baseName];

    if (meta) {
      await prisma.musicBed.create({
        data: {
          stationId: station.id,
          name: meta.name,
          fileName: file,
          filePath,
          category: meta.category,
          durationSeconds: meta.durationSeconds,
          isActive: true,
        },
      });
      console.log(`  CREATED: ${meta.name} (${meta.category}) -> ${filePath}`);
      created++;
    } else {
      // Unknown file — create with generic metadata
      const name = baseName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      await prisma.musicBed.create({
        data: {
          stationId: station.id,
          name,
          fileName: file,
          filePath,
          category: "general",
          isActive: true,
        },
      });
      console.log(`  CREATED: ${name} (general) -> ${filePath}`);
      created++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch(console.error);
