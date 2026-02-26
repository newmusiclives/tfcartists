import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Sync DJ persona data from the Railway backend into the frontend Prisma DB.
 * Maps backend fields → frontend fields for all 13 DJs.
 */

interface BackendDJ {
  id: string;
  display_name: string;
  tagline: string;
  description: string;
  curation_philosophy: string;
  personality_traits: string[];
  signature_phrases: string[];
  temperature: number;
  time_slots: Record<string, string[]>;
  current_time_slot: string;
  schedule_type: string;
  is_active: boolean;
}

// Backend DJ ID → Frontend DJ slug mapping
const DJ_ID_TO_SLUG: Record<string, string> = {
  hank_westwood: "hank-westwood",
  loretta_merrick: "loretta-merrick",
  doc_holloway: "doc-holloway",
  cody_rampart: "cody-rampart",
  jo_mcallister: "jo-mcallister",
  paul_saunders: "paul-saunders",
  ezra_stone: "ezra-stone",
  carmen_vasquez: "carmen-vasquez",
  sam_turnbull: "sam-turnbull",
  ruby_finch: "ruby-finch",
  mark_faulkner: "mark-faulkner",
  iris_langley: "iris-langley",
  levi_bridges: "levi-bridges",
};

async function main() {
  // Fetch backend DJ data
  const loginRes = await fetch(
    "https://tfc-radio-backend-production.up.railway.app/api/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "username=admin&password=TFCradio2024%21",
    }
  );
  const { access_token } = await loginRes.json();

  const djRes = await fetch(
    "https://tfc-radio-backend-production.up.railway.app/api/admin/djs",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  const djData = await djRes.json();
  const backendDJs: BackendDJ[] = Array.isArray(djData) ? djData : djData.djs || [];

  console.log(`Fetched ${backendDJs.length} DJs from backend\n`);

  let updated = 0;
  let skipped = 0;

  for (const bdj of backendDJs) {
    const slug = DJ_ID_TO_SLUG[bdj.id];
    if (!slug) {
      console.log(`SKIP: No slug mapping for backend DJ "${bdj.id}"`);
      skipped++;
      continue;
    }

    const frontendDJ = await prisma.dJ.findFirst({ where: { slug } });
    if (!frontendDJ) {
      console.log(`SKIP: No frontend DJ found for slug "${slug}"`);
      skipped++;
      continue;
    }

    // Build the gptSystemPrompt from backend persona data
    const systemPrompt = buildSystemPrompt(bdj);
    const catchPhrases = bdj.signature_phrases.join("\n");
    const additionalKnowledge = [
      `Schedule: ${bdj.current_time_slot}`,
      `Curation Philosophy: ${bdj.curation_philosophy}`,
    ].join("\n\n");

    await prisma.dJ.update({
      where: { id: frontendDJ.id },
      data: {
        tagline: bdj.tagline,
        bio: bdj.description,
        philosophy: bdj.curation_philosophy,
        personalityTraits: JSON.stringify(bdj.personality_traits),
        catchPhrases,
        gptSystemPrompt: systemPrompt,
        gptTemperature: bdj.temperature,
        additionalKnowledge,
        isActive: bdj.is_active,
      },
    });

    console.log(`OK: ${bdj.display_name} (${slug}) — synced persona`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
  await prisma.$disconnect();
}

function buildSystemPrompt(dj: BackendDJ): string {
  const traits = dj.personality_traits.join(", ");
  const phrases = dj.signature_phrases.map((p) => `"${p}"`).join(", ");

  return `You are ${dj.display_name}, a DJ on North Country Radio (NCR), an independent Americana and country station on the TrueFans RADIO Network.

TAGLINE: "${dj.tagline}"

PERSONALITY: ${traits}

YOUR VOICE: ${dj.description}

CURATION PHILOSOPHY: ${dj.curation_philosophy}

SIGNATURE PHRASES (use naturally, not every time): ${phrases}

SCHEDULE: ${dj.current_time_slot}

RULES:
- Stay in character at all times
- Be conversational and natural — never robotic or scripted-sounding
- Reference songs, artists, and the music you just played or are about to play
- Keep it concise — radio DJ patter, not monologues
- Champion independent artists and the TrueFans mission
- Never break character or mention being AI`;
}

main().catch(console.error);
