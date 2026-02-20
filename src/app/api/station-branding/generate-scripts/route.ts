import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiProvider } from "@/lib/ai/providers";
import { handleApiError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

interface ImagingScript {
  label: string;
  text: string;
  musicBed: string;
}

const CATEGORY_CONFIGS: Record<
  string,
  { type: "toh" | "sweeper" | "promo" | "overnight"; djSlug?: string; count: number }
> = {
  toh: { type: "toh", count: 5 },
  sweeper_general: { type: "sweeper", count: 6 },
  sweeper_hank_westwood: { type: "sweeper", djSlug: "hank-westwood", count: 4 },
  sweeper_loretta_merrick: { type: "sweeper", djSlug: "loretta-merrick", count: 4 },
  sweeper_doc_holloway: { type: "sweeper", djSlug: "doc-holloway", count: 4 },
  sweeper_cody_rampart: { type: "sweeper", djSlug: "cody-rampart", count: 4 },
  promo_general: { type: "promo", count: 5 },
  promo_hank_westwood: { type: "promo", djSlug: "hank-westwood", count: 3 },
  promo_loretta_merrick: { type: "promo", djSlug: "loretta-merrick", count: 3 },
  promo_doc_holloway: { type: "promo", djSlug: "doc-holloway", count: 3 },
  promo_cody_rampart: { type: "promo", djSlug: "cody-rampart", count: 3 },
  overnight: { type: "overnight", count: 5 },
};

function buildPrompt(
  station: { name: string; callSign: string | null; tagline: string | null; genre: string; formatType: string | null },
  type: string,
  count: number,
  dj?: { name: string; catchPhrases: string | null; gptSystemPrompt: string | null; additionalKnowledge: string | null; showFormat: string | null; onAirStyle: string | null; atmosphere: string | null; vibe: string | null } | null
): string {
  const stationInfo = `Station: ${station.name}${station.callSign ? ` (${station.callSign})` : ""}
Tagline: ${station.tagline || "N/A"}
Genre: ${station.genre}
Format: ${station.formatType || "americana"}`;

  let instructions = "";

  switch (type) {
    case "toh":
      instructions = `Write ${count} Top of Hour station ID scripts for radio. Each must:
- Be under 15 seconds when spoken aloud
- Legally identify the station by name/call sign
- Feel warm, authentic, and match the station's americana/roots vibe
- Vary in style: some simple, some with flair`;
      break;

    case "sweeper":
      if (dj) {
        instructions = `Write ${count} DJ-specific sweeper scripts (5-10 seconds spoken) for ${dj.name}.
These are quick brand drops between songs, IN CHARACTER as ${dj.name}.

DJ Personality:
${dj.gptSystemPrompt || dj.vibe || "Warm, authentic radio personality"}
Catch Phrases: ${dj.catchPhrases || "None specified"}
${dj.additionalKnowledge ? `Additional Context: ${dj.additionalKnowledge}` : ""}

Each sweeper should feel like ${dj.name} talking naturally between songs, using their voice and personality.`;
      } else {
        instructions = `Write ${count} general sweeper scripts (5-10 seconds spoken) for the station.
These are quick brand drops between songs. No DJ personality — just the station brand.
Keep them punchy, warm, and varied in style.`;
      }
      break;

    case "promo":
      if (dj) {
        instructions = `Write ${count} show promo scripts (15-30 seconds spoken) for ${dj.name}'s show.

DJ Profile:
Show Format: ${dj.showFormat || "Live radio show"}
On-Air Style: ${dj.onAirStyle || "Authentic and engaging"}
Atmosphere: ${dj.atmosphere || "Warm and inviting"}
${dj.catchPhrases ? `Catch Phrases: ${dj.catchPhrases}` : ""}
${dj.additionalKnowledge ? `Additional Context: ${dj.additionalKnowledge}` : ""}

Each promo should sell the experience of listening to ${dj.name}'s show, highlighting what makes it special.`;
      } else {
        instructions = `Write ${count} general station promo scripts (15-30 seconds spoken).
Highlight the station format, DJ lineup (weekday DJs: Hank Westwood 6-9am, Loretta Merrick 9am-12pm, Doc Holloway 12-3pm, Cody Rampart 3-6pm), and the listening experience.
Sell the station as a destination for music lovers.`;
      }
      break;

    case "overnight":
      instructions = `Write ${count} overnight automation imaging scripts (5-15 seconds spoken).
These play between 6pm and 6am when no live DJ is on air.
- Warm, late-night radio feel
- No references to specific DJs
- Evoke the mood of late-night/early-morning listening
- Cozy, intimate, like the station is keeping you company`;
      break;
  }

  return `You are a radio imaging scriptwriter. ${stationInfo}

${instructions}

For each script, also suggest a music bed style (e.g., "Soft acoustic guitar bed", "Upbeat banjo and fiddle").

Respond with ONLY a JSON array of objects, each with "label", "text", and "musicBed" fields. No markdown, no explanation.
Example: [{"label":"Morning ID 1","text":"This is North Country Radio...","musicBed":"Warm acoustic guitar"}]`;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const { stationId, category } = await request.json();

    if (!stationId || !category || !CATEGORY_CONFIGS[category]) {
      return NextResponse.json({ error: "Invalid stationId or category" }, { status: 400 });
    }

    const config = CATEGORY_CONFIGS[category];

    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { name: true, callSign: true, tagline: true, genre: true, formatType: true },
    });

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    let dj: { name: string; catchPhrases: string | null; gptSystemPrompt: string | null; additionalKnowledge: string | null; showFormat: string | null; onAirStyle: string | null; atmosphere: string | null; vibe: string | null } | null = null;
    if (config.djSlug) {
      dj = await prisma.dJ.findUnique({
        where: { slug: config.djSlug },
        select: {
          name: true,
          catchPhrases: true,
          gptSystemPrompt: true,
          additionalKnowledge: true,
          showFormat: true,
          onAirStyle: true,
          atmosphere: true,
          vibe: true,
        },
      });
    }

    const prompt = buildPrompt(station, config.type, config.count, dj);

    const response = await aiProvider.chat(
      [
        { role: "system", content: "You are a professional radio imaging scriptwriter. Always respond with valid JSON arrays only." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.9, maxTokens: 2000 }
    );

    let scripts: ImagingScript[];
    try {
      const parsed = JSON.parse(response.content);
      scripts = Array.isArray(parsed) ? parsed : [];
    } catch {
      // Try extracting JSON from the response if it contains extra text
      const match = response.content.match(/\[[\s\S]*\]/);
      if (match) {
        scripts = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 502 });
      }
    }

    // Validate shape
    scripts = scripts.map((s, i) => ({
      label: s.label || `Script ${i + 1}`,
      text: s.text || "",
      musicBed: s.musicBed || "",
    }));

    return NextResponse.json({ scripts });
  } catch (error) {
    return handleApiError(error, "/api/station-branding/generate-scripts");
  }
}
