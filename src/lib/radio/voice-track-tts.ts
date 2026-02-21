/**
 * Voice Track TTS — shared TTS generation for voice tracks.
 * Core TTS functions extracted from show-transitions generate-audio route.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { mixVoiceWithMusicBed } from "@/lib/radio/audio-mixer";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

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

export function saveAudioFile(buffer: Buffer, dir: string, filename: string): string {
  try {
    const outputDir = path.join(process.cwd(), "public", "audio", dir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    return `/audio/${dir}/${filename}`;
  } catch {
    // Serverless (Netlify) — read-only filesystem, store as data URI
    const mimeType = filename.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }
}

export async function generateWithOpenAI(text: string, voice: string): Promise<{ buffer: Buffer; ext: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const openai = new OpenAI({ apiKey });
  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: voice as "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer",
    input: text,
  });

  return { buffer: Buffer.from(await response.arrayBuffer()), ext: "mp3" };
}

/** Generate OpenAI TTS as raw PCM (24kHz 16-bit mono) for audio mixing */
export async function generatePcmWithOpenAI(text: string, voice: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const openai = new OpenAI({ apiKey });
  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: voice as "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer",
    input: text,
    response_format: "pcm",
  });

  return Buffer.from(await response.arrayBuffer());
}

export async function generateWithGemini(text: string, voice: string): Promise<{ buffer: Buffer; ext: string }> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Speak in a warm West Midlands English accent from Birmingham, UK. Relaxed and friendly Brummie tone: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice || "Leda",
          },
        },
      },
    },
  });

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error("Gemini returned no audio data");
  }

  const pcmBuffer = Buffer.from(audioData, "base64");
  const wavBuffer = pcmToWav(pcmBuffer);

  return { buffer: wavBuffer, ext: "wav" };
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
    select: { ttsVoice: true, ttsProvider: true, stationId: true },
  });

  const voice = dj?.ttsVoice || "alloy";
  const provider = dj?.ttsProvider || "openai";

  // Try to find an active music bed for voice tracks (prefer "soft" category)
  let musicBedPath: string | null = null;
  if (dj?.stationId) {
    const bed = await prisma.musicBed.findFirst({
      where: { stationId: dj.stationId, isActive: true, category: "soft" },
    }) || await prisma.musicBed.findFirst({
      where: { stationId: dj.stationId, isActive: true, category: "general" },
    });
    if (bed?.filePath) {
      musicBedPath = bed.filePath;
    }
  }

  let generated = 0;
  const errors: string[] = [];

  for (const vt of voiceTracks) {
    try {
      if (!vt.scriptText) continue;

      // If we have a music bed, generate as PCM so we can mix
      if (musicBedPath) {
        let voicePcm: Buffer;

        if (provider === "gemini") {
          // Gemini returns WAV containing PCM — extract the PCM
          const { buffer } = await generateWithGemini(vt.scriptText, voice);
          // Skip the 44-byte WAV header to get raw PCM
          voicePcm = buffer.subarray(44);
        } else {
          voicePcm = await generatePcmWithOpenAI(vt.scriptText, voice);
        }

        // Boost voice slightly, then mix with bed
        const boostedPcm = amplifyPcm(voicePcm, 1.5);
        const mixedPcm = mixVoiceWithMusicBed(boostedPcm, musicBedPath, {
          voiceGain: 1.0,
          bedGain: 0.15, // subtle bed for voice tracks
          fadeInMs: 300,
          fadeOutMs: 800,
        });

        const wavBuffer = pcmToWav(mixedPcm);
        const filename = `vt-${vt.id}.wav`;
        const audioFilePath = saveAudioFile(wavBuffer, "voice-tracks", filename);

        const audioDuration = Math.round((mixedPcm.length / 48000) * 10) / 10;

        await prisma.voiceTrack.update({
          where: { id: vt.id },
          data: {
            audioFilePath,
            audioDuration,
            ttsVoice: voice,
            ttsProvider: provider,
            status: "audio_ready",
          },
        });
      } else {
        // No music bed — generate as before
        let buffer: Buffer;
        let ext: string;

        if (provider === "gemini") {
          ({ buffer, ext } = await generateWithGemini(vt.scriptText, voice));
        } else {
          ({ buffer, ext } = await generateWithOpenAI(vt.scriptText, voice));
        }

        const filename = `vt-${vt.id}.${ext}`;
        const audioFilePath = saveAudioFile(buffer, "voice-tracks", filename);

        const wordCount = vt.scriptText.split(/\s+/).length;
        const audioDuration = Math.round((wordCount / 150) * 60 * 10) / 10;

        await prisma.voiceTrack.update({
          where: { id: vt.id },
          data: {
            audioFilePath,
            audioDuration,
            ttsVoice: voice,
            ttsProvider: provider,
            status: "audio_ready",
          },
        });
      }

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
    select: { ttsVoice: true, ttsProvider: true, stationId: true },
  });
  const voice = dj?.ttsVoice || "alloy";
  const provider = dj?.ttsProvider || "openai";

  // Try to find an active music bed (prefer "soft" → "general" fallback)
  let musicBedPath: string | null = null;
  const bed = await prisma.musicBed.findFirst({
    where: { stationId, isActive: true, category: "soft" },
  }) || await prisma.musicBed.findFirst({
    where: { stationId, isActive: true, category: "general" },
  });
  if (bed?.filePath) musicBedPath = bed.filePath;

  let generated = 0;
  const errors: string[] = [];

  for (const fc of features) {
    try {
      if (musicBedPath) {
        let voicePcm: Buffer;
        if (provider === "gemini") {
          const { buffer } = await generateWithGemini(fc.content, voice);
          voicePcm = buffer.subarray(44);
        } else {
          voicePcm = await generatePcmWithOpenAI(fc.content, voice);
        }

        const boostedPcm = amplifyPcm(voicePcm, 1.5);
        const mixedPcm = mixVoiceWithMusicBed(boostedPcm, musicBedPath, {
          voiceGain: 1.0,
          bedGain: 0.15,
          fadeInMs: 300,
          fadeOutMs: 800,
        });

        const wavBuffer = pcmToWav(mixedPcm);
        const filename = `fc-${fc.id}.wav`;
        const audioFilePath = saveAudioFile(wavBuffer, "features", filename);
        const audioDuration = Math.round((mixedPcm.length / 48000) * 10) / 10;

        await prisma.featureContent.update({
          where: { id: fc.id },
          data: { audioFilePath, audioDuration },
        });
      } else {
        let buffer: Buffer;
        let ext: string;
        if (provider === "gemini") {
          ({ buffer, ext } = await generateWithGemini(fc.content, voice));
        } else {
          ({ buffer, ext } = await generateWithOpenAI(fc.content, voice));
        }

        const filename = `fc-${fc.id}.${ext}`;
        const audioFilePath = saveAudioFile(buffer, "features", filename);
        const wordCount = fc.content.split(/\s+/).length;
        const audioDuration = Math.round((wordCount / 150) * 60 * 10) / 10;

        await prisma.featureContent.update({
          where: { id: fc.id },
          data: { audioFilePath, audioDuration },
        });
      }

      generated++;
    } catch (err) {
      const msg = `Feature ${fc.id}: ${err instanceof Error ? err.message : String(err)}`;
      logger.error("Feature TTS failed", { error: msg, featureContentId: fc.id });
      errors.push(msg);
    }
  }

  return { generated, errors };
}
