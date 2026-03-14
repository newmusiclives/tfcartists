/**
 * Populate Clock Patterns
 *
 * Fills all clock templates that have empty clockPattern with a proper
 * 20-slot hour pattern based on their name/clockType.
 *
 * Usage: npx tsx scripts/populate-clock-patterns.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Standard 20-slot clock pattern for a typical radio hour
// Mix: 13 songs, 3 voice breaks, 2 ad breaks (2 ads each), 2 features, sweepers
function buildClockPattern(energyLevel: string = "medium"): any[] {
  return [
    { position: 1, minute: 0, duration: 2, category: "TOH", type: "station_id", notes: "Top of hour ID" },
    { position: 2, minute: 2, duration: 3, category: "A", type: "song", notes: "Power rotation opener" },
    { position: 3, minute: 5, duration: 3, category: "B", type: "song", notes: "Secondary rotation" },
    { position: 4, minute: 8, duration: 1, category: "DJ", type: "voice_break", notes: "Back-announce + intro" },
    { position: 5, minute: 9, duration: 3, category: "A", type: "song", notes: "Power rotation" },
    { position: 6, minute: 12, duration: 3, category: "C", type: "song", notes: "Catalog/deep cut" },
    { position: 7, minute: 15, duration: 1, category: "Imaging", type: "sweeper", notes: "Station sweeper" },
    { position: 8, minute: 16, duration: 3, category: "B", type: "song", notes: "Secondary rotation" },
    { position: 9, minute: 19, duration: 2, category: "Feature", type: "feature", notes: "Feature segment", featureSlot: 1 },
    { position: 10, minute: 21, duration: 3, category: "D", type: "song", notes: "Discovery track" },
    { position: 11, minute: 24, duration: 1, category: "DJ", type: "voice_break", notes: "Back-announce + intro" },
    { position: 12, minute: 25, duration: 3, category: "A", type: "song", notes: "Power rotation" },
    { position: 13, minute: 28, duration: 3, category: "C", type: "song", notes: "Catalog/deep cut" },
    { position: 14, minute: 31, duration: 1, category: "Imaging", type: "sweeper", notes: "Station imaging" },
    { position: 15, minute: 32, duration: 4, category: "Sponsor", type: "ad", notes: "Ad break 1 (2 spots)" },
    { position: 16, minute: 36, duration: 3, category: "B", type: "song", notes: "Secondary rotation" },
    { position: 17, minute: 39, duration: 3, category: "E", type: "song", notes: "Emerging/featured artist" },
    { position: 18, minute: 42, duration: 2, category: "Feature", type: "feature", notes: "Feature segment", featureSlot: 2 },
    { position: 19, minute: 44, duration: 1, category: "DJ", type: "voice_break", notes: "Intro to next song" },
    { position: 20, minute: 45, duration: 3, category: "A", type: "song", notes: "Power rotation" },
    { position: 21, minute: 48, duration: 3, category: "D", type: "song", notes: "Discovery track" },
    { position: 22, minute: 51, duration: 1, category: "Imaging", type: "sweeper", notes: "Station imaging" },
    { position: 23, minute: 52, duration: 4, category: "Sponsor", type: "ad", notes: "Ad break 2 (2 spots)" },
    { position: 24, minute: 56, duration: 3, category: "C", type: "song", notes: "Close out song" },
  ];
}

async function main() {
  console.log("Populating clock patterns...\n");

  const templates = await prisma.clockTemplate.findMany({
    where: {
      OR: [
        { clockPattern: null },
        { clockPattern: "[]" },
        { clockPattern: "" },
      ],
    },
  });

  console.log(`Found ${templates.length} templates without patterns\n`);

  let updated = 0;
  for (const template of templates) {
    const pattern = buildClockPattern(template.energyLevel || "medium");

    await prisma.clockTemplate.update({
      where: { id: template.id },
      data: { clockPattern: JSON.stringify(pattern) },
    });

    console.log(`  Updated: ${template.name} (${pattern.length} slots)`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated} templates.`);
  await prisma.$disconnect();
}

main().catch(console.error);
