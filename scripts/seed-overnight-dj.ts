/**
 * Seed "Overnight Automation" DJ + 3 format clocks + 12 hourly assignments.
 *
 * Creates:
 *   A. "Overnight" DJ personality (id: overnight)
 *   B. 3 clock templates: Into The Night (6pm-10pm), The Small Hours (10pm-2am),
 *      Heading To Dawn (2am-6am)
 *   C. 12 clock assignments (hours 18:00-05:00)
 *
 * Idempotent: skips DJ/templates/assignments that already exist.
 *
 * Run with: npx tsx scripts/seed-overnight-dj.ts
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

// ── Build 28-slot pattern ──────────────────────────────────────────────
// Same skeleton as seed-master-clocks.ts

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

// ── 3 Overnight Clock Definitions ────────────────────────────────────

interface OvernightClock {
  name: string;
  description: string;
  clockType: string;
  tempo: string;
  songCategories: SongCategory[];
  hours: number[]; // 24h hours this template covers
}

const overnightClocks: OvernightClock[] = [
  {
    name: "Into The Night",
    description: "6pm-10pm — evening transition, moderate pace with deep rotation",
    clockType: "overnight_evening",
    tempo: "moderate",
    songCategories: ["C", "D", "B", "A", "D", "E", "C", "D", "B", "E", "D", "C", "A"],
    // A=2 B=2 C=3 D=4 E=2
    hours: [18, 19, 20, 21],
  },
  {
    name: "The Small Hours",
    description: "10pm-2am — late night deep cuts, laid back and mellow",
    clockType: "overnight_late",
    tempo: "laid_back",
    songCategories: ["D", "C", "D", "E", "D", "A", "E", "D", "C", "D", "B", "E", "C"],
    // A=1 B=1 C=3 D=5 E=3
    hours: [22, 23, 0, 1],
  },
  {
    name: "Heading To Dawn",
    description: "2am-6am — pre-dawn calm, moderate build toward morning",
    clockType: "overnight_dawn",
    tempo: "moderate",
    songCategories: ["D", "C", "A", "D", "C", "E", "D", "C", "B", "E", "D", "C", "A"],
    // A=2 B=1 C=4 D=4 E=2
    hours: [2, 3, 4, 5],
  },
];

// ── CSRF helper ────────────────────────────────────────────────────────
// Railway backend requires CSRF token for POST/PUT/DELETE requests.

async function getCsrfToken(): Promise<{ header: string; cookie: string }> {
  const res = await fetch(`${RAILWAY_API}/api/stations/`, { redirect: "manual" });
  const csrfHeader = res.headers.get("x-csrf-token") || "";
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/csrf_token=([^;]+)/);
  return { header: csrfHeader, cookie: match ? `csrf_token=${match[1]}` : "" };
}

function csrfHeaders(csrf: { header: string; cookie: string }): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrf.header,
    Cookie: csrf.cookie,
  };
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Seeding Overnight DJ + 3 Format Clocks ===\n");

  // ── CSRF token ────────────────────────────────────────────────────
  const csrf = await getCsrfToken();
  if (!csrf.header) console.log("Warning: no CSRF token obtained\n");

  // ── Step A: Get station_id (americana) ────────────────────────────
  console.log("Fetching station list...");
  const stationsRes = await fetch(`${RAILWAY_API}/api/stations/`);
  if (!stationsRes.ok) {
    throw new Error(`Failed to fetch stations: ${stationsRes.status}`);
  }
  const stationsData = await stationsRes.json();
  const stations = stationsData.stations || stationsData || [];
  if (!Array.isArray(stations) || stations.length === 0) {
    throw new Error("No stations found");
  }
  // Pick the americana station (active), not country_gold (test)
  const station = stations.find((s: { station_code: string }) => s.station_code === "americana") || stations[0];
  const stationId = station.id;
  console.log(`Using station: ${station.station_name || station.name} (${stationId})\n`);

  // ── Step B: Create "Overnight" DJ ─────────────────────────────────
  console.log("Checking for existing Overnight DJ...");
  const djsRes = await fetch(`${RAILWAY_API}/api/clocks/djs`);
  let existingDJs: Array<{ id: string; display_name: string }> = [];
  if (djsRes.ok) {
    const djData = await djsRes.json();
    existingDJs = djData.djs || djData || [];
  }

  const overnightDJ = existingDJs.find(
    (d) => d.id.startsWith("overnight") || d.display_name === "Overnight Automation"
  );

  let djId: string;
  if (overnightDJ) {
    djId = overnightDJ.id;
    console.log(`  SKIP (exists): Overnight Automation (${djId})\n`);
  } else {
    console.log("  Creating Overnight Automation DJ...");
    // Backend expects: { id, name, style, slot? } and namespaces as {id}_{station_code}
    const djBody = {
      id: "overnight",
      name: "Overnight Automation",
      style: "Automated overnight programming — no live DJ, mellow late-night automation",
      slot: "6pm-6am daily",
    };

    const createDjRes = await fetch(
      `${RAILWAY_API}/api/stations/${stationId}/djs`,
      {
        method: "POST",
        headers: csrfHeaders(csrf),
        body: JSON.stringify(djBody),
      }
    );

    if (createDjRes.ok) {
      const result = await createDjRes.json();
      djId = result.dj_id || result.id || "overnight_americana";
      console.log(`  CREATED: Overnight Automation (${djId})\n`);
    } else {
      const errText = await createDjRes.text().catch(() => "");
      console.error(`  FAILED to create DJ: ${createDjRes.status} ${errText}`);
      djId = "overnight_americana";
      console.log(`  Proceeding with djId='${djId}'...\n`);
    }
  }

  // ── Step C: Create 3 clock templates ──────────────────────────────
  console.log("Checking existing clock templates...");
  const templatesRes = await fetch(`${RAILWAY_API}/api/clocks/templates`);
  const existingNames = new Set<string>();
  const templateIdByName = new Map<string, string>();

  if (templatesRes.ok) {
    const data = await templatesRes.json();
    const templates = data.templates || data || [];
    if (Array.isArray(templates)) {
      for (const t of templates) {
        existingNames.add(t.name);
        templateIdByName.set(t.name, t.id);
      }
    }
    console.log(`  Found ${existingNames.size} existing templates.\n`);
  }

  let createdTemplates = 0;
  let skippedTemplates = 0;

  for (const def of overnightClocks) {
    if (existingNames.has(def.name)) {
      console.log(`  SKIP (exists): ${def.name}`);
      skippedTemplates++;
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
      const templateId = result.template_id || result.id || "";
      templateIdByName.set(def.name, templateId);
      console.log(`  CREATED: ${def.name} (${templateId})`);
      createdTemplates++;
    } else {
      const errText = await res.text().catch(() => "");
      console.error(`  FAILED: ${def.name} — ${res.status} ${errText}`);
    }
  }

  console.log(`\n  Templates — created: ${createdTemplates}, skipped: ${skippedTemplates}\n`);

  // ── Step D: Create 12 clock assignments ───────────────────────────
  console.log("Creating hourly clock assignments...");

  // Fetch existing assignments to check for duplicates
  const assignRes = await fetch(`${RAILWAY_API}/api/clocks/assignments`);
  const existingAssignments: Array<{
    dj_id: string;
    time_slot_start: string;
  }> = [];
  if (assignRes.ok) {
    const aData = await assignRes.json();
    const aList = aData.assignments || aData || [];
    if (Array.isArray(aList)) {
      existingAssignments.push(...aList);
    }
  }

  // Build lookup: "djId:HH:00" → exists
  // API returns time_slot_start as "HH:00:00" — normalize to "HH:00"
  const assignmentKeys = new Set(
    existingAssignments.map((a) => {
      const t = a.time_slot_start.replace(/:00$/, ""); // "18:00:00" → "18:00"
      return `${a.dj_id}:${t}`;
    })
  );

  let createdAssignments = 0;
  let skippedAssignments = 0;

  for (const def of overnightClocks) {
    const templateId = templateIdByName.get(def.name);
    if (!templateId) {
      console.error(`  No template ID for "${def.name}" — skipping assignments`);
      continue;
    }

    for (const hour of def.hours) {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = (hour + 1) % 24;
      const endTime = `${String(endHour).padStart(2, "0")}:00`;

      const key = `${djId}:${startTime}`;
      if (assignmentKeys.has(key)) {
        console.log(`  SKIP (exists): ${djId} @ ${startTime}`);
        skippedAssignments++;
        continue;
      }

      const body = {
        dj_id: djId,
        clock_template_id: templateId,
        time_slot_start: startTime,
        time_slot_end: endTime,
        priority: 1,
        is_active: true,
      };

      const res = await fetch(`${RAILWAY_API}/api/clocks/assignments`, {
        method: "POST",
        headers: csrfHeaders(csrf),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        console.log(`  CREATED: ${startTime}–${endTime} → ${def.name}`);
        createdAssignments++;
      } else {
        const errText = await res.text().catch(() => "");
        console.error(`  FAILED: ${startTime} — ${res.status} ${errText}`);
      }
    }
  }

  console.log(`\n  Assignments — created: ${createdAssignments}, skipped: ${skippedAssignments}`);

  // ── Summary ───────────────────────────────────────────────────────
  console.log("\n=== Done ===");
  console.log(`DJ: ${overnightDJ ? "already existed" : "created"}`);
  console.log(`Templates: ${createdTemplates} created, ${skippedTemplates} skipped`);
  console.log(`Assignments: ${createdAssignments} created, ${skippedAssignments} skipped`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
