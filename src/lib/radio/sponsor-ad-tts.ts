/**
 * Sponsor Ad TTS — reusable audio generation for sponsor ads.
 * Extracted from the per-ad generate-audio API route so it can be
 * called programmatically (e.g. auto-generate on ad creation).
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  amplifyPcm,
  pcmToWav,
  saveAudioFile,
  generateWithGemini,
} from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed } from "@/lib/radio/audio-mixer";
import { trackAiSpend } from "@/lib/ai/spend-tracker";

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

  // Determine Gemini voice: prefer sponsor-specific imaging voices, then any imaging voice
  // Rotate across multiple sponsor voices using ad ID hash for consistent variety
  let geminiVoice = "Algieba";
  let voiceDirection: string | null = null;
  const adMeta = (ad.metadata as Record<string, unknown>) || {};
  const adVoiceType = adMeta.voiceType as string | undefined;

  // Find imaging voices that include "sponsor" in their usageTypes
  const sponsorVoices = await prisma.stationImagingVoice.findMany({
    where: { stationId: ad.stationId, isActive: true, usageTypes: { contains: "sponsor" } },
  });

  let chosenVoice: typeof sponsorVoices[number] | null = null;
  if (sponsorVoices.length > 0) {
    // If ad declares a voiceType, prefer matching gender; otherwise rotate by ad id hash
    const matchingByGender = adVoiceType
      ? sponsorVoices.filter((v) => v.voiceType === adVoiceType)
      : sponsorVoices;
    const pool = matchingByGender.length > 0 ? matchingByGender : sponsorVoices;
    const hash = adId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    chosenVoice = pool[hash % pool.length];
  } else {
    // Fall back to any active imaging voice
    chosenVoice = await prisma.stationImagingVoice.findFirst({
      where: { stationId: ad.stationId, isActive: true },
    });
  }

  if (chosenVoice) {
    const fallback = chosenVoice.voiceType === "female" ? "Autonoe" : "Algieba";
    geminiVoice = chosenVoice.elevenlabsVoiceId || fallback;
    voiceDirection = (chosenVoice.metadata as { voiceDirection?: string } | null)?.voiceDirection || null;
  }

  // Gemini-only — no OpenAI fallback. Errors propagate to the caller so a
  // failed Gemini call is visible instead of silently producing OpenAI audio.
  const { buffer } = await generateWithGemini(ad.scriptText, geminiVoice, voiceDirection);
  const rawPcm = buffer.subarray(44); // strip WAV header to get PCM
  await trackAiSpend({ provider: "google", operation: "tts", cost: 0.004, characters: ad.scriptText.length });

  const boostedPcm = amplifyPcm(rawPcm, VOICE_GAIN);
  await finalizeSponsorAd(ad, rawPcm, boostedPcm, adId, geminiVoice);
}

/** Mix with music bed (if any), save WAV, and update the DB record */
async function finalizeSponsorAd(
  ad: { adTitle: string; musicBed?: { filePath: string | null } | null },
  originalPcm: Buffer,
  boostedPcm: Buffer,
  adId: string,
  geminiVoice: string,
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
    data: {
      audioFilePath,
      durationSeconds,
      generatedByProvider: "gemini",
      generatedVoiceName: geminiVoice,
      generatedAt: new Date(),
    },
  });

  logger.info("Auto-generated sponsor ad audio", { adId, audioFilePath, durationSeconds, voice: geminiVoice });
}
