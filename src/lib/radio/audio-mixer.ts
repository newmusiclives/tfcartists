/**
 * Audio Mixer Utility — Pure Node.js WAV parsing, resampling, and mixing.
 * Used to layer music beds underneath TTS voice audio.
 *
 * All audio is normalized to 24kHz, 16-bit, mono PCM (matching OpenAI TTS output).
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { logger } from "@/lib/logger";

interface WavData {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
  pcm: Buffer;
}

interface MixOptions {
  voiceGain?: number;  // default 1.8
  bedGain?: number;    // default 0.25
  fadeInMs?: number;    // default 500
  fadeOutMs?: number;   // default 1500
}

/**
 * Convert an audio buffer (MP3, etc.) to WAV via ffmpeg.
 * Returns the WAV buffer or null if ffmpeg is unavailable.
 */
function convertToWavViaFfmpeg(inputBuffer: Buffer): Buffer | null {
  try {
    const tmpDir = path.join(process.cwd(), ".tmp-audio");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const inputPath = path.join(tmpDir, `input-${Date.now()}.mp3`);
    const outputPath = path.join(tmpDir, `output-${Date.now()}.wav`);

    fs.writeFileSync(inputPath, inputBuffer);
    logger.info("ffmpeg: wrote temp input", { path: inputPath, size: inputBuffer.length });

    const result = execSync(
      `ffmpeg -y -i "${inputPath}" -ar 24000 -ac 1 -sample_fmt s16 "${outputPath}" 2>&1`,
      { timeout: 10000 }
    );
    logger.info("ffmpeg: command completed", { output: result.toString().slice(-200) });

    const wavBuffer = fs.readFileSync(outputPath);
    logger.info("ffmpeg: read WAV output", { size: wavBuffer.length });

    // Clean up temp files
    try { fs.unlinkSync(inputPath); } catch { /* ignore */ }
    try { fs.unlinkSync(outputPath); } catch { /* ignore */ }

    return wavBuffer;
  } catch (err) {
    logger.error("ffmpeg conversion failed", { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

/** Parse a WAV file buffer and extract raw PCM data + format info */
export function parseWav(buffer: Buffer): WavData {
  // Verify RIFF header
  const riff = buffer.toString("ascii", 0, 4);
  const wave = buffer.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE") {
    throw new Error("Not a valid WAV file");
  }

  // Find fmt chunk
  let offset = 12;
  let fmtFound = false;
  let audioFormat = 0;
  let numChannels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;

  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === "fmt ") {
      audioFormat = buffer.readUInt16LE(offset + 8);
      numChannels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      // byteRate at offset + 16, blockAlign at offset + 20
      bitsPerSample = buffer.readUInt16LE(offset + 22);
      fmtFound = true;
    }

    if (chunkId === "data") {
      if (!fmtFound) {
        throw new Error("WAV: data chunk found before fmt chunk");
      }
      const pcm = buffer.subarray(offset + 8, offset + 8 + chunkSize);
      return { sampleRate, numChannels, bitsPerSample, pcm };
    }

    // Advance to next chunk (chunks are word-aligned)
    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }

  throw new Error("WAV: no data chunk found");
}

/** Resample 16-bit PCM from one sample rate to another using linear interpolation */
export function resamplePcm(pcm: Buffer, fromRate: number, toRate: number): Buffer {
  if (fromRate === toRate) return pcm;

  const numSamples = pcm.length / 2;
  const ratio = fromRate / toRate;
  const outLength = Math.floor(numSamples / ratio);
  const out = Buffer.alloc(outLength * 2);

  for (let i = 0; i < outLength; i++) {
    const srcPos = i * ratio;
    const srcIdx = Math.floor(srcPos);
    const frac = srcPos - srcIdx;

    const s0 = srcIdx < numSamples ? pcm.readInt16LE(srcIdx * 2) : 0;
    const s1 = srcIdx + 1 < numSamples ? pcm.readInt16LE((srcIdx + 1) * 2) : s0;
    const interpolated = Math.round(s0 + (s1 - s0) * frac);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, interpolated)), i * 2);
  }

  return out;
}

/** Convert stereo 16-bit PCM to mono by averaging left and right channels */
export function stereoToMono(pcm: Buffer, numChannels: number): Buffer {
  if (numChannels === 1) return pcm;

  const samplesPerChannel = pcm.length / (2 * numChannels);
  const out = Buffer.alloc(samplesPerChannel * 2);

  for (let i = 0; i < samplesPerChannel; i++) {
    let sum = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      sum += pcm.readInt16LE((i * numChannels + ch) * 2);
    }
    const avg = Math.round(sum / numChannels);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, avg)), i * 2);
  }

  return out;
}

/** Loop a PCM buffer to match a target length (in bytes) */
export function loopPcm(pcm: Buffer, targetLength: number): Buffer {
  if (pcm.length === 0) return Buffer.alloc(targetLength);
  if (pcm.length >= targetLength) return pcm.subarray(0, targetLength);

  const out = Buffer.alloc(targetLength);
  let offset = 0;
  while (offset < targetLength) {
    const remaining = targetLength - offset;
    const copyLen = Math.min(pcm.length, remaining);
    pcm.copy(out, offset, 0, copyLen);
    offset += copyLen;
  }

  return out;
}

/** Mix two PCM buffers sample-by-sample with gain control and hard clipping */
export function mixPcmBuffers(
  voice: Buffer,
  bed: Buffer,
  voiceGain: number,
  bedGain: number
): Buffer {
  const length = Math.max(voice.length, bed.length);
  const out = Buffer.alloc(length);
  const numSamples = length / 2;

  for (let i = 0; i < numSamples; i++) {
    const offset = i * 2;
    const vSample = offset < voice.length ? voice.readInt16LE(offset) : 0;
    const bSample = offset < bed.length ? bed.readInt16LE(offset) : 0;

    const mixed = Math.round(vSample * voiceGain + bSample * bedGain);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, mixed)), offset);
  }

  return out;
}

/** Apply fade-in and fade-out to a 16-bit PCM buffer */
function applyFades(pcm: Buffer, sampleRate: number, fadeInMs: number, fadeOutMs: number): Buffer {
  const out = Buffer.from(pcm); // copy
  const numSamples = out.length / 2;
  const fadeInSamples = Math.floor((fadeInMs / 1000) * sampleRate);
  const fadeOutSamples = Math.floor((fadeOutMs / 1000) * sampleRate);

  // Fade in
  for (let i = 0; i < Math.min(fadeInSamples, numSamples); i++) {
    const gain = i / fadeInSamples;
    const sample = out.readInt16LE(i * 2);
    out.writeInt16LE(Math.round(sample * gain), i * 2);
  }

  // Fade out
  const fadeOutStart = numSamples - fadeOutSamples;
  for (let i = Math.max(0, fadeOutStart); i < numSamples; i++) {
    const gain = (numSamples - i) / fadeOutSamples;
    const sample = out.readInt16LE(i * 2);
    out.writeInt16LE(Math.round(sample * gain), i * 2);
  }

  return out;
}

/**
 * High-level: mix voice PCM with a music bed file.
 *
 * Reads the music bed WAV, resamples to 24kHz mono, loops to match voice duration,
 * applies fades, and mixes under the voice.
 *
 * Returns the combined PCM buffer (24kHz, 16-bit, mono).
 * If the music bed file is not WAV or unreadable, returns voice-only PCM.
 */
export function mixVoiceWithMusicBed(
  voicePcm: Buffer,
  musicBedFilePath: string,
  options: MixOptions = {}
): Buffer {
  const {
    voiceGain = 1.8,
    bedGain = 0.25,
    fadeInMs = 500,
    fadeOutMs = 1500,
  } = options;

  const TARGET_RATE = 24000;

  try {
    let fileBuffer: Buffer;

    if (musicBedFilePath.startsWith("data:")) {
      // Data URI (base64-encoded) — uploaded on serverless (Netlify)
      const base64Match = musicBedFilePath.match(/^data:[^;]+;base64,(.+)$/);
      if (!base64Match) {
        logger.warn("Invalid music bed data URI, returning voice-only");
        return voicePcm;
      }
      fileBuffer = Buffer.from(base64Match[1], "base64");
      logger.info("Music bed: decoded data URI", { size: fileBuffer.length, header: fileBuffer.toString("ascii", 0, 4) });
    } else {
      // File path — resolve to absolute
      let resolvedPath = musicBedFilePath;
      if (musicBedFilePath.startsWith("/audio/")) {
        resolvedPath = path.join(process.cwd(), "public", musicBedFilePath);
      }

      if (!fs.existsSync(resolvedPath)) {
        logger.warn("Music bed file not found, returning voice-only", { path: musicBedFilePath });
        return voicePcm;
      }

      fileBuffer = fs.readFileSync(resolvedPath);
    }

    // Check if the file is WAV format
    const header = fileBuffer.toString("ascii", 0, 4);
    if (header !== "RIFF") {
      // Not WAV — try to convert MP3 to WAV via ffmpeg
      logger.info("Music bed: not WAV, attempting ffmpeg conversion", { headerBytes: fileBuffer.toString("hex", 0, 4) });
      const converted = convertToWavViaFfmpeg(fileBuffer);
      if (converted) {
        logger.info("Music bed: ffmpeg conversion succeeded", { wavSize: converted.length });
        fileBuffer = converted;
      } else {
        logger.warn("Music bed is not WAV and ffmpeg conversion failed, returning voice-only", {
          path: musicBedFilePath.startsWith("data:") ? "data-uri" : musicBedFilePath,
        });
        return voicePcm;
      }
    }

    const wav = parseWav(fileBuffer);

    // Convert to mono if needed
    let bedPcm = stereoToMono(wav.pcm, wav.numChannels);

    // Convert to 16-bit if needed (8-bit or 24-bit)
    if (wav.bitsPerSample === 8) {
      const converted = Buffer.alloc(bedPcm.length * 2);
      for (let i = 0; i < bedPcm.length; i++) {
        const sample = ((bedPcm[i] - 128) / 128) * 32767;
        converted.writeInt16LE(Math.round(sample), i * 2);
      }
      bedPcm = converted;
    }

    // Resample to match TTS output rate (24kHz)
    bedPcm = resamplePcm(bedPcm, wav.sampleRate, TARGET_RATE);

    // Loop bed to match voice duration
    bedPcm = loopPcm(bedPcm, voicePcm.length);

    // Apply fades to the music bed
    bedPcm = applyFades(bedPcm, TARGET_RATE, fadeInMs, fadeOutMs);

    // Mix voice over bed
    return mixPcmBuffers(voicePcm, bedPcm, voiceGain, bedGain);
  } catch (err) {
    logger.warn("Music bed mixing failed, returning voice-only", {
      path: musicBedFilePath,
      error: err instanceof Error ? err.message : String(err),
    });
    return voicePcm;
  }
}
