/**
 * Pool Generic Tracks Cron
 *
 * Ensures each active DJ has at least 50 generic voice tracks.
 * Generates in batches of 10 per run to stay within serverless timeouts.
 * Reuses the same script generation and TTS pipeline as generate-generic.
 *
 * Schedule: Run daily after features-daily, before voice-tracks-daily.
 * Expected to reduce AI costs by pooling reusable tracks instead of
 * generating fresh ones each day.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { aiProvider } from "@/lib/ai/providers";
import { buildSystemPrompt } from "@/lib/radio/voice-track-generator";
import {
  generateWithOpenAI,
  generateWithGemini,
  amplifyPcm,
  pcmToWav,
  saveAudioFile,
} from "@/lib/radio/voice-track-tts";
import { logCronExecution, isCronSuspended } from "@/lib/cron/log";
import { withCronLock } from "@/lib/cron/lock";
import { isAiSpendLimitReached, trackAiSpend } from "@/lib/ai/spend-tracker";
import { filterContent } from "@/lib/ai/content-filter";

export const dynamic = "force-dynamic";

const POOL_TARGET = 50; // Target number of active generic tracks per DJ
const BATCH_SIZE = 10; // Max tracks to generate per DJ per run
const CATEGORIES = ["personality", "station_promo", "time_check", "music_tease"] as const;

function getCategoryPrompt(category: string, djFirstName: string, timeOfDay: string): string {
  const rules = `Rules:
- 2-4 sentences max (10-20 seconds when spoken)
- Natural, conversational, in-character
- Match ${timeOfDay} energy
- Do NOT reference any specific song or artist
- Output ONLY the spoken text — no stage directions, no quotes, no labels`;

  switch (category) {
    case "personality":
      return `Write a short personality moment for ${djFirstName} — a quick personal story, opinion about music, humorous aside, or observation. Something that makes the listener feel connected to the DJ as a person.
Time of day: ${timeOfDay}.
${rules}`;
    case "station_promo":
      return `Write a brief station mention for ${djFirstName} — remind listeners what station they're tuned to, express gratitude for listening, or mention the station's mission of supporting independent artists.
Time of day: ${timeOfDay}.
${rules}`;
    case "time_check":
      return `Write a casual time-check voice break for ${djFirstName}. Mention it's the ${timeOfDay} and weave in a natural comment about the time of day. Don't use exact times — keep it vague like "getting on toward lunch" or "still got some morning left."
Time of day: ${timeOfDay}.
${rules}`;
    case "music_tease":
      return `Write a short music tease for ${djFirstName} — promise more great music ahead, hype up the listening experience, or express enthusiasm about the music being played today. Keep it generic (no specific songs).
Time of day: ${timeOfDay}.
${rules}`;
    default:
      return `Write a short, generic DJ voice break for ${djFirstName} during the ${timeOfDay}.
${rules}`;
  }
}

function getTimeOfDayFromHour(startHour: number): string {
  if (startHour < 10) return "morning";
  if (startHour < 14) return "midday";
  return "afternoon";
}

export async function GET(req: NextRequest) {
  const _cronStart = Date.now();
  const _cronStartedAt = new Date();

  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret) {
      logger.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/pool-generic-tracks" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return withCronLock("pool-generic-tracks", async () => {
      // Check if this job is suspended
      const suspended = await isCronSuspended("pool-generic-tracks");
      if (suspended) return suspended;

      logger.info("Starting pool-generic-tracks cron");

      // Check AI spend limit
      if (await isAiSpendLimitReached()) {
        logger.warn("AI daily spend limit reached — skipping generic track pooling");
        await logCronExecution({
          jobName: "pool-generic-tracks",
          status: "success",
          duration: Date.now() - _cronStart,
          summary: { message: "Skipped: AI spend limit reached" },
          startedAt: _cronStartedAt,
        });
        return NextResponse.json({
          success: true,
          message: "Skipped: AI daily spend limit reached",
        });
      }

      // Get station
      const station = await prisma.station.findFirst();
      if (!station) {
        return NextResponse.json({ error: "No station found" }, { status: 404 });
      }

      // Get all active DJs with their clock assignments
      const djs = await prisma.dJ.findMany({
        where: { stationId: station.id, isActive: true },
        select: {
          id: true,
          name: true,
          bio: true,
          gptSystemPrompt: true,
          gptTemperature: true,
          catchPhrases: true,
          additionalKnowledge: true,
          ttsVoice: true,
          ttsProvider: true,
          voiceDescription: true,
          clockAssignments: {
            where: { stationId: station.id, isActive: true },
            select: { timeSlotStart: true },
            take: 1,
          },
        },
      });

      if (djs.length === 0) {
        logger.info("No active DJs found");
        return NextResponse.json({ success: true, message: "No active DJs", generated: 0 });
      }

      let totalGenerated = 0;
      let totalSkipped = 0;
      const byDj: Record<string, number> = {};

      for (const dj of djs) {
        // Count existing active generic tracks for this DJ
        const existingCount = await prisma.genericVoiceTrack.count({
          where: {
            djId: dj.id,
            stationId: station.id,
            isActive: true,
          },
        });

        if (existingCount >= POOL_TARGET) {
          totalSkipped++;
          continue;
        }

        const needed = Math.min(POOL_TARGET - existingCount, BATCH_SIZE);
        if (needed <= 0) {
          totalSkipped++;
          continue;
        }

        // Re-check spend limit before each DJ batch
        if (await isAiSpendLimitReached()) {
          logger.warn("AI spend limit reached mid-run — stopping");
          break;
        }

        const startHour = dj.clockAssignments[0]
          ? parseInt(dj.clockAssignments[0].timeSlotStart.split(":")[0], 10)
          : 9;
        const timeOfDay = getTimeOfDayFromHour(startHour);
        const systemPrompt = buildSystemPrompt(dj);
        const voice = dj.ttsVoice || "alloy";
        const provider = dj.ttsProvider || "openai";
        const djFirstName = dj.name.split(" ")[0] || dj.name;

        let djGenerated = 0;

        for (let i = 0; i < needed; i++) {
          const category = CATEGORIES[i % CATEGORIES.length];

          try {
            // Generate script via AI
            const userPrompt = getCategoryPrompt(category, djFirstName, timeOfDay);
            const response = await aiProvider.chat(
              [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              {
                maxTokens: 200,
                temperature: dj.gptTemperature || 0.8,
              },
            );
            await trackAiSpend({ provider: "anthropic", operation: "chat", cost: 0.003, tokens: 200 });

            let scriptText = response.content.trim();

            // Content safety filter
            const filtered = filterContent(scriptText, "voice_track");
            if (!filtered) {
              logger.warn("Generic track rejected by content filter", { djId: dj.id, category });
              continue;
            }
            scriptText = filtered.text;

            // Generate TTS audio
            let buffer: Buffer;
            let ext: string;

            if (provider === "gemini") {
              ({ buffer, ext } = await generateWithGemini(scriptText, voice, dj.voiceDescription));
            } else {
              ({ buffer, ext } = await generateWithOpenAI(scriptText, voice));
            }
            await trackAiSpend({
              provider,
              operation: "tts",
              cost: provider === "gemini" ? 0.004 : 0.015,
              characters: scriptText.length,
            });

            // Apply gain boost for Gemini PCM output
            if (provider === "gemini" && ext === "wav") {
              const pcmData = buffer.subarray(44);
              const boosted = amplifyPcm(pcmData, 1.8);
              buffer = pcmToWav(boosted);
            }

            const filename = `generic-${dj.id.slice(-6)}-${Date.now()}-${i}.${ext}`;
            const audioFilePath = saveAudioFile(buffer, "voice-tracks/generic", filename);

            // Estimate duration from word count
            const wordCount = scriptText.split(/\s+/).length;
            const audioDuration = Math.round((wordCount / 150) * 60 * 10) / 10;

            await prisma.genericVoiceTrack.create({
              data: {
                stationId: station.id,
                djId: dj.id,
                scriptText,
                audioFilePath,
                audioDuration,
                category,
                timeOfDay,
                ttsVoice: voice,
                ttsProvider: provider,
              },
            });

            djGenerated++;
          } catch (err) {
            logger.error("Generic track generation failed", {
              djId: dj.id,
              category,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }

        if (djGenerated > 0) {
          byDj[dj.name] = djGenerated;
          totalGenerated += djGenerated;
        }

        logger.info(`Pooled ${djGenerated} generic tracks for ${dj.name}`, {
          existing: existingCount,
          needed,
          generated: djGenerated,
        });
      }

      const summary = {
        generated: totalGenerated,
        skipped: totalSkipped,
        poolTarget: POOL_TARGET,
        batchSize: BATCH_SIZE,
        byDj,
      };

      logger.info("Pool-generic-tracks cron completed", summary);

      await logCronExecution({
        jobName: "pool-generic-tracks",
        status: "success",
        duration: Date.now() - _cronStart,
        summary: summary as Record<string, unknown>,
        startedAt: _cronStartedAt,
      });

      return NextResponse.json({
        success: true,
        ...summary,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error("Pool-generic-tracks cron failed", { error });

    await logCronExecution({
      jobName: "pool-generic-tracks",
      status: "error",
      duration: Date.now() - _cronStart,
      error: error instanceof Error ? error.message : String(error),
      startedAt: _cronStartedAt,
    });

    return NextResponse.json(
      {
        error: "Pool generic tracks cron failed",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}
