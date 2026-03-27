/**
 * Show Reel Generation API — generates a ~20-minute personalized station demo.
 *
 * POST { stationName, tagline?, genre, venueName?, prospectName?, prospectDj? }
 *
 * Produces 4 DJ segments (5 mins each) with:
 *   - Station ID with custom station name
 *   - 1 voice track per DJ (3 generic + 1 personalized via ElevenLabs)
 *   - Music beds underneath all voice content
 *   - The personalized segment uses Loretta Merrick's cloned voice to
 *     mention the prospect by name and venue/location
 *
 * Rate-limited to 2 reels per IP per hour (these are expensive).
 */

import { NextRequest, NextResponse } from "next/server";
import { STATION_TEMPLATES } from "@/lib/station-templates";
import {
  generateWithOpenAI,
  generatePcmWithElevenLabs,
  generatePcmWithOpenAI,
  amplifyPcm,
  pcmToWav,
  saveAudioFileAsync,
} from "@/lib/radio/voice-track-tts";
import { mixVoiceWithMusicBed } from "@/lib/radio/audio-mixer";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { trackAiSpend } from "@/lib/ai/spend-tracker";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min timeout for long generation

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 2;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// DJ definitions for the show reel — matches the Americana station roster
const SHOWREEL_DJS = [
  {
    name: "Hank",
    slot: "Morning Show",
    timeLabel: "6:00 AM",
    voice: "onyx", // deep baritone
    traits: "warm, storytelling, nostalgic, gravel-voiced Southern gentleman",
    vibe: "front porch morning coffee",
  },
  {
    name: "Loretta Merrick",
    slot: "Desert Folk Dispatch",
    timeLabel: "10:00 AM",
    voice: "nova", // fallback if no ElevenLabs
    traits: "British accent, knowledgeable, intimate, shares discovery stories, unpretentious",
    vibe: "somewhere between the M6 and the Mississippi",
    isPersonalized: true,
  },
  {
    name: "Doc",
    slot: "The Afternoon Session",
    timeLabel: "2:00 PM",
    voice: "echo", // professorial
    traits: "erudite, calm, insightful, dry wit, music historian",
    vibe: "university radio professor",
  },
  {
    name: "Cody",
    slot: "Drive Time",
    timeLabel: "5:00 PM",
    voice: "fable", // youthful
    traits: "enthusiastic, witty, relatable, young energy, new discoveries",
    vibe: "new generation country, road trip energy",
  },
];

interface ShowReelRequest {
  stationName: string;
  tagline?: string;
  genre: string;
  venueName?: string;
  prospectName?: string;
}

function findTemplate(genre: string) {
  const lower = genre.toLowerCase();
  const exact = STATION_TEMPLATES.find((t) => t.id === lower);
  if (exact) return exact;
  const best = STATION_TEMPLATES.map((t) => {
    const tg = t.genre.toLowerCase().split(/[,\s]+/);
    const ig = lower.split(/[,\s]+/);
    const score = ig.filter((g) => tg.some((x) => x.includes(g) || g.includes(x))).length;
    return { template: t, score };
  }).sort((a, b) => b.score - a.score);
  return best[0]?.score > 0 ? best[0].template : STATION_TEMPLATES[0];
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can generate up to 2 show reels per hour." },
        { status: 429 },
      );
    }

    const body: ShowReelRequest = await request.json();
    const { stationName, genre, venueName, prospectName } = body;

    if (!stationName || !genre) {
      return NextResponse.json({ error: "stationName and genre are required" }, { status: 400 });
    }
    if (stationName.length > 100 || genre.length > 100) {
      return NextResponse.json({ error: "Input too long" }, { status: 400 });
    }

    const template = findTemplate(genre);
    const tagline = body.tagline || template.tagline;

    const openaiKey = await getConfig("OPENAI_API_KEY");
    if (!openaiKey) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey: openaiKey });

    // Check for Loretta's ElevenLabs voice
    const elevenLabsKey = await getConfig("ELEVENLABS_API_KEY");
    let lorettaVoiceId: string | null = null;
    let lorettaStability = 0.75;
    let lorettaSimilarity = 0.75;

    // Try to find Loretta's cloned voice in the database
    const lorettaDj = await prisma.dJ.findFirst({
      where: {
        name: { contains: "Loretta" },
        ttsProvider: "elevenlabs",
        voiceProfileId: { not: null },
      },
      select: { voiceProfileId: true, voiceStability: true, voiceSimilarityBoost: true },
    });

    if (lorettaDj?.voiceProfileId && elevenLabsKey) {
      lorettaVoiceId = lorettaDj.voiceProfileId;
      lorettaStability = lorettaDj.voiceStability ?? 0.75;
      lorettaSimilarity = lorettaDj.voiceSimilarityBoost ?? 0.75;
    }

    // Find a music bed for mixing
    let musicBedPath: string | null = null;
    const station = await prisma.station.findFirst();
    if (station) {
      const beds = await prisma.musicBed.findMany({
        where: { stationId: station.id, isActive: true },
      });
      const realBeds = beds.filter(
        (b) => b.filePath && !b.filePath.startsWith("data:") && !b.name.toLowerCase().includes("pad"),
      );
      const bed =
        realBeds.find((b) => b.category === "soft") ||
        realBeds[0] ||
        beds.find((b) => b.filePath && !b.filePath.startsWith("data:"));
      if (bed?.filePath) musicBedPath = bed.filePath;
    }

    // Generate all 4 DJ segments
    const segments: Array<{
      djName: string;
      slot: string;
      timeLabel: string;
      script: string;
      audioUrl: string;
      isPersonalized: boolean;
    }> = [];

    for (const dj of SHOWREEL_DJS) {
      const isLoretta = dj.isPersonalized === true;
      const hasPersonalization = isLoretta && prospectName;

      // Build the script prompt
      const personalizedInstructions = hasPersonalization
        ? `\n\nIMPORTANT: This is the PERSONALIZED segment. Loretta must naturally mention "${prospectName}" by name at least once — as if she's talking directly to them.${venueName ? ` Also reference "${venueName}" as a location/venue/event.` : ""} Make it feel warm and personal, like Loretta is welcoming ${prospectName} to the station for the first time. This is a pitch to get them excited about having their own station.`
        : "";

      const scriptResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.85,
        max_tokens: 350,
        messages: [
          {
            role: "system",
            content: `You are a radio copywriter. Write a smooth, professional radio DJ segment script.
The script should flow naturally as one continuous read — no stage directions, no sound effects labels, no brackets.
DJ: ${dj.name}. Show: "${dj.slot}". Personality: ${dj.traits}. Vibe: ${dj.vibe}.
Keep it under 120 words so it reads in about 50-60 seconds.${personalizedInstructions}`,
          },
          {
            role: "user",
            content: `Write a DJ segment for "${stationName}" (${genre} station, tagline: "${tagline}").

Structure:
1. Station ID: "You're listening to ${stationName}, ${tagline}"
2. DJ intro: ${dj.name} welcomes listeners${dj.timeLabel ? ` — it's ${dj.timeLabel}` : ""}
3. ${hasPersonalization ? `Personal welcome to ${prospectName}${venueName ? ` at ${venueName}` : ""}` : `Tease upcoming ${genre} music`}
4. Song intro: hype the next track
5. Brief station close: "${stationName}"

Write it as a single flowing script — no labels, just the words the DJ speaks.`,
          },
        ],
      });

      const script = scriptResponse.choices[0]?.message?.content;
      if (!script) continue;

      await trackAiSpend({ provider: "openai", operation: "chat", cost: 0.001, tokens: 500 });

      // Generate TTS audio
      let voicePcm: Buffer;

      if (isLoretta && lorettaVoiceId) {
        // Use ElevenLabs cloned voice for Loretta
        voicePcm = await generatePcmWithElevenLabs(script, lorettaVoiceId, {
          stability: lorettaStability,
          similarityBoost: lorettaSimilarity,
        });
        await trackAiSpend({
          provider: "elevenlabs",
          operation: "tts",
          cost: (script.length / 1000) * 0.30,
          characters: script.length,
        });
      } else {
        // Use OpenAI for the other DJs
        voicePcm = await generatePcmWithOpenAI(script, dj.voice);
        await trackAiSpend({ provider: "openai", operation: "tts", cost: 0.015, characters: script.length });
      }

      // Mix with music bed if available
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
      const timestamp = Date.now();
      const safeName = stationName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 20);
      const djSlug = dj.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const filename = `reel-${safeName}-${djSlug}-${timestamp}.wav`;
      const audioUrl = await saveAudioFileAsync(wavBuffer, "showreels", filename);

      segments.push({
        djName: dj.name,
        slot: dj.slot,
        timeLabel: dj.timeLabel,
        script,
        audioUrl,
        isPersonalized: !!hasPersonalization,
      });
    }

    if (segments.length === 0) {
      return NextResponse.json({ error: "Failed to generate any segments" }, { status: 500 });
    }

    return NextResponse.json({
      stationName,
      tagline,
      genre: template.genre,
      venueName: venueName || null,
      prospectName: prospectName || null,
      usedElevenLabs: !!lorettaVoiceId,
      segments,
    });
  } catch (error) {
    logger.error("Show reel generation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to generate show reel. Please try again." },
      { status: 500 },
    );
  }
}
