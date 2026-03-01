/**
 * Save generated imaging scripts to station metadata.
 * Reads from /private/tmp/generated-scripts.json and merges into station.metadata.imagingScripts.
 * Run with: npx tsx scripts/save-imaging-scripts.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

const STATION_ID = "cmm3sum5b00lq7d120drjrew8";

async function main() {
  // Read generated scripts
  const raw = fs.readFileSync("/private/tmp/generated-scripts.json", "utf-8");
  const newScripts = JSON.parse(raw) as Record<string, Array<{ label: string; text: string; musicBed: string }>>;

  console.log(`Loaded ${Object.keys(newScripts).length} new categories:`);
  for (const [cat, scripts] of Object.entries(newScripts)) {
    console.log(`  ${cat}: ${scripts.length} scripts`);
  }

  // Get current station metadata
  const station = await prisma.station.findUnique({
    where: { id: STATION_ID },
    select: { metadata: true, name: true },
  });

  if (!station) throw new Error("Station not found");
  console.log(`\nStation: ${station.name}`);

  const meta = (station.metadata as Record<string, unknown>) || {};
  const existing = (meta.imagingScripts as Record<string, unknown[]>) || {};

  console.log(`Existing categories: ${Object.keys(existing).join(", ")}`);

  // Merge new scripts into existing
  const merged = { ...existing, ...newScripts };

  console.log(`\nMerged categories: ${Object.keys(merged).join(", ")}`);
  console.log(`Total categories: ${Object.keys(merged).length}`);

  // Save back to DB
  await prisma.station.update({
    where: { id: STATION_ID },
    data: {
      metadata: {
        ...meta,
        imagingScripts: merged,
      },
    },
  });

  console.log("\nSaved to database!");

  // Verify
  const updated = await prisma.station.findUnique({
    where: { id: STATION_ID },
    select: { metadata: true },
  });
  const updatedMeta = (updated?.metadata as Record<string, unknown>) || {};
  const updatedScripts = (updatedMeta.imagingScripts as Record<string, unknown[]>) || {};
  console.log("\nVerification:");
  for (const [cat, scripts] of Object.entries(updatedScripts)) {
    console.log(`  ${cat}: ${Array.isArray(scripts) ? scripts.length : "?"} scripts`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
