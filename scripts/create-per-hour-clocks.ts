/**
 * Create per-hour clock templates for each DJ and split 3-hour assignments
 * into 1-hour assignments.
 *
 * Each DJ gets 3 clocks:
 *   Hour 1: Show intro, songs, 2 ad breaks (3 min each), 2 features, 1 generic VT, 2 song VTs
 *   Hour 2: Songs, 2 ad breaks, 2 features, 1 generic VT, 2 song VTs (no intro/outro)
 *   Hour 3: Songs, 2 ad breaks, 2 features, 1 generic VT, 2 song VTs, show closer at end
 *
 * Clock slot format: { position, minute, duration, category, type, notes }
 * Types: station_id, song, voice_break, ad, feature, sweeper
 * Categories: TOH, A, B, C, D, E, DJ, Sponsor, Feature, Imaging
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// CLOCK PATTERNS
// ============================================================================

// Hour 1: Show opener with intro
function hour1Pattern() {
  return [
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID over music bed" },
    { position: 2,  minute: 0,  duration: 2, category: "DJ",      type: "voice_break", notes: "SHOW INTRO — DJ opens the show" },
    { position: 3,  minute: 2,  duration: 4, category: "A",       type: "song",        notes: "Power hit opener" },
    { position: 4,  minute: 6,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 5,  minute: 10, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 6,  minute: 11, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 7,  minute: 15, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    { position: 8,  minute: 18, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 9,  minute: 22, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break" },
    { position: 10, minute: 23, duration: 3, category: "Sponsor", type: "ad",          notes: "Sponsor ad break 1 (2 spots)" },
    { position: 11, minute: 26, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 12, minute: 30, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 13, minute: 31, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    { position: 14, minute: 35, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    { position: 15, minute: 38, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 16, minute: 42, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 17, minute: 46, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break" },
    { position: 18, minute: 47, duration: 3, category: "Sponsor", type: "ad",          notes: "Sponsor ad break 2 (2 spots)" },
    { position: 19, minute: 50, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 20, minute: 54, duration: 1, category: "DJ",      type: "voice_break", notes: "Generic pre-recorded voice track" },
    { position: 21, minute: 55, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
  ];
}

// Hour 2: Mid-show — no intro/outro
function hour2Pattern() {
  return [
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID" },
    { position: 2,  minute: 0,  duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 3,  minute: 4,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 4,  minute: 8,  duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 5,  minute: 9,  duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 6,  minute: 13, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    { position: 7,  minute: 16, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 8,  minute: 20, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    { position: 9,  minute: 24, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break" },
    { position: 10, minute: 25, duration: 3, category: "Sponsor", type: "ad",          notes: "Sponsor ad break 1 (2 spots)" },
    { position: 11, minute: 28, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 12, minute: 32, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 13, minute: 33, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    { position: 14, minute: 37, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 15, minute: 41, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    { position: 16, minute: 44, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 17, minute: 48, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break" },
    { position: 18, minute: 49, duration: 3, category: "Sponsor", type: "ad",          notes: "Sponsor ad break 2 (2 spots)" },
    { position: 19, minute: 52, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 20, minute: 56, duration: 1, category: "DJ",      type: "voice_break", notes: "Generic pre-recorded voice track" },
    { position: 21, minute: 57, duration: 3, category: "D",       type: "song",        notes: "Light rotation closer" },
  ];
}

// Hour 3: Show closer
function hour3Pattern() {
  return [
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID" },
    { position: 2,  minute: 0,  duration: 4, category: "A",       type: "song",        notes: "Power hit opener" },
    { position: 3,  minute: 4,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 4,  minute: 8,  duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 5,  minute: 9,  duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 6,  minute: 13, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    { position: 7,  minute: 16, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 8,  minute: 20, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    { position: 9,  minute: 24, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break" },
    { position: 10, minute: 25, duration: 3, category: "Sponsor", type: "ad",          notes: "Sponsor ad break 1 (2 spots)" },
    { position: 11, minute: 28, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 12, minute: 32, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 13, minute: 33, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    { position: 14, minute: 37, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    { position: 15, minute: 40, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 16, minute: 44, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break" },
    { position: 17, minute: 45, duration: 3, category: "Sponsor", type: "ad",          notes: "Sponsor ad break 2 (2 spots)" },
    { position: 18, minute: 48, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 19, minute: 52, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 20, minute: 56, duration: 1, category: "DJ",      type: "voice_break", notes: "Generic pre-recorded voice track — SHOW CLOSER" },
    { position: 21, minute: 57, duration: 3, category: "D",       type: "song",        notes: "Final song before handoff" },
  ];
}

// DJ configs
const DJ_CLOCKS = [
  { slug: "hank-westwood",    name: "Hank",    clockPrefix: "Morning Drive",    clockType: "morning_drive", tempo: "upbeat",   hours: [6, 7, 8] },
  { slug: "loretta-merrick",  name: "Loretta", clockPrefix: "Midday Show",      clockType: "midday",        tempo: "moderate", hours: [9, 10, 11] },
  { slug: "doc-holloway",     name: "Doc",     clockPrefix: "Afternoon Groove", clockType: "midday",        tempo: "moderate", hours: [12, 13, 14] },
  { slug: "cody-rampart",     name: "Cody",    clockPrefix: "Drive Home",       clockType: "evening",       tempo: "laid_back", hours: [15, 16, 17] },
];

const DAY_TYPES = ["weekday", "saturday", "sunday"];

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) {
    console.error("No active station found");
    process.exit(1);
  }

  console.log(`Station: ${station.name} (${station.id})`);

  // Delete old assignments and templates
  const deletedAssignments = await prisma.clockAssignment.deleteMany({ where: { stationId: station.id } });
  console.log(`Deleted ${deletedAssignments.count} old assignments`);

  const deletedTemplates = await prisma.clockTemplate.deleteMany({ where: { stationId: station.id } });
  console.log(`Deleted ${deletedTemplates.count} old templates`);

  // Create 12 templates (3 per DJ) + assignments
  for (const dj of DJ_CLOCKS) {
    const djRecord = await prisma.dJ.findFirst({
      where: { stationId: station.id, slug: dj.slug },
      select: { id: true, name: true },
    });

    if (!djRecord) {
      console.warn(`DJ ${dj.slug} not found, skipping`);
      continue;
    }

    console.log(`\n${djRecord.name}:`);

    const patterns = [hour1Pattern(), hour2Pattern(), hour3Pattern()];
    const hourLabels = ["Hour 1 (Opener)", "Hour 2", "Hour 3 (Closer)"];

    for (let i = 0; i < 3; i++) {
      const templateName = `${dj.clockPrefix} — ${hourLabels[i]}`;
      const template = await prisma.clockTemplate.create({
        data: {
          stationId: station.id,
          name: templateName,
          description: `${djRecord.name}'s ${hourLabels[i].toLowerCase()} clock. ${i === 0 ? "Includes show intro." : i === 2 ? "Includes show closer." : "Mid-show programming."}`,
          clockType: dj.clockType,
          tempo: dj.tempo,
          hitsPerHour: 6,
          indiePerHour: 3,
          genderBalanceTarget: 0.5,
          clockPattern: JSON.stringify(patterns[i]),
          isActive: true,
        },
      });

      console.log(`  Created template: ${templateName} (${template.id})`);

      // Create assignment for each day type
      const hour = dj.hours[i];
      for (const dayType of DAY_TYPES) {
        await prisma.clockAssignment.create({
          data: {
            stationId: station.id,
            djId: djRecord.id,
            clockTemplateId: template.id,
            dayType,
            timeSlotStart: `${hour.toString().padStart(2, "0")}:00`,
            timeSlotEnd: `${(hour + 1).toString().padStart(2, "0")}:00`,
            priority: 0,
            isActive: true,
          },
        });
      }
      console.log(`  Assigned to ${DAY_TYPES.join(", ")} at ${hour}:00-${hour + 1}:00`);
    }
  }

  // Verify
  const totalTemplates = await prisma.clockTemplate.count({ where: { stationId: station.id } });
  const totalAssignments = await prisma.clockAssignment.count({ where: { stationId: station.id } });
  console.log(`\nDone: ${totalTemplates} templates, ${totalAssignments} assignments`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
