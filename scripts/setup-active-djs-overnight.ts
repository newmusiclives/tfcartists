/**
 * Setup active DJs and overnight coverage.
 *
 * Idempotent migration script that:
 *   1. Deactivates 8 unused DJs
 *   2. Creates 3 overnight clock templates for Night Owl
 *   3. Assigns Night Owl to 18:00-06:00 across all 7 days
 *   4. Updates Cody's Hour 3 closer to add a Cody→Night Owl handoff voice break
 *   5. Creates missing Night Owl show transitions (intro, outro, handoffs)
 *   6. Updates existing show transitions to apply to all days (dayOfWeek: null)
 *
 * Run: npx tsx scripts/setup-active-djs-overnight.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INACTIVE_DJ_NAMES = [
  "Jo McAllister",
  "Paul Saunders",
  "Ezra Stone",
  "Levi Bridges",
  "Sam Turnbull",
  "Ruby Finch",
  "Mark Faulkner",
  "Iris Langley",
];

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) throw new Error("No active station found");

  // ========================================================================
  // STEP 1: Deactivate the 8 unused DJs
  // ========================================================================
  console.log("\n=== STEP 1: Deactivate unused DJs ===");
  const deactivated = await prisma.dJ.updateMany({
    where: { name: { in: INACTIVE_DJ_NAMES } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivated.count} DJs`);

  // Also deactivate any of their existing assignments
  const deactivatedAssignments = await prisma.clockAssignment.updateMany({
    where: { dj: { name: { in: INACTIVE_DJ_NAMES } } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivatedAssignments.count} assignments for inactive DJs`);

  // ========================================================================
  // STEP 2: Create 3 overnight clock templates (idempotent via name lookup)
  // ========================================================================
  console.log("\n=== STEP 2: Create overnight clock templates ===");

  // Reuse existing patterns from Hank's templates as the structural reference
  const refOpener = await prisma.clockTemplate.findFirst({
    where: { name: "Morning Drive — Hour 1 (Opener)" },
  });
  const refBody = await prisma.clockTemplate.findFirst({
    where: { name: "Morning Drive — Hour 2" },
  });
  const refCloser = await prisma.clockTemplate.findFirst({
    where: { name: "Morning Drive — Hour 3 (Closer + Handoff)" },
  });

  if (!refOpener || !refBody || !refCloser) {
    throw new Error("Missing reference clock templates from Hank's Morning Drive show");
  }

  // Adjust the opener pattern to say "OVERNIGHT INTRO" instead of "SHOW INTRO"
  const overnightOpenerPattern = JSON.parse(refOpener.clockPattern!).map((slot: { type: string; notes: string; [k: string]: unknown }) => {
    if (slot.type === "voice_break" && /show intro|opener|opens the show/i.test(slot.notes || "")) {
      return { ...slot, notes: "OVERNIGHT INTRO — Night Owl opens the overnight" };
    }
    return slot;
  });

  // Body uses pattern as-is (TOH + 2 voice breaks + features + sponsor breaks)
  const overnightBodyPattern = JSON.parse(refBody.clockPattern!);

  // Closer: rename the handoff voice break to be Night Owl → Hank specific
  const overnightCloserPattern = JSON.parse(refCloser.clockPattern!).map((slot: { type: string; notes: string; [k: string]: unknown }) => {
    if (slot.type === "voice_break" && /handoff/i.test(slot.notes || "")) {
      return { ...slot, notes: "Handoff to Hank Westwood — sunrise approaches" };
    }
    if (slot.type === "voice_break" && /closer|outro|wrap/i.test(slot.notes || "")) {
      return { ...slot, notes: "OVERNIGHT CLOSER — Night Owl signs off" };
    }
    return slot;
  });

  const overnightTemplates = [
    {
      name: "Overnight — Hour 1 (Opener)",
      description: "Night Owl opens the overnight at 18:00",
      clockType: "overnight_evening",
      clockPattern: JSON.stringify(overnightOpenerPattern),
    },
    {
      name: "Overnight — Body",
      description: "Repeating overnight body hour (used 19:00-04:00)",
      clockType: "overnight_late",
      clockPattern: JSON.stringify(overnightBodyPattern),
    },
    {
      name: "Overnight — Final Hour (Closer)",
      description: "Night Owl wraps the overnight at 05:00 and hands off to Hank",
      clockType: "overnight_dawn",
      clockPattern: JSON.stringify(overnightCloserPattern),
    },
  ];

  const overnightTemplateIds: Record<string, string> = {};
  for (const tmpl of overnightTemplates) {
    const existing = await prisma.clockTemplate.findFirst({
      where: { name: tmpl.name, stationId: station.id },
    });
    let id: string;
    if (existing) {
      const updated = await prisma.clockTemplate.update({
        where: { id: existing.id },
        data: {
          description: tmpl.description,
          clockType: tmpl.clockType,
          clockPattern: tmpl.clockPattern,
          isActive: true,
        },
      });
      id = updated.id;
      console.log(`  UPDATED: ${tmpl.name}`);
    } else {
      const created = await prisma.clockTemplate.create({
        data: {
          stationId: station.id,
          name: tmpl.name,
          description: tmpl.description,
          clockType: tmpl.clockType,
          clockPattern: tmpl.clockPattern,
          tempo: "moderate",
          energyLevel: "low",
          hitsPerHour: 4,
          indiePerHour: 4,
          isActive: true,
        },
      });
      id = created.id;
      console.log(`  CREATED: ${tmpl.name}`);
    }
    overnightTemplateIds[tmpl.name] = id;
  }

  // ========================================================================
  // STEP 3: Assign Night Owl to 12 hours × 3 day types
  // ========================================================================
  console.log("\n=== STEP 3: Assign Night Owl 18:00-06:00 ===");

  const nightOwl = await prisma.dJ.findFirst({ where: { slug: "night-owl" } });
  if (!nightOwl) throw new Error("Night Owl DJ not found");

  // Make sure Night Owl is active
  if (!nightOwl.isActive) {
    await prisma.dJ.update({ where: { id: nightOwl.id }, data: { isActive: true } });
    console.log("  Activated Night Owl");
  }

  const dayTypes = ["weekday", "saturday", "sunday"];
  const hourTemplateMap: Array<{ start: string; end: string; templateName: string }> = [
    { start: "18:00", end: "19:00", templateName: "Overnight — Hour 1 (Opener)" },
    { start: "19:00", end: "20:00", templateName: "Overnight — Body" },
    { start: "20:00", end: "21:00", templateName: "Overnight — Body" },
    { start: "21:00", end: "22:00", templateName: "Overnight — Body" },
    { start: "22:00", end: "23:00", templateName: "Overnight — Body" },
    { start: "23:00", end: "00:00", templateName: "Overnight — Body" },
    { start: "00:00", end: "01:00", templateName: "Overnight — Body" },
    { start: "01:00", end: "02:00", templateName: "Overnight — Body" },
    { start: "02:00", end: "03:00", templateName: "Overnight — Body" },
    { start: "03:00", end: "04:00", templateName: "Overnight — Body" },
    { start: "04:00", end: "05:00", templateName: "Overnight — Body" },
    { start: "05:00", end: "06:00", templateName: "Overnight — Final Hour (Closer)" },
  ];

  let assignmentCount = 0;
  for (const dayType of dayTypes) {
    for (const slot of hourTemplateMap) {
      const templateId = overnightTemplateIds[slot.templateName];
      // Use the unique constraint [djId, dayType, timeSlotStart] for upsert
      await prisma.clockAssignment.upsert({
        where: {
          djId_dayType_timeSlotStart: {
            djId: nightOwl.id,
            dayType,
            timeSlotStart: slot.start,
          },
        },
        update: {
          clockTemplateId: templateId,
          timeSlotEnd: slot.end,
          isActive: true,
          stationId: station.id,
        },
        create: {
          stationId: station.id,
          djId: nightOwl.id,
          clockTemplateId: templateId,
          dayType,
          timeSlotStart: slot.start,
          timeSlotEnd: slot.end,
          isActive: true,
          priority: 0,
        },
      });
      assignmentCount++;
    }
  }
  console.log(`  Created/updated ${assignmentCount} Night Owl assignments`);

  // ========================================================================
  // STEP 4: Fix Cody's Hour 3 to add the Cody→Night Owl handoff slot
  // ========================================================================
  console.log("\n=== STEP 4: Add Cody→Night Owl handoff to Cody's Hour 3 ===");
  const codyH3 = await prisma.clockTemplate.findFirst({
    where: { name: "Drive Home — Hour 3 (Closer)" },
  });
  if (codyH3 && codyH3.clockPattern) {
    type Slot = { position: number; minute: number; duration: number; category: string; type: string; notes: string };
    const pattern: Slot[] = JSON.parse(codyH3.clockPattern);

    // Check if a handoff voice break already exists
    const hasHandoff = pattern.some((s) => s.type === "voice_break" && /handoff/i.test(s.notes || ""));
    if (hasHandoff) {
      console.log("  Cody Hour 3 already has a handoff slot, skipping");
    } else {
      // Find the LAST song slot and convert it to a voice_break (handoff to Night Owl)
      const lastSongIdx = [...pattern].reverse().findIndex((s) => s.type === "song");
      if (lastSongIdx !== -1) {
        const realIdx = pattern.length - 1 - lastSongIdx;
        const original = pattern[realIdx];
        pattern[realIdx] = {
          ...original,
          duration: 1, // voice break is shorter than a song
          category: "DJ",
          type: "voice_break",
          notes: "Handoff to Night Owl — Cody signs off",
        };
        await prisma.clockTemplate.update({
          where: { id: codyH3.id },
          data: { clockPattern: JSON.stringify(pattern) },
        });
        console.log(`  Converted last song slot (position ${original.position}) to handoff voice break`);
      }
    }
  }

  // ========================================================================
  // STEP 5 & 6: Show transitions — make existing day-agnostic + add Night Owl transitions
  // ========================================================================
  console.log("\n=== STEP 5: Make existing transitions day-agnostic ===");
  const dayAgnostic = await prisma.showTransition.updateMany({
    where: { isActive: true, dayOfWeek: { not: null } },
    data: { dayOfWeek: null },
  });
  console.log(`  Updated ${dayAgnostic.count} transitions to dayOfWeek=null`);

  console.log("\n=== STEP 6: Create Night Owl show transitions ===");
  const cody = await prisma.dJ.findFirst({ where: { slug: "cody-rampart" } });
  const hank = await prisma.dJ.findFirst({ where: { slug: "hank-westwood" } });
  if (!cody || !hank) throw new Error("Cody or Hank not found");

  const newTransitions = [
    // Night Owl show intro at 18:00
    {
      transitionType: "show_intro",
      name: "Night Owl Show Intro",
      hourOfDay: 18,
      toDjId: nightOwl.id,
      durationSeconds: 12,
      scriptText: "You're tuned to North Country Radio after dark. I'm Night Owl — settle in, the long road from sundown to sunrise starts right now.",
    },
    // Night Owl show outro at 05:00
    {
      transitionType: "show_outro",
      name: "Night Owl Show Outro",
      hourOfDay: 5,
      fromDjId: nightOwl.id,
      durationSeconds: 10,
      scriptText: "That's the overnight wrapping up. I'm Night Owl — Hank Westwood is taking it from here. Stay safe out there.",
    },
    // Cody → Night Owl handoff (2 parts)
    {
      transitionType: "handoff",
      name: "Cody Rampart → Night Owl Handoff Pt.1",
      hourOfDay: 18,
      fromDjId: cody.id,
      toDjId: nightOwl.id,
      handoffGroupId: "cody-to-night-owl",
      handoffPart: 1,
      handoffPartName: "Toss",
      durationSeconds: 10,
      scriptText: "Night Owl, the road's all yours. Take it easy out there as the sun goes down.",
    },
    {
      transitionType: "handoff",
      name: "Cody Rampart → Night Owl Handoff Pt.2",
      hourOfDay: 18,
      fromDjId: nightOwl.id,
      toDjId: null,
      handoffGroupId: "cody-to-night-owl",
      handoffPart: 2,
      handoffPartName: "Response",
      durationSeconds: 10,
      scriptText: "Thanks Cody. Alright friends, the lights are low and the music's deep — let's begin.",
    },
    // Night Owl → Hank handoff (2 parts)
    {
      transitionType: "handoff",
      name: "Night Owl → Hank Westwood Handoff Pt.1",
      hourOfDay: 6,
      fromDjId: nightOwl.id,
      toDjId: hank.id,
      handoffGroupId: "night-owl-to-hank",
      handoffPart: 1,
      handoffPartName: "Toss",
      durationSeconds: 10,
      scriptText: "Hank, the morning is yours. The night was good — pass on a hot cup to the early crew.",
    },
    {
      transitionType: "handoff",
      name: "Night Owl → Hank Westwood Handoff Pt.2",
      hourOfDay: 6,
      fromDjId: hank.id,
      toDjId: null,
      handoffGroupId: "night-owl-to-hank",
      handoffPart: 2,
      handoffPartName: "Response",
      durationSeconds: 10,
      scriptText: "Thanks Night Owl, get some rest. Good morning North Country — Hank Westwood here, let's wake this town up.",
    },
  ];

  let createdCount = 0;
  let updatedCount = 0;
  for (const t of newTransitions) {
    // Idempotent: look up by name + station
    const existing = await prisma.showTransition.findFirst({
      where: { stationId: station.id, name: t.name },
    });
    if (existing) {
      await prisma.showTransition.update({
        where: { id: existing.id },
        data: {
          ...t,
          stationId: station.id,
          dayOfWeek: null,
          isActive: true,
        },
      });
      updatedCount++;
    } else {
      await prisma.showTransition.create({
        data: {
          ...t,
          stationId: station.id,
          dayOfWeek: null,
          isActive: true,
        },
      });
      createdCount++;
    }
  }
  console.log(`  Created ${createdCount} new transitions, updated ${updatedCount} existing`);

  // ========================================================================
  // VERIFICATION
  // ========================================================================
  console.log("\n=== VERIFICATION ===");
  const activeAssignments = await prisma.clockAssignment.findMany({
    where: { isActive: true, dj: { isActive: true } },
    include: { dj: { select: { name: true } }, clockTemplate: { select: { name: true } } },
    orderBy: [{ dayType: "asc" }, { timeSlotStart: "asc" }],
  });

  const byDay: Record<string, typeof activeAssignments> = {};
  for (const a of activeAssignments) {
    if (!byDay[a.dayType]) byDay[a.dayType] = [];
    byDay[a.dayType].push(a);
  }

  for (const [day, assigns] of Object.entries(byDay)) {
    console.log(`\n  ${day.toUpperCase()} — ${assigns.length} hours covered:`);
    for (const a of assigns) {
      console.log(`    ${a.timeSlotStart}-${a.timeSlotEnd} ${a.dj.name.padEnd(22)} ${a.clockTemplate.name}`);
    }
  }

  const activeTransitions = await prisma.showTransition.count({
    where: { isActive: true },
  });
  console.log(`\n  Total active show transitions: ${activeTransitions}`);

  const activeDjsCount = await prisma.dJ.count({ where: { isActive: true } });
  console.log(`  Total active DJs: ${activeDjsCount}`);

  console.log("\n✓ Done");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
