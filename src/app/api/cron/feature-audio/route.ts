/**
 * Bulk Feature Audio Generation cron endpoint.
 *
 * Finds FeatureContent records that have content text but no audioFilePath
 * and generates TTS audio for them. This decouples feature audio generation
 * from the voice-tracks-hour cron, which may not run for every hour.
 *
 * Processes up to 5 features per invocation to stay within serverless timeouts.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { logCronExecution, isCronSuspended } from "@/lib/cron/log";
import { withCronLock } from "@/lib/cron/lock";
import { isAiSpendLimitReached, trackAiSpend } from "@/lib/ai/spend-tracker";
import {
  amplifyPcm,
  generatePcmWithOpenAI,
  generateWithGemini,
  pcmToWav,
  saveAudioFile,
} from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed, trimSilence } from "@/lib/radio/audio-mixer";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 10;
const LIVE_HOURS = 12; // 6am-6pm
const FEATURES_PER_HOUR = 2;
const MAX_DAYS_AHEAD = 3;
const MAX_AUDIO_BANK = LIVE_HOURS * FEATURES_PER_HOUR * MAX_DAYS_AHEAD; // 3 days ahead = 72

export async function GET(req: NextRequest) {
  const cronStart = Date.now();
  const cronStartedAt = new Date();

  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return withCronLock("feature-audio", async () => {
      const suspended = await isCronSuspended("feature-audio");
      if (suspended) return suspended;

      logger.info("Starting feature-audio cron");

      const station = await prisma.station.findFirst({
        where: { isActive: true, deletedAt: null },
      });
      if (!station) {
        return NextResponse.json({ error: "No station found" }, { status: 404 });
      }

      // Check if we already have enough audio banked (2 days ahead)
      const withAudio = await prisma.featureContent.count({
        where: { stationId: station.id, audioFilePath: { not: null }, isUsed: false },
      });
      if (withAudio >= MAX_AUDIO_BANK) {
        return NextResponse.json({
          success: true, generated: 0, errors: 0, remaining: 0,
          message: `Audio bank full (${withAudio} ready, max ${MAX_AUDIO_BANK})`,
        });
      }

      // Find features with content but no audio
      const toGenerate = Math.min(BATCH_SIZE, MAX_AUDIO_BANK - withAudio);
      const features = await prisma.featureContent.findMany({
        where: {
          stationId: station.id,
          audioFilePath: null,
          content: { not: "" },
          isUsed: false,
        },
        take: toGenerate,
        orderBy: { createdAt: "asc" },
      });

      if (features.length === 0) {
        await logCronExecution({
          jobName: "feature-audio",
          status: "success",
          duration: Date.now() - cronStart,
          summary: { generated: 0, message: "No features need audio" } as Record<string, unknown>,
          startedAt: cronStartedAt,
        });
        return NextResponse.json({ success: true, generated: 0, remaining: 0 });
      }

      // Check AI spend limit before processing
      if (await isAiSpendLimitReached()) {
        return NextResponse.json({ success: true, generated: 0, errors: 0, remaining: features.length, message: "AI daily spend limit reached" });
      }

      // We need a DJ to determine TTS voice. Find the DJ linked to each feature,
      // or fall back to the first active DJ.
      const djIds = [...new Set(features.map((f) => f.djPersonalityId).filter(Boolean))] as string[];
      const djs = await prisma.dJ.findMany({
        where: { id: { in: djIds } },
        select: { id: true, ttsVoice: true, ttsProvider: true, voiceDescription: true },
      });
      const djMap = new Map(djs.map((d) => [d.id, d]));

      // Fallback DJ if feature has no DJ linked
      const fallbackDj = await prisma.dJ.findFirst({
        where: { stationId: station.id, isActive: true },
        select: { id: true, ttsVoice: true, ttsProvider: true, voiceDescription: true },
      });

      // Find music bed
      let musicBedPath: string | null = null;
      const allBeds = await prisma.musicBed.findMany({
        where: { stationId: station.id, isActive: true },
      });
      const realBeds = allBeds.filter(
        (b) => b.filePath && !b.filePath.startsWith("data:") && !b.name.toLowerCase().includes("pad"),
      );
      const bed =
        realBeds.find((b) => b.category === "soft") ||
        realBeds[0] ||
        allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:") && b.category === "soft") ||
        allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:") && b.category === "general") ||
        allBeds.find((b) => b.filePath && !b.filePath.startsWith("data:"));
      if (bed?.filePath) musicBedPath = bed.filePath;

      let generated = 0;
      const errors: string[] = [];

      for (const fc of features) {
        try {
          const dj = (fc.djPersonalityId ? djMap.get(fc.djPersonalityId) : null) || fallbackDj;
          const voice = dj?.ttsVoice || "alloy";
          const provider = dj?.ttsProvider || "openai";
          const voiceDirection = dj?.voiceDescription || null;

          let voicePcm: Buffer;
          if (provider === "gemini") {
            const { buffer } = await generateWithGemini(fc.content, voice, voiceDirection);
            voicePcm = buffer.subarray(44);
          } else {
            voicePcm = await generatePcmWithOpenAI(fc.content, voice);
          }
          await trackAiSpend({ provider, operation: "tts", cost: provider === "gemini" ? 0.004 : 0.015, characters: fc.content.length });

          voicePcm = trimSilence(voicePcm);

          let finalPcm: Buffer;
          if (musicBedPath) {
            const boostedPcm = amplifyPcm(voicePcm, 2.0);
            finalPcm = mixVoiceWithMusicBed(boostedPcm, musicBedPath, {
              voiceGain: 1.0,
              bedGain: 0.25,
              fadeInMs: 200,
              fadeOutMs: 600,
            });
          } else {
            finalPcm = voicePcm;
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
          logger.error("Feature audio generation failed", { error: msg, featureContentId: fc.id });
          errors.push(msg);
        }
      }

      // Count remaining features that still need audio
      const remaining = await prisma.featureContent.count({
        where: {
          stationId: station.id,
          audioFilePath: null,
          content: { not: "" },
          isUsed: false,
        },
      });

      logger.info("Feature-audio cron completed", { generated, errors: errors.length, remaining });

      await logCronExecution({
        jobName: "feature-audio",
        status: errors.length > 0 && generated === 0 ? "error" : "success",
        duration: Date.now() - cronStart,
        summary: { generated, errors: errors.length, remaining } as Record<string, unknown>,
        startedAt: cronStartedAt,
      });

      return NextResponse.json({
        success: true,
        generated,
        errors: errors.length,
        remaining,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error("Feature-audio cron failed", { error });

    await logCronExecution({
      jobName: "feature-audio",
      status: "error",
      duration: Date.now() - cronStart,
      error: error instanceof Error ? error.message : String(error),
      startedAt: cronStartedAt,
    });

    return NextResponse.json(
      { error: "Feature audio cron failed" },
      { status: 500 },
    );
  }
}
