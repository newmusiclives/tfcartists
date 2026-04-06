/**
 * Sponsor Ad TTS — reusable audio generation for sponsor ads.
 * Extracted from the per-ad generate-audio API route so it can be
 * called programmatically (e.g. auto-generate on ad creation).
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getConfig } from "@/lib/config";
import {
  amplifyPcm,
  pcmToWav,
  saveAudioFile,
  generateWithGemini,
} from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed } from "@/lib/radio/audio-mixer";
import { trackAiSpend } from "@/lib/ai/spend-tracker";
import OpenAI from "openai";

const voiceMap: Record<string, string> = {
  male: "onyx",
  female: "nova",
};

const VOICE_GAIN = 3.5;

/**
 * Generate TTS audio for a sponsor ad and save it.
 * Supports Gemini and OpenAI TTS providers.
 */
export async function generateSponsorAdAudio(adId: string): Promise<void> {
  const ad = await prisma.sponsorAd.findUnique({
    where: { id: adId },
    include: { musicBed: true },
  });

  if (!ad || !ad.scriptText) {
    logger.warn("generateSponsorAdAudio: ad not found or no scriptText", { adId });
    return;
  }

  // Skip if audio already exists — avoid redundant TTS calls
  if (ad.audioFilePath) {
    logger.info("generateSponsorAdAudio: audio already exists, skipping", { adId, audioFilePath: ad.audioFilePath });
    return;
  }

  // Determine Gemini voice: ad metadata > station imaging voice > default "Kore"
  let geminiVoice = "Kore";
  const geminiVoiceMap: Record<string, string> = { male: "Charon", female: "Kore" };
  const adMeta = (ad.metadata as Record<string, unknown>) || {};
  const adVoiceType = adMeta.voiceType as string | undefined;
  if (adVoiceType && geminiVoiceMap[adVoiceType]) {
    geminiVoice = geminiVoiceMap[adVoiceType];
  } else {
    const imagingVoice = await prisma.stationImagingVoice.findFirst({
      where: { stationId: ad.stationId, isActive: true },
    });
    if (imagingVoice) {
      geminiVoice = geminiVoiceMap[imagingVoice.voiceType] || "Kore";
    }
  }

  // Generate TTS with Gemini (primary) or OpenAI (fallback)
  let rawPcm: Buffer;
  try {
    const { buffer } = await generateWithGemini(ad.scriptText, geminiVoice, null);
    rawPcm = buffer.subarray(44); // strip WAV header to get PCM
    await trackAiSpend({ provider: "google", operation: "tts", cost: 0.004, characters: ad.scriptText.length });
  } catch {
    // Fall back to OpenAI
    const apiKey = await getConfig("OPENAI_API_KEY");
    if (!apiKey) {
      logger.warn("generateSponsorAdAudio: neither Gemini nor OpenAI available");
      return;
    }
    const openaiVoice = voiceMap[adVoiceType || ""] || "onyx";
    const openai = new OpenAI({ apiKey });
    const response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: openaiVoice as "onyx" | "nova" | "alloy" | "echo" | "fable" | "shimmer",
      input: ad.scriptText,
      response_format: "pcm",
    });
    rawPcm = Buffer.from(await response.arrayBuffer());
    await trackAiSpend({ provider: "openai", operation: "tts", cost: 0.015, characters: ad.scriptText.length });
  }

  const boostedPcm = amplifyPcm(rawPcm, VOICE_GAIN);
  await finalizeSponsorAd(ad, rawPcm, boostedPcm, adId);
}

/** Mix with music bed (if any), save WAV, and update the DB record */
async function finalizeSponsorAd(
  ad: { adTitle: string; musicBed?: { filePath: string | null } | null },
  originalPcm: Buffer,
  boostedPcm: Buffer,
  adId: string,
): Promise<void> {
  // Mix with music bed if the ad has one assigned
  let finalPcm: Buffer;
  if (ad.musicBed?.filePath) {
    const mixed = mixVoiceWithMusicBed(boostedPcm, ad.musicBed.filePath, {
      voiceGain: 1.0,
      bedGain: 0.7,
      fadeInMs: 300,
      fadeOutMs: 800,
    });
    // If mixer failed (returned input buffer unchanged), fall back to gentle boost
    finalPcm = mixed === boostedPcm ? amplifyPcm(originalPcm, 1.5) : mixed;
  } else {
    finalPcm = amplifyPcm(originalPcm, 1.5);
  }

  const wavBuffer = pcmToWav(finalPcm);

  const safeName = ad.adTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `ad-${safeName}-${adId.slice(-6)}.wav`;
  const audioFilePath = saveAudioFile(wavBuffer, "commercials", filename);

  const durationSeconds = Math.round((finalPcm.length / 48000) * 10) / 10;

  await prisma.sponsorAd.update({
    where: { id: adId },
    data: { audioFilePath, durationSeconds },
  });

  logger.info("Auto-generated sponsor ad audio", { adId, audioFilePath, durationSeconds });
}
