/**
 * Delete historical non-Gemini VoiceTrack rows + their audio files.
 *
 * Safety guarantees:
 *   - Only deletes voice tracks whose ttsProvider is something other than
 *     "gemini" (i.e. "openai" / "elevenlabs" leftovers from before the
 *     April 2026 migration).
 *   - Only deletes voice tracks whose parent HourPlaylist's slot has
 *     already aired. Anything in the current or upcoming hour is left
 *     alone so we can't break live playout.
 *   - Skips data: URIs (nothing to delete on disk).
 *
 * Run with: npx tsx scripts/cleanup-old-voice-tracks.ts
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

async function main() {
  const now = stationNow();
  console.log("Station now:", now.toISOString());

  // Pull all non-Gemini voice tracks with their parent hour info
  const candidates = await prisma.voiceTrack.findMany({
    where: {
      ttsProvider: { not: null },
      AND: { ttsProvider: { not: "gemini" } },
    },
    select: {
      id: true,
      audioFilePath: true,
      ttsProvider: true,
      hourPlaylistId: true,
      hourPlaylist: { select: { airDate: true, hourOfDay: true } },
    },
  });
  console.log(`Candidates (non-gemini): ${candidates.length}`);

  // Bucket: past (safe), current/future (skip)
  const pastIds: string[] = [];
  const skipped: { id: string; reason: string }[] = [];
  for (const vt of candidates) {
    if (!vt.hourPlaylist) {
      // Orphaned — no parent. Treat as safe to delete (can't air).
      pastIds.push(vt.id);
      continue;
    }
    const slot = new Date(vt.hourPlaylist.airDate);
    slot.setUTCHours(vt.hourPlaylist.hourOfDay, 0, 0, 0);
    const slotEnd = new Date(slot.getTime() + 3600_000);
    if (slotEnd <= now) {
      pastIds.push(vt.id);
    } else {
      skipped.push({ id: vt.id, reason: `airs at ${slot.toISOString()}` });
    }
  }

  console.log(`  past (deleting):    ${pastIds.length}`);
  console.log(`  current/future (skipping): ${skipped.length}`);
  if (skipped.length > 0) {
    console.log("  (first 5 skipped):", skipped.slice(0, 5));
  }

  // Delete files first
  let filesRemoved = 0;
  let filesAlreadyGone = 0;
  let dataUrisSkipped = 0;
  for (const vt of candidates.filter((c) => pastIds.includes(c.id))) {
    if (!vt.audioFilePath) continue;
    if (vt.audioFilePath.startsWith("data:")) {
      dataUrisSkipped++;
      continue;
    }
    if (unlinkIfExists(vt.audioFilePath)) filesRemoved++;
    else filesAlreadyGone++;
  }
  console.log(`\nFiles removed from disk:   ${filesRemoved}`);
  console.log(`Files already missing:     ${filesAlreadyGone}`);
  console.log(`Data URIs (no file to rm): ${dataUrisSkipped}`);

  // Delete DB rows
  const result = await prisma.voiceTrack.deleteMany({
    where: { id: { in: pastIds } },
  });
  console.log(`\nVoiceTrack rows deleted: ${result.count}`);

  // Final verification
  const remaining = await prisma.voiceTrack.count({
    where: {
      ttsProvider: { not: null },
      AND: { ttsProvider: { not: "gemini" } },
    },
  });
  console.log(`\nNon-gemini voice tracks remaining: ${remaining}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
