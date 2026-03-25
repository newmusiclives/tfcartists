import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter: max 10 messages per IP per minute
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// Periodically clean up stale entries so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 60_000);

// ---------------------------------------------------------------------------
// POST /api/dj-chat
// Body: { message: string; djSlug: string; listenerName?: string }
// Returns: { reply: string; djName: string }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // Rate-limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Slow down! Too many messages. Try again in a minute." },
        { status: 429 }
      );
    }

    // Parse body
    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== "string" || typeof body.djSlug !== "string") {
      return NextResponse.json(
        { error: "Missing required fields: message, djSlug" },
        { status: 400 }
      );
    }

    const { message, djSlug, listenerName } = body as {
      message: string;
      djSlug: string;
      listenerName?: string;
    };

    if (message.trim().length === 0 || message.length > 500) {
      return NextResponse.json(
        { error: "Message must be between 1 and 500 characters" },
        { status: 400 }
      );
    }

    // Look up the DJ
    const dj = await prisma.dJ.findUnique({
      where: { slug: djSlug },
      select: {
        name: true,
        personalityTraits: true,
        voiceDescription: true,
        bio: true,
        vibe: true,
        catchPhrases: true,
        onAirStyle: true,
        musicalFocus: true,
      },
    });

    if (!dj) {
      return NextResponse.json({ error: "DJ not found" }, { status: 404 });
    }

    // Get OpenAI API key
    const apiKey = await getConfig("OPENAI_API_KEY");
    if (!apiKey) {
      logger.error("DJ Chat: OPENAI_API_KEY not configured");
      return NextResponse.json(
        { error: "Chat is temporarily unavailable" },
        { status: 503 }
      );
    }

    // Build the system prompt
    const traits = dj.personalityTraits || "";
    const listenerRef = listenerName ? `The listener's name is ${listenerName}. Use it occasionally.` : "";

    const systemPrompt = `You are ${dj.name}, a radio DJ currently on air at TrueFans Radio, an Americana/roots music station.

PERSONALITY & VOICE:
${dj.voiceDescription ? `- Voice style: ${dj.voiceDescription}` : ""}
${traits ? `- Personality traits: ${traits}` : ""}
${dj.vibe ? `- Vibe: ${dj.vibe}` : ""}
${dj.onAirStyle ? `- On-air style: ${dj.onAirStyle}` : ""}
${dj.catchPhrases ? `- Signature phrases: ${dj.catchPhrases}` : ""}
${dj.musicalFocus ? `- Musical focus: ${dj.musicalFocus}` : ""}

RULES:
- Stay in character as ${dj.name} at all times. Never break character.
- Never mention being an AI, a language model, or anything that breaks the radio DJ illusion.
- Keep responses SHORT — 2-3 sentences max, like real DJ banter between songs.
- Be warm, personable, and conversational. This is radio, not a lecture.
- You can talk about music, the station, take song dedications, share stories, or just shoot the breeze.
- If asked about something outside your expertise, deflect naturally like a real DJ would.
${listenerRef}`;

    // Call OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "unknown");
      logger.error("DJ Chat: OpenAI API error", {
        status: openaiRes.status,
        body: errText.slice(0, 300),
      });
      return NextResponse.json(
        { error: "Chat is temporarily unavailable" },
        { status: 502 }
      );
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "Sorry, got distracted by this great track! What was that?";

    logger.debug("DJ Chat response", { dj: dj.name, messageLength: message.length });

    return NextResponse.json({ reply, djName: dj.name });
  } catch (err) {
    logger.error("DJ Chat: unhandled error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
