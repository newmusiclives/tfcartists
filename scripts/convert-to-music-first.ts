/**
 * Convert North Country Radio to Music-First, Host-Driven Model
 *
 * Run with: npx tsx scripts/convert-to-music-first.ts
 *
 * - Deactivates all 12 DJs, their shows, feature schedules, and old clock templates
 * - Creates two station hosts (male + female) with distinct Gemini voices
 * - Creates two new music-first clock templates (daytime + late night)
 * - Creates clock assignments for 24/7 coverage
 * - Purges draft playlists so they rebuild with new clocks
 *
 * Idempotent: safe to re-run.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Music First clock (daytime 6am–6pm) ──────────────────────────────
// 17 songs, 1 TOH, 2 sweepers, 2 ad breaks
const MUSIC_FIRST_PATTERN = [
  { position: 1,  minute: 0,  duration: 0.25, category: "TOH",     type: "station_id", notes: "Top of hour station ID" },
  { position: 2,  minute: 0,  duration: 3.5,  category: "A",       type: "song",       notes: "Hit opener" },
  { position: 3,  minute: 4,  duration: 3.5,  category: "A",       type: "song",       notes: "Power hit" },
  { position: 4,  minute: 7,  duration: 3.5,  category: "B",       type: "song",       notes: "Medium rotation" },
  { position: 5,  minute: 11, duration: 3.5,  category: "A",       type: "song",       notes: "Hit" },
  { position: 6,  minute: 14, duration: 0.15, category: "Imaging", type: "sweeper",    notes: "Imaging sweeper" },
  { position: 7,  minute: 15, duration: 3.5,  category: "C",       type: "song",       notes: "Recurrent" },
  { position: 8,  minute: 18, duration: 3.5,  category: "E",       type: "song",       notes: "Indie spotlight" },
  { position: 9,  minute: 22, duration: 1,    category: "Sponsor", type: "ad",         notes: "Ad break 1" },
  { position: 10, minute: 23, duration: 3.5,  category: "A",       type: "song",       notes: "Hit post-break" },
  { position: 11, minute: 27, duration: 3.5,  category: "B",       type: "song",       notes: "Medium rotation" },
  { position: 12, minute: 30, duration: 3.5,  category: "D",       type: "song",       notes: "Deep cut" },
  { position: 13, minute: 34, duration: 3.5,  category: "E",       type: "song",       notes: "Indie" },
  { position: 14, minute: 37, duration: 0.15, category: "Imaging", type: "sweeper",    notes: "Mid-hour sweeper" },
  { position: 15, minute: 38, duration: 3.5,  category: "C",       type: "song",       notes: "Recurrent" },
  { position: 16, minute: 41, duration: 3.5,  category: "B",       type: "song",       notes: "Medium rotation" },
  { position: 17, minute: 45, duration: 1,    category: "Sponsor", type: "ad",         notes: "Ad break 2" },
  { position: 18, minute: 46, duration: 3.5,  category: "A",       type: "song",       notes: "Hit post-break" },
  { position: 19, minute: 50, duration: 3.5,  category: "E",       type: "song",       notes: "Indie" },
  { position: 20, minute: 53, duration: 3.5,  category: "D",       type: "song",       notes: "Deep cut" },
  { position: 21, minute: 57, duration: 3.5,  category: "D",       type: "song",       notes: "Closer" },
];

// ── Late Night Music clock (6pm–6am) ─────────────────────────────────
// 16 songs, 1 TOH, 3 sweepers, 2 ad breaks — mellower, more atmosphere
const LATE_NIGHT_PATTERN = [
  { position: 1,  minute: 0,  duration: 0.25, category: "TOH",     type: "station_id", notes: "Late night TOH" },
  { position: 2,  minute: 0,  duration: 4,    category: "D",       type: "song",       notes: "Slow opener" },
  { position: 3,  minute: 4,  duration: 4,    category: "C",       type: "song",       notes: "Recurrent" },
  { position: 4,  minute: 8,  duration: 4,    category: "D",       type: "song",       notes: "Deep cut" },
  { position: 5,  minute: 12, duration: 0.15, category: "Imaging", type: "sweeper",    notes: "Ambient sweeper" },
  { position: 6,  minute: 12, duration: 4,    category: "E",       type: "song",       notes: "Indie" },
  { position: 7,  minute: 16, duration: 4,    category: "A",       type: "song",       notes: "Hit" },
  { position: 8,  minute: 20, duration: 1,    category: "Sponsor", type: "ad",         notes: "Ad break 1" },
  { position: 9,  minute: 21, duration: 4,    category: "D",       type: "song",       notes: "Ballad" },
  { position: 10, minute: 25, duration: 4,    category: "E",       type: "song",       notes: "Indie" },
  { position: 11, minute: 29, duration: 4,    category: "C",       type: "song",       notes: "Recurrent" },
  { position: 12, minute: 33, duration: 0.15, category: "Imaging", type: "sweeper",    notes: "Ambient sweeper" },
  { position: 13, minute: 33, duration: 4,    category: "A",       type: "song",       notes: "Hit" },
  { position: 14, minute: 37, duration: 4,    category: "D",       type: "song",       notes: "Deep cut" },
  { position: 15, minute: 41, duration: 4,    category: "E",       type: "song",       notes: "Indie" },
  { position: 16, minute: 45, duration: 1,    category: "Sponsor", type: "ad",         notes: "Ad break 2" },
  { position: 17, minute: 46, duration: 4,    category: "D",       type: "song",       notes: "Night ballad" },
  { position: 18, minute: 50, duration: 4,    category: "E",       type: "song",       notes: "Indie closer" },
  { position: 19, minute: 54, duration: 4,    category: "D",       type: "song",       notes: "Wind down" },
  { position: 20, minute: 58, duration: 0.15, category: "Imaging", type: "sweeper",    notes: "Night imaging" },
];

async function main() {
  console.log("🎵 Converting North Country Radio to Music-First model...\n");

  // ── Step 1: Find station ───────────────────────────────────────────
  const station = await prisma.station.findFirst({
    where: { isActive: true, deletedAt: null },
  });
  if (!station) {
    console.error("No active station found!");
    process.exit(1);
  }
  console.log(`Station: ${station.name} (${station.id})`);

  // ── Step 2: Deactivate all existing DJs ────────────────────────────
  const djResult = await prisma.dJ.updateMany({
    where: { stationId: station.id, isActive: true },
    data: { isActive: false },
  });
  console.log(`Deactivated ${djResult.count} DJs`);

  // ── Step 3: Deactivate all ClockAssignments ────────────────────────
  const caResult = await prisma.clockAssignment.updateMany({
    where: { stationId: station.id, isActive: true },
    data: { isActive: false },
  });
  console.log(`Deactivated ${caResult.count} clock assignments`);

  // ── Step 4: Deactivate all DJShows ─────────────────────────────────
  const showResult = await prisma.dJShow.updateMany({
    where: { dj: { stationId: station.id }, isActive: true },
    data: { isActive: false },
  });
  console.log(`Deactivated ${showResult.count} DJ shows`);

  // ── Step 5: Deactivate all FeatureSchedules ────────────────────────
  const fsResult = await prisma.featureSchedule.updateMany({
    where: { stationId: station.id, isActive: true },
    data: { isActive: false },
  });
  console.log(`Deactivated ${fsResult.count} feature schedules`);

  // ── Step 6: Deactivate old clock templates ─────────────────────────
  const ctResult = await prisma.clockTemplate.updateMany({
    where: { stationId: station.id, isActive: true },
    data: { isActive: false },
  });
  console.log(`Deactivated ${ctResult.count} clock templates`);

  // ── Step 7: Create two host "DJ" records ───────────────────────────
  const maleHost = await prisma.dJ.upsert({
    where: { slug: "ncr-host-male" },
    update: {
      name: "NCR Host",
      isActive: true,
      ttsVoice: "Puck",
      ttsProvider: "gemini",
      voiceDescription: "Role: Station host for North Country Radio. Voice Texture: Warm, conversational, friendly. Delivery: Natural and relaxed, like a friend playing you a great song.",
    },
    create: {
      name: "NCR Host",
      slug: "ncr-host-male",
      bio: "Your companion on North Country Radio.",
      vibe: "Warm, friendly station host",
      tagline: "Great music, all day long.",
      isActive: true,
      isWeekend: false,
      ttsVoice: "Puck",
      ttsProvider: "gemini",
      voiceDescription: "Role: Station host for North Country Radio. Voice Texture: Warm, conversational, friendly. Delivery: Natural and relaxed, like a friend playing you a great song.",
      stationId: station.id,
      priority: 0,
      voiceStability: 0.75,
      voiceSimilarityBoost: 0.75,
      gptTemperature: 0.8,
    },
  });
  console.log(`Male host: ${maleHost.name} (${maleHost.slug}) — voice: Puck`);

  const femaleHost = await prisma.dJ.upsert({
    where: { slug: "ncr-host-female" },
    update: {
      name: "NCR Weekend Host",
      isActive: true,
      ttsVoice: "Zephyr",
      ttsProvider: "gemini",
      voiceDescription: "Role: Station host for North Country Radio. Voice Texture: Bright, warm, natural. Delivery: Relaxed and inviting, keeping the music flowing.",
    },
    create: {
      name: "NCR Weekend Host",
      slug: "ncr-host-female",
      bio: "Your weekend companion on North Country Radio.",
      vibe: "Bright, inviting station host",
      tagline: "Your weekend starts here.",
      isActive: true,
      isWeekend: true,
      ttsVoice: "Zephyr",
      ttsProvider: "gemini",
      voiceDescription: "Role: Station host for North Country Radio. Voice Texture: Bright, warm, natural. Delivery: Relaxed and inviting, keeping the music flowing.",
      stationId: station.id,
      priority: 1,
      voiceStability: 0.75,
      voiceSimilarityBoost: 0.75,
      gptTemperature: 0.8,
    },
  });
  console.log(`Female host: ${femaleHost.name} (${femaleHost.slug}) — voice: Zephyr`);

  // ── Step 8: Create new clock templates ─────────────────────────────
  // Delete any previous music-first templates for idempotency
  await prisma.clockTemplate.deleteMany({
    where: { stationId: station.id, name: { in: ["Music First", "Late Night Music"] } },
  });

  const musicFirst = await prisma.clockTemplate.create({
    data: {
      stationId: station.id,
      name: "Music First",
      description: "All-day music-focused format — 17 songs per hour, imaging and ads only",
      clockType: "midday",
      tempo: "moderate",
      energyLevel: "medium",
      hitsPerHour: 6,
      indiePerHour: 3,
      genderBalanceTarget: 0.5,
      clockPattern: JSON.stringify(MUSIC_FIRST_PATTERN),
      isActive: true,
    },
  });
  console.log(`Clock template: ${musicFirst.name} (${musicFirst.id}) — 21 slots, 17 songs`);

  const lateNight = await prisma.clockTemplate.create({
    data: {
      stationId: station.id,
      name: "Late Night Music",
      description: "After-hours mellow format — 16 songs per hour, atmospheric imaging",
      clockType: "late_night",
      tempo: "laid_back",
      energyLevel: "low",
      hitsPerHour: 2,
      indiePerHour: 4,
      genderBalanceTarget: 0.45,
      clockPattern: JSON.stringify(LATE_NIGHT_PATTERN),
      isActive: true,
    },
  });
  console.log(`Clock template: ${lateNight.name} (${lateNight.id}) — 20 slots, 16 songs`);

  // ── Step 9: Create clock assignments ───────────────────────────────
  // Clear any old host assignments for idempotency
  await prisma.clockAssignment.deleteMany({
    where: { djId: { in: [maleHost.id, femaleHost.id] } },
  });

  const assignments = [
    // Male host — weekday daytime
    { djId: maleHost.id, clockTemplateId: musicFirst.id, dayType: "weekday", start: "06:00", end: "18:00" },
    // Female host — Saturday daytime
    { djId: femaleHost.id, clockTemplateId: musicFirst.id, dayType: "saturday", start: "06:00", end: "18:00" },
    // Female host — Sunday daytime
    { djId: femaleHost.id, clockTemplateId: musicFirst.id, dayType: "sunday", start: "06:00", end: "18:00" },
    // Male host — weekday late night
    { djId: maleHost.id, clockTemplateId: lateNight.id, dayType: "weekday", start: "18:00", end: "06:00" },
    // Male host — Saturday late night
    { djId: maleHost.id, clockTemplateId: lateNight.id, dayType: "saturday", start: "18:00", end: "06:00" },
    // Male host — Sunday late night
    { djId: maleHost.id, clockTemplateId: lateNight.id, dayType: "sunday", start: "18:00", end: "06:00" },
  ];

  for (const a of assignments) {
    await prisma.clockAssignment.create({
      data: {
        stationId: station.id,
        djId: a.djId,
        clockTemplateId: a.clockTemplateId,
        dayType: a.dayType,
        timeSlotStart: a.start,
        timeSlotEnd: a.end,
        priority: 1,
        isActive: true,
      },
    });
  }
  console.log(`Created ${assignments.length} clock assignments (24/7 coverage)`);

  // ── Step 10: Purge draft playlists ─────────────────────────────────
  const purged = await prisma.hourPlaylist.deleteMany({
    where: { stationId: station.id, status: "draft" },
  });
  console.log(`Purged ${purged.count} draft playlists`);

  console.log("\n✅ North Country Radio is now Music First!");
  console.log("   Hosts: NCR Host (Puck) weekdays, NCR Weekend Host (Zephyr) weekends");
  console.log("   Imaging voices: Algieba + Autonoe (unchanged)");
  console.log("   Sponsor ad voices: Rasalgethi, Laomedeia, Iapetus, Achernar (unchanged)");
  console.log("\n   Next: run POST /api/hour-playlists { regenerateToday: true } to rebuild today's playlists");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
