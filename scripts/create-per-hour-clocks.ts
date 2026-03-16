/**
 * Create per-hour clock templates for each DJ and split 3-hour assignments
 * into 1-hour assignments.
 *
 * Each DJ gets 3 clocks:
 *   Hour 1: Show intro, songs, 3 ad breaks (2 min each = 6 min total), 2 features, 1 generic VT, 2 song VTs
 *   Hour 2: Songs, 3 ad breaks, 2 features, 1 generic VT, 2 song VTs (no intro/outro)
 *   Hour 3: Songs, 3 ad breaks, 2 features, 1 generic VT, 2 song VTs, show closer at end
 *
 * Ad breaks: 3 per hour x 2 min each = 6 min/hour
 *   Each ad break = sweeper(5s) + 4 ad slots(~15s each) + promo(10s) ≈ 2 min
 *   The playout endpoint expands each "ad" slot into sweeper + 2x15s spots + promo
 *   So 2 ad slots per break = 4 sponsor spots + bookend imaging ≈ 2 min
 *
 * Features: 2 per hour (artist spotlights, music stories, etc.)
 * Voice tracks: 2 song-referencing (back-announce + intro) + 1 generic pre-recorded
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// CLOCK PATTERNS — 3 ad breaks per hour, 2 features, 3 voice tracks
// ============================================================================

// Hour 1: Show opener with intro
function hour1Pattern() {
  return [
    // :00 — Top of hour
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID over music bed" },
    { position: 2,  minute: 0,  duration: 2, category: "DJ",      type: "voice_break", notes: "SHOW INTRO — DJ opens the show" },
    // :02 — Music block 1
    { position: 3,  minute: 2,  duration: 4, category: "A",       type: "song",        notes: "Power hit opener" },
    { position: 4,  minute: 6,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 5,  minute: 10, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 6,  minute: 11, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    // :15 — Feature 1
    { position: 7,  minute: 15, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    // :18 — AD BREAK 1 (2 min: sweeper + 4 spots + promo)
    { position: 8,  minute: 18, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 1" },
    { position: 9,  minute: 18, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 1 — spots 1-2" },
    { position: 10, minute: 19, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 1 — spots 3-4" },
    // :20 — Music block 2
    { position: 11, minute: 20, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 12, minute: 24, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 13, minute: 28, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 14, minute: 29, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    // :33 — Feature 2
    { position: 15, minute: 33, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    // :36 — AD BREAK 2 (2 min)
    { position: 16, minute: 36, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 2" },
    { position: 17, minute: 36, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 2 — spots 1-2" },
    { position: 18, minute: 37, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 2 — spots 3-4" },
    // :38 — Music block 3
    { position: 19, minute: 38, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 20, minute: 42, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    // :46 — AD BREAK 3 (2 min)
    { position: 21, minute: 46, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 3" },
    { position: 22, minute: 46, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 3 — spots 1-2" },
    { position: 23, minute: 47, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 3 — spots 3-4" },
    // :48 — Music block 4 + generic VT
    { position: 24, minute: 48, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 25, minute: 52, duration: 1, category: "DJ",      type: "voice_break", notes: "Generic pre-recorded voice track" },
    { position: 26, minute: 53, duration: 4, category: "C",       type: "song",        notes: "Medium rotation closer" },
  ];
}

// Hour 2: Mid-show — no intro/outro
function hour2Pattern() {
  return [
    // :00 — Top of hour
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID" },
    // :00 — Music block 1
    { position: 2,  minute: 0,  duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 3,  minute: 4,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 4,  minute: 8,  duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 5,  minute: 9,  duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    // :13 — Feature 1
    { position: 6,  minute: 13, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    // :16 — AD BREAK 1 (2 min)
    { position: 7,  minute: 16, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 1" },
    { position: 8,  minute: 16, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 1 — spots 1-2" },
    { position: 9,  minute: 17, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 1 — spots 3-4" },
    // :18 — Music block 2
    { position: 10, minute: 18, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 11, minute: 22, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    { position: 12, minute: 26, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 13, minute: 27, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    // :31 — Feature 2
    { position: 14, minute: 31, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    // :34 — AD BREAK 2 (2 min)
    { position: 15, minute: 34, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 2" },
    { position: 16, minute: 34, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 2 — spots 1-2" },
    { position: 17, minute: 35, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 2 — spots 3-4" },
    // :36 — Music block 3
    { position: 18, minute: 36, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    { position: 19, minute: 40, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    // :44 — AD BREAK 3 (2 min)
    { position: 20, minute: 44, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 3" },
    { position: 21, minute: 44, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 3 — spots 1-2" },
    { position: 22, minute: 45, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 3 — spots 3-4" },
    // :46 — Music block 4 + generic VT
    { position: 23, minute: 46, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 24, minute: 50, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 25, minute: 54, duration: 1, category: "DJ",      type: "voice_break", notes: "Generic pre-recorded voice track" },
    { position: 26, minute: 55, duration: 4, category: "D",       type: "song",        notes: "Light rotation closer" },
  ];
}

// Hour 3 WITH handoff: Show closer + transition to next DJ (Hank→Loretta, Loretta→Doc, Doc→Cody)
function hour3WithHandoffPattern() {
  return [
    // :00 — Top of hour
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID" },
    // :00 — Music block 1
    { position: 2,  minute: 0,  duration: 4, category: "A",       type: "song",        notes: "Power hit opener" },
    { position: 3,  minute: 4,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 4,  minute: 8,  duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 5,  minute: 9,  duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    // :13 — Feature 1
    { position: 6,  minute: 13, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    // :16 — AD BREAK 1 (2 min)
    { position: 7,  minute: 16, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 1" },
    { position: 8,  minute: 16, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 1 — spots 1-2" },
    { position: 9,  minute: 17, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 1 — spots 3-4" },
    // :18 — Music block 2
    { position: 10, minute: 18, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 11, minute: 22, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    { position: 12, minute: 26, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 13, minute: 27, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    // :31 — Feature 2
    { position: 14, minute: 31, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    // :34 — AD BREAK 2 (2 min)
    { position: 15, minute: 34, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 2" },
    { position: 16, minute: 34, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 2 — spots 1-2" },
    { position: 17, minute: 35, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 2 — spots 3-4" },
    // :36 — Music block 3
    { position: 18, minute: 36, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 19, minute: 40, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    // :44 — AD BREAK 3 (2 min)
    { position: 20, minute: 44, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 3" },
    { position: 21, minute: 44, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 3 — spots 1-2" },
    { position: 22, minute: 45, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 3 — spots 3-4" },
    // :46 — Final music + transition
    { position: 23, minute: 46, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 24, minute: 50, duration: 2, category: "DJ",      type: "voice_break", notes: "SHOW TRANSITION — DJ hands off to next DJ" },
    { position: 25, minute: 52, duration: 4, category: "B",       type: "song",        notes: "Final song" },
    { position: 26, minute: 56, duration: 2, category: "DJ",      type: "voice_break", notes: "SHOW CLOSER — DJ signs off" },
  ];
}

// Hour 3 WITHOUT handoff: Show closer only (Cody — last DJ of the day, no following DJ)
function hour3NoHandoffPattern() {
  return [
    // :00 — Top of hour
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID" },
    // :00 — Music block 1
    { position: 2,  minute: 0,  duration: 4, category: "A",       type: "song",        notes: "Power hit opener" },
    { position: 3,  minute: 4,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 4,  minute: 8,  duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 5,  minute: 9,  duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    // :13 — Feature 1
    { position: 6,  minute: 13, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    // :16 — AD BREAK 1 (2 min)
    { position: 7,  minute: 16, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 1" },
    { position: 8,  minute: 16, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 1 — spots 1-2" },
    { position: 9,  minute: 17, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 1 — spots 3-4" },
    // :18 — Music block 2
    { position: 10, minute: 18, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    { position: 11, minute: 22, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    { position: 12, minute: 26, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 13, minute: 27, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    // :31 — Feature 2
    { position: 14, minute: 31, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    // :34 — AD BREAK 2 (2 min)
    { position: 15, minute: 34, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 2" },
    { position: 16, minute: 34, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 2 — spots 1-2" },
    { position: 17, minute: 35, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 2 — spots 3-4" },
    // :36 — Music block 3
    { position: 18, minute: 36, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 19, minute: 40, duration: 4, category: "A",       type: "song",        notes: "Power hit" },
    // :44 — AD BREAK 3 (2 min)
    { position: 20, minute: 44, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into ad break 3" },
    { position: 21, minute: 44, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 3 — spots 1-2" },
    { position: 22, minute: 45, duration: 1, category: "Sponsor", type: "sponsor",          notes: "Ad break 3 — spots 3-4" },
    // :46 — Final music + show closer (no handoff)
    { position: 23, minute: 46, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 24, minute: 50, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 25, minute: 54, duration: 4, category: "A",       type: "song",        notes: "Final power hit of the day" },
    { position: 26, minute: 58, duration: 2, category: "DJ",      type: "voice_break", notes: "SHOW CLOSER — DJ signs off for the day" },
  ];
}

// DJ configs — hasFollowingDj determines if Hour 3 has a show transition
const DJ_CLOCKS = [
  { slug: "hank-westwood",    name: "Hank",    clockPrefix: "Morning Drive",    clockType: "morning_drive", tempo: "upbeat",    hours: [6, 7, 8],   hasFollowingDj: true },
  { slug: "loretta-merrick",  name: "Loretta", clockPrefix: "Midday Show",      clockType: "midday",        tempo: "moderate",  hours: [9, 10, 11], hasFollowingDj: true },
  { slug: "doc-holloway",     name: "Doc",     clockPrefix: "Afternoon Groove", clockType: "midday",        tempo: "moderate",  hours: [12, 13, 14], hasFollowingDj: true },
  { slug: "cody-rampart",     name: "Cody",    clockPrefix: "Drive Home",       clockType: "evening",       tempo: "laid_back", hours: [15, 16, 17], hasFollowingDj: false },
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

    const hour3 = dj.hasFollowingDj ? hour3WithHandoffPattern() : hour3NoHandoffPattern();
    const patterns = [hour1Pattern(), hour2Pattern(), hour3];
    const hourLabels = [
      "Hour 1 (Opener)",
      "Hour 2",
      dj.hasFollowingDj ? "Hour 3 (Closer + Handoff)" : "Hour 3 (Closer)",
    ];

    // Count elements per pattern for logging
    for (let i = 0; i < 3; i++) {
      const p = patterns[i];
      const songs = p.filter(s => s.type === "song").length;
      const ads = p.filter(s => s.type === "ad").length;
      const features = p.filter(s => s.type === "feature").length;
      const vts = p.filter(s => s.type === "voice_break").length;

      const templateName = `${dj.clockPrefix} — ${hourLabels[i]}`;
      const template = await prisma.clockTemplate.create({
        data: {
          stationId: station.id,
          name: templateName,
          description: `${djRecord.name}'s ${hourLabels[i].toLowerCase()} clock. ${i === 0 ? "Includes show intro." : i === 2 ? (dj.hasFollowingDj ? "Includes show transition to next DJ + show closer." : "Includes show closer (last DJ of the day).") : "Mid-show programming."} ${songs} songs, ${ads * 2} ad spots (${ads} breaks), ${features} features, ${vts} voice tracks.`,
          clockType: dj.clockType,
          tempo: dj.tempo,
          hitsPerHour: songs,
          indiePerHour: 3,
          genderBalanceTarget: 0.5,
          clockPattern: JSON.stringify(patterns[i]),
          isActive: true,
        },
      });

      console.log(`  Created: ${templateName} — ${songs} songs, ${ads * 2} ad spots (3 breaks), ${features} features, ${vts} VTs`);

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
      console.log(`  Assigned: ${DAY_TYPES.join(", ")} at ${hour}:00-${hour + 1}:00`);
    }
  }

  // Verify
  const totalTemplates = await prisma.clockTemplate.count({ where: { stationId: station.id } });
  const totalAssignments = await prisma.clockAssignment.count({ where: { stationId: station.id } });
  console.log(`\nDone: ${totalTemplates} templates, ${totalAssignments} assignments`);
  console.log(`Each hour: 3 ad breaks x 2 min = 6 min ads, 2 features, 3 voice tracks (2 song + 1 generic)`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
