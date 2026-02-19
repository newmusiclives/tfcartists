/**
 * Voice Track Script Generator — generates AI DJ scripts for voice breaks
 * that correctly reference the prev/next songs in the actual playlist.
 */

import { prisma } from "@/lib/db";
import { aiProvider } from "@/lib/ai/providers";
import { logger } from "@/lib/logger";

// Voice break positions in the clock pattern (standard positions)
const VOICE_BREAK_CONFIG: { position: number; trackType: string; approxMinute: number }[] = [
  { position: 4,  trackType: "intro",               approxMinute: 8 },
  { position: 11, trackType: "back_announce_intro",  approxMinute: 27 },
  { position: 19, trackType: "back_announce",        approxMinute: 47 },
];

interface ResolvedSlot {
  position: number;
  minute: number;
  type: string;
  category: string;
  songId?: string;
  songTitle?: string;
  artistName?: string;
}

interface GenerateVoiceTracksResult {
  generated: number;
  errors: string[];
}

/**
 * Generate voice track scripts for all voice breaks in an HourPlaylist.
 */
export async function generateVoiceTrackScripts(hourPlaylistId: string): Promise<GenerateVoiceTracksResult> {
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

  for (const vbConfig of VOICE_BREAK_CONFIG) {
    try {
      // Find the voice break slot in the clock
      const vbSlot = slots.find(
        (s) => s.position === vbConfig.position && s.type === "voice_break"
      );
      if (!vbSlot) {
        // Voice break position not in this clock pattern — try matching by type
        const altSlot = slots.find(
          (s) => s.type === "voice_break" && !slots.some(
            (existing) => existing.position === s.position && s !== existing
          )
        );
        if (!altSlot) continue;
      }

      // Find prev and next songs relative to this voice break
      const prevSong = findPrevSong(slots, vbConfig.position);
      const nextSong = findNextSong(slots, vbConfig.position);

      // Build the AI prompt
      const systemPrompt = buildSystemPrompt(dj);
      const userPrompt = buildUserPrompt(
        vbConfig.trackType,
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
          position: vbConfig.position,
        },
      });

      const vtData = {
        stationId: playlist.stationId,
        djId: playlist.djId,
        hourPlaylistId,
        position: vbConfig.position,
        trackType: vbConfig.trackType,
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
        minuteOfHour: vbConfig.approxMinute,
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
      const msg = `VT position ${vbConfig.position}: ${err instanceof Error ? err.message : String(err)}`;
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

function buildSystemPrompt(dj: {
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
    return `Write a voice track where ${djFirstName} introduces the next song.
Next up: "${nextSong.songTitle}" by ${nextSong.artistName}.
Time of day: ${timeOfDay}.
${rules}`;
  }

  if (trackType === "back_announce_intro" && prevSong && nextSong) {
    return `Write a voice track where ${djFirstName} back-announces the song that just played, then introduces the next one.
Just played: "${prevSong.songTitle}" by ${prevSong.artistName}.
Coming up: "${nextSong.songTitle}" by ${nextSong.artistName}.
Time of day: ${timeOfDay}.
${rules}`;
  }

  if (trackType === "back_announce" && prevSong) {
    return `Write a voice track where ${djFirstName} back-announces the song that just played.
Just played: "${prevSong.songTitle}" by ${prevSong.artistName}.
Time of day: ${timeOfDay}.
${rules}`;
  }

  // Fallback for missing song context
  return `Write a short, generic DJ voice track for ${djFirstName} during the ${timeOfDay}.
${rules}`;
}
