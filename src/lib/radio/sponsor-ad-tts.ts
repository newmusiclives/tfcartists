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
  generatePcmWithElevenLabs,
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
 * Supports OpenAI and ElevenLabs TTS providers.
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

  // Check if station has an ElevenLabs DJ voice to use for ads
  const stationDj = await prisma.dJ.findFirst({
    where: { stationId: ad.stationId, ttsProvider: "elevenlabs", voiceProfileId: { not: null }, isActive: true },
    select: { voiceProfileId: true, voiceStability: true, voiceSimilarityBoost: true },
  });

  let rawPcm: Buffer;
  let provider: string;

  if (stationDj?.voiceProfileId) {
    // Use ElevenLabs cloned voice
    const elevenLabsKey = await getConfig("ELEVENLABS_API_KEY");
    if (!elevenLabsKey) {
      logger.warn("generateSponsorAdAudio: ELEVENLABS_API_KEY not configured, falling back to OpenAI");
    } else {
      rawPcm = await generatePcmWithElevenLabs(ad.scriptText, stationDj.voiceProfileId, {
        stability: stationDj.voiceStability ?? 0.75,
        similarityBoost: stationDj.voiceSimilarityBoost ?? 0.75,
      });
      provider = "elevenlabs";
      await trackAiSpend({ provider: "elevenlabs", operation: "tts", cost: (ad.scriptText.length / 1000) * 0.30, characters: ad.scriptText.length });

      const boostedPcm = amplifyPcm(rawPcm!, VOICE_GAIN);
      return finalizeSponsorAd(ad, boostedPcm, adId);
    }
  }

  // Fall back to OpenAI
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

  rawPcm = Buffer.from(await response.arrayBuffer());
  await trackAiSpend({ provider: "openai", operation: "tts", cost: 0.015, characters: ad.scriptText.length });
  const boostedPcm = amplifyPcm(rawPcm, VOICE_GAIN);

  await finalizeSponsorAd(ad, boostedPcm, adId);
}

/** Mix with music bed (if any), save WAV, and update the DB record */
async function finalizeSponsorAd(
  ad: { adTitle: string; musicBed?: { filePath: string | null } | null },
  boostedPcm: Buffer,
  adId: string,
): Promise<void> {
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
