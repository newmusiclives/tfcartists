/**
 * Upload local imaging audio files as data URIs into ProducedImaging records.
 * This makes them servable from Netlify serverless (no local filesystem needed).
 *
 * Also restores the audioFilePath in StationImagingVoice metadata so the
 * skip-if-exists logic works and prevents future redundant regeneration.
 *
 * Run with: npx tsx scripts/upload-imaging-data-uris.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const IMAGING_DIR = path.join(process.cwd(), "public", "audio", "imaging");

// Infer category from filename pattern
function inferCategory(filename: string): string {
  if (filename.includes("station_id") || filename.includes("-toh") || filename.includes("hour-id")) return "station_id";
  if (filename.includes("promo")) return "promo";
  if (filename.includes("sweeper")) return "sweeper";
  if (filename.includes("commercial")) return "sweeper"; // commercials act as sweepers in playout
  return "sweeper";
}

async function main() {
  const files = fs.readdirSync(IMAGING_DIR).filter(f => f.endsWith(".wav") || f.endsWith(".mp3"));
  console.log(`Found ${files.length} imaging audio files`);

  const station = await prisma.station.findFirst({ select: { id: true } });
  if (!station) { console.error("No station found"); return; }

  let created = 0;
  let skipped = 0;

  for (const filename of files) {
    const filePath = `/audio/imaging/${filename}`;
    const fullPath = path.join(IMAGING_DIR, filename);

    // Check if already exists with a data URI
    const existing = await prisma.producedImaging.findFirst({
      where: { stationId: station.id, fileName: filename },
    });
    if (existing?.filePath?.startsWith("data:")) {
      skipped++;
      continue;
    }

    // Read file and convert to data URI
    const buffer = fs.readFileSync(fullPath);
    const mimeType = filename.endsWith(".mp3") ? "audio/mpeg" : "audio/wav";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Duration estimate: WAV 24kHz 16-bit mono = 48000 bytes/sec
    const pcmBytes = filename.endsWith(".wav") ? buffer.length - 44 : buffer.length;
    const durationSeconds = filename.endsWith(".wav")
      ? Math.round((pcmBytes / 48000) * 10) / 10
      : null;

    const category = inferCategory(filename);
    const name = filename.replace(/\.(wav|mp3)$/, "").replace(/-/g, " ");

    if (existing) {
      // Update existing record with data URI
      await prisma.producedImaging.update({
        where: { id: existing.id },
        data: { filePath: dataUri, durationSeconds, isActive: true },
      });
    } else {
      await prisma.producedImaging.create({
        data: {
          stationId: station.id,
          name,
          fileName: filename,
          filePath: dataUri,
          category,
          durationSeconds,
          isActive: true,
        },
      });
    }

    console.log(`  ✓ [${category}] ${filename} (${Math.round(buffer.length / 1024)}KB)`);
    created++;
  }

  // Also restore audioFilePath in imaging voice metadata so regeneration is skipped
  const voices = await prisma.stationImagingVoice.findMany({
    where: { stationId: station.id, isActive: true },
  });

  let metaRestored = 0;
  for (const voice of voices) {
    const meta = voice.metadata as Record<string, unknown> | null;
    const scripts = (meta?.scripts || {}) as Record<string, Array<{ label?: string; text?: string; audioFilePath?: string }>>;
    let changed = false;

    const voiceSlug = voice.displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    for (const [scriptType, items] of Object.entries(scripts)) {
      for (const script of items || []) {
        if (script.audioFilePath) continue; // already has path
        if (!script.label) continue;

        // Try to find the matching local file
        const safeLabel = script.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const expectedFile = `${voiceSlug}-${scriptType}-${safeLabel}.wav`;
        const fullExpectedPath = path.join(IMAGING_DIR, expectedFile);

        if (fs.existsSync(fullExpectedPath)) {
          script.audioFilePath = `/audio/imaging/${expectedFile}`;
          changed = true;
          metaRestored++;
        }
      }
    }

    if (changed) {
      await prisma.stationImagingVoice.update({
        where: { id: voice.id },
        data: { metadata: meta },
      });
    }
  }

  console.log(`\nDone: ${created} uploaded, ${skipped} already had data URIs, ${metaRestored} metadata paths restored`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
