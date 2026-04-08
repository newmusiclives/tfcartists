/**
 * Regenerate voice track scripts + audio for the upcoming hours of today.
 *
 * The patched prompt (maxTokens 600 + improved trimToCompleteSentence)
 * lives in code, but already-locked hours still reference scripts produced
 * by the old logic. This script wipes today's voice tracks for any hour
 * that hasn't aired yet and re-runs generation so the fix takes effect
 * before tomorrow's daily cron.
 *
 * Run with: npx tsx scripts/refresh-upcoming-voice-tracks.ts
 */
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/db";
import {
  generateVoiceTrackScripts,
} from "../src/lib/radio/voice-track-generator";
import { generateVoiceTrackAudio } from "../src/lib/radio/voice-track-tts";
import { stationNow, stationHour } from "../src/lib/timezone";

const PUBLIC_AUDIO = path.join(process.cwd(), "public", "audio");

function unlinkIfExists(filePath: string | null): boolean {
  if (!filePath || filePath.startsWith("data:")) return false;
  const rel = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const abs = path.join(process.cwd(), "public", rel);
  if (!abs.startsWith(PUBLIC_AUDIO)) return false;
  if (!fs.existsSync(abs)) return false;
  fs.unlinkSync(abs);
  return true;
}

async function main() {
  const now = stationNow();
  const hr = stationHour();
  console.log(`Station now: ${now.toISOString()}, hour=${hr}`);

  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  // Find upcoming hour playlists today (current hour + future)
  const upcoming = await prisma.hourPlaylist.findMany({
    where: { airDate: { gte: today, lt: tomorrow }, hourOfDay: { gte: hr } },
    select: { id: true, hourOfDay: true, status: true },
    orderBy: { hourOfDay: "asc" },
  });
  console.log(`\nUpcoming hour playlists today: ${upcoming.length}`);

  for (const p of upcoming) {
    console.log(`\n--- Hour ${p.hourOfDay} (${p.status}) ${p.id} ---`);

    // Pull existing voice tracks so we can delete files
    const existing = await prisma.voiceTrack.findMany({
      where: { hourPlaylistId: p.id },
      select: { id: true, audioFilePath: true },
    });
    let removed = 0;
    for (const vt of existing) {
      if (unlinkIfExists(vt.audioFilePath)) removed++;
    }
    await prisma.voiceTrack.deleteMany({ where: { hourPlaylistId: p.id } });
    console.log(`  cleared ${existing.length} voice tracks (${removed} files removed)`);

    // Regenerate scripts (fresh AI calls with fixed prompt + trim)
    const scripts = await generateVoiceTrackScripts(p.id);
    console.log(`  scripts: generated=${scripts.generated} errors=${scripts.errors.length}`);
    for (const e of scripts.errors) console.log(`    ! ${e}`);

    // Regenerate audio with Gemini
    const audio = await generateVoiceTrackAudio(p.id);
    console.log(`  audio:   generated=${audio.generated} errors=${audio.errors.length}`);
    for (const e of audio.errors) console.log(`    ! ${e}`);
  }

  console.log("\nDone.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
