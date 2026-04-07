/**
 * Wipe the ElevenLabs-era GenericVoiceTrack pool and regenerate cached
 * ShowTransition audio with Gemini.
 *
 * Background: when the station ran on ElevenLabs, the daily cron substituted
 * one cached `GenericVoiceTrack` per DJ hour at the last voice break to save
 * credits. All 66 surviving generics are OpenAI/alloy — when they fired
 * during a Loretta hour the listener heard a male voice break instead of
 * Loretta. The cron has been patched to stop using the pool; this script
 * removes the data + ensures every "audio_ready" voice break really is
 * Gemini.
 *
 * Run with: npx tsx scripts/wipe-generic-voice-tracks.ts
 */
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/db";
import { stationNow } from "../src/lib/timezone";

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

async function wipeGenericPool() {
  console.log("=== GenericVoiceTrack pool ===");
  const all = await prisma.genericVoiceTrack.findMany({
    select: { id: true, audioFilePath: true, ttsProvider: true, dj: { select: { name: true } } },
  });
  console.log(`Found ${all.length} pool entries`);

  let filesRemoved = 0;
  for (const g of all) {
    if (unlinkIfExists(g.audioFilePath)) filesRemoved++;
  }
  console.log(`  files removed: ${filesRemoved}`);

  const result = await prisma.genericVoiceTrack.deleteMany({});
  console.log(`  rows deleted: ${result.count}`);
}

async function wipeShowTransitionAudio() {
  console.log("\n=== ShowTransition cached audio ===");
  const transitions = await prisma.showTransition.findMany({
    where: { audioFilePath: { not: null } },
    select: { id: true, name: true, audioFilePath: true },
  });
  console.log(`Found ${transitions.length} transitions with cached audio`);

  let filesRemoved = 0;
  for (const t of transitions) {
    if (unlinkIfExists(t.audioFilePath)) filesRemoved++;
  }
  console.log(`  files removed: ${filesRemoved}`);

  const cleared = await prisma.showTransition.updateMany({
    where: { audioFilePath: { not: null } },
    data: { audioFilePath: null },
  });
  console.log(`  audioFilePath cleared on ${cleared.count} rows`);
  console.log(`  (regenerate via POST /api/show-transitions/generate-audio-bulk)`);
}

async function refreshUpcomingVoiceTracks() {
  console.log("\n=== Today's upcoming voice tracks ===");
  const now = stationNow();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  // Find any voice tracks for hours that haven't aired yet today whose
  // ttsProvider isn't gemini OR whose audioFilePath came from the generic
  // pool (mp3 in /audio/voice-tracks/generic/).
  const suspect = await prisma.voiceTrack.findMany({
    where: {
      airDate: { gte: today, lt: tomorrow },
      OR: [
        { ttsProvider: { not: "gemini" } },
        { audioFilePath: { contains: "/voice-tracks/generic/" } },
      ],
    },
    select: { id: true, hourOfDay: true, position: true, ttsProvider: true, audioFilePath: true, hourPlaylistId: true },
  });

  // Filter to upcoming hours only (don't disturb hours already aired/aring)
  const currentHourStart = new Date(now);
  currentHourStart.setUTCMinutes(0, 0, 0);
  const upcoming = suspect.filter((vt) => vt.hourOfDay > currentHourStart.getUTCHours());

  console.log(`Suspect VTs in today's playlists: ${suspect.length}`);
  console.log(`  upcoming (will reset): ${upcoming.length}`);
  console.log(`  past/current (left alone): ${suspect.length - upcoming.length}`);

  for (const vt of upcoming) {
    if (vt.audioFilePath) unlinkIfExists(vt.audioFilePath);
  }

  if (upcoming.length > 0) {
    const ids = upcoming.map((v) => v.id);
    await prisma.voiceTrack.updateMany({
      where: { id: { in: ids } },
      data: { audioFilePath: null, audioDuration: null, status: "script_ready", ttsProvider: null, ttsVoice: null },
    });
    console.log(`  reset ${upcoming.length} upcoming voice tracks → status=script_ready`);
    console.log(`  (next playout cron run will regenerate them with Gemini)`);
  }
}

async function main() {
  await wipeGenericPool();
  await wipeShowTransitionAudio();
  await refreshUpcomingVoiceTracks();

  console.log("\n=== Final state ===");
  const remainingGen = await prisma.genericVoiceTrack.count();
  const remainingTransAudio = await prisma.showTransition.count({ where: { audioFilePath: { not: null } } });
  const todayNonGemini = await prisma.voiceTrack.count({
    where: {
      airDate: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) },
      ttsProvider: { not: "gemini" },
      AND: { ttsProvider: { not: null } },
    },
  });
  console.log(`GenericVoiceTrack rows remaining: ${remainingGen}`);
  console.log(`ShowTransitions with audio: ${remainingTransAudio}`);
  console.log(`Today's non-gemini voice tracks: ${todayNonGemini}`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
