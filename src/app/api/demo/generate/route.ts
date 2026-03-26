/**
 * Demo Generation API — generates a 60-second audio demo for a prospect's station.
 * POST { stationName, genre, djName? }
 * Rate-limited to 3 demos per IP per hour.
 */

import { NextRequest, NextResponse } from "next/server";
import { STATION_TEMPLATES } from "@/lib/station-templates";
import { generateWithOpenAI, saveAudioFile } from "@/lib/radio/voice-track-tts";
import { getConfig } from "@/lib/config";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// In-memory rate limiter (resets on server restart — fine for demo usage)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

function findClosestTemplate(genre: string) {
  const lower = genre.toLowerCase();

  // Exact id match first
  const exact = STATION_TEMPLATES.find((t) => t.id === lower);
  if (exact) return exact;

  // Check if genre keywords overlap
  const best = STATION_TEMPLATES.map((t) => {
    const templateGenres = t.genre.toLowerCase().split(/[,\s]+/);
    const inputGenres = lower.split(/[,\s]+/);
    const overlap = inputGenres.filter((g) => templateGenres.some((tg) => tg.includes(g) || g.includes(tg))).length;
    return { template: t, score: overlap };
  })
    .sort((a, b) => b.score - a.score)
    .filter((r) => r.score > 0);

  return best.length > 0 ? best[0].template : STATION_TEMPLATES[0];
}

// Map DJ voice descriptions to OpenAI TTS voice IDs
function pickTtsVoice(voiceDescription: string): string {
  const desc = voiceDescription.toLowerCase();
  if (desc.includes("baritone") || desc.includes("deep") || desc.includes("low")) return "onyx";
  if (desc.includes("contralto") || desc.includes("powerful") || desc.includes("rich")) return "nova";
  if (desc.includes("bright") || desc.includes("clear") || desc.includes("energetic")) return "shimmer";
  if (desc.includes("warm") || desc.includes("soft") || desc.includes("gentle")) return "sage";
  if (desc.includes("smooth") || desc.includes("silky") || desc.includes("velvety")) return "echo";
  if (desc.includes("fast") || desc.includes("excitable") || desc.includes("youthful")) return "fable";
  if (desc.includes("strong") || desc.includes("sassy") || desc.includes("confident")) return "coral";
  return "alloy";
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can generate up to 3 demos per hour." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { stationName, genre, djName } = body;

    if (!stationName || !genre) {
      return NextResponse.json({ error: "stationName and genre are required" }, { status: 400 });
    }

    if (stationName.length > 100 || genre.length > 100) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    // Find matching template
    const template = findClosestTemplate(genre);
    const djPreset = template.djPresets[0];
    const finalDjName = djName || djPreset.name;
    const ttsVoice = pickTtsVoice(djPreset.voiceDescription);

    // Generate demo script via OpenAI chat
    const apiKey = await getConfig("OPENAI_API_KEY");
    if (!apiKey) {
      return NextResponse.json({ error: "TTS not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const scriptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `You are a radio copywriter. Write a smooth, professional 60-second radio demo script.
The script should flow naturally as one continuous read — no stage directions, no sound effects labels, no brackets.
Voice personality: ${djPreset.voiceDescription}. Vibe: ${djPreset.vibe}. Traits: ${djPreset.traits}.
Keep it under 150 words so it reads in about 60 seconds.`,
        },
        {
          role: "user",
          content: `Write a 60-second demo script for a radio station called "${stationName}" playing ${genre} music.
The DJ's name is ${finalDjName}. The station tagline is "${template.tagline}".

Structure:
1. Station imaging opener: "You're listening to ${stationName}, ${template.tagline}"
2. DJ intro: "${finalDjName}" welcomes listeners to ${stationName}
3. Song tease: hype upcoming ${genre} music
4. Close with station ID: "${stationName} — ${template.tagline}"

Write it as a single flowing script — no labels, no annotations, just the words the DJ speaks.`,
        },
      ],
    });

    const script = scriptResponse.choices[0]?.message?.content;
    if (!script) {
      return NextResponse.json({ error: "Failed to generate demo script" }, { status: 500 });
    }

    // Generate TTS audio
    const { buffer, ext } = await generateWithOpenAI(script, ttsVoice);

    // Save to temporary demo directory
    const timestamp = Date.now();
    const safeStationName = stationName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 30);
    const filename = `demo-${safeStationName}-${timestamp}.${ext}`;
    const audioUrl = saveAudioFile(buffer, "demos", filename);

    return NextResponse.json({
      audioUrl,
      script,
      djName: finalDjName,
      template: {
        id: template.id,
        name: template.name,
        genre: template.genre,
        tagline: template.tagline,
      },
    });
  } catch (error) {
    console.error("Demo generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate demo. Please try again." },
      { status: 500 },
    );
  }
}
