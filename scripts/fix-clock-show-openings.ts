/**
 * Fix Clock Show Openings & Closings
 *
 * - Show opening (station_id/TOH at position 1): only in hour 1 of each DJ's shift
 * - Show closing (position 28 labeled "Closer"): only in hour 3 (last hour) of each DJ's shift
 * - Hours 2 & 3 get a short sweeper at position 1 instead of full show open
 * - Hours 1 & 2 get "Hour closer" at position 28 instead of "Show closer"
 *
 * Run with: npx tsx scripts/fix-clock-show-openings.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Clock types by position in each DJ's 3-hour shift
const FIRST_HOUR_CLOCKS = [
  "morning_wakeup",     // Hank hour 1
  "midday_kickoff",     // Loretta hour 1
  "afternoon_lunch",    // Doc hour 1
  "evening_launch",     // Cody hour 1
];

const SECOND_HOUR_CLOCKS = [
  "morning_drive_peak", // Hank hour 2
  "midday_cruise",      // Loretta hour 2
  "afternoon_groove",   // Doc hour 2
  "evening_rush",       // Cody hour 2
];

const THIRD_HOUR_CLOCKS = [
  "morning_winddown",   // Hank hour 3
  "midday_mellow",      // Loretta hour 3
  "afternoon_deep",     // Doc hour 3
  "evening_unwind",     // Cody hour 3
];

async function main() {
  console.log("=== Fixing clock show openings & closings ===\n");

  const allClockTypes = [...FIRST_HOUR_CLOCKS, ...SECOND_HOUR_CLOCKS, ...THIRD_HOUR_CLOCKS];
  const templates = await prisma.clockTemplate.findMany({
    where: { clockType: { in: allClockTypes } },
  });

  if (templates.length === 0) {
    console.log("No matching clock templates found. Are clocks seeded?");
    return;
  }

  let updated = 0;

  for (const template of templates) {
    if (!template.clockPattern) continue;

    const slots = JSON.parse(template.clockPattern);
    const isFirstHour = FIRST_HOUR_CLOCKS.includes(template.clockType);
    const isLastHour = THIRD_HOUR_CLOCKS.includes(template.clockType);
    let changed = false;

    // --- Position 1: Show opening ---
    const pos1 = slots.find((s: { position: number }) => s.position === 1);
    if (pos1) {
      if (!isFirstHour && pos1.type === "station_id") {
        // Replace full show opening with a short sweeper
        pos1.type = "sweeper";
        pos1.category = "Imaging";
        pos1.duration = 0.5;
        pos1.notes = "Hour sweeper — quick station ID (not full show open)";
        changed = true;
        console.log(`  ✓ ${template.name}: Position 1 → sweeper (not first hour)`);
      } else if (isFirstHour && pos1.type === "station_id") {
        console.log(`  · ${template.name}: Position 1 — show opening kept (first hour)`);
      }
    }

    // --- Position 28: Show closing ---
    const pos28 = slots.find((s: { position: number }) => s.position === 28);
    if (pos28) {
      if (!isLastHour && (pos28.notes === "Closer" || pos28.notes === "Show closer")) {
        pos28.notes = "Hour closer";
        changed = true;
        console.log(`  ✓ ${template.name}: Position 28 → "Hour closer" (not last hour)`);
      } else if (isLastHour && pos28.notes !== "Show closer") {
        pos28.notes = "Show closer";
        changed = true;
        console.log(`  ✓ ${template.name}: Position 28 → "Show closer" (last hour)`);
      }
    }

    if (changed) {
      await prisma.clockTemplate.update({
        where: { id: template.id },
        data: { clockPattern: JSON.stringify(slots) },
      });
      updated++;
    }
  }

  console.log(`\nDone — updated ${updated} of ${templates.length} clock templates.`);
  console.log("\nShow opening (full TOH) kept for: morning_wakeup, midday_kickoff, afternoon_lunch, evening_launch");
  console.log("Show closing kept for: morning_winddown, midday_mellow, afternoon_deep, evening_unwind");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
