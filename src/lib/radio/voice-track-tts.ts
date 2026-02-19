/**
 * Voice Track TTS — shared TTS generation for voice tracks.
 * Core TTS functions extracted from show-transitions generate-audio route.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
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
 * script_ready status.
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
    select: { ttsVoice: true, ttsProvider: true },
  });

  const voice = dj?.ttsVoice || "alloy";
  const provider = dj?.ttsProvider || "openai";

  let generated = 0;
  const errors: string[] = [];

  for (const vt of voiceTracks) {
    try {
      if (!vt.scriptText) continue;

      let buffer: Buffer;
      let ext: string;

      if (provider === "gemini") {
        ({ buffer, ext } = await generateWithGemini(vt.scriptText, voice));
      } else {
        ({ buffer, ext } = await generateWithOpenAI(vt.scriptText, voice));
      }

      const filename = `vt-${vt.id}.${ext}`;
      const audioFilePath = saveAudioFile(buffer, "voice-tracks", filename);

      // Estimate duration (~150 words per minute for spoken audio)
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
