/**
 * Voice Track Orchestrator
 *
 * Runs voice track generation for all of today's hours, one at a time.
 * Each hour is processed via the /api/cron/voice-tracks-hour endpoint,
 * which fits within Netlify's 30-second timeout.
 *
 * This script runs LOCALLY (no timeout) and chains the calls sequentially.
 *
 * Usage:
 *   npx tsx scripts/run-voice-tracks.ts
 *   npx tsx scripts/run-voice-tracks.ts --api-url https://truefans-radio.netlify.app
 *
 * Or run directly against the database (faster, no HTTP overhead):
 *   npx tsx scripts/run-voice-tracks.ts --direct
 */

const API_URL = process.argv.includes("--api-url")
  ? process.argv[process.argv.indexOf("--api-url") + 1]
  : process.env.NEXTAUTH_URL || "https://truefans-radio.netlify.app";

const CRON_SECRET = process.env.CRON_SECRET || "08c3568c09d6a425b66085caf92bda510e2cdc6d8ab5a1242c2304630910139b";

const DIRECT_MODE = process.argv.includes("--direct");

interface PendingHour {
  stationId: string;
  djId: string;
  djName: string;
  clockTemplateId: string;
  hourOfDay: number;
}

async function getDispatch(): Promise<PendingHour[]> {
  console.log(`\nFetching today's schedule from ${API_URL}/api/cron/voice-tracks-dispatch...\n`);

  const res = await fetch(`${API_URL}/api/cron/voice-tracks-dispatch`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dispatch failed: ${res.status} ${text.substring(0, 200)}`);
  }

  const data = await res.json();
  console.log(`Date: ${data.date}`);
  console.log(`Total hours: ${data.totalHours}`);
  console.log(`Already locked: ${data.lockedHours}`);
  console.log(`Pending: ${data.pendingHours}\n`);

  return data.pending || [];
}

async function processHourViaApi(hour: PendingHour): Promise<boolean> {
  const params = new URLSearchParams({
    stationId: hour.stationId,
    djId: hour.djId,
    clockTemplateId: hour.clockTemplateId,
    hour: String(hour.hourOfDay),
  });

  const url = `${API_URL}/api/cron/voice-tracks-hour?${params}`;
  console.log(`  Processing ${hour.djName} hour ${hour.hourOfDay}...`);

  const start = Date.now();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });

  const duration = ((Date.now() - start) / 1000).toFixed(1);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`  FAILED (${duration}s): ${res.status} ${text.substring(0, 200)}`);
    return false;
  }

  const result = await res.json();
  console.log(
    `  OK (${duration}s): playlist=${result.playlistBuilt}, scripts=${result.scriptsGenerated}, audio=${result.audioGenerated}, features=${result.featureAudioGenerated}`
  );

  if (result.errors?.length > 0) {
    for (const err of result.errors) {
      console.warn(`    WARNING: ${err}`);
    }
  }

  return result.success;
}

async function processHourDirect(hour: PendingHour): Promise<boolean> {
  // Dynamic import to load Prisma and the runner only when needed
  const { runVoiceTracksHour } = await import("../src/lib/cron/voice-tracks-hour-runner");

  console.log(`  Processing ${hour.djName} hour ${hour.hourOfDay} (direct)...`);
  const result = await runVoiceTracksHour({
    stationId: hour.stationId,
    djId: hour.djId,
    clockTemplateId: hour.clockTemplateId,
    hourOfDay: hour.hourOfDay,
  });

  console.log(
    `  ${result.success ? "OK" : "FAILED"} (${(result.durationMs / 1000).toFixed(1)}s): playlist=${result.playlistBuilt}, scripts=${result.scriptsGenerated}, audio=${result.audioGenerated}`
  );

  if (result.errors?.length > 0) {
    for (const err of result.errors) {
      console.warn(`    WARNING: ${err}`);
    }
  }

  return result.success;
}

async function getDispatchDirect(): Promise<PendingHour[]> {
  console.log(`\nFetching today's schedule directly from database...\n`);
  const { getTodaysShiftHours } = await import("../src/lib/cron/voice-tracks-hour-runner");
  const hours = await getTodaysShiftHours();
  const pending = hours.filter((h) => !h.alreadyLocked);
  const locked = hours.filter((h) => h.alreadyLocked);
  console.log(`Total hours: ${hours.length}`);
  console.log(`Already locked: ${locked.length}`);
  console.log(`Pending: ${pending.length}\n`);
  return pending;
}

async function main() {
  console.log("=== Voice Track Orchestrator ===");
  console.log(`Mode: ${DIRECT_MODE ? "direct (local DB)" : `API (${API_URL})`}`);

  const pending = DIRECT_MODE ? await getDispatchDirect() : await getDispatch();

  if (pending.length === 0) {
    console.log("All hours are already processed. Nothing to do.");
    return;
  }

  let succeeded = 0;
  let failed = 0;
  const totalStart = Date.now();

  for (const hour of pending) {
    const ok = DIRECT_MODE
      ? await processHourDirect(hour)
      : await processHourViaApi(hour);

    if (ok) succeeded++;
    else failed++;

    // Brief pause between hours to avoid overwhelming the API
    if (!DIRECT_MODE && pending.indexOf(hour) < pending.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);

  console.log("\n=== Done ===");
  console.log(`Hours processed: ${succeeded}/${pending.length}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total time: ${totalDuration}s`);
}

main().catch((e) => {
  console.error("Orchestrator error:", e);
  process.exit(1);
});
