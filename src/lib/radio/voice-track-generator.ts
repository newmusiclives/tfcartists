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
import { isAiSpendLimitReached, trackAiSpend } from "@/lib/ai/spend-tracker";
import { filterContent } from "@/lib/ai/content-filter";

/**
 * Trim a script to the last *complete* sentence and discard any trailing
 * fragment. A sentence is considered complete when it has a sentence-ending
 * punctuation mark (`.`, `!`, `?`) AND, if a comma appears after the last
 * such mark, the words after the comma form an actual continuation rather
 * than a stub like "let's." or "isn't.".
 *
 * Previously this function only checked the very last character. If the LLM
 * happened to produce a fragment that ended with a period (e.g. "...road,
 * let's.") it slipped through and the TTS faithfully spoke the truncation,
 * making the DJ sound clipped mid-thought.
 */
function trimToCompleteSentence(text: string): string {
  let cleaned = text.trim();
  if (!cleaned) return cleaned;

  // Find every position that ends a sentence.
  const endings: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (c === "." || c === "!" || c === "?") endings.push(i);
  }

  if (endings.length === 0) {
    // No sentence ending at all — return empty so the caller can retry
    // rather than ship a fragment with a fake period.
    return "";
  }

  // Look at the tail after the last sentence ending. If there's anything
  // there, it's an incomplete fragment — drop it.
  const lastEnd = endings[endings.length - 1];
  const tail = cleaned.substring(lastEnd + 1).trim();
  if (tail.length > 0) {
    cleaned = cleaned.substring(0, lastEnd + 1).trim();
  }

  // Also catch the "...road, let's." case: a sentence whose tail after the
  // last comma is too short to be a complete clause. Drop the whole final
  // sentence and back up to the previous one.
  const lastCommaInFinal = cleaned.lastIndexOf(",", cleaned.length - 1);
  const finalSentenceStart = endings.length >= 2 ? endings[endings.length - 2] + 1 : 0;
  if (lastCommaInFinal > finalSentenceStart) {
    const afterComma = cleaned.substring(lastCommaInFinal + 1, cleaned.length - 1).trim();
    // If the trailing clause is just one or two short words (likely a
    // truncated continuation like "let's" or "isn't"), drop the final
    // sentence entirely.
    const wordsAfter = afterComma.split(/\s+/).filter(Boolean);
    const isStubClause =
      wordsAfter.length <= 2 &&
      afterComma.length <= 12 &&
      !/^(yes|no|please|thanks|cheers|amen|right|sure|enjoy|okay)\b/i.test(afterComma);
    if (isStubClause && endings.length >= 2) {
      cleaned = cleaned.substring(0, endings[endings.length - 2] + 1).trim();
    }
  }

  return cleaned;
}

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
 *   - If there's a next song → forward intro (DJ introduces what's coming up)
 *   - Otherwise → generic personality moment
 *   - No back-announces — they often reference the wrong song due to queue timing
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

    if (nextSong) {
      // Always forward-intro the next song — no back-announces
      trackType = "intro";
    } else if (prevIsSong) {
      // Nothing ahead → generic personality moment (no back-announce)
      trackType = "generic";
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

  // Check AI spend limit before generating
  if (await isAiSpendLimitReached()) {
    return { generated: 0, errors: ["AI daily spend limit reached — skipping voice track generation"] };
  }

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

      // Generate script via AI. maxTokens at 800 gives plenty of headroom
      // for 2 short sentences without bumping the ceiling and producing a
      // clipped fragment. (Was 600, before that 350.)
      const MAX_TOKENS = 800;
      // Use a lower temperature for voice track generation than the DJ's
      // chat default. High temperature drives Claude away from the rigid
      // template into "creative" prose that omits the artist/title.
      const VOICE_TRACK_TEMPERATURE = 0.5;
      const response = await aiProvider.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          maxTokens: MAX_TOKENS,
          temperature: VOICE_TRACK_TEMPERATURE,
        }
      );
      await trackAiSpend({ provider: "anthropic", operation: "chat", cost: 0.003, tokens: MAX_TOKENS });

      // Validate tense accuracy AND required content — regenerate once if wrong
      let scriptText = trimToCompleteSentence(response.content.trim());
      const tenseIssue = validateVoiceTrackTense(vb.trackType, scriptText, prevSong, nextSong);
      const contentIssue = validateRequiredContent(vb.trackType, scriptText, dj.name.split(" ")[0] || dj.name, nextSong);
      const issue = tenseIssue || contentIssue;
      if (issue) {
        logger.warn("Voice track validation failed, regenerating", {
          position: vb.position, trackType: vb.trackType, issue,
        });
        const retry = await aiProvider.chat(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt + `\n\nIMPORTANT CORRECTION: Your previous attempt had this problem: "${issue}". Fix this in your new response.` },
          ],
          { maxTokens: MAX_TOKENS, temperature: 0.3 }
        );
        await trackAiSpend({ provider: "anthropic", operation: "chat", cost: 0.003, tokens: MAX_TOKENS });
        scriptText = trimToCompleteSentence(retry.content.trim());
      }

      // Hard reject — if even after the retry the script is empty or missing
      // critical elements, mark this voice track position as error so the
      // playout filters it out (orphan-drop in /api/next_hour) instead of
      // playing a half-script.
      if (!scriptText || (vb.trackType === "intro" && nextSong &&
          (!scriptMentionsArtist(scriptText, nextSong.artistName) || !scriptMentionsTitle(scriptText, nextSong.songTitle)))) {
        const why = !scriptText
          ? "empty"
          : !scriptMentionsArtist(scriptText, nextSong!.artistName)
            ? `no artist "${nextSong!.artistName}"`
            : `no title "${nextSong!.songTitle}"`;
        errors.push(`VT pos ${vb.position} [${why}]: ${scriptText.slice(0, 200) || "(empty)"}`);
        const orphan = await prisma.voiceTrack.findFirst({ where: { hourPlaylistId, position: vb.position } });
        if (orphan) {
          await prisma.voiceTrack.update({ where: { id: orphan.id }, data: { status: "error" } });
        }
        continue;
      }

      // Content safety filter
      const filtered = filterContent(scriptText, "voice_track");
      if (!filtered) {
        errors.push(`VT position ${vb.position}: content rejected by safety filter`);
        continue;
      }
      if (filtered.warnings.length > 0) {
        logger.warn("Voice track content filtered", { position: vb.position, warnings: filtered.warnings });
      }
      scriptText = filtered.text;

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
        scriptText,
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

/**
 * Build the system prompt for voice track generation.
 *
 * IMPORTANT: We deliberately do NOT use the DJ's full `gptSystemPrompt`
 * field here. That field tends to be a rich character document (2000+
 * chars of persona, biography, voice rules) intended for long-form
 * conversation. When we use it for short voice intros, the persona rules
 * ("be poetic", "use sensory imagery", "never over-explain", "let
 * meaningful lines breathe") completely override the user prompt's
 * structural requirements, and Claude ships abstract vibe scripts that
 * never name the song or artist.
 *
 * For voice tracks specifically, we use a tight focused prompt that
 * captures the DJ's name, format, and a one-line vibe — enough flavor
 * for the model to sound like the DJ, without the elaborate persona
 * rules that fight the structural requirements.
 *
 * The full gptSystemPrompt is still available to other parts of the app
 * (live AI chat, Q&A, etc.) — this is voice-tracks-only.
 */
export function buildSystemPrompt(dj: {
  name: string;
  gptSystemPrompt: string | null;
  catchPhrases: string | null;
  additionalKnowledge: string | null;
  bio: string;
}): string {
  const firstName = dj.name.split(" ")[0] || dj.name;
  // Pull just a one-line vibe from the bio if available
  const bioLine = dj.bio
    ? dj.bio.split(/[.\n]/).find((s) => s.trim().length > 10)?.trim() || ""
    : "";

  let prompt = `You are ${dj.name} ("${firstName}"), a radio DJ on North Country Radio — a country / Americana / country-rock station.`;
  if (bioLine) prompt += ` ${bioLine}.`;
  prompt += `

You are writing short forward intros to introduce upcoming songs. Speak warmly and naturally, in character, but ALWAYS follow the user's structural template — every intro must name the artist, the song title, and identify yourself or the station. Two short sentences only.`;

  if (dj.catchPhrases) {
    prompt += `\n\nYour signature phrases (use sparingly): ${dj.catchPhrases}`;
  }
  return prompt;
}

/**
 * When RAILWAY_SAFE_MODE is true, voice tracks will NOT reference specific
 * song titles — they'll be personality-driven (mood, time of day, DJ character)
 * instead. This prevents mismatches when Railway picks different songs than
 * the HourPlaylist.
 *
 * Default: false — Railway consumes /api/playout/hour and plays the locked
 * playlist, so voice tracks should reference actual song titles.
 * Set VOICE_TRACK_SAFE_MODE=true to revert to generic mode if needed.
 */
const RAILWAY_SAFE_MODE = process.env.VOICE_TRACK_SAFE_MODE === "true";

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
- EXACTLY 2 sentences (8-12 seconds when spoken). Two short complete sentences only — do not write a third.
- Every sentence MUST end with a period, exclamation mark, or question mark
- NEVER leave a sentence unfinished — if you're running long, end the current sentence and stop
- Natural, conversational, in-character
- Match ${timeOfDay} energy
- Output ONLY the spoken text — no stage directions, no quotes, no labels`;

  // SAFE MODE: Generate personality-driven voice tracks without song references.
  // This prevents DJ from naming wrong songs when Railway picks its own playlist.
  if (RAILWAY_SAFE_MODE) {
    const moods: Record<string, string> = {
      morning: "Talk about the morning — coffee, sunrise, getting the day started. Keep it warm and optimistic.",
      midday: "Talk about the midday groove — keeping the energy up, the music flowing. Mention the kind of music you love playing.",
      afternoon: "Talk about the afternoon — winding through the day, deep cuts, discoveries. Share something personal about why you love this music.",
      evening: "Talk about the evening — settling in, reflecting, the feel of the music. Create atmosphere.",
    };
    return `Write a short, in-character DJ voice break for ${djFirstName} during the ${timeOfDay}.
${moods[timeOfDay] || moods.afternoon}

DO NOT mention any specific song titles or artist names. Instead, talk about the music, the mood, your feelings, or the listeners.

${rules}`;
  }

  if (trackType === "intro" && nextSong) {
    // Pick the primary artist name (strip featured collabs) so the model
    // doesn't try to recite "Jim Brickman f. Jana Kramer" verbatim.
    const primaryArtist = nextSong.artistName.split(/\s+(?:feat\.?|ft\.?|f\.|with|&|and|x|\/)\s+/i)[0].trim();
    return `You are writing a forward intro for ${djFirstName} on North Country Radio.

INPUTS:
- Station: North Country Radio
- DJ first name: ${djFirstName}
- Song about to play: "${nextSong.songTitle}"
- Artist: ${primaryArtist}
- Time of day: ${timeOfDay}

OUTPUT FORMAT — write EXACTLY two sentences, in this order:

  Sentence 1: A warm, in-character one-line greeting that names EITHER the DJ ("${djFirstName}") OR the station ("North Country Radio"). 6-12 words max.
  Sentence 2: A forward intro for the song that names BOTH the artist AND the song title. Must start with one of: "Here's", "Up next", "Coming up", "Now", "Next up". 8-15 words. End with a period.

REQUIRED LITERAL STRINGS — your output MUST contain all of these exact strings somewhere:
  - "${primaryArtist}"
  - "${nextSong.songTitle}"
  - Either "${djFirstName}" or "North Country Radio" (or both)

GOOD EXAMPLES (follow this structure):
  - "You're with ${djFirstName} on a ${timeOfDay} drive. Up next, here's "${nextSong.songTitle}" from ${primaryArtist}."
  - "This is North Country Radio — ${djFirstName} with you. Coming up, ${primaryArtist} with "${nextSong.songTitle}"."
  - "${djFirstName} here on North Country Radio. Now here's ${primaryArtist} with "${nextSong.songTitle}"."

BAD EXAMPLES (do NOT do these):
  - "As the afternoon light fades, there's something about deep cuts..." (NO artist, NO title, NO station/DJ — pure vibes, REJECTED)
  - "Music has a way of carrying us through the day..." (says nothing concrete, REJECTED)

You MUST use the INPUTS above in your output. The persona below describes HOW to phrase things; it does NOT permit you to omit the song title, artist, or station/DJ identification.

${rules}

TENSE: This song has NOT played yet. NEVER use "that was", "you just heard", "hope you enjoyed". Only forward-looking language.

Output ONLY the two sentences. No labels, no quotes around the whole output, no stage directions.`;
  }

  if (trackType === "back_announce_intro" && prevSong && nextSong) {
    return `You are writing a BACK-ANNOUNCE + FORWARD INTRO. Two songs are referenced — get the tense RIGHT for each one.

SONG THAT ALREADY FINISHED (use PAST tense): "${prevSong.songTitle}" by ${prevSong.artistName}
SONG ABOUT TO PLAY NEXT (use FUTURE tense): "${nextSong.songTitle}" by ${nextSong.artistName}

Structure: One short past-tense line about "${prevSong.songTitle}", then pivot to introduce "${nextSong.songTitle}".

Time of day: ${timeOfDay}.
${rules}

CRITICAL TENSE RULES — VIOLATION MEANS FAILURE:
- "${prevSong.songTitle}" ALREADY PLAYED → use "That was..." / "You just heard..." — NEVER "here's" or "coming up"
- "${nextSong.songTitle}" is ABOUT TO PLAY → use "Now here's..." / "Coming up..." / "Next up..." — NEVER "that was" or "you just heard"
- CORRECT: "That was ${prevSong.songTitle} by ${prevSong.artistName}. Now here's ${nextSong.songTitle} by ${nextSong.artistName}."
- WRONG: "That was ${nextSong.songTitle}" — NO! That song hasn't played yet!
- WRONG: "Here's ${prevSong.songTitle}" — NO! That song already finished!
- Back-announce FIRST (one line), then forward intro SECOND (main focus)`;
  }

  if (trackType === "back_announce" && prevSong) {
    return `You are writing a BACK-ANNOUNCE ONLY. The song ALREADY FINISHED PLAYING. You are commenting on it AFTER it ended.

SONG THAT JUST PLAYED: "${prevSong.songTitle}" by ${prevSong.artistName}

Time of day: ${timeOfDay}.
${rules}

CRITICAL TENSE RULES — VIOLATION MEANS FAILURE:
- MUST use PAST tense: "That was..." / "You just heard..." / "What a track from..."
- The words "here's", "coming up", "next up", "let's hear" are BANNED — the song ALREADY PLAYED
- Only mention "${prevSong.songTitle}" — do NOT introduce any upcoming song`;
  }

  // Fallback for missing song context or "generic" trackType
  return `Write a short, generic DJ voice track for ${djFirstName} during the ${timeOfDay}.
${rules}`;
}

/**
 * Validates that a voice track script uses the correct tense for its track type.
 * Returns a description of the issue, or null if valid.
 */
function validateVoiceTrackTense(
  trackType: string,
  script: string,
  prevSong: { songTitle: string; artistName: string } | null,
  nextSong: { songTitle: string; artistName: string } | null,
): string | null {
  const lower = script.toLowerCase();
  const PAST_PHRASES = ["that was", "you just heard", "we just heard", "hope you enjoyed", "what a track"];
  const FUTURE_PHRASES = ["here's", "here is", "coming up", "next up", "let's hear", "now let's", "up next"];

  if (trackType === "intro" && nextSong) {
    // Intro should NOT have past tense about the next song
    for (const phrase of PAST_PHRASES) {
      if (lower.includes(phrase) && nextSong && lower.includes(nextSong.songTitle.toLowerCase())) {
        return `Used past tense "${phrase}" for upcoming song "${nextSong.songTitle}"`;
      }
    }
    // Check if any past-tense phrase appears at all (intro should be forward-looking)
    for (const phrase of PAST_PHRASES) {
      if (lower.includes(phrase)) {
        return `Intro contains past-tense phrase "${phrase}" — should only use future tense`;
      }
    }
  }

  if (trackType === "back_announce" && prevSong) {
    // Back-announce should NOT have future tense
    for (const phrase of FUTURE_PHRASES) {
      if (lower.includes(phrase)) {
        return `Back-announce contains future-tense phrase "${phrase}" — song already played`;
      }
    }
  }

  if (trackType === "back_announce_intro" && prevSong && nextSong) {
    // Check that the previous song isn't introduced with future tense
    const prevTitle = prevSong.songTitle.toLowerCase();
    const nextTitle = nextSong.songTitle.toLowerCase();
    for (const phrase of FUTURE_PHRASES) {
      const idx = lower.indexOf(phrase);
      if (idx !== -1) {
        // If a future phrase is near the prev song title, that's wrong
        const nearbyText = lower.substring(Math.max(0, idx - 5), idx + phrase.length + 60);
        if (nearbyText.includes(prevTitle)) {
          return `Used future tense "${phrase}" for already-played song "${prevSong.songTitle}"`;
        }
      }
    }
    for (const phrase of PAST_PHRASES) {
      const idx = lower.indexOf(phrase);
      if (idx !== -1) {
        // If a past phrase is near the next song title, that's wrong
        const nearbyText = lower.substring(Math.max(0, idx - 5), idx + phrase.length + 60);
        if (nearbyText.includes(nextTitle)) {
          return `Used past tense "${phrase}" for upcoming song "${nextSong.songTitle}"`;
        }
      }
    }
  }

  return null; // No issues detected
}

/**
 * Case-insensitive, whitespace-tolerant substring check.
 * Used to verify a generated script actually mentions an artist or title.
 */
function normalizedIncludes(haystack: string, needle: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const h = norm(haystack);
  const n = norm(needle);
  if (!n) return true;
  return h.includes(n);
}

/**
 * Check whether a script mentions an artist, tolerating multi-artist names.
 * Splits on common separators (feat., ft., f., with, &, and, x, /) and
 * accepts a match if EITHER the full normalized artist OR any of its
 * primary segments appears. e.g. "Jim Brickman f. Jana Kramer" matches if
 * the script mentions "Jim Brickman".
 */
function scriptMentionsArtist(script: string, artistName: string): boolean {
  if (normalizedIncludes(script, artistName)) return true;
  const parts = artistName
    .split(/\s+(?:feat\.?|ft\.?|f\.|with|&|and|x|\/)\s+/i)
    .map((p) => p.trim())
    .filter((p) => p.length >= 3); // ignore tiny stubs
  for (const p of parts) {
    if (normalizedIncludes(script, p)) return true;
  }
  return false;
}

/**
 * Check whether a script mentions a song title. Strips parenthetical suffixes
 * like "(Radio Edit)" before comparing, since the spoken title rarely
 * includes those.
 */
function scriptMentionsTitle(script: string, songTitle: string): boolean {
  if (normalizedIncludes(script, songTitle)) return true;
  const cleanTitle = songTitle.replace(/\s*\([^)]*\)\s*/g, "").trim();
  if (cleanTitle && cleanTitle !== songTitle) {
    return normalizedIncludes(script, cleanTitle);
  }
  return false;
}

/**
 * Make sure a forward intro actually says the artist name and song title,
 * AND identifies either the DJ or the station. Without this check, the LLM
 * sometimes ships abstract "vibe" scripts that introduce nothing concrete,
 * leaving listeners with no idea what they're hearing.
 */
function validateRequiredContent(
  trackType: string,
  script: string,
  djFirstName: string,
  nextSong: { songTitle: string; artistName: string } | null,
): string | null {
  if (trackType !== "intro" || !nextSong) return null;
  if (!script) return "Empty script";

  if (!scriptMentionsArtist(script, nextSong.artistName)) {
    return `Script does not mention the artist name "${nextSong.artistName}"`;
  }
  if (!scriptMentionsTitle(script, nextSong.songTitle)) {
    return `Script does not mention the song title "${nextSong.songTitle}"`;
  }
  // At least one of: DJ first name OR "North Country Radio"
  const hasDjName = normalizedIncludes(script, djFirstName);
  const hasStation = normalizedIncludes(script, "North Country Radio");
  if (!hasDjName && !hasStation) {
    return `Script does not mention DJ name "${djFirstName}" or station name "North Country Radio"`;
  }
  return null;
}
