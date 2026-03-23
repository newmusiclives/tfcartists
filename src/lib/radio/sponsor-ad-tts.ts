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
} from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed } from "@/lib/radio/audio-mixer";
import OpenAI from "openai";

const voiceMap: Record<string, string> = {
  male: "onyx",
  female: "nova",
};

const VOICE_GAIN = 3.5;

/**
 * Generate TTS audio for a sponsor ad and save it.
 * This is the same logic as the /api/sponsor-ads/[id]/generate-audio route,
 * but callable as a plain function (no HTTP request/response).
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

  const apiKey = await getConfig("OPENAI_API_KEY");
  if (!apiKey) {
    logger.warn("generateSponsorAdAudio: OPENAI_API_KEY not configured");
    return;
  }

  // Determine voice: ad metadata > station imaging voice > default "onyx"
  let openaiVoice = "onyx";
  const adMeta = (ad.metadata as Record<string, unknown>) || {};
  const adVoiceType = adMeta.voiceType as string | undefined;
  if (adVoiceType && voiceMap[adVoiceType]) {
    openaiVoice = voiceMap[adVoiceType];
  } else {
    const imagingVoice = await prisma.stationImagingVoice.findFirst({
      where: { stationId: ad.stationId, isActive: true },
    });
    if (imagingVoice) {
      openaiVoice = voiceMap[imagingVoice.voiceType] || "onyx";
    }
  }

  // Generate TTS as raw PCM so we can boost the voice volume
  const openai = new OpenAI({ apiKey });
  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: openaiVoice as "onyx" | "nova" | "alloy" | "echo" | "fable" | "shimmer",
    input: ad.scriptText,
    response_format: "pcm",
  });

  const rawPcm = Buffer.from(await response.arrayBuffer());
  const boostedPcm = amplifyPcm(rawPcm, VOICE_GAIN);

  // Mix with music bed if the ad has one assigned
  let finalPcm = boostedPcm;
  if (ad.musicBed?.filePath) {
    finalPcm = mixVoiceWithMusicBed(boostedPcm, ad.musicBed.filePath, {
      voiceGain: 1.0,
      bedGain: 0.7,
      fadeInMs: 300,
      fadeOutMs: 800,
    });
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
