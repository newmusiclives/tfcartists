/**
 * Re-seed produced imaging database records from existing audio files.
 * Run: npx tsx scripts/reseed-produced-imaging.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const IMAGING_DIR = path.join(process.cwd(), "public", "audio", "imaging");

function detectCategory(fileName: string): string {
  if (fileName.includes("-station_id-") || fileName.includes("-station-id-")) return "station_id";
  if (fileName.includes("-toh-")) return "toh";
  if (fileName.includes("-sweeper-")) return "sweeper";
  if (fileName.includes("-promo-")) return "promo";
  if (fileName.includes("-commercial-")) return "sweeper"; // commercials act as sweepers
  return "sweeper";
}

function buildName(fileName: string): string {
  // e.g. "ncr-power-voice-promo-morning-id-1.wav" -> "NCR Power Voice - Promo - Morning ID 1"
  const base = fileName.replace(/\.(wav|mp3)$/, "");
  const parts = base.split("-");

  // Find the voice name and the rest
  const voiceNames = ["ncr-power-voice", "the-voice-of-ncr"];
  let voiceName = "";
  let rest = base;

  for (const vn of voiceNames) {
    if (base.startsWith(vn)) {
      voiceName = vn === "ncr-power-voice" ? "NCR Power Voice" : "The Voice of NCR";
      rest = base.slice(vn.length + 1); // skip the voice name + hyphen
      break;
    }
  }

  // Capitalize the rest
  const label = rest
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return voiceName ? `${voiceName} - ${label}` : label;
}

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) {
    console.error("No active station found");
    process.exit(1);
  }
  console.log(`Station: ${station.name} (${station.id})`);

  const existing = await prisma.producedImaging.findMany({ where: { stationId: station.id } });
  console.log(`Existing DB records: ${existing.length}`);

  if (!fs.existsSync(IMAGING_DIR)) {
    console.error(`Directory not found: ${IMAGING_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMAGING_DIR).filter(f => f.endsWith(".wav") || f.endsWith(".mp3"));
  console.log(`Audio files found: ${files.length}`);

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = `/audio/imaging/${file}`;

    const existingRecord = existing.find(e => e.filePath === filePath || e.fileName === file);
    if (existingRecord) {
      console.log(`  SKIP: ${file}`);
      skipped++;
      continue;
    }

    const category = detectCategory(file);
    const name = buildName(file);

    await prisma.producedImaging.create({
      data: {
        stationId: station.id,
        name,
        fileName: file,
        filePath,
        category,
        isActive: true,
      },
    });
    console.log(`  CREATED: ${name} (${category})`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch(console.error);
