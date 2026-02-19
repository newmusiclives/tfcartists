/**
 * Voice Track Script Generator — generates AI DJ scripts for voice breaks
 * that correctly reference the prev/next songs in the actual playlist.
 *
 * Voice break positions and trackTypes are derived from the actual clock
 * pattern slots — NOT hardcoded — so they work with any clock template.
 */

import { prisma } from "@/lib/db";
import { aiProvider } from "@/lib/ai/providers";
import { logger } from "@/lib/logger";

interface ResolvedSlot {
  position: number;
  minute: number;
  type: string;
  category: string;
  notes?: string;
  songId?: string;
  songTitle?: string;
  artistName?: string;
}

interface GenerateVoiceTracksResult {
  generated: number;
  errors: string[];
}

/**
 * Scan the playlist slots to find all voice_break positions and determine
 * the correct trackType for each based on the immediately adjacent slots.
 *
 * trackType logic:
 *   - If the slot immediately BEFORE the VB is a song → always forward-intro
 *     (the listener just heard the song; the DJ should introduce what's NEXT)
 *   - If there's a non-song slot (feature, ad, sweeper) between the previous
 *     song and the VB → intro (the flow was broken; don't back-announce)
 *   - Fallback: intro if a next song exists, otherwise generic personality moment
 */
function discoverVoiceBreaks(slots: ResolvedSlot[]): {
  position: number;
  trackType: string;
  approxMinute: number;
}[] {
  const breaks: { position: number; trackType: string; approxMinute: number }[] = [];

  for (const slot of slots) {
    if (slot.type !== "voice_break") continue;

    const nextSong = findNextSong(slots, slot.position);
    const immediatePrev = slots.find((s) => s.position === slot.position - 1);
    const prevIsSong = immediatePrev?.type === "song" && !!immediatePrev.songId;

    let trackType: string;

    if (prevIsSong && nextSong) {
      // Song right before AND song ahead → back-announce + intro
      trackType = "back_announce_intro";
    } else if (nextSong) {
      // No immediate song before (feature/ad/sweeper gap) → just intro the next song
      trackType = "intro";
    } else if (prevIsSong) {
      // Song right before, nothing ahead → back-announce only
      trackType = "back_announce";
    } else {
      // No adjacent songs at all → generic personality moment
      trackType = "generic";
    }

    breaks.push({
      position: slot.position,
      trackType,
      approxMinute: slot.minute,
    });
  }

  return breaks;
}

/**
 * Generate voice track scripts for all voice breaks in an HourPlaylist.
 */
export async function generateVoiceTrackScripts(
  hourPlaylistId: string,
  options?: { skipPositions?: number[] },
): Promise<GenerateVoiceTracksResult> {
  const playlist = await prisma.hourPlaylist.findUnique({
    where: { id: hourPlaylistId },
  });
  if (!playlist) {
    throw new Error(`HourPlaylist ${hourPlaylistId} not found`);
  }

  // Load DJ persona
  const dj = await prisma.dJ.findUnique({
    where: { id: playlist.djId },
  });
  if (!dj) {
    throw new Error(`DJ ${playlist.djId} not found`);
  }

  const slots: ResolvedSlot[] = JSON.parse(playlist.slots);
  let generated = 0;
  const errors: string[] = [];

  const skipPositions = options?.skipPositions || [];

  // Discover voice break positions and types from the actual clock pattern
  const voiceBreaks = discoverVoiceBreaks(slots);

  for (const vb of voiceBreaks) {
    try {
      // Skip positions that will use generic tracks
      if (skipPositions.includes(vb.position)) {
        continue;
      }

      // Find prev and next songs relative to this voice break's ACTUAL position
      const prevSong = findPrevSong(slots, vb.position);
      const nextSong = findNextSong(slots, vb.position);

      // Build the AI prompt
      const systemPrompt = buildSystemPrompt(dj);
      const userPrompt = buildUserPrompt(
        vb.trackType,
        dj.name.split(" ")[0] || dj.name,
        prevSong,
        nextSong,
        playlist.hourOfDay,
      );

      // Generate script via AI
      const response = await aiProvider.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          maxTokens: 200,
          temperature: dj.gptTemperature || 0.8,
        }
      );

      // Upsert voice track record
      const existingVt = await prisma.voiceTrack.findFirst({
        where: {
          hourPlaylistId,
          position: vb.position,
        },
      });

      const vtData = {
        stationId: playlist.stationId,
        djId: playlist.djId,
        hourPlaylistId,
        position: vb.position,
        trackType: vb.trackType,
        prevSongId: prevSong?.songId || null,
        prevSongTitle: prevSong?.songTitle || null,
        prevArtistName: prevSong?.artistName || null,
        nextSongId: nextSong?.songId || null,
        nextSongTitle: nextSong?.songTitle || null,
        nextArtistName: nextSong?.artistName || null,
        scriptText: response.content.trim(),
        status: "script_ready",
        airDate: playlist.airDate,
        hourOfDay: playlist.hourOfDay,
        minuteOfHour: vb.approxMinute,
      };

      if (existingVt) {
        await prisma.voiceTrack.update({
          where: { id: existingVt.id },
          data: vtData,
        });
      } else {
        await prisma.voiceTrack.create({ data: vtData });
      }

      generated++;
    } catch (err) {
      const msg = `VT position ${vb.position}: ${err instanceof Error ? err.message : String(err)}`;
      logger.error("Voice track script generation failed", { error: msg, hourPlaylistId });
      errors.push(msg);
    }
  }

  return { generated, errors };
}

function findPrevSong(
  slots: ResolvedSlot[],
  position: number,
): { songId: string; songTitle: string; artistName: string } | null {
  // Walk backwards from position to find the most recent song slot
  for (let i = position - 1; i >= 0; i--) {
    const slot = slots.find((s) => s.position === i);
    if (slot?.type === "song" && slot.songId && slot.songTitle && slot.artistName) {
      return {
        songId: slot.songId,
        songTitle: slot.songTitle,
        artistName: slot.artistName,
      };
    }
  }
  return null;
}

function findNextSong(
  slots: ResolvedSlot[],
  position: number,
): { songId: string; songTitle: string; artistName: string } | null {
  // Walk forwards from position to find the next song slot
  const maxPos = Math.max(...slots.map((s) => s.position));
  for (let i = position + 1; i <= maxPos; i++) {
    const slot = slots.find((s) => s.position === i);
    if (slot?.type === "song" && slot.songId && slot.songTitle && slot.artistName) {
      return {
        songId: slot.songId,
        songTitle: slot.songTitle,
        artistName: slot.artistName,
      };
    }
  }
  return null;
}

export function buildSystemPrompt(dj: {
  name: string;
  gptSystemPrompt: string | null;
  catchPhrases: string | null;
  additionalKnowledge: string | null;
  bio: string;
}): string {
  if (dj.gptSystemPrompt) {
    let prompt = dj.gptSystemPrompt;
    if (dj.catchPhrases) {
      prompt += `\n\nYour signature phrases (use occasionally, not every time): ${dj.catchPhrases}`;
    }
    if (dj.additionalKnowledge) {
      prompt += `\n\nAdditional context: ${dj.additionalKnowledge}`;
    }
    return prompt;
  }

  // Fallback: build from bio
  return `You are ${dj.name}, a radio DJ. ${dj.bio}
You speak naturally and in character. Keep it conversational and warm.${
    dj.catchPhrases ? `\nYour signature phrases: ${dj.catchPhrases}` : ""
  }`;
}

function buildUserPrompt(
  trackType: string,
  djFirstName: string,
  prevSong: { songTitle: string; artistName: string } | null,
  nextSong: { songTitle: string; artistName: string } | null,
  hourOfDay: number,
): string {
  const timeOfDay =
    hourOfDay < 10 ? "morning" :
    hourOfDay < 14 ? "midday" :
    hourOfDay < 18 ? "afternoon" : "evening";

  const rules = `Rules:
- 2-4 sentences max (10-20 seconds when spoken)
- Natural, conversational, in-character
- Reference specific song titles and artist names when available
- Match ${timeOfDay} energy
- Output ONLY the spoken text — no stage directions, no quotes, no labels`;

  if (trackType === "intro" && nextSong) {
    return `Write a voice track where ${djFirstName} introduces the next song. Focus ONLY on the upcoming song — do NOT mention or reference any previous song.
Next up: "${nextSong.songTitle}" by ${nextSong.artistName}.
Time of day: ${timeOfDay}.
${rules}
- IMPORTANT: Only talk about the upcoming song, not any song that already played`;
  }

  if (trackType === "back_announce_intro" && prevSong && nextSong) {
    return `Write a voice track where ${djFirstName} briefly acknowledges the song that just finished, then pivots to introduce the NEXT song. The main focus should be on what's coming up next.
Just finished: "${prevSong.songTitle}" by ${prevSong.artistName}.
Coming up next: "${nextSong.songTitle}" by ${nextSong.artistName}.
Time of day: ${timeOfDay}.
${rules}
- IMPORTANT: Lead with a quick nod to the previous song, then shift focus to introducing the upcoming song`;
  }

  if (trackType === "back_announce" && prevSong) {
    return `Write a voice track where ${djFirstName} back-announces the song that just played.
Just played: "${prevSong.songTitle}" by ${prevSong.artistName}.
Time of day: ${timeOfDay}.
${rules}`;
  }

  // Fallback for missing song context or "generic" trackType
  return `Write a short, generic DJ voice track for ${djFirstName} during the ${timeOfDay}.
${rules}`;
}
