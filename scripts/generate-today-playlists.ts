/**
 * Generate Today's Playlists
 *
 * Builds and locks HourPlaylists for all DJ shifts today.
 * Generates voice track scripts, TTS audio, and links features.
 *
 * This is the same logic as the daily cron, packaged as a CLI command.
 *
 * Usage:
 *   npm run generate-playlists           # Generate for today
 *   npx tsx scripts/generate-today-playlists.ts --date 2026-03-16  # Specific date
 *   npx tsx scripts/generate-today-playlists.ts --playlists-only   # Skip voice/feature TTS
 */

import { PrismaClient } from "@prisma/client";
import { runVoiceTracksDaily } from "../src/lib/cron/voice-tracks-daily-runner";
import { buildHourPlaylist } from "../src/lib/radio/playlist-builder";
import { stationToday, stationDayType } from "../src/lib/timezone";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const playlistsOnly = args.includes("--playlists-only");
const dateArg = args.find(a => a.startsWith("--date="))?.split("=")[1]
  || (args.indexOf("--date") >= 0 ? args[args.indexOf("--date") + 1] : null);

async function main() {
  const station = await prisma.station.findFirst({ where: { isActive: true } });
  if (!station) {
    console.error("No active station found.");
    process.exit(1);
  }

  const today = dateArg ? new Date(dateArg + "T00:00:00") : stationToday();
  const dayType = stationDayType();

  console.log(`\nStation: ${station.name}`);
  console.log(`Date: ${today.toISOString().split("T")[0]}`);
  console.log(`Day type: ${dayType}`);
  console.log(`Mode: ${playlistsOnly ? "Playlists only (no TTS)" : "Full generation (playlists + voice tracks + features)"}\n`);

  if (playlistsOnly) {
    // Fast mode — just build and lock playlists, skip AI/TTS
    const assignments = await prisma.clockAssignment.findMany({
      where: {
        stationId: station.id,
        isActive: true,
        dayType: { in: [dayType, "all"] },
      },
      include: {
        dj: { select: { id: true, name: true, isActive: true } },
        clockTemplate: { select: { id: true, name: true } },
      },
      orderBy: { timeSlotStart: "asc" },
    });

    const djUsedSongs = new Map<string, Set<string>>();
    let built = 0;

    for (const assignment of assignments) {
      if (!assignment.dj?.isActive) continue;

      const startHour = parseInt(assignment.timeSlotStart.split(":")[0], 10);
      const endHour = parseInt(assignment.timeSlotEnd.split(":")[0], 10);

      if (!djUsedSongs.has(assignment.djId)) {
        djUsedSongs.set(assignment.djId, new Set<string>());
      }
      const excludeSongIds = djUsedSongs.get(assignment.djId)!;

      for (let hour = startHour; hour < endHour; hour++) {
        // Check if already locked
        const existing = await prisma.hourPlaylist.findFirst({
          where: {
            stationId: station.id,
            djId: assignment.djId,
            airDate: today,
            hourOfDay: hour,
            status: { in: ["locked", "aired"] },
          },
        });
        if (existing) {
          console.log(`  Hour ${hour} — ${assignment.dj.name} — already locked`);
          continue;
        }

        const playlist = await buildHourPlaylist({
          stationId: station.id,
          djId: assignment.djId,
          clockTemplateId: assignment.clockTemplateId,
          airDate: today,
          hourOfDay: hour,
          excludeSongIds,
        });

        for (const slot of playlist.slots) {
          if (slot.songId) excludeSongIds.add(slot.songId);
        }

        await prisma.hourPlaylist.update({
          where: { id: playlist.hourPlaylistId },
          data: { status: "locked" },
        });

        console.log(`  Hour ${hour} — ${assignment.dj.name} → ${assignment.clockTemplate?.name} — ${playlist.songsAssigned} songs locked`);
        built++;
      }
    }

    console.log(`\nDone — ${built} playlists built and locked.`);
  } else {
    // Full mode — same as daily cron (playlists + voice scripts + TTS + features)
    console.log("Running full daily generation (this may take several minutes)...\n");
    const result = await runVoiceTracksDaily();

    console.log(`\nResults:`);
    console.log(`  Hours processed: ${result.hoursProcessed}`);
    console.log(`  Playlists built: ${result.playlistsBuilt}`);
    console.log(`  Voice scripts: ${result.scriptsGenerated}`);
    console.log(`  Voice audio: ${result.audioGenerated}`);
    console.log(`  Generic tracks: ${result.genericTracksUsed}`);
    console.log(`  Features relinked: ${result.featuresRelinked}`);
    console.log(`  Feature audio: ${result.featureAudioGenerated}`);
    if (result.errors.length > 0) {
      console.log(`  Errors (${result.errors.length}):`);
      for (const err of result.errors) {
        console.log(`    - ${err}`);
      }
    }
    console.log(`  Success: ${result.success}`);
  }
}

main()
  .catch((err) => {
    console.error("Failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
