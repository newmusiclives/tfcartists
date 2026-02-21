import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { aiProvider } from "@/lib/ai/providers";
import { buildSystemPrompt } from "@/lib/radio/voice-track-generator";
import {
  generateWithOpenAI,
  generateWithGemini,
  amplifyPcm,
  pcmToWav,
  saveAudioFile,
} from "@/lib/radio/voice-track-tts";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

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
      return `Write a brief station mention for ${djFirstName} — remind listeners what station they're tuned to (North Country Radio), express gratitude for listening, or mention the station's mission of supporting independent Americana artists.
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

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { stationId, djId, count = 12 } = body;

    if (!stationId || !djId) {
      return NextResponse.json(
        { error: "stationId and djId are required" },
        { status: 400 }
      );
    }

    // Load DJ persona
    const dj = await prisma.dJ.findUnique({
      where: { id: djId },
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
          where: { stationId, isActive: true },
          select: { timeSlotStart: true },
          take: 1,
        },
      },
    });

    if (!dj) {
      return NextResponse.json({ error: "DJ not found" }, { status: 404 });
    }

    // Determine DJ's time-of-day from their clock assignment
    const startHour = dj.clockAssignments[0]
      ? parseInt(dj.clockAssignments[0].timeSlotStart.split(":")[0], 10)
      : 9;
    const timeOfDay = getTimeOfDayFromHour(startHour);

    const systemPrompt = buildSystemPrompt(dj);
    const voice = dj.ttsVoice || "alloy";
    const provider = dj.ttsProvider || "openai";
    const djFirstName = dj.name.split(" ")[0] || dj.name;

    const results: Array<{
      id: string;
      category: string;
      success: boolean;
      error?: string;
    }> = [];

    for (let i = 0; i < count; i++) {
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
          }
        );

        const scriptText = response.content.trim();

        // Generate TTS audio
        let buffer: Buffer;
        let ext: string;

        if (provider === "gemini") {
          ({ buffer, ext } = await generateWithGemini(scriptText, voice, dj.voiceDescription));
        } else {
          ({ buffer, ext } = await generateWithOpenAI(scriptText, voice));
        }

        // Apply 1.8x gain boost for Gemini PCM output (same as sponsor ads)
        if (provider === "gemini" && ext === "wav") {
          // Extract PCM data (skip 44-byte WAV header), amplify, re-wrap
          const pcmData = buffer.subarray(44);
          const boosted = amplifyPcm(pcmData, 1.8);
          buffer = pcmToWav(boosted);
        }

        const filename = `generic-${djId.slice(-6)}-${Date.now()}-${i}.${ext}`;
        const audioFilePath = saveAudioFile(buffer, "voice-tracks/generic", filename);

        // Estimate duration
        const wordCount = scriptText.split(/\s+/).length;
        const audioDuration = Math.round((wordCount / 150) * 60 * 10) / 10;

        // Create record
        const track = await prisma.genericVoiceTrack.create({
          data: {
            stationId,
            djId,
            scriptText,
            audioFilePath,
            audioDuration,
            category,
            timeOfDay,
            ttsVoice: voice,
            ttsProvider: provider,
          },
        });

        results.push({ id: track.id, category, success: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error("Generic voice track generation failed", {
          djId,
          category,
          index: i,
          error: msg,
        });
        results.push({ id: "", category, success: false, error: msg });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Generated ${succeeded} of ${count} generic voice tracks${failed > 0 ? ` (${failed} failed)` : ""}`,
      generated: succeeded,
      failed,
      results,
    });
  } catch (error) {
    return handleApiError(error, "/api/voice-tracks/generate-generic");
  }
}
