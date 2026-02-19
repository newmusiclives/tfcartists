import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { buildHourPlaylist } from "@/lib/radio/playlist-builder";
import { generateVoiceTrackScripts } from "@/lib/radio/voice-track-generator";
import { generateVoiceTrackAudio } from "@/lib/radio/voice-track-tts";
import { fillTemplate, djFirstName, pick, type SongData } from "@/lib/radio/template-utils";

/**
 * Voice Tracks Daily Cron
 *
 * Runs at 5:00 AM daily (after features-daily at 4 AM, before first DJ at 6 AM).
 * For each DJ shift today:
 *   1. Build HourPlaylist from clock template + song selection
 *   2. Lock the playlist
 *   3. Generate 3 voice track scripts (AI)
 *   4. Generate 3 voice track audio files (TTS)
 *   5. Re-link feature content to match actual adjacent songs
 */

interface ShiftHour {
  djId: string;
  djName: string;
  clockTemplateId: string;
  hourOfDay: number;
}

export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === "development";

    // Verify cron secret (skip in development)
    if (!isDev) {
      const authHeader = req.headers.get("authorization");
      const cronSecret = env.CRON_SECRET;
      if (!cronSecret) {
        logger.error("CRON_SECRET not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
      }
      if (authHeader !== `Bearer ${cronSecret}`) {
        logger.warn("Unauthorized cron attempt", { path: "/api/cron/voice-tracks-daily" });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    logger.info("Starting voice-tracks-daily cron");

    // 1. Get station
    const station = await prisma.station.findFirst();
    if (!station) {
      return NextResponse.json({ error: "No station found" }, { status: 404 });
    }

    // 2. Determine today's day type
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
    const dayType = dayOfWeek === 0 ? "sunday" : dayOfWeek === 6 ? "saturday" : "weekday";

    // 3. Get all active clock assignments for today
    const assignments = await prisma.clockAssignment.findMany({
      where: {
        stationId: station.id,
        isActive: true,
        dayType: { in: [dayType, "all"] },
      },
      include: {
        dj: { select: { id: true, name: true, isActive: true } },
        clockTemplate: { select: { id: true, name: true, clockPattern: true } },
      },
      orderBy: { timeSlotStart: "asc" },
    });

    if (assignments.length === 0) {
      logger.info("No clock assignments found for today", { dayType });
      return NextResponse.json({
        success: true,
        message: "No assignments for today",
        dayType,
      });
    }

    // 4. Expand assignments into individual hours
    const shiftHours: ShiftHour[] = [];
    for (const assignment of assignments) {
      if (!assignment.dj?.isActive || !assignment.clockTemplate?.clockPattern) continue;

      const startHour = parseInt(assignment.timeSlotStart.split(":")[0], 10);
      const endHour = parseInt(assignment.timeSlotEnd.split(":")[0], 10);

      for (let hour = startHour; hour < endHour; hour++) {
        shiftHours.push({
          djId: assignment.djId,
          djName: assignment.dj.name,
          clockTemplateId: assignment.clockTemplateId,
          hourOfDay: hour,
        });
      }
    }

    logger.info(`Processing ${shiftHours.length} hours across ${assignments.length} shifts`);

    // 5. Process each hour
    const results = {
      hoursProcessed: 0,
      playlistsBuilt: 0,
      scriptsGenerated: 0,
      audioGenerated: 0,
      genericTracksUsed: 0,
      featuresRelinked: 0,
      errors: [] as string[],
    };

    for (const shift of shiftHours) {
      try {
        // 5a. Build playlist
        const playlist = await buildHourPlaylist({
          stationId: station.id,
          djId: shift.djId,
          clockTemplateId: shift.clockTemplateId,
          airDate: today,
          hourOfDay: shift.hourOfDay,
        });
        results.playlistsBuilt++;

        // 5b. Lock the playlist
        await prisma.hourPlaylist.update({
          where: { id: playlist.hourPlaylistId },
          data: { status: "locked" },
        });

        // 5c. Find the last voice break in the clock and try to replace it with a generic track
        const lastVbPos = findLastVoiceBreakPosition(playlist.slots);
        let genericSkipPositions: number[] = [];
        if (lastVbPos !== null) {
          const genericTrack = await pickGenericTrack(shift.djId, station.id);
          if (genericTrack) {
            const lastVbSlot = playlist.slots.find(
              (s: { position: number }) => s.position === lastVbPos
            );
            await prisma.voiceTrack.create({
              data: {
                stationId: station.id,
                djId: shift.djId,
                hourPlaylistId: playlist.hourPlaylistId,
                position: lastVbPos,
                trackType: "generic",
                scriptText: genericTrack.scriptText,
                audioFilePath: genericTrack.audioFilePath,
                audioDuration: genericTrack.audioDuration,
                ttsVoice: genericTrack.ttsVoice,
                ttsProvider: genericTrack.ttsProvider,
                status: "audio_ready",
                airDate: today,
                hourOfDay: shift.hourOfDay,
                minuteOfHour: lastVbSlot?.minute ?? 47,
              },
            });

            await prisma.genericVoiceTrack.update({
              where: { id: genericTrack.id },
              data: {
                useCount: { increment: 1 },
                lastUsedAt: new Date(),
              },
            });

            genericSkipPositions = [lastVbPos];
            results.genericTracksUsed++;
          }
        }

        // 5d. Generate voice track scripts (skip last VB position if generic was used)
        const scripts = await generateVoiceTrackScripts(
          playlist.hourPlaylistId,
          genericSkipPositions.length > 0 ? { skipPositions: genericSkipPositions } : undefined,
        );
        results.scriptsGenerated += scripts.generated;
        if (scripts.errors.length > 0) {
          results.errors.push(...scripts.errors.map((e) => `[${shift.djName} H${shift.hourOfDay}] ${e}`));
        }

        // 5e. Generate voice track audio (skips tracks already at audio_ready)
        const audio = await generateVoiceTrackAudio(playlist.hourPlaylistId);
        results.audioGenerated += audio.generated;
        if (audio.errors.length > 0) {
          results.errors.push(...audio.errors.map((e) => `[${shift.djName} H${shift.hourOfDay}] ${e}`));
        }

        // 5f. Re-link feature content to actual adjacent songs
        const relinked = await relinkFeatures(station.id, shift.djId, playlist.hourPlaylistId, playlist.slots);
        results.featuresRelinked += relinked;

        results.hoursProcessed++;
      } catch (err) {
        const msg = `[${shift.djName} H${shift.hourOfDay}] ${err instanceof Error ? err.message : String(err)}`;
        logger.error("Hour processing failed", { error: msg });
        results.errors.push(msg);
      }
    }

    logger.info("Voice-tracks-daily cron completed", results);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Voice-tracks-daily cron failed", { error });
    return NextResponse.json(
      {
        error: "Voice tracks daily cron failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Re-link feature content slots to match the actual adjacent songs in the playlist.
 * This fixes the root cause: features were generated with random songs, not the real playlist order.
 */
async function relinkFeatures(
  stationId: string,
  djId: string,
  hourPlaylistId: string,
  slots: Array<{
    position: number;
    type: string;
    category: string;
    songId?: string;
    songTitle?: string;
    artistName?: string;
    featureContentId?: string;
    featureSlot?: number;
    featuredTrack?: string;
  }>,
): Promise<number> {
  let relinked = 0;

  const featureSlots = slots.filter((s) => s.type === "feature");

  for (const fSlot of featureSlots) {
    // Find the adjacent song based on track placement
    let adjacentSong: { songId: string; songTitle: string; artistName: string } | null = null;

    if (fSlot.featuredTrack === "before") {
      // Feature plays before the song — find next song
      const maxPos = Math.max(...slots.map((s) => s.position));
      for (let i = fSlot.position + 1; i <= maxPos; i++) {
        const slot = slots.find((s) => s.position === i);
        if (slot?.type === "song" && slot.songId && slot.songTitle && slot.artistName) {
          adjacentSong = { songId: slot.songId, songTitle: slot.songTitle, artistName: slot.artistName };
          break;
        }
      }
    } else if (fSlot.featuredTrack === "after") {
      // Feature plays after the song — find prev song
      for (let i = fSlot.position - 1; i >= 0; i--) {
        const slot = slots.find((s) => s.position === i);
        if (slot?.type === "song" && slot.songId && slot.songTitle && slot.artistName) {
          adjacentSong = { songId: slot.songId, songTitle: slot.songTitle, artistName: slot.artistName };
          break;
        }
      }
    }

    if (!adjacentSong) continue;

    // Find an unused feature content item for this DJ and re-generate with correct song
    const featureContent = await prisma.featureContent.findFirst({
      where: {
        stationId,
        djPersonalityId: djId,
        isUsed: false,
      },
      include: { featureType: true },
      orderBy: { createdAt: "desc" },
    });

    if (!featureContent || !featureContent.featureType.gptPromptTemplate) continue;

    // Get DJ name for template
    const dj = await prisma.dJ.findUnique({
      where: { id: djId },
      select: { name: true },
    });
    if (!dj) continue;

    // Get full song data
    const song = await prisma.song.findUnique({
      where: { id: adjacentSong.songId },
      select: { id: true, title: true, artistName: true, genre: true, album: true },
    });

    const songData: SongData | undefined = song
      ? { id: song.id, artistName: song.artistName, title: song.title, genre: song.genre, album: song.album }
      : undefined;

    // Re-generate content with correct song
    const newContent = fillTemplate(
      featureContent.featureType.gptPromptTemplate,
      djFirstName(dj.name),
      songData,
    );

    await prisma.featureContent.update({
      where: { id: featureContent.id },
      data: {
        content: newContent,
        relatedSongId: adjacentSong.songId,
        contextData: JSON.stringify({
          artistName: adjacentSong.artistName,
          songTitle: adjacentSong.songTitle,
        }),
      },
    });

    // Update the slot to reference this feature content
    const slotIdx = slots.findIndex((s) => s.position === fSlot.position);
    if (slotIdx >= 0) {
      slots[slotIdx].featureContentId = featureContent.id;
    }

    relinked++;
  }

  // Update the playlist slots with feature content IDs
  if (relinked > 0) {
    await prisma.hourPlaylist.update({
      where: { id: hourPlaylistId },
      data: { slots: JSON.stringify(slots) },
    });
  }

  return relinked;
}

/**
 * Find the last voice_break position in the playlist slots.
 * This is the slot that gets replaced by a generic track.
 */
function findLastVoiceBreakPosition(
  slots: Array<{ position: number; type: string; minute?: number }>,
): number | null {
  const vbSlots = slots
    .filter((s) => s.type === "voice_break")
    .sort((a, b) => b.position - a.position);
  return vbSlots.length > 0 ? vbSlots[0].position : null;
}

/**
 * Pick the least-used active generic voice track for a DJ.
 * Returns null if no generic tracks exist (fallback to full AI generation).
 */
async function pickGenericTrack(djId: string, stationId: string) {
  const track = await prisma.genericVoiceTrack.findFirst({
    where: {
      djId,
      stationId,
      isActive: true,
      audioFilePath: { not: null },
    },
    orderBy: [
      { useCount: "asc" },
      { lastUsedAt: "asc" },
    ],
  });

  return track;
}
