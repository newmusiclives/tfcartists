/**
 * Expand weekday clocks from 4 shared templates to 12 per-hour templates.
 *
 * Each weekday daypart (Hank 6-9, Loretta 9-12, Doc 12-3, Cody 3-6) gets
 * 3 distinct clocks: opening, middle, and closing hour with different
 * category mixes so each hour has its own energy and character.
 *
 * Weekend Discovery and Late Night Road clocks remain unchanged.
 *
 * Run with: npx tsx scripts/seed-expanded-clocks.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Standard clock structure ────────────────────────────────────────────
// Each clock follows the same skeleton with 3 ad breaks (SWEEPER→AD→PROMO)
// and 2 feature slots. The category assigned to each song slot varies per
// clock based on its mix ratios.

type SlotCategory = "TOH" | "A" | "B" | "C" | "D" | "E" | "DJ" | "Imaging" | "Sponsor" | "Feature" | "Promo";
type SlotType = "station_id" | "song" | "voice_break" | "feature" | "sweeper" | "ad" | "promo";

interface ClockSlot {
  position: number;
  minute: number;
  duration: number;
  category: SlotCategory;
  type: SlotType;
  notes: string;
  featureSlot?: number;
  featuredTrack?: "before" | "after";
}

/**
 * Build a 23-slot clock pattern with the given song categories.
 * Songs are placed in positions: 2,3,5,6,8,10,12,13,16,17,20,21,23
 * (13 song slots total per hour)
 *
 * songCategories must be exactly 13 entries matching those positions.
 */
function buildPattern(songCategories: SlotCategory[], tohNotes: string): ClockSlot[] {
  // Song positions mapped to their minute marks in the hour
  // Positions: 2(0), 3(4), 5(9), 6(13), 8(18), 10(23), 12(28), 13(32), 16(38), 17(42), 20(48), 21(52), 23(57)
  const pattern: ClockSlot[] = [
    { position: 1,  minute: 0,  duration: 2,    category: "TOH",     type: "station_id",  notes: tohNotes },
    { position: 2,  minute: 0,  duration: 4,    category: songCategories[0],  type: "song",        notes: "Opener" },
    { position: 3,  minute: 4,  duration: 4,    category: songCategories[1],  type: "song",        notes: "Second song" },
    { position: 4,  minute: 8,  duration: 0.25, category: "DJ",      type: "voice_break", notes: "DJ break 1" },
    { position: 5,  minute: 9,  duration: 4,    category: songCategories[2],  type: "song",        notes: "Post-break" },
    { position: 6,  minute: 13, duration: 4,    category: songCategories[3],  type: "song",        notes: "Pre-ad" },
    // ── Ad break 1 (~17 min): SWEEPER → AD → PROMO ──
    { position: 7,  minute: 17, duration: 1,    category: "Imaging", type: "sweeper",     notes: "Imaging voice sweeper w/ music bed" },
    { position: 8,  minute: 18, duration: 1,    category: "Sponsor", type: "ad",          notes: "Sponsor break 1" },
    { position: 9,  minute: 19, duration: 1,    category: "Promo",   type: "promo",       notes: "Station promo 1" },
    { position: 10, minute: 20, duration: 4,    category: songCategories[4],  type: "song",        notes: "Post-break song", featureSlot: 1, featuredTrack: "before" },
    { position: 11, minute: 24, duration: 0.5,  category: "Feature", type: "feature",     notes: "Artist spotlight", featureSlot: 1 },
    { position: 12, minute: 25, duration: 4,    category: songCategories[5],  type: "song",        notes: "Post-feature", featureSlot: 1, featuredTrack: "after" },
    { position: 13, minute: 29, duration: 0.25, category: "DJ",      type: "voice_break", notes: "DJ break 2" },
    { position: 14, minute: 30, duration: 4,    category: songCategories[6],  type: "song",        notes: "Mid-hour" },
    { position: 15, minute: 34, duration: 4,    category: songCategories[7],  type: "song",        notes: "Mid-hour" },
    // ── Ad break 2 (~38 min): SWEEPER → AD → PROMO ──
    { position: 16, minute: 38, duration: 1,    category: "Imaging", type: "sweeper",     notes: "Imaging voice sweeper w/ music bed" },
    { position: 17, minute: 39, duration: 1,    category: "Sponsor", type: "ad",          notes: "Sponsor break 2" },
    { position: 18, minute: 40, duration: 1,    category: "Promo",   type: "promo",       notes: "Station promo 2" },
    { position: 19, minute: 41, duration: 4,    category: songCategories[8],  type: "song",        notes: "Post-break song", featureSlot: 2, featuredTrack: "before" },
    { position: 20, minute: 45, duration: 0.5,  category: "Feature", type: "feature",     notes: "New release", featureSlot: 2 },
    { position: 21, minute: 46, duration: 4,    category: songCategories[9],  type: "song",        notes: "Post-feature", featureSlot: 2, featuredTrack: "after" },
    { position: 22, minute: 50, duration: 0.25, category: "DJ",      type: "voice_break", notes: "DJ break 3 / back-sell" },
    { position: 23, minute: 51, duration: 4,    category: songCategories[10], type: "song",        notes: "Late-hour" },
    // ── Ad break 3 (~55 min): SWEEPER → AD → PROMO ──
    { position: 24, minute: 55, duration: 1,    category: "Imaging", type: "sweeper",     notes: "Imaging voice sweeper w/ music bed" },
    { position: 25, minute: 56, duration: 1,    category: "Sponsor", type: "ad",          notes: "Sponsor break 3" },
    { position: 26, minute: 57, duration: 1,    category: "Promo",   type: "promo",       notes: "Station promo 3" },
    { position: 27, minute: 58, duration: 4,    category: songCategories[11], type: "song",        notes: "Penultimate" },
    { position: 28, minute: 59, duration: 1,    category: songCategories[12], type: "song",        notes: "Closer" },
  ];
  return pattern;
}

// ── 12 weekday clock definitions ────────────────────────────────────────

interface ClockDef {
  name: string;
  description: string;
  clockType: string;
  tempo: string;
  energyLevel: string;
  hitsPerHour: number;
  indiePerHour: number;
  genderBalanceTarget: number;
  /** 13 song categories matching the 13 song slots in buildPattern */
  songCategories: SlotCategory[];
  tohNotes: string;
}

const clockDefs: ClockDef[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // HANK WESTWOOD — Morning Drive (6am–9am)
  // ═══════════════════════════════════════════════════════════════════════

  // Hour 1 (6am) — "Morning Wake-Up"
  // Mix: 4A, 2B, 2C, 2D, 1E — hit-heavy but gentle start
  {
    name: "Morning Wake-Up",
    description: "6am opener — ease listeners in with familiar hits and warm ballads",
    clockType: "morning_wakeup",
    tempo: "moderate",
    energyLevel: "medium",
    hitsPerHour: 4,
    indiePerHour: 1,
    genderBalanceTarget: 0.45,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["A",   "D",   "B",    "A",    "C",    "A",   "B",   "D",   "C",    "A",    "E",   "A",   "A"],
    //                 A(1)   D(1)   B(1)    A(2)    C(1)    A(3)   B(2)   D(2)   C(2)    A(4)    E(1)   --     --
    // Wait — need exactly 4A, 2B, 2C, 2D, 1E = 11 songs, but we have 13 slots.
    // Total = 13 songs. Mix goal: 4A 2B 2C 2D 1E = 11. Remaining 2 pick from A/C for balance.
    // Revised: 5A, 2B, 2C, 2D, 2E = 13 (adding 1A and 1E extra to fill)
    // Actually per plan: 4A 2B 2C 2D 1E = 11 songs. 13 slots means plan mix is approximate.
    // Adjust to 13: 5A, 2B, 2C, 2D, 2E = 13
    tohNotes: "Morning TOH — imaging voice over music bed",
  },

  // Hour 2 (7am) — "Morning Drive Peak"
  // Mix: 5A, 3B, 1C, 0D, 2E — aggressive rotation, showcase indie energy
  {
    name: "Morning Drive Peak",
    description: "7am peak commute — maximum energy, all hits and fast tracks",
    clockType: "morning_drive_peak",
    tempo: "upbeat",
    energyLevel: "high",
    hitsPerHour: 5,
    indiePerHour: 2,
    genderBalanceTarget: 0.45,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["A",   "B",   "A",    "B",    "A",    "E",   "B",   "A",   "C",    "E",    "A",   "A",   "B"],
    // Tally: A=6, B=3, C=1, E=2, D=0 — close to 5A 3B 1C 0D 2E target (13 slots = +1A)
    tohNotes: "Morning TOH — imaging voice over music bed",
  },

  // Hour 3 (8am) — "Morning Wind-Down"
  // Mix: 3A, 2B, 3C, 1D, 2E — more medium/indie, showcase range
  {
    name: "Morning Wind-Down",
    description: "8am wind-down — balanced mix, variety before handoff to Loretta",
    clockType: "morning_winddown",
    tempo: "moderate",
    energyLevel: "medium",
    hitsPerHour: 3,
    indiePerHour: 2,
    genderBalanceTarget: 0.45,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["A",   "C",   "B",    "C",    "A",    "E",   "C",   "D",   "B",    "E",    "A",   "C",   "D"],
    // Tally: A=3, B=2, C=4, D=2, E=2 — close to 3A 2B 3C 1D 2E (13 slots = +1C +1D)
    tohNotes: "Morning TOH — imaging voice over music bed",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // LORETTA MERRICK — Midday Morning (9am–12pm)
  // ═══════════════════════════════════════════════════════════════════════

  // Hour 1 (9am) — "Midday Kickoff"
  // Mix: 4A, 3B, 2C, 0D, 2E — bright and energetic
  {
    name: "Midday Kickoff",
    description: "9am fresh energy — uptempo opener after handoff from Hank",
    clockType: "midday_kickoff",
    tempo: "upbeat",
    energyLevel: "high",
    hitsPerHour: 4,
    indiePerHour: 2,
    genderBalanceTarget: 0.5,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["A",   "B",   "A",    "B",    "C",    "E",   "A",   "B",   "A",    "E",    "C",   "A",   "B"],
    // Tally: A=5, B=4, C=2, D=0, E=2 — close to 4A 3B 2C 0D 2E (13 slots = +1A +1B)
    tohNotes: "Midday TOH — imaging voice over music bed",
  },

  // Hour 2 (10am) — "Midday Cruise"
  // Mix: 3A, 2B, 3C, 1D, 2E — balanced across categories
  {
    name: "Midday Cruise",
    description: "10am settled mid-morning — balanced, easy listening",
    clockType: "midday_cruise",
    tempo: "moderate",
    energyLevel: "medium",
    hitsPerHour: 3,
    indiePerHour: 2,
    genderBalanceTarget: 0.5,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["A",   "C",   "B",    "A",    "C",    "E",   "B",   "D",   "A",    "E",    "C",   "C",   "D"],
    // Tally: A=3, B=2, C=4, D=2, E=2 — close to 3A 2B 3C 1D 2E (13 slots = +1C +1D)
    tohNotes: "Midday TOH — imaging voice over music bed",
  },

  // Hour 3 (11am) — "Pre-Lunch Mellow"
  // Mix: 2A, 1B, 3C, 3D, 2E — slow/medium dominant, reflective
  {
    name: "Pre-Lunch Mellow",
    description: "11am winding toward lunch — laid-back, deeper cuts",
    clockType: "midday_mellow",
    tempo: "moderate",
    energyLevel: "low",
    hitsPerHour: 2,
    indiePerHour: 2,
    genderBalanceTarget: 0.5,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["C",   "D",   "A",    "C",    "D",    "E",   "B",   "D",   "C",    "E",    "A",   "D",   "C"],
    // Tally: A=2, B=1, C=4, D=4, E=2 — close to 2A 1B 3C 3D 2E (13 slots = +1C +1D)
    tohNotes: "Midday TOH — imaging voice over music bed",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DOC HOLLOWAY — Afternoon (12pm–3pm)
  // ═══════════════════════════════════════════════════════════════════════

  // Hour 1 (12pm) — "Lunch Hour Energy"
  // Mix: 4A, 3B, 2C, 0D, 2E — uptempo, lunch crowd
  {
    name: "Lunch Hour Energy",
    description: "12pm lunch break — energy boost with fast and familiar tracks",
    clockType: "afternoon_lunch",
    tempo: "upbeat",
    energyLevel: "high",
    hitsPerHour: 4,
    indiePerHour: 2,
    genderBalanceTarget: 0.5,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["A",   "B",   "A",    "B",    "C",    "E",   "A",   "B",   "A",    "E",    "C",   "A",   "B"],
    // Tally: A=5, B=4, C=2, D=0, E=2 — close to 4A 3B 2C 0D 2E (13 slots = +1A +1B)
    tohNotes: "Afternoon TOH — imaging voice over music bed",
  },

  // Hour 2 (1pm) — "Afternoon Groove"
  // Mix: 3A, 1B, 4C, 1D, 2E — medium-heavy, steady groove
  {
    name: "Afternoon Groove",
    description: "1pm post-lunch groove — smooth, medium tempo",
    clockType: "afternoon_groove",
    tempo: "moderate",
    energyLevel: "medium",
    hitsPerHour: 3,
    indiePerHour: 2,
    genderBalanceTarget: 0.5,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["A",   "C",   "C",    "A",    "C",    "E",   "B",   "D",   "A",    "E",    "C",   "C",   "C"],
    // Tally: A=3, B=1, C=6, D=1, E=2 — close to 3A 1B 4C 1D 2E (13 slots = +2C)
    tohNotes: "Afternoon TOH — imaging voice over music bed",
  },

  // Hour 3 (2pm) — "Deep Afternoon"
  // Mix: 2A, 1B, 2C, 3D, 3E — indie/slow heavy, discovery focus
  {
    name: "Deep Afternoon",
    description: "2pm deep dive — slower tracks, storytelling, indie gems",
    clockType: "afternoon_deep",
    tempo: "laid_back",
    energyLevel: "low",
    hitsPerHour: 2,
    indiePerHour: 3,
    genderBalanceTarget: 0.5,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["D",   "E",   "A",    "C",    "D",    "E",   "B",   "D",   "E",    "A",    "C",   "D",   "E"],
    // Tally: A=2, B=1, C=2, D=4, E=4 — close to 2A 1B 2C 3D 3E (13 slots = +1D +1E)
    tohNotes: "Afternoon TOH — imaging voice over music bed",
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CODY RAMPART — Evening Drive (3pm–6pm)
  // ═══════════════════════════════════════════════════════════════════════

  // Hour 1 (3pm) — "Drive Time Launch"
  // Mix: 5A, 3B, 1C, 0D, 2E — hit-heavy opener
  {
    name: "Drive Time Launch",
    description: "3pm commute begins — big energy, familiar hits",
    clockType: "evening_launch",
    tempo: "upbeat",
    energyLevel: "high",
    hitsPerHour: 5,
    indiePerHour: 2,
    genderBalanceTarget: 0.5,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["A",   "B",   "A",    "B",    "A",    "E",   "B",   "A",   "C",    "E",    "A",   "A",   "B"],
    // Tally: A=6, B=4, C=1, D=0, E=2 — close to 5A 3B 1C 0D 2E (13 slots = +1A +1B)
    tohNotes: "Evening TOH — imaging voice over music bed",
  },

  // Hour 2 (4pm) — "Rush Hour"
  // Mix: 4A, 3B, 2C, 0D, 2E — sustained high energy
  {
    name: "Rush Hour",
    description: "4pm peak drive time — highest energy of the day, all bangers",
    clockType: "evening_rush",
    tempo: "upbeat",
    energyLevel: "high",
    hitsPerHour: 4,
    indiePerHour: 2,
    genderBalanceTarget: 0.5,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["A",   "B",   "A",    "B",    "C",    "E",   "A",   "B",   "A",    "E",    "C",   "A",   "B"],
    // Tally: A=5, B=4, C=2, D=0, E=2 — close to 4A 3B 2C 0D 2E (13 slots = +1A +1B)
    tohNotes: "Evening TOH — imaging voice over music bed",
  },

  // Hour 3 (5pm) — "Evening Unwind"
  // Mix: 2A, 1B, 3C, 3D, 2E — mellow, more ballads/indie before night
  {
    name: "Evening Unwind",
    description: "5pm winding down — reflective, deeper tracks before automation",
    clockType: "evening_unwind",
    tempo: "moderate",
    energyLevel: "medium",
    hitsPerHour: 2,
    indiePerHour: 2,
    genderBalanceTarget: 0.5,
    //         Opener  2nd    Post-brk Pre-ad  Feat-bf Feat-af Mid    Mid    Feat-bf Post-ft Late   Penult Closer
    songCategories: ["C",   "D",   "A",    "C",    "D",    "E",   "B",   "D",   "C",    "E",    "A",   "D",   "C"],
    // Tally: A=2, B=1, C=4, D=4, E=2 — close to 2A 1B 3C 3D 2E (13 slots = +1C +1D)
    tohNotes: "Evening TOH — imaging voice over music bed",
  },
];

// ── Assignment mapping: clockType → DJ slug + hour range ────────────────

interface AssignmentDef {
  clockType: string;
  djSlug: string;
  dayType: string;
  timeSlotStart: string;
  timeSlotEnd: string;
}

const assignmentDefs: AssignmentDef[] = [
  // Hank Westwood — Morning Drive
  { clockType: "morning_wakeup",      djSlug: "hank-westwood",   dayType: "weekday", timeSlotStart: "06:00", timeSlotEnd: "07:00" },
  { clockType: "morning_drive_peak",  djSlug: "hank-westwood",   dayType: "weekday", timeSlotStart: "07:00", timeSlotEnd: "08:00" },
  { clockType: "morning_winddown",    djSlug: "hank-westwood",   dayType: "weekday", timeSlotStart: "08:00", timeSlotEnd: "09:00" },
  // Loretta Merrick — Midday Morning
  { clockType: "midday_kickoff",      djSlug: "loretta-merrick", dayType: "weekday", timeSlotStart: "09:00", timeSlotEnd: "10:00" },
  { clockType: "midday_cruise",       djSlug: "loretta-merrick", dayType: "weekday", timeSlotStart: "10:00", timeSlotEnd: "11:00" },
  { clockType: "midday_mellow",       djSlug: "loretta-merrick", dayType: "weekday", timeSlotStart: "11:00", timeSlotEnd: "12:00" },
  // Doc Holloway — Afternoon
  { clockType: "afternoon_lunch",     djSlug: "doc-holloway",    dayType: "weekday", timeSlotStart: "12:00", timeSlotEnd: "13:00" },
  { clockType: "afternoon_groove",    djSlug: "doc-holloway",    dayType: "weekday", timeSlotStart: "13:00", timeSlotEnd: "14:00" },
  { clockType: "afternoon_deep",      djSlug: "doc-holloway",    dayType: "weekday", timeSlotStart: "14:00", timeSlotEnd: "15:00" },
  // Cody Rampart — Evening Drive
  { clockType: "evening_launch",      djSlug: "cody-rampart",    dayType: "weekday", timeSlotStart: "15:00", timeSlotEnd: "16:00" },
  { clockType: "evening_rush",        djSlug: "cody-rampart",    dayType: "weekday", timeSlotStart: "16:00", timeSlotEnd: "17:00" },
  { clockType: "evening_unwind",      djSlug: "cody-rampart",    dayType: "weekday", timeSlotStart: "17:00", timeSlotEnd: "18:00" },
];

async function main() {
  console.log("=== Expanding weekday clocks (4 → 12) ===\n");

  // 1. Get station
  const station = await prisma.station.findFirst();
  if (!station) throw new Error("No station found — run seed-all-teams.ts first");
  console.log(`Station: ${station.name} (${station.id})`);

  // 2. Deactivate old weekday clock templates + any previous expanded clocks
  //    (keep only weekend + late_night active)
  const expandedTypes = clockDefs.map((d) => d.clockType);
  const oldTypes = ["morning_drive", "midday", "evening"];
  const deactivated = await prisma.clockTemplate.updateMany({
    where: {
      stationId: station.id,
      clockType: { in: [...oldTypes, ...expandedTypes] },
    },
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivated.count} old/stale weekday clock templates`);

  // 3. Delete old weekday clock assignments
  const deleted = await prisma.clockAssignment.deleteMany({
    where: {
      stationId: station.id,
      dayType: "weekday",
    },
  });
  console.log(`Deleted ${deleted.count} old weekday clock assignments`);

  // 4. Create 12 new clock templates
  const templateMap = new Map<string, string>(); // clockType → template id
  for (const def of clockDefs) {
    const pattern = buildPattern(def.songCategories, def.tohNotes);
    const template = await prisma.clockTemplate.create({
      data: {
        stationId: station.id,
        name: def.name,
        description: def.description,
        clockType: def.clockType,
        tempo: def.tempo,
        energyLevel: def.energyLevel,
        hitsPerHour: def.hitsPerHour,
        indiePerHour: def.indiePerHour,
        genderBalanceTarget: def.genderBalanceTarget,
        clockPattern: JSON.stringify(pattern),
        isActive: true,
      },
    });
    templateMap.set(def.clockType, template.id);
    console.log(`  Created clock: ${def.name} (${def.clockType})`);
  }

  // 5. Look up DJ ids
  const djSlugs = [...new Set(assignmentDefs.map((a) => a.djSlug))];
  const djs = await prisma.dJ.findMany({
    where: { slug: { in: djSlugs }, stationId: station.id },
    select: { id: true, slug: true, name: true },
  });
  const djMap = new Map(djs.map((d) => [d.slug, d]));

  for (const slug of djSlugs) {
    if (!djMap.has(slug)) throw new Error(`DJ not found: ${slug}`);
  }

  // 6. Create 12 new clock assignments (1 per hour)
  let assignCount = 0;
  for (const def of assignmentDefs) {
    const dj = djMap.get(def.djSlug)!;
    const templateId = templateMap.get(def.clockType)!;
    await prisma.clockAssignment.create({
      data: {
        stationId: station.id,
        djId: dj.id,
        clockTemplateId: templateId,
        dayType: def.dayType,
        timeSlotStart: def.timeSlotStart,
        timeSlotEnd: def.timeSlotEnd,
        isActive: true,
      },
    });
    assignCount++;
    console.log(`  Assigned ${dj.name} ${def.timeSlotStart}-${def.timeSlotEnd} → ${def.clockType}`);
  }

  // 7. Summary
  console.log(`\n=== Done ===`);
  console.log(`Created ${templateMap.size} new clock templates`);
  console.log(`Created ${assignCount} new clock assignments`);
  console.log(`Old weekday templates deactivated (not deleted)`);
  console.log(`Weekend Discovery + Late Night Road unchanged`);

  // 8. Verify
  const activeTemplates = await prisma.clockTemplate.findMany({
    where: { stationId: station.id, isActive: true },
    select: { name: true, clockType: true },
    orderBy: { clockType: "asc" },
  });
  console.log(`\nActive clock templates (${activeTemplates.length}):`);
  for (const t of activeTemplates) {
    console.log(`  ${t.clockType}: ${t.name}`);
  }

  const activeAssignments = await prisma.clockAssignment.findMany({
    where: { stationId: station.id, isActive: true, dayType: "weekday" },
    include: { dj: { select: { name: true } }, clockTemplate: { select: { name: true } } },
    orderBy: { timeSlotStart: "asc" },
  });
  console.log(`\nWeekday assignments (${activeAssignments.length}):`);
  for (const a of activeAssignments) {
    console.log(`  ${a.timeSlotStart}-${a.timeSlotEnd} ${a.dj.name} → ${a.clockTemplate.name}`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
