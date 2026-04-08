/**
 * Backfill ProducedImaging records from StationImagingVoice metadata.
 *
 * The generate-audio route was storing imaging audio paths in metadata JSON
 * but never creating ProducedImaging records that the playout reads from.
 * This script copies existing audio paths into ProducedImaging so they
 * start playing immediately.
 *
 * Run with: npx tsx scripts/backfill-produced-imaging.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoryMap: Record<string, string> = {
  station_id: "station_id",
  sweeper: "sweeper",
  promo: "promo",
  commercial: "sweeper",
};

async function main() {
  const voices = await prisma.stationImagingVoice.findMany({
    where: { isActive: true },
  });

  console.log(`Found ${voices.length} imaging voices`);

  let created = 0;
  let skipped = 0;

  for (const voice of voices) {
    const metadata = voice.metadata as Record<string, unknown> | null;
    const scripts = (metadata?.scripts || {}) as Record<
      string,
      Array<{ label?: string; text?: string; audioFilePath?: string; hasMusicBed?: boolean; audioDuration?: number }>
    >;

    for (const [scriptType, items] of Object.entries(scripts)) {
      for (const script of items || []) {
        if (!script.audioFilePath) continue;

        // Check if already exists
        const existing = await prisma.producedImaging.findFirst({
          where: { stationId: voice.stationId, filePath: script.audioFilePath },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const category = categoryMap[scriptType] || "sweeper";
        const safeName = `${voice.displayName} ${scriptType} ${script.label || ""}`.trim().substring(0, 120);
        const safeFileName = script.audioFilePath.split("/").pop() || `imaging-${Date.now()}.wav`;

        await prisma.producedImaging.create({
          data: {
            stationId: voice.stationId,
            name: safeName,
            fileName: safeFileName,
            filePath: script.audioFilePath,
            category,
            durationSeconds: script.audioDuration || 0,
            isActive: true,
          },
        });

        console.log(`  ✓ ${category}: ${safeName}`);
        created++;
      }
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
