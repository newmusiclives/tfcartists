/**
 * Fix Clock Template Minute Values
 *
 * Multiple slots share the same minute (e.g., 4 slots at minute=0),
 * causing unpredictable ordering. This recalculates minutes based on
 * cumulative duration so each slot has a unique minute offset.
 *
 * Usage: npx tsx scripts/fix-clock-minutes.ts
 */

const API_URL = process.env.RAILWAY_API_URL || "https://tfc-radio-backend-production.up.railway.app";

const SLOT_DURATIONS: Record<string, number> = {
  song: 4,
  voice_track: 1,
  sponsor: 0.5,
  sweeper: 0.25,
  promo: 0.5,
  feature: 2,
  toh: 0.5,
};

interface Slot {
  type: string;
  minute: number;
  position: number;
  category?: string;
  notes?: string;
  [key: string]: any;
}

interface Template {
  id: string;
  name: string;
  clock_pattern: Slot[];
}

async function main() {
  console.log(`Fetching templates from ${API_URL}/api/clocks/templates...`);

  const res = await fetch(`${API_URL}/api/clocks/templates`);
  if (!res.ok) {
    console.error(`Failed to fetch: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const templates: Template[] = data.templates || [];
  console.log(`Found ${templates.length} templates\n`);

  for (const tpl of templates) {
    const slots = tpl.clock_pattern;
    if (!Array.isArray(slots) || slots.length === 0) {
      console.log(`  ${tpl.name}: empty pattern, skipping`);
      continue;
    }

    // Sort by existing (minute, position) to maintain intended order
    const sorted = [...slots].sort((a, b) => {
      const ma = a.minute ?? 0;
      const mb = b.minute ?? 0;
      if (ma !== mb) return ma - mb;
      return (a.position ?? 0) - (b.position ?? 0);
    });

    // Recalculate minutes based on cumulative duration
    let cumulative = 0;
    let changed = 0;
    for (let i = 0; i < sorted.length; i++) {
      const slot = sorted[i];
      const oldMinute = slot.minute;
      const duration = SLOT_DURATIONS[slot.type] ?? 1;

      slot.minute = Math.round(cumulative * 100) / 100; // avoid float drift
      slot.position = i;

      if (slot.minute !== oldMinute) changed++;
      cumulative += duration;
    }

    console.log(`  ${tpl.name}: ${sorted.length} slots, ${changed} minutes updated, total=${cumulative.toFixed(1)} min`);

    if (changed === 0) {
      console.log(`    No changes needed, skipping PATCH`);
      continue;
    }

    // PUT the template with updated clock_pattern
    const patchRes = await fetch(`${API_URL}/api/clocks/templates/${tpl.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clock_pattern: sorted }),
    });

    if (patchRes.ok) {
      console.log(`    Updated successfully`);
    } else {
      console.error(`    Update failed: ${patchRes.status} ${await patchRes.text()}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
