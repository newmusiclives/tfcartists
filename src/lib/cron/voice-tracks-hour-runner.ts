import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { buildHourPlaylist } from "@/lib/radio/playlist-builder";
import { generateVoiceTrackScripts } from "@/lib/radio/voice-track-generator";
import { generateVoiceTrackAudio, generateFeatureAudio } from "@/lib/radio/voice-track-tts";
import { stationToday, stationDayType } from "@/lib/timezone";

export interface HourResult {
  success: boolean;
  djName: string;
  hourOfDay: number;
  playlistBuilt: boolean;
  scriptsGenerated: number;
  audioGenerated: number;
  featuresRelinked: number;
  featureAudioGenerated: number;
  errors: string[];
  durationMs: number;
}

/**
 * Process a SINGLE hour of voice track generation.
 * Designed to complete within Netlify's 30-second timeout by handling
 * only one hour at a time instead of an entire day.
 *
 * Steps for each hour:
 *   1. Build HourPlaylist from clock template
 *   2. Lock the playlist
 *   3. Generate voice track scripts (AI)
 *   4. Generate voice track audio (TTS)
 *   5. Re-link features + generate feature audio
 */
export async function runVoiceTracksHour(params: {
  stationId: string;
  djId: string;
  clockTemplateId: string;
  hourOfDay: number;
  airDate?: Date;
  excludeSongIds?: Set<string>;
}): Promise<HourResult> {
  const start = Date.now();
  const { stationId, djId, clockTemplateId, hourOfDay, excludeSongIds } = params;
  const airDate = params.airDate || stationToday();

  const dj = await prisma.dJ.findUnique({
    where: { id: djId },
    select: { name: true },
  });
  const djName = dj?.name || djId;

  const result: HourResult = {
    success: false,
    djName,
    hourOfDay,
    playlistBuilt: false,
    scriptsGenerated: 0,
    audioGenerated: 0,
    featuresRelinked: 0,
    featureAudioGenerated: 0,
    errors: [],
    durationMs: 0,
  };

  try {
    // Check if a locked playlist already exists — don't overwrite it
    const normalizedDate = new Date(airDate);
    normalizedDate.setHours(0, 0, 0, 0);
    const existingLocked = await prisma.hourPlaylist.findFirst({
      where: {
        stationId,
        djId,
        airDate: normalizedDate,
        hourOfDay,
        status: { in: ["locked", "aired"] },
      },
    });

    let playlistId: string;

    if (existingLocked) {
      // Already locked — skip rebuild, just ensure voice tracks + audio exist
      playlistId = existingLocked.id;
      result.playlistBuilt = true;
    } else {
      // 1. Build playlist
      const playlist = await buildHourPlaylist({
        stationId,
        djId,
        clockTemplateId,
        airDate,
        hourOfDay,
        excludeSongIds,
      });
      playlistId = playlist.hourPlaylistId;
      result.playlistBuilt = true;

      // 2. Lock the playlist
      await prisma.hourPlaylist.update({
        where: { id: playlistId },
        data: { status: "locked" },
      });
    }

    // 3. Generate voice track scripts
    const scripts = await generateVoiceTrackScripts(playlistId);
    result.scriptsGenerated = scripts.generated;
    if (scripts.errors.length > 0) {
      result.errors.push(...scripts.errors);
    }

    // 4. Generate voice track audio
    const audio = await generateVoiceTrackAudio(playlistId);
    result.audioGenerated = audio.generated;
    if (audio.errors.length > 0) {
      result.errors.push(...audio.errors);
    }

    // 5. Generate feature audio (features were linked during daily cron)
    const featureAudio = await generateFeatureAudio(
      playlistId,
      stationId,
      djId,
    );
    result.featureAudioGenerated = featureAudio.generated;
    if (featureAudio.errors.length > 0) {
      result.errors.push(...featureAudio.errors);
    }

    result.success = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Hour ${hourOfDay} processing failed for ${djName}`, { error: msg });
    result.errors.push(msg);
  }

  result.durationMs = Date.now() - start;
  return result;
}

/**
 * Get today's shift hours that need processing.
 * Returns the list of hours with DJ and clock template info.
 */
export async function getTodaysShiftHours(): Promise<Array<{
  djId: string;
  djName: string;
  clockTemplateId: string;
  hourOfDay: number;
  stationId: string;
  alreadyLocked: boolean;
}>> {
  const station = await prisma.station.findFirst({
    where: { isActive: true, deletedAt: null },
  });
  if (!station) return [];

  const today = stationToday();
  const dayType = stationDayType();

  const assignments = await prisma.clockAssignment.findMany({
    where: {
      stationId: station.id,
      isActive: true,
      dayType: { in: [dayType, "all"] },
    },
    include: {
      dj: { select: { id: true, name: true, isActive: true } },
      clockTemplate: { select: { id: true } },
    },
    orderBy: { timeSlotStart: "asc" },
  });

  // Check which hours already have locked playlists
  const existingPlaylists = await prisma.hourPlaylist.findMany({
    where: {
      stationId: station.id,
      airDate: today,
      status: { in: ["locked", "aired"] },
    },
    select: { hourOfDay: true, djId: true },
  });
  const lockedKey = (djId: string, hour: number) => `${djId}:${hour}`;
  const lockedSet = new Set(existingPlaylists.map((p) => lockedKey(p.djId, p.hourOfDay)));

  const hours: Array<{
    djId: string;
    djName: string;
    clockTemplateId: string;
    hourOfDay: number;
    stationId: string;
    alreadyLocked: boolean;
  }> = [];

  for (const assignment of assignments) {
    if (!assignment.dj?.isActive) continue;

    const startHour = parseInt(assignment.timeSlotStart.split(":")[0], 10);
    const endHour = parseInt(assignment.timeSlotEnd.split(":")[0], 10);

    for (let hour = startHour; hour < endHour; hour++) {
      hours.push({
        djId: assignment.djId,
        djName: assignment.dj.name,
        clockTemplateId: assignment.clockTemplateId,
        hourOfDay: hour,
        stationId: station.id,
        alreadyLocked: lockedSet.has(lockedKey(assignment.djId, hour)),
      });
    }
  }

  return hours;
}
