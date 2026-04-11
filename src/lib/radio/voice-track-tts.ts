/**
 * Voice Track TTS — shared TTS generation for voice tracks.
 * Core TTS functions extracted from show-transitions generate-audio route.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { mixVoiceWithMusicBed, trimSilence, appendSilence } from "@/lib/radio/audio-mixer";
import { isAiSpendLimitReached, trackAiSpend } from "@/lib/ai/spend-tracker";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

/** Retry an async function with exponential backoff.
 *  Does NOT retry on rate-limit (429) or quota-exhaustion errors
 *  to avoid burning credits on calls that will keep failing. */
async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; baseDelayMs?: number; label?: string } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, label = "TTS call" } = opts;
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on rate-limit or quota errors — they won't resolve with retries
      const msg = lastError.message.toLowerCase();
      if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota") || msg.includes("exceeded") || msg.includes("too many requests")) {
        logger.error(`${label} hit rate limit / quota — aborting without retry`, { error: lastError.message });
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        logger.warn(`${label} attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
          error: lastError.message,
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/** Convert raw PCM (24kHz, 16-bit, mono) to a WAV buffer */
export function pcmToWav(pcm: Buffer): Buffer {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

/** Amplify 16-bit PCM samples by a gain factor, with hard clipping */
export function amplifyPcm(pcm: Buffer, gain: number): Buffer {
  const out = Buffer.alloc(pcm.length);
  for (let i = 0; i < pcm.length; i += 2) {
    const sample = pcm.readInt16LE(i);
    const boosted = Math.max(-32768, Math.min(32767, Math.round(sample * gain)));
    out.writeInt16LE(boosted, i);
  }
  return out;
}

/**
 * Save audio file to R2 object storage (or local disk fallback).
 *
 * Resolution order:
 *   1. R2 configured → write to local /public/audio/ AND fire-and-forget R2
 *      upload, return the public path. This is the production-on-Netlify path.
 *   2. R2 not configured → try local disk write. If it succeeds, return the
 *      public path so the file can be served by Next.js. This is the local
 *      dev path.
 *   3. R2 not configured AND local disk write failed (e.g. read-only
 *      serverless filesystem) → fall back to a base64 data URI inlined into
 *      the DB so the playout API can still serve it.
 *
 * Previously this function ALWAYS returned a data URI when R2 wasn't
 * configured, which bloated the DB even on local dev where disk writes work.
 */
export function saveAudioFile(buffer: Buffer, dir: string, filename: string): string {
  const { uploadFile, isR2Configured } = require("@/lib/storage");
  const publicPath = `/audio/${dir}/${filename}`;

  // Try to write to local disk first — this works on local dev and on
  // Netlify-build-time, and is required so R2 has a source to upload from.
  let localWriteOk = false;
  try {
    const outputDir = path.join(process.cwd(), "public", "audio", dir);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    localWriteOk = true;
  } catch {
    // Read-only filesystem (serverless runtime) — fall through.
  }

  if (isR2Configured()) {
    // Fire-and-forget R2 upload; the DB stores the public path either way.
    (uploadFile as typeof import("@/lib/storage").uploadFile)(buffer, dir, filename).catch(() => {});
    return publicPath;
  }

  // No R2: prefer the on-disk file if we managed to write it, otherwise
  // inline a data URI so the audio still survives the request.
  if (localWriteOk) return publicPath;

  const mimeType = filename.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

/**
 * Async version of saveAudioFile — uploads to R2 and returns the public URL.
 * Preferred for new code.
 */
export async function saveAudioFileAsync(buffer: Buffer, dir: string, filename: string): Promise<string> {
  const { uploadFile } = await import("@/lib/storage");
  return uploadFile(buffer, dir, filename);
}

export async function generateWithOpenAI(text: string, voice: string): Promise<{ buffer: Buffer; ext: string }> {
  const { getConfig } = await import("@/lib/config");
  const apiKey = await getConfig("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  return withRetry(async () => {
    const openai = new OpenAI({ apiKey });
    const response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: voice as "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer",
      input: text,
    });
    return { buffer: Buffer.from(await response.arrayBuffer()), ext: "mp3" };
  }, { label: "OpenAI TTS" });
}

/** Generate OpenAI TTS as raw PCM (24kHz 16-bit mono) for audio mixing */
export async function generatePcmWithOpenAI(text: string, voice: string): Promise<Buffer> {
  const { getConfig } = await import("@/lib/config");
  const apiKey = await getConfig("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  return withRetry(async () => {
    const openai = new OpenAI({ apiKey });
    const response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: voice as "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer",
      input: text,
      response_format: "pcm",
    });
    return Buffer.from(await response.arrayBuffer());
  }, { label: "OpenAI PCM TTS" });
}

export async function generateWithGemini(text: string, voice: string, voiceDirection?: string | null): Promise<{ buffer: Buffer; ext: string }> {
  // Read from environment variable first (set in Netlify), then database config.
  let apiKey: string | undefined = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    const { getConfig } = await import("@/lib/config");
    apiKey = (await getConfig("GOOGLE_API_KEY")) || undefined;
  }
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY not configured. Set it in Admin > Settings or as a Netlify environment variable.");
  }

  try {
    return await withRetry(async () => {
      // Direct REST call instead of @google/genai SDK — the SDK auto-detects
      // Vertex AI / GOOGLE_APPLICATION_CREDENTIALS in some environments and
      // ignores the API key, causing 401s. The REST API is simpler and
      // guaranteed to use the key we pass.
      const prompt = voiceDirection
        ? `${voiceDirection}\n\nSay: "${text}"`
        : `Say: "${text}"`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(apiKey!)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice || "Leda",
                },
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`Gemini API ${response.status}: ${errBody.slice(0, 300)}`);
      }

      const data = await response.json();
      const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) {
        throw new Error("Gemini returned no audio data");
      }

      const pcmBuffer = Buffer.from(audioData, "base64");
      const wavBuffer = pcmToWav(pcmBuffer);

      return { buffer: wavBuffer, ext: "wav" };
    }, { label: "Gemini TTS", baseDelayMs: 2000 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Gemini TTS failed", { error: msg, voice });
    throw new Error(`Gemini TTS failed: ${msg}`);
  }
}

/**
 * Generate TTS via Gemini. Gemini is the only supported TTS provider.
 * ElevenLabs is explicitly refused so bad DB rows fail loudly instead of
 * being silently remapped. Legacy OpenAI voice names (e.g. "alloy") are
 * remapped to a sensible Gemini default ("Leda").
 */
async function generatePcmWithFallback(
  text: string,
  provider: string,
  voice: string,
  voiceDirection: string | null,
): Promise<{ pcm: Buffer; cost: number; usedProvider: string }> {
  if (provider === "elevenlabs") {
    throw new Error(
      `ElevenLabs TTS is not supported — fix the DJ row (voice="${voice}") to use a Gemini voice`,
    );
  }
  const openaiVoiceNames = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"];
  const isOpenAiVoiceName = voice && openaiVoiceNames.includes(voice.toLowerCase());
  const geminiVoice = (!voice || isOpenAiVoiceName) ? "Leda" : voice;
  const { buffer } = await generateWithGemini(text, geminiVoice, voiceDirection);
  return { pcm: buffer.subarray(44), cost: 0.004, usedProvider: "gemini" };
}

interface GenerateAudioResult {
  generated: number;
  errors: string[];
}

/**
 * Generate TTS audio for all voice tracks in an HourPlaylist that have
 * script_ready status. Optionally layers a music bed underneath the voice.
 */
export async function generateVoiceTrackAudio(hourPlaylistId: string): Promise<GenerateAudioResult> {
  const voiceTracks = await prisma.voiceTrack.findMany({
    where: {
      hourPlaylistId,
      status: "script_ready",
      scriptText: { not: null },
    },
  });

  if (voiceTracks.length === 0) {
    return { generated: 0, errors: [] };
  }

  // Load DJ TTS config once
  const djId = voiceTracks[0].djId;
  const dj = await prisma.dJ.findUnique({
    where: { id: djId },
    select: { ttsVoice: true, ttsProvider: true, stationId: true, voiceDescription: true, voiceProfileId: true, voiceStability: true, voiceSimilarityBoost: true },
  });

  const voice = dj?.ttsVoice || "alloy";
  const provider = dj?.ttsProvider || "openai";
  const voiceDirection = dj?.voiceDescription || null;

  // Try to find an active music bed for voice tracks
  // Prefer real uploaded beds (MP3s) over synthetic pads, then prefer "soft" category
  let musicBedPath: string | null = null;
  if (dj?.stationId) {
    const allBeds = await prisma.musicBed.findMany({
      where: { stationId: dj.stationId, isActive: true },
    });
    // Real uploaded beds: file-path based, not synthetic "pad" files
    const realBeds = allBeds.filter((b) =>
      b.filePath && !b.filePath.startsWith("data:") && !b.name.toLowerCase().includes("pad")
    );
    const bed =
      realBeds.find((b) => b.category === "soft") ||
      realBeds[0] ||
      allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:") && b.category === "soft") ||
      allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:") && b.category === "general") ||
      allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:"));
    if (bed?.filePath) {
      musicBedPath = bed.filePath;
    }
  }

  let generated = 0;
  const errors: string[] = [];

  if (await isAiSpendLimitReached()) {
    return { generated: 0, errors: ["AI daily spend limit reached — skipping TTS generation"] };
  }

  for (const vt of voiceTracks) {
    try {
      if (!vt.scriptText) continue;

      // Generate PCM with automatic fallback (Gemini → OpenAI)
      const ttsResult = await generatePcmWithFallback(
        vt.scriptText, provider, voice, voiceDirection,
      );
      let voicePcm = ttsResult.pcm;
      await trackAiSpend({ provider: ttsResult.usedProvider, operation: "tts", cost: ttsResult.cost, characters: vt.scriptText!.length });

      // Trim leading/trailing silence, then add tail padding for crossfade protection
      voicePcm = trimSilence(voicePcm);
      voicePcm = appendSilence(voicePcm, 800);

      let finalPcm: Buffer;
      if (musicBedPath) {
        // Boost voice (2.0x for presence in the mix), then mix with bed
        const boostedPcm = amplifyPcm(voicePcm, 2.0);
        const mixed = mixVoiceWithMusicBed(boostedPcm, musicBedPath, {
          voiceGain: 1.0,
          bedGain: 0.20,
          fadeInMs: 150,
          fadeOutMs: 400,
        });
        // If the bed file wasn't found (serverless), mixVoiceWithMusicBed returns
        // the boosted input unchanged — use gentle boost on original instead
        finalPcm = mixed === boostedPcm ? amplifyPcm(voicePcm, 1.5) : mixed;
      } else {
        finalPcm = amplifyPcm(voicePcm, 1.5);
      }

      const wavBuffer = pcmToWav(finalPcm);
      const filename = `vt-${vt.id}.wav`;
      const audioFilePath = saveAudioFile(wavBuffer, "voice-tracks", filename);
      const audioDuration = Math.round((finalPcm.length / 48000) * 10) / 10;

      await prisma.voiceTrack.update({
        where: { id: vt.id },
        data: {
          audioFilePath,
          audioDuration,
          ttsVoice: voice,
          ttsProvider: ttsResult.usedProvider,
          status: "audio_ready",
        },
      });

      generated++;
    } catch (err) {
      const msg = `VT ${vt.id} (pos ${vt.position}): ${err instanceof Error ? err.message : String(err)}`;
      logger.error("Voice track TTS failed", { error: msg, voiceTrackId: vt.id });
      errors.push(msg);

      await prisma.voiceTrack.update({
        where: { id: vt.id },
        data: { status: "error" },
      });
    }
  }

  return { generated, errors };
}

/**
 * Generate TTS audio for a single voice track by ID.
 * Used by the catch-up cron to process leftover script_ready tracks
 * one at a time within tight serverless timeouts.
 */
export async function generateSingleVoiceTrackAudio(voiceTrackId: string): Promise<{ success: boolean; error?: string }> {
  if (await isAiSpendLimitReached()) {
    return { success: false, error: "AI daily spend limit reached" };
  }

  const vt = await prisma.voiceTrack.findUnique({ where: { id: voiceTrackId } });
  if (!vt || vt.status !== "script_ready" || !vt.scriptText) {
    return { success: false, error: "Track not found or not in script_ready status" };
  }

  const dj = await prisma.dJ.findUnique({
    where: { id: vt.djId },
    select: { ttsVoice: true, ttsProvider: true, stationId: true, voiceDescription: true, voiceProfileId: true, voiceStability: true, voiceSimilarityBoost: true },
  });

  const voice = dj?.ttsVoice || "alloy";
  const provider = dj?.ttsProvider || "openai";
  const voiceDirection = dj?.voiceDescription || null;

  // Find music bed
  let musicBedPath: string | null = null;
  if (dj?.stationId) {
    const allBeds = await prisma.musicBed.findMany({
      where: { stationId: dj.stationId, isActive: true },
    });
    const realBeds = allBeds.filter((b) =>
      b.filePath && !b.filePath.startsWith("data:") && !b.name.toLowerCase().includes("pad")
    );
    const bed =
      realBeds.find((b) => b.category === "soft") ||
      realBeds[0] ||
      allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:") && b.category === "soft") ||
      allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:") && b.category === "general") ||
      allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:"));
    if (bed?.filePath) musicBedPath = bed.filePath;
  }

  try {
    // Generate PCM with automatic fallback (Gemini → OpenAI)
    const ttsResult = await generatePcmWithFallback(
      vt.scriptText, provider, voice, voiceDirection,
    );
    let voicePcm = ttsResult.pcm;
    await trackAiSpend({ provider: ttsResult.usedProvider, operation: "tts", cost: ttsResult.cost, characters: vt.scriptText!.length });

    voicePcm = trimSilence(voicePcm);
    voicePcm = appendSilence(voicePcm, 400);

    let finalPcm: Buffer;
    if (musicBedPath) {
      const boostedPcm = amplifyPcm(voicePcm, 2.0);
      const mixed = mixVoiceWithMusicBed(boostedPcm, musicBedPath, {
        voiceGain: 1.0,
        bedGain: 0.20,
        fadeInMs: 150,
        fadeOutMs: 400,
      });
      // If bed file unavailable (serverless), use gentle boost on original
      finalPcm = mixed === boostedPcm ? amplifyPcm(voicePcm, 1.5) : mixed;
    } else {
      finalPcm = amplifyPcm(voicePcm, 1.5);
    }

    const wavBuffer = pcmToWav(finalPcm);
    const filename = `vt-${vt.id}.wav`;
    const audioFilePath = saveAudioFile(wavBuffer, "voice-tracks", filename);
    const audioDuration = Math.round((finalPcm.length / 48000) * 10) / 10;

    await prisma.voiceTrack.update({
      where: { id: vt.id },
      data: { audioFilePath, audioDuration, ttsVoice: voice, ttsProvider: provider, status: "audio_ready" },
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Single voice track TTS failed", { error: msg, voiceTrackId: vt.id });
    // Don't set to error — leave as script_ready so catch-up can retry later
    return { success: false, error: msg };
  }
}

/**
 * Generate TTS audio for all FeatureContent items in an HourPlaylist that
 * have content but no audioFilePath yet. Follows the same TTS + music-bed
 * pattern as generateVoiceTrackAudio().
 */
export async function generateFeatureAudio(
  hourPlaylistId: string,
  stationId: string,
  djId: string,
): Promise<GenerateAudioResult> {
  // Load playlist slots to find feature content IDs
  const playlist = await prisma.hourPlaylist.findUnique({
    where: { id: hourPlaylistId },
    select: { slots: true },
  });
  if (!playlist?.slots) return { generated: 0, errors: [] };

  const slots: Array<{ featureContentId?: string }> = JSON.parse(
    typeof playlist.slots === "string" ? playlist.slots : JSON.stringify(playlist.slots),
  );
  const featureContentIds = slots
    .filter((s) => s.featureContentId)
    .map((s) => s.featureContentId!);

  if (featureContentIds.length === 0) return { generated: 0, errors: [] };

  // Load feature content records that still need audio
  const features = await prisma.featureContent.findMany({
    where: {
      id: { in: featureContentIds },
      audioFilePath: null,
      content: { not: "" },
    },
  });

  if (features.length === 0) return { generated: 0, errors: [] };

  // Load DJ TTS config once
  const dj = await prisma.dJ.findUnique({
    where: { id: djId },
    select: { ttsVoice: true, ttsProvider: true, stationId: true, voiceDescription: true, voiceProfileId: true, voiceStability: true, voiceSimilarityBoost: true },
  });
  const voice = dj?.ttsVoice || "alloy";
  const provider = dj?.ttsProvider || "openai";
  const featureVoiceDirection = dj?.voiceDescription || null;

  // Try to find an active music bed — prefer real uploads over synthetic pads
  let musicBedPath: string | null = null;
  const allBeds = await prisma.musicBed.findMany({
    where: { stationId, isActive: true },
  });
  const realBeds = allBeds.filter((b) =>
    b.filePath && !b.filePath.startsWith("data:") && !b.name.toLowerCase().includes("pad")
  );
  const featureBed =
    realBeds.find((b) => b.category === "soft") ||
    realBeds[0] ||
    allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:") && b.category === "soft") ||
    allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:") && b.category === "general") ||
    allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:"));
  if (featureBed?.filePath) musicBedPath = featureBed.filePath;

  let generated = 0;
  const errors: string[] = [];

  if (await isAiSpendLimitReached()) {
    return { generated: 0, errors: ["AI daily spend limit reached — skipping feature TTS"] };
  }

  for (const fc of features) {
    try {
      // Generate PCM with automatic fallback (Gemini → OpenAI)
      const ttsResult = await generatePcmWithFallback(
        fc.content, provider, voice, featureVoiceDirection,
      );
      let voicePcm = ttsResult.pcm;
      await trackAiSpend({ provider: ttsResult.usedProvider, operation: "tts", cost: ttsResult.cost, characters: fc.content.length });

      voicePcm = trimSilence(voicePcm);
      voicePcm = appendSilence(voicePcm, 800);

      let finalPcm: Buffer;
      if (musicBedPath) {
        const boostedPcm = amplifyPcm(voicePcm, 2.0);
        const mixed = mixVoiceWithMusicBed(boostedPcm, musicBedPath, {
          voiceGain: 1.0,
          bedGain: 0.20,
          fadeInMs: 150,
          fadeOutMs: 400,
        });
        finalPcm = mixed === boostedPcm ? amplifyPcm(voicePcm, 1.5) : mixed;
      } else {
        finalPcm = amplifyPcm(voicePcm, 1.5);
      }

      const wavBuffer = pcmToWav(finalPcm);
      const filename = `fc-${fc.id}.wav`;
      const audioFilePath = saveAudioFile(wavBuffer, "features", filename);
      const audioDuration = Math.round((finalPcm.length / 48000) * 10) / 10;

      await prisma.featureContent.update({
        where: { id: fc.id },
        data: { audioFilePath, audioDuration },
      });

      generated++;
    } catch (err) {
      const msg = `Feature ${fc.id}: ${err instanceof Error ? err.message : String(err)}`;
      logger.error("Feature TTS failed", { error: msg, featureContentId: fc.id });
      errors.push(msg);
    }
  }

  return { generated, errors };
}
