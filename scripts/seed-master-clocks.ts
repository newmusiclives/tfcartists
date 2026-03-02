/**
 * Seed 36 master format clocks covering all 24 hours, 7 days:
 *   - 12 Weekday Daytime (6am–6pm)
 *   - 12 Overnight        (6pm–6am, all days)
 *   - 12 Weekend Daytime  (6am–6pm)
 *
 * Calls the Railway backend API directly (POST /api/clocks/templates).
 * Idempotent: skips any template whose name already exists.
 *
 * Run with: npx tsx scripts/seed-master-clocks.ts
 */

const RAILWAY_API =
  process.env.RAILWAY_BACKEND_URL ||
  "https://tfc-radio-backend-production.up.railway.app";

// ── Types ──────────────────────────────────────────────────────────────

type SongCategory = "A" | "B" | "C" | "D" | "E";

interface ClockSlot {
  position: number;
  minute: number;
  duration: number;
  category: string;
  type: string;
  notes: string;
}

interface ClockDef {
  name: string;
  description: string;
  clockType: string;
  tempo: string;
  /** 13 song categories — no adjacent duplicates */
  songCategories: SongCategory[];
}

// ── Build 28-slot pattern ──────────────────────────────────────────────
// Same skeleton as seed-expanded-clocks.ts:
//   1 TOH, 13 songs, 3 DJ voice breaks, 3 ad breaks (sweeper+sponsor+promo), 2 features

function buildPattern(songCategories: SongCategory[], tohNotes: string): ClockSlot[] {
  return [
    { position: 1,  minute: 0,  duration: 2,    category: "toh",     type: "toh",         notes: tohNotes },
    { position: 2,  minute: 0,  duration: 4,    category: songCategories[0],  type: "song", notes: "Opener" },
    { position: 3,  minute: 4,  duration: 4,    category: songCategories[1],  type: "song", notes: "Second song" },
    { position: 4,  minute: 8,  duration: 0.25, category: "dj",      type: "voice_track", notes: "DJ break 1" },
    { position: 5,  minute: 9,  duration: 4,    category: songCategories[2],  type: "song", notes: "Post-break" },
    { position: 6,  minute: 13, duration: 4,    category: songCategories[3],  type: "song", notes: "Pre-ad" },
    // Ad break 1 (~17 min)
    { position: 7,  minute: 17, duration: 1,    category: "imaging", type: "sweeper",     notes: "Imaging sweeper" },
    { position: 8,  minute: 18, duration: 1,    category: "sponsor", type: "sponsor",     notes: "Sponsor break 1" },
    { position: 9,  minute: 19, duration: 1,    category: "imaging", type: "promo",       notes: "Station promo 1" },
    { position: 10, minute: 20, duration: 4,    category: songCategories[4],  type: "song", notes: "Post-break song" },
    { position: 11, minute: 24, duration: 0.5,  category: "feature", type: "feature",     notes: "Artist spotlight" },
    { position: 12, minute: 25, duration: 4,    category: songCategories[5],  type: "song", notes: "Post-feature" },
    { position: 13, minute: 29, duration: 0.25, category: "dj",      type: "voice_track", notes: "DJ break 2" },
    { position: 14, minute: 30, duration: 4,    category: songCategories[6],  type: "song", notes: "Mid-hour" },
    { position: 15, minute: 34, duration: 4,    category: songCategories[7],  type: "song", notes: "Mid-hour" },
    // Ad break 2 (~38 min)
    { position: 16, minute: 38, duration: 1,    category: "imaging", type: "sweeper",     notes: "Imaging sweeper" },
    { position: 17, minute: 39, duration: 1,    category: "sponsor", type: "sponsor",     notes: "Sponsor break 2" },
    { position: 18, minute: 40, duration: 1,    category: "imaging", type: "promo",       notes: "Station promo 2" },
    { position: 19, minute: 41, duration: 4,    category: songCategories[8],  type: "song", notes: "Post-break song" },
    { position: 20, minute: 45, duration: 0.5,  category: "feature", type: "feature",     notes: "New release" },
    { position: 21, minute: 46, duration: 4,    category: songCategories[9],  type: "song", notes: "Post-feature" },
    { position: 22, minute: 50, duration: 0.25, category: "dj",      type: "voice_track", notes: "DJ break 3 / back-sell" },
    { position: 23, minute: 51, duration: 4,    category: songCategories[10], type: "song", notes: "Late-hour" },
    // Ad break 3 (~55 min)
    { position: 24, minute: 55, duration: 1,    category: "imaging", type: "sweeper",     notes: "Imaging sweeper" },
    { position: 25, minute: 56, duration: 1,    category: "sponsor", type: "sponsor",     notes: "Sponsor break 3" },
    { position: 26, minute: 57, duration: 1,    category: "imaging", type: "promo",       notes: "Station promo 3" },
    { position: 27, minute: 58, duration: 4,    category: songCategories[11], type: "song", notes: "Penultimate" },
    { position: 28, minute: 59, duration: 1,    category: songCategories[12], type: "song", notes: "Closer" },
  ];
}

// ── 36 Master Clock Definitions ────────────────────────────────────────
// Each songCategories array has exactly 13 entries with NO adjacent duplicates.

const masterClocks: ClockDef[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // WEEKDAY DAYTIME (6am–6pm) — max 4 A per hour
  // ═══════════════════════════════════════════════════════════════════════

  { // 6am
    name: "Weekday Early Rise",
    description: "6am — gentle start, moderate energy, balanced discovery",
    clockType: "weekday_early_rise",
    tempo: "moderate",
    songCategories: ["A", "B", "C", "D", "A", "C", "B", "D", "E", "C", "A", "E", "D"],
    // A=3 B=2 C=3 D=3 E=2
  },
  { // 7am
    name: "Weekday Morning Drive",
    description: "7am — peak commute, upbeat hits, high energy",
    clockType: "weekday_morning_drive",
    tempo: "upbeat",
    songCategories: ["A", "B", "A", "C", "B", "A", "D", "E", "B", "D", "A", "E", "C"],
    // A=4 B=3 C=2 D=2 E=2
  },
  { // 8am
    name: "Weekday Morning Cruise",
    description: "8am — moderate cruise, balanced variety",
    clockType: "weekday_morning_cruise",
    tempo: "moderate",
    songCategories: ["A", "C", "B", "A", "D", "E", "C", "B", "A", "E", "C", "D", "B"],
    // A=3 B=3 C=3 D=2 E=2
  },
  { // 9am
    name: "Weekday Mid-Morning",
    description: "9am — fresh energy, upbeat rotation",
    clockType: "weekday_mid_morning",
    tempo: "upbeat",
    songCategories: ["A", "B", "A", "C", "D", "A", "E", "C", "B", "D", "A", "E", "C"],
    // A=4 B=2 C=3 D=2 E=2
  },
  { // 10am
    name: "Weekday Late Morning",
    description: "10am — moderate settled pace, good variety",
    clockType: "weekday_late_morning",
    tempo: "moderate",
    songCategories: ["C", "D", "A", "B", "C", "D", "E", "A", "C", "D", "B", "E", "A"],
    // A=3 B=2 C=3 D=3 E=2
  },
  { // 11am
    name: "Weekday Pre-Lunch",
    description: "11am — winding toward lunch, deeper cuts",
    clockType: "weekday_pre_lunch",
    tempo: "moderate",
    songCategories: ["C", "D", "A", "C", "B", "D", "E", "C", "A", "D", "B", "E", "C"],
    // A=2 B=2 C=4 D=3 E=2
  },
  { // 12pm
    name: "Weekday Lunch Hour",
    description: "12pm — lunch energy boost, familiar hits",
    clockType: "weekday_lunch_hour",
    tempo: "upbeat",
    songCategories: ["A", "B", "A", "C", "B", "A", "D", "E", "B", "D", "A", "E", "C"],
    // A=4 B=3 C=2 D=2 E=2
  },
  { // 1pm
    name: "Weekday Early Afternoon",
    description: "1pm — smooth post-lunch groove, moderate tempo",
    clockType: "weekday_early_afternoon",
    tempo: "moderate",
    songCategories: ["A", "C", "B", "C", "A", "D", "E", "C", "B", "D", "A", "E", "C"],
    // A=3 B=2 C=4 D=2 E=2
  },
  { // 2pm
    name: "Weekday Deep Afternoon",
    description: "2pm — laid back discovery focus, slower pace",
    clockType: "weekday_deep_afternoon",
    tempo: "laid_back",
    songCategories: ["D", "E", "A", "C", "D", "B", "E", "C", "D", "A", "E", "B", "C"],
    // A=2 B=2 C=3 D=3 E=3
  },
  { // 3pm
    name: "Weekday Drive Time",
    description: "3pm — commute begins, big energy hits",
    clockType: "weekday_drive_time",
    tempo: "upbeat",
    songCategories: ["A", "B", "A", "D", "B", "A", "E", "C", "B", "D", "A", "E", "C"],
    // A=4 B=3 C=2 D=2 E=2
  },
  { // 4pm
    name: "Weekday Rush Hour",
    description: "4pm — peak drive time, sustained high energy",
    clockType: "weekday_rush_hour",
    tempo: "upbeat",
    songCategories: ["B", "A", "B", "A", "C", "E", "A", "B", "D", "A", "E", "C", "D"],
    // A=4 B=3 C=2 D=2 E=2
  },
  { // 5pm
    name: "Weekday Wind-Down",
    description: "5pm — winding down, reflective tracks before evening",
    clockType: "weekday_wind_down",
    tempo: "moderate",
    songCategories: ["D", "C", "A", "D", "B", "E", "C", "D", "A", "E", "D", "C", "B"],
    // A=2 B=2 C=3 D=4 E=2
  },

  // ═══════════════════════════════════════════════════════════════════════
  // OVERNIGHT (6pm–6am) — mellow, max 2 A, fewer B, heavy C/D/E
  // ═══════════════════════════════════════════════════════════════════════

  { // 6pm
    name: "Night Transition",
    description: "6pm — transitioning to evening, mellow start",
    clockType: "night_transition",
    tempo: "moderate",
    songCategories: ["C", "D", "B", "A", "D", "E", "C", "D", "B", "E", "D", "C", "A"],
    // A=2 B=2 C=3 D=4 E=2
  },
  { // 7pm
    name: "Early Evening",
    description: "7pm — laid back evening listening, deep rotation",
    clockType: "early_evening",
    tempo: "laid_back",
    songCategories: ["C", "D", "C", "A", "D", "E", "C", "D", "B", "E", "D", "C", "A"],
    // A=2 B=1 C=4 D=4 E=2
  },
  { // 8pm
    name: "Evening Chill",
    description: "8pm — evening chill, heavy discovery and deep cuts",
    clockType: "evening_chill",
    tempo: "laid_back",
    songCategories: ["C", "D", "E", "C", "D", "A", "E", "C", "D", "B", "E", "D", "C"],
    // A=1 B=1 C=4 D=4 E=3
  },
  { // 9pm
    name: "Night Drift",
    description: "9pm — drifting into night, deep D rotation",
    clockType: "night_drift",
    tempo: "laid_back",
    songCategories: ["D", "C", "D", "E", "C", "D", "A", "D", "C", "E", "D", "B", "C"],
    // A=1 B=1 C=4 D=5 E=2
  },
  { // 10pm
    name: "Late Night",
    description: "10pm — late night deep cuts, minimal hits",
    clockType: "late_night_10",
    tempo: "laid_back",
    songCategories: ["D", "C", "D", "E", "D", "A", "E", "D", "C", "D", "B", "E", "C"],
    // A=1 B=1 C=3 D=5 E=3
  },
  { // 11pm
    name: "Midnight Approach",
    description: "11pm — approaching midnight, deep and mellow",
    clockType: "midnight_approach",
    tempo: "laid_back",
    songCategories: ["D", "E", "C", "D", "C", "D", "A", "E", "D", "B", "D", "E", "C"],
    // A=1 B=1 C=3 D=5 E=3
  },
  { // 12am
    name: "Midnight",
    description: "12am — midnight hour, deep slow rotation",
    clockType: "midnight_hour",
    tempo: "laid_back",
    songCategories: ["C", "D", "E", "D", "C", "D", "B", "E", "D", "A", "D", "E", "C"],
    // A=1 B=1 C=3 D=5 E=3
  },
  { // 1am
    name: "Small Hours",
    description: "1am — small hours, deep and reflective",
    clockType: "small_hours",
    tempo: "laid_back",
    songCategories: ["D", "C", "D", "E", "D", "C", "D", "A", "E", "D", "B", "E", "C"],
    // A=1 B=1 C=3 D=5 E=3
  },
  { // 2am
    name: "Late Night Road",
    description: "2am — late night road, sparse and atmospheric",
    clockType: "late_night_road",
    tempo: "laid_back",
    songCategories: ["E", "D", "C", "D", "E", "D", "A", "C", "D", "B", "D", "E", "C"],
    // A=1 B=1 C=3 D=5 E=3
  },
  { // 3am
    name: "Pre-Dawn",
    description: "3am — pre-dawn calm, heavy discovery",
    clockType: "pre_dawn",
    tempo: "laid_back",
    songCategories: ["D", "E", "C", "D", "C", "A", "E", "D", "C", "B", "D", "E", "C"],
    // A=1 B=1 C=4 D=4 E=3
  },
  { // 4am
    name: "Dawn Stir",
    description: "4am — first stirring, gentle warm-up",
    clockType: "dawn_stir",
    tempo: "moderate",
    songCategories: ["D", "C", "A", "D", "C", "E", "D", "C", "B", "E", "C", "D", "A"],
    // A=2 B=1 C=4 D=4 E=2
  },
  { // 5am
    name: "Early Bird",
    description: "5am — early risers, moderate build toward morning",
    clockType: "early_bird",
    tempo: "moderate",
    songCategories: ["C", "D", "A", "B", "D", "E", "C", "D", "B", "E", "D", "C", "A"],
    // A=2 B=2 C=3 D=4 E=2
  },

  // ═══════════════════════════════════════════════════════════════════════
  // WEEKEND DAYTIME (6am–6pm) — laid back, max 3 A, less B
  // ═══════════════════════════════════════════════════════════════════════

  { // 6am
    name: "Weekend Sunrise",
    description: "6am — weekend sunrise, slow and easy",
    clockType: "weekend_sunrise",
    tempo: "moderate",
    songCategories: ["D", "C", "B", "D", "A", "E", "C", "D", "B", "E", "D", "C", "A"],
    // A=2 B=2 C=3 D=4 E=2
  },
  { // 7am
    name: "Weekend Morning",
    description: "7am — weekend morning, relaxed variety",
    clockType: "weekend_morning",
    tempo: "moderate",
    songCategories: ["A", "C", "D", "B", "A", "E", "C", "D", "A", "B", "E", "C", "D"],
    // A=3 B=2 C=3 D=3 E=2
  },
  { // 8am
    name: "Weekend Brunch",
    description: "8am — brunch vibes, easy listening",
    clockType: "weekend_brunch",
    tempo: "moderate",
    songCategories: ["C", "A", "D", "B", "C", "A", "E", "D", "C", "B", "A", "E", "D"],
    // A=3 B=2 C=3 D=3 E=2
  },
  { // 9am
    name: "Weekend Mid-Morning",
    description: "9am — weekend mid-morning, relaxed discovery",
    clockType: "weekend_mid_morning",
    tempo: "moderate",
    songCategories: ["D", "A", "C", "B", "D", "E", "A", "C", "D", "B", "A", "E", "C"],
    // A=3 B=2 C=3 D=3 E=2
  },
  { // 10am
    name: "Weekend Late Morning",
    description: "10am — weekend late morning, moderate variety",
    clockType: "weekend_late_morning",
    tempo: "moderate",
    songCategories: ["A", "C", "B", "A", "D", "E", "C", "A", "C", "D", "B", "E", "C"],
    // A=3 B=2 C=4 D=2 E=2
  },
  { // 11am
    name: "Weekend Pre-Noon",
    description: "11am — pre-noon weekend, deeper rotation",
    clockType: "weekend_pre_noon",
    tempo: "moderate",
    songCategories: ["C", "D", "A", "C", "B", "D", "E", "C", "A", "D", "B", "E", "C"],
    // A=2 B=2 C=4 D=3 E=2
  },
  { // 12pm
    name: "Weekend Noon",
    description: "12pm — weekend noon, moderate energy mix",
    clockType: "weekend_noon",
    tempo: "moderate",
    songCategories: ["B", "A", "D", "C", "A", "E", "D", "B", "A", "E", "C", "D", "C"],
    // A=3 B=2 C=3 D=3 E=2
  },
  { // 1pm
    name: "Weekend Afternoon",
    description: "1pm — weekend afternoon, easy going",
    clockType: "weekend_afternoon",
    tempo: "moderate",
    songCategories: ["A", "D", "C", "B", "A", "E", "D", "C", "A", "B", "E", "D", "C"],
    // A=3 B=2 C=3 D=3 E=2
  },
  { // 2pm
    name: "Weekend Discovery",
    description: "2pm — discovery hour, heavy indie and deep cuts",
    clockType: "weekend_discovery",
    tempo: "laid_back",
    songCategories: ["D", "E", "C", "D", "A", "E", "D", "C", "B", "E", "D", "C", "A"],
    // A=2 B=1 C=3 D=4 E=3
  },
  { // 3pm
    name: "Weekend Late Afternoon",
    description: "3pm — weekend late afternoon, relaxed mix",
    clockType: "weekend_late_afternoon",
    tempo: "moderate",
    songCategories: ["C", "A", "D", "B", "C", "E", "A", "D", "C", "B", "A", "E", "D"],
    // A=3 B=2 C=3 D=3 E=2
  },
  { // 4pm
    name: "Weekend Golden Hour",
    description: "4pm — golden hour, warm moderate mix",
    clockType: "weekend_golden_hour",
    tempo: "moderate",
    songCategories: ["A", "D", "C", "B", "A", "E", "C", "D", "A", "B", "E", "D", "C"],
    // A=3 B=2 C=3 D=3 E=2
  },
  { // 5pm
    name: "Weekend Sundown",
    description: "5pm — weekend sundown, winding into evening",
    clockType: "weekend_sundown",
    tempo: "moderate",
    songCategories: ["C", "D", "B", "A", "D", "E", "C", "D", "B", "E", "D", "C", "A"],
    // A=2 B=2 C=3 D=4 E=2
  },
];

// ── Validation ─────────────────────────────────────────────────────────

function validate(clocks: ClockDef[]): void {
  for (const c of clocks) {
    const cats = c.songCategories;
    if (cats.length !== 13) {
      throw new Error(`${c.name}: expected 13 song categories, got ${cats.length}`);
    }
    // No adjacent duplicates
    for (let i = 1; i < cats.length; i++) {
      if (cats[i] === cats[i - 1]) {
        throw new Error(`${c.name}: back-to-back ${cats[i]} at positions ${i - 1},${i}`);
      }
    }
    // Count categories
    const counts: Record<string, number> = {};
    for (const cat of cats) {
      counts[cat] = (counts[cat] || 0) + 1;
    }
    console.log(`  ${c.name}: A=${counts.A || 0} B=${counts.B || 0} C=${counts.C || 0} D=${counts.D || 0} E=${counts.E || 0}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Seeding 36 Master Format Clocks ===\n");

  // Validate all definitions first
  console.log("Validating category sequences...");
  validate(masterClocks);
  console.log(`\nAll ${masterClocks.length} clocks validated.\n`);

  // Fetch existing templates for idempotency check
  console.log("Fetching existing clock templates...");
  const listRes = await fetch(`${RAILWAY_API}/api/clocks/templates`);
  let existingNames = new Set<string>();
  if (listRes.ok) {
    const data = await listRes.json();
    const templates = data.templates || data || [];
    if (Array.isArray(templates)) {
      for (const t of templates) {
        existingNames.add(t.name);
      }
    }
    console.log(`Found ${existingNames.size} existing templates.\n`);
  } else {
    console.log(`Warning: Could not fetch existing templates (${listRes.status}). Proceeding anyway.\n`);
  }

  let created = 0;
  let skipped = 0;

  for (const def of masterClocks) {
    // Idempotency: skip if name already exists
    if (existingNames.has(def.name)) {
      console.log(`  SKIP (exists): ${def.name}`);
      skipped++;
      continue;
    }

    const pattern = buildPattern(def.songCategories, `${def.name} — TOH imaging`);

    const body = {
      name: def.name,
      description: def.description,
      clock_pattern: pattern,
      clock_type: def.clockType,
      tempo: def.tempo,
    };

    const res = await fetch(`${RAILWAY_API}/api/clocks/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const result = await res.json();
      console.log(`  CREATED: ${def.name} (${result.template_id || "ok"})`);
      created++;
    } else {
      const errText = await res.text().catch(() => "");
      console.error(`  FAILED: ${def.name} — ${res.status} ${errText}`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Total master clocks: ${masterClocks.length}`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
