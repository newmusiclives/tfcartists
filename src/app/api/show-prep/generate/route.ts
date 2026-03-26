import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getConfig } from "@/lib/config";
import { stationToday } from "@/lib/timezone";
import { fetchWeather, generateWeatherScript } from "@/lib/community/weather";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function friendlyDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// POST /api/show-prep/generate
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { djId, date: rawDate } = body;

    if (!djId) {
      return NextResponse.json({ error: "djId is required" }, { status: 400 });
    }

    // Resolve date — default to station today
    const targetDate = rawDate || formatDate(stationToday());

    // -----------------------------------------------------------------------
    // 1. Load DJ
    // -----------------------------------------------------------------------
    const dj = await prisma.dJ.findUnique({
      where: { id: djId },
      include: {
        station: true,
        clockAssignments: { where: { isActive: true }, take: 5 },
      },
    });

    if (!dj) {
      return NextResponse.json({ error: "DJ not found" }, { status: 404 });
    }

    const station = dj.station;
    const stationName = station?.name || "TrueFans Radio";

    // -----------------------------------------------------------------------
    // 2. Gather context data in parallel
    // -----------------------------------------------------------------------
    const dateStart = new Date(targetDate + "T00:00:00Z");
    const dateEnd = new Date(targetDate + "T23:59:59Z");
    const yesterdayStart = new Date(dateStart.getTime() - 86400000);

    const [
      weatherData,
      communityEvents,
      topPlayed,
      pendingRequests,
      activeSponsors,
    ] = await Promise.all([
      // Weather
      station?.stationLatitude && station?.stationLongitude
        ? fetchWeather(station.stationLatitude, station.stationLongitude).catch(
            (err) => {
              logger.warn("[ShowPrep] Weather fetch failed", {
                error: String(err),
              });
              return null;
            }
          )
        : Promise.resolve(null),

      // Community events upcoming within the next 7 days
      prisma.communityEvent.findMany({
        where: {
          ...(station ? { stationId: station.id } : {}),
          isActive: true,
          startDate: {
            gte: dateStart,
            lte: new Date(dateStart.getTime() + 7 * 86400000),
          },
        },
        orderBy: { startDate: "asc" },
        take: 10,
      }),

      // Top played songs yesterday (by play count in TrackPlayback)
      prisma.trackPlayback.groupBy({
        by: ["trackTitle", "artistName"],
        where: {
          playedAt: { gte: yesterdayStart, lt: dateStart },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),

      // Pending song requests
      prisma.songRequest.findMany({
        where: {
          ...(station ? { stationId: station.id } : {}),
          status: "pending",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Active sponsors
      prisma.sponsor.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
        },
        select: {
          businessName: true,
          sponsorshipTier: true,
          businessType: true,
        },
        take: 20,
      }),
    ]);

    // -----------------------------------------------------------------------
    // 3. Build weather string
    // -----------------------------------------------------------------------
    let weatherInfo = "Weather data not available.";
    if (weatherData) {
      weatherInfo = generateWeatherScript(weatherData, stationName);
    }

    // -----------------------------------------------------------------------
    // 4. Format gathered data for the AI prompt
    // -----------------------------------------------------------------------
    const topPlayedStr =
      topPlayed.length > 0
        ? topPlayed
            .map(
              (t, i) =>
                `${i + 1}. "${t.trackTitle}" by ${t.artistName} (${t._count.id} plays)`
            )
            .join("\n")
        : "No playback data from yesterday.";

    const eventsStr =
      communityEvents.length > 0
        ? communityEvents
            .map((e) => {
              const when = e.startDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return `- ${e.title} (${when}${e.location ? ` at ${e.location}` : ""})${e.description ? `: ${e.description}` : ""}`;
            })
            .join("\n")
        : "No upcoming community events.";

    const requestsStr =
      pendingRequests.length > 0
        ? pendingRequests
            .map(
              (r) =>
                `- "${r.songTitle}" by ${r.artistName}${r.listenerName ? ` (requested by ${r.listenerName})` : ""}${r.message ? ` — "${r.message}"` : ""}`
            )
            .join("\n")
        : "No pending listener requests.";

    const sponsorsStr =
      activeSponsors.length > 0
        ? activeSponsors
            .map(
              (s) =>
                `- ${s.businessName} (${s.sponsorshipTier || "standard"} tier, ${s.businessType})`
            )
            .join("\n")
        : "No active sponsors currently.";

    // DJ personality context
    let personalityContext = `DJ Name: ${dj.name}`;
    if (dj.personalityTraits) personalityContext += `\nPersonality Traits: ${dj.personalityTraits}`;
    if (dj.vibe) personalityContext += `\nVibe: ${dj.vibe}`;
    if (dj.tagline) personalityContext += `\nTagline: ${dj.tagline}`;
    if (dj.onAirStyle) personalityContext += `\nOn-Air Style: ${dj.onAirStyle}`;
    if (dj.catchPhrases) personalityContext += `\nCatch Phrases: ${dj.catchPhrases}`;
    if (dj.musicalFocus) personalityContext += `\nMusical Focus: ${dj.musicalFocus}`;
    if (dj.philosophy) personalityContext += `\nPhilosophy: ${dj.philosophy}`;

    // -----------------------------------------------------------------------
    // 5. Call OpenAI to generate the show prep sheet
    // -----------------------------------------------------------------------
    const apiKey = await getConfig("OPENAI_API_KEY");
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a show prep writer for a radio station called "${stationName}".
You are writing a prep sheet for DJ "${dj.name}". Write it in their voice and personality style.

${personalityContext}

Write a complete show prep sheet with exactly these sections. Use markdown formatting with ## headers.
Each section should feel natural and written in the DJ's personality/voice.

Sections required:
1. ## Weather & Greeting — A warm opening greeting with today's weather woven in naturally.
2. ## This Day in Music — 2-3 interesting "this day in music history" facts for ${friendlyDate(targetDate)}. These should be real, well-known music history facts.
3. ## Hot Tracks — Yesterday's top played songs with brief, personality-driven commentary on each.
4. ## Listener Requests — Pending listener requests with notes on how to acknowledge them on air.
5. ## Community Events — Upcoming local events to mention on air, with suggested talking points.
6. ## Sponsor Mentions — Active sponsors with natural-sounding mention suggestions (not scripted ads, just organic name-drops).
7. ## Conversation Starters — 3-4 fun, engaging topics the DJ could riff on between songs to connect with listeners.

Keep it conversational, practical, and ready-to-use. This is a working document, not a script.`;

    const userPrompt = `Generate a show prep sheet for ${friendlyDate(targetDate)}.

WEATHER:
${weatherInfo}

YESTERDAY'S TOP PLAYED:
${topPlayedStr}

PENDING LISTENER REQUESTS:
${requestsStr}

UPCOMING COMMUNITY EVENTS:
${eventsStr}

ACTIVE SPONSORS:
${sponsorsStr}

Station genre: ${station?.genre || "Americana / Country / Singer-Songwriter"}`;

    logger.info("[ShowPrep] Generating prep sheet", {
      djId,
      djName: dj.name,
      date: targetDate,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 2500,
    });

    const prepContent =
      completion.choices[0]?.message?.content || "Failed to generate prep sheet.";

    // -----------------------------------------------------------------------
    // 6. Store in SystemConfig
    // -----------------------------------------------------------------------
    const configKey = `show_prep:${djId}:${targetDate}`;

    const storedValue = JSON.stringify({
      djId,
      djName: dj.name,
      date: targetDate,
      content: prepContent,
      generatedAt: new Date().toISOString(),
      model: "gpt-4o-mini",
      sections: {
        weatherAvailable: !!weatherData,
        topPlayedCount: topPlayed.length,
        eventsCount: communityEvents.length,
        requestsCount: pendingRequests.length,
        sponsorsCount: activeSponsors.length,
      },
    });

    await prisma.systemConfig.upsert({
      where: { key: configKey },
      create: {
        key: configKey,
        value: storedValue,
        category: "show_prep",
        label: `Show Prep: ${dj.name} - ${targetDate}`,
        encrypted: false,
      },
      update: {
        value: storedValue,
        label: `Show Prep: ${dj.name} - ${targetDate}`,
        updatedAt: new Date(),
      },
    });

    logger.info("[ShowPrep] Prep sheet generated and stored", {
      djId,
      date: targetDate,
      configKey,
    });

    return NextResponse.json({
      success: true,
      prepSheet: {
        djId,
        djName: dj.name,
        date: targetDate,
        content: prepContent,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("[ShowPrep] Generation failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to generate show prep",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/show-prep/generate?djId=xxx&date=YYYY-MM-DD
// Retrieve a previously generated prep sheet
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const djId = searchParams.get("djId");
    const date = searchParams.get("date");

    // If djId provided, get specific prep sheet or list history
    if (djId && date) {
      const configKey = `show_prep:${djId}:${date}`;
      const config = await prisma.systemConfig.findUnique({
        where: { key: configKey },
      });

      if (!config) {
        return NextResponse.json({ prepSheet: null });
      }

      const parsed = JSON.parse(config.value);
      return NextResponse.json({ prepSheet: parsed });
    }

    // List all prep sheets (optionally filtered by djId)
    const where: Record<string, unknown> = { category: "show_prep" };
    if (djId) {
      where.key = { startsWith: `show_prep:${djId}:` };
    }

    const configs = await prisma.systemConfig.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const history = configs.map((c) => {
      try {
        const parsed = JSON.parse(c.value);
        return {
          key: c.key,
          djId: parsed.djId,
          djName: parsed.djName,
          date: parsed.date,
          generatedAt: parsed.generatedAt,
          sections: parsed.sections,
        };
      } catch {
        return {
          key: c.key,
          djId: null,
          djName: null,
          date: null,
          generatedAt: c.updatedAt?.toISOString(),
        };
      }
    });

    return NextResponse.json({ history });
  } catch (error) {
    logger.error("[ShowPrep] Fetch failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch show prep data" },
      { status: 500 }
    );
  }
}
