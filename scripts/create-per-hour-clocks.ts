/**
 * Create per-hour clock templates for each DJ.
 *
 * RULES:
 * - 3 sponsor ad breaks per hour, each 30 seconds (2 x 15-sec spots)
 * - Sponsor breaks placed RIGHT AFTER a sweeper/promo
 * - Sponsor breaks NOT adjacent to station features (at least 1 song gap)
 * - 3 A-category tracks: 1st song of the hour + 1 after each of the other 2 ad breaks
 * - 2 station features per hour
 * - 2 song-referencing voice tracks + 1 generic pre-recorded
 * - Hour 1: show intro at top
 * - Hour 3: show transition (Hank/Loretta/Doc) or just closer (Cody)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// CLOCK PATTERNS
// ============================================================================

/**
 * Hour 1: Show opener
 *
 * :00  Station ID + Show Intro
 * :02  Song A ← FIRST SONG = A CATEGORY
 * :06  Song B
 * :10  VT: back-announce + intro
 * :11  Song C
 * :15  Sweeper → SPONSOR BREAK 1 (2x15s)
 * :16  Song A ← AFTER AD BREAK = A CATEGORY
 * :20  Song D
 * :24  Song B
 * :28  Feature 1
 * :31  Song C
 * :35  Sweeper → SPONSOR BREAK 2 (2x15s)
 * :36  Song A ← AFTER AD BREAK = A CATEGORY
 * :40  VT: back-announce + intro
 * :41  Song E
 * :45  Song B
 * :49  Feature 2
 * :52  Song D
 * :56  Sweeper → SPONSOR BREAK 3 (2x15s)
 * :56  Generic VT
 * :57  Song C closer
 */
function hour1Pattern() {
  return [
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID over music bed" },
    { position: 2,  minute: 0,  duration: 2, category: "DJ",      type: "voice_break", notes: "SHOW INTRO — DJ opens the show" },
    { position: 3,  minute: 2,  duration: 4, category: "A",       type: "song",        notes: "Power hit — first song of the hour" },
    { position: 4,  minute: 6,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 5,  minute: 10, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 6,  minute: 11, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    // SPONSOR BREAK 1 — after sweeper, before A track
    { position: 7,  minute: 15, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 1" },
    { position: 8,  minute: 15, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 1 — spot 1 (15s)" },
    { position: 9,  minute: 15, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 1 — spot 2 (15s)" },
    { position: 10, minute: 16, duration: 4, category: "A",       type: "song",        notes: "Power hit — after sponsor break" },
    { position: 11, minute: 20, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    { position: 12, minute: 24, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    // FEATURE 1 — gap from sponsor breaks
    { position: 13, minute: 28, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    { position: 14, minute: 31, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    // SPONSOR BREAK 2 — after sweeper, before A track, gap from feature
    { position: 15, minute: 35, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 2" },
    { position: 16, minute: 35, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 2 — spot 1 (15s)" },
    { position: 17, minute: 35, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 2 — spot 2 (15s)" },
    { position: 18, minute: 36, duration: 4, category: "A",       type: "song",        notes: "Power hit — after sponsor break" },
    { position: 19, minute: 40, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 20, minute: 41, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    { position: 21, minute: 45, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    // FEATURE 2 — gap from sponsor breaks
    { position: 22, minute: 49, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    { position: 23, minute: 52, duration: 4, category: "D",       type: "song",        notes: "Light rotation" },
    // SPONSOR BREAK 3 — after sweeper
    { position: 24, minute: 56, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 3" },
    { position: 25, minute: 56, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 3 — spot 1 (15s)" },
    { position: 26, minute: 56, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 3 — spot 2 (15s)" },
    { position: 27, minute: 57, duration: 1, category: "DJ",      type: "voice_break", notes: "Generic pre-recorded voice track" },
    { position: 28, minute: 58, duration: 4, category: "C",       type: "song",        notes: "Medium rotation closer" },
  ];
}

/**
 * Hour 2: Mid-show — no intro or closer
 */
function hour2Pattern() {
  return [
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID" },
    { position: 2,  minute: 0,  duration: 4, category: "A",       type: "song",        notes: "Power hit — first song of the hour" },
    { position: 3,  minute: 4,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 4,  minute: 8,  duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 5,  minute: 9,  duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 6,  minute: 13, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    // SPONSOR BREAK 1
    { position: 7,  minute: 17, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 1" },
    { position: 8,  minute: 17, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 1 — spot 1 (15s)" },
    { position: 9,  minute: 17, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 1 — spot 2 (15s)" },
    { position: 10, minute: 18, duration: 4, category: "A",       type: "song",        notes: "Power hit — after sponsor break" },
    { position: 11, minute: 22, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    // FEATURE 1 — gap from sponsor break
    { position: 12, minute: 26, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    { position: 13, minute: 29, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 14, minute: 33, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 15, minute: 34, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    // SPONSOR BREAK 2
    { position: 16, minute: 38, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 2" },
    { position: 17, minute: 38, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 2 — spot 1 (15s)" },
    { position: 18, minute: 38, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 2 — spot 2 (15s)" },
    { position: 19, minute: 39, duration: 4, category: "A",       type: "song",        notes: "Power hit — after sponsor break" },
    { position: 20, minute: 43, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    // FEATURE 2 — gap from sponsor break
    { position: 21, minute: 47, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    { position: 22, minute: 50, duration: 4, category: "D",       type: "song",        notes: "Light rotation" },
    // SPONSOR BREAK 3
    { position: 23, minute: 54, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 3" },
    { position: 24, minute: 54, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 3 — spot 1 (15s)" },
    { position: 25, minute: 54, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 3 — spot 2 (15s)" },
    { position: 26, minute: 55, duration: 1, category: "DJ",      type: "voice_break", notes: "Generic pre-recorded voice track" },
    { position: 27, minute: 56, duration: 4, category: "C",       type: "song",        notes: "Medium rotation closer" },
  ];
}

/**
 * Hour 3 WITH handoff: Show transition to next DJ + closer
 * (Hank→Loretta, Loretta→Doc, Doc→Cody)
 */
function hour3WithHandoffPattern() {
  return [
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID" },
    { position: 2,  minute: 0,  duration: 4, category: "A",       type: "song",        notes: "Power hit — first song of the hour" },
    { position: 3,  minute: 4,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 4,  minute: 8,  duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 5,  minute: 9,  duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 6,  minute: 13, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    // SPONSOR BREAK 1
    { position: 7,  minute: 17, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 1" },
    { position: 8,  minute: 17, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 1 — spot 1 (15s)" },
    { position: 9,  minute: 17, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 1 — spot 2 (15s)" },
    { position: 10, minute: 18, duration: 4, category: "A",       type: "song",        notes: "Power hit — after sponsor break" },
    { position: 11, minute: 22, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    // FEATURE 1 — gap from sponsor break
    { position: 12, minute: 26, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    { position: 13, minute: 29, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    { position: 14, minute: 33, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 15, minute: 34, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    // SPONSOR BREAK 2
    { position: 16, minute: 38, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 2" },
    { position: 17, minute: 38, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 2 — spot 1 (15s)" },
    { position: 18, minute: 38, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 2 — spot 2 (15s)" },
    { position: 19, minute: 39, duration: 4, category: "A",       type: "song",        notes: "Power hit — after sponsor break" },
    { position: 20, minute: 43, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    // FEATURE 2 — gap from sponsor break
    { position: 21, minute: 47, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    { position: 22, minute: 50, duration: 4, category: "D",       type: "song",        notes: "Light rotation" },
    // SPONSOR BREAK 3
    { position: 23, minute: 54, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 3" },
    { position: 24, minute: 54, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 3 — spot 1 (15s)" },
    { position: 25, minute: 54, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 3 — spot 2 (15s)" },
    // Show transition + closer
    { position: 26, minute: 55, duration: 2, category: "DJ",      type: "voice_break", notes: "SHOW TRANSITION — DJ hands off to next DJ" },
    { position: 27, minute: 57, duration: 4, category: "B",       type: "song",        notes: "Final song" },
    { position: 28, minute: 59, duration: 1, category: "DJ",      type: "voice_break", notes: "SHOW CLOSER — DJ signs off" },
  ];
}

/**
 * Hour 3 WITHOUT handoff: Show closer only (Cody — last DJ, no following DJ)
 */
function hour3NoHandoffPattern() {
  return [
    { position: 1,  minute: 0,  duration: 2, category: "TOH",     type: "station_id",  notes: "Top of hour — station ID" },
    { position: 2,  minute: 0,  duration: 4, category: "A",       type: "song",        notes: "Power hit — first song of the hour" },
    { position: 3,  minute: 4,  duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 4,  minute: 8,  duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 5,  minute: 9,  duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    { position: 6,  minute: 13, duration: 4, category: "D",       type: "song",        notes: "Light rotation / discovery" },
    // SPONSOR BREAK 1
    { position: 7,  minute: 17, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 1" },
    { position: 8,  minute: 17, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 1 — spot 1 (15s)" },
    { position: 9,  minute: 17, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 1 — spot 2 (15s)" },
    { position: 10, minute: 18, duration: 4, category: "A",       type: "song",        notes: "Power hit — after sponsor break" },
    { position: 11, minute: 22, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    // FEATURE 1 — gap from sponsor break
    { position: 12, minute: 26, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 1" },
    { position: 13, minute: 29, duration: 4, category: "E",       type: "song",        notes: "Artist spotlight / new music" },
    { position: 14, minute: 33, duration: 1, category: "DJ",      type: "voice_break", notes: "Back-announce + intro next song" },
    { position: 15, minute: 34, duration: 4, category: "C",       type: "song",        notes: "Medium rotation" },
    // SPONSOR BREAK 2
    { position: 16, minute: 38, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 2" },
    { position: 17, minute: 38, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 2 — spot 1 (15s)" },
    { position: 18, minute: 38, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 2 — spot 2 (15s)" },
    { position: 19, minute: 39, duration: 4, category: "A",       type: "song",        notes: "Power hit — after sponsor break" },
    { position: 20, minute: 43, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    // FEATURE 2 — gap from sponsor break
    { position: 21, minute: 47, duration: 3, category: "Feature", type: "feature",     notes: "Station feature segment 2" },
    { position: 22, minute: 50, duration: 4, category: "D",       type: "song",        notes: "Light rotation" },
    // SPONSOR BREAK 3
    { position: 23, minute: 54, duration: 1, category: "Imaging", type: "sweeper",     notes: "Sweeper into sponsor break 3" },
    { position: 24, minute: 54, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 3 — spot 1 (15s)" },
    { position: 25, minute: 54, duration: 1, category: "Sponsor", type: "sponsor",     notes: "Sponsor break 3 — spot 2 (15s)" },
    // Final songs + closer (no handoff)
    { position: 26, minute: 55, duration: 4, category: "B",       type: "song",        notes: "Heavy rotation" },
    { position: 27, minute: 57, duration: 1, category: "DJ",      type: "voice_break", notes: "SHOW CLOSER — DJ signs off for the day" },
    { position: 28, minute: 58, duration: 4, category: "C",       type: "song",        notes: "Final song of the day" },
  ];
}

// DJ configs
const DJ_CLOCKS = [
  { slug: "hank-westwood",    name: "Hank",    clockPrefix: "Morning Drive",    clockType: "morning_drive", tempo: "upbeat",    hours: [6, 7, 8],   hasFollowingDj: true },
  { slug: "loretta-merrick",  name: "Loretta", clockPrefix: "Midday Show",      clockType: "midday",        tempo: "moderate",  hours: [9, 10, 11], hasFollowingDj: true },
  { slug: "doc-holloway",     name: "Doc",     clockPrefix: "Afternoon Groove", clockType: "midday",        tempo: "moderate",  hours: [12, 13, 14], hasFollowingDj: true },
  { slug: "cody-rampart",     name: "Cody",    clockPrefix: "Drive Home",       clockType: "evening",       tempo: "laid_back", hours: [15, 16, 17], hasFollowingDj: false },
];

const DAY_TYPES = ["weekday", "saturday", "sunday"];

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) { console.error("No active station"); process.exit(1); }

  console.log(`Station: ${station.name}`);

  const del1 = await prisma.clockAssignment.deleteMany({ where: { stationId: station.id } });
  const del2 = await prisma.clockTemplate.deleteMany({ where: { stationId: station.id } });
  console.log(`Cleaned: ${del1.count} assignments, ${del2.count} templates\n`);

  for (const dj of DJ_CLOCKS) {
    const djRec = await prisma.dJ.findFirst({ where: { stationId: station.id, slug: dj.slug }, select: { id: true, name: true } });
    if (!djRec) { console.warn(`  DJ ${dj.slug} not found`); continue; }

    console.log(`${djRec.name}:`);

    const hour3 = dj.hasFollowingDj ? hour3WithHandoffPattern() : hour3NoHandoffPattern();
    const patterns = [hour1Pattern(), hour2Pattern(), hour3];
    const labels = ["Hour 1 (Opener)", "Hour 2", dj.hasFollowingDj ? "Hour 3 (Closer + Handoff)" : "Hour 3 (Closer)"];

    for (let i = 0; i < 3; i++) {
      const p = patterns[i];
      const songs = p.filter(s => s.type === "song").length;
      const sponsorSpots = p.filter(s => s.type === "sponsor").length;
      const sponsorBreaks = sponsorSpots / 2;
      const features = p.filter(s => s.type === "feature").length;
      const vts = p.filter(s => s.type === "voice_break").length;
      const aCat = p.filter(s => s.type === "song" && s.category === "A").length;

      const name = `${dj.clockPrefix} — ${labels[i]}`;
      const desc = `${i === 0 ? "Show intro. " : i === 2 ? (dj.hasFollowingDj ? "Show transition + closer. " : "Show closer. ") : ""}${songs} songs (${aCat}xA), ${sponsorBreaks} sponsor breaks (${sponsorSpots} spots), ${features} features, ${vts} voice tracks.`;

      const template = await prisma.clockTemplate.create({
        data: {
          stationId: station.id, name, description: desc,
          clockType: dj.clockType, tempo: dj.tempo,
          hitsPerHour: songs, indiePerHour: 3, genderBalanceTarget: 0.5,
          clockPattern: JSON.stringify(p), isActive: true,
        },
      });

      const hour = dj.hours[i];
      for (const dayType of DAY_TYPES) {
        await prisma.clockAssignment.create({
          data: {
            stationId: station.id, djId: djRec.id, clockTemplateId: template.id,
            dayType, timeSlotStart: `${hour.toString().padStart(2, "0")}:00`,
            timeSlotEnd: `${(hour + 1).toString().padStart(2, "0")}:00`,
            priority: 0, isActive: true,
          },
        });
      }

      console.log(`  ${labels[i]}: ${songs} songs (${aCat}A), ${sponsorBreaks} sponsor breaks, ${features} features, ${vts} VTs`);
    }
    console.log();
  }

  const tc = await prisma.clockTemplate.count({ where: { stationId: station.id } });
  const ac = await prisma.clockAssignment.count({ where: { stationId: station.id } });
  console.log(`Done: ${tc} templates, ${ac} assignments`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
