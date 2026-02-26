import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Rebuild gptSystemPrompt for weekday DJs from their surviving rich character fields.
 * The previous sync overwrote custom prompts with generic backend data.
 * This script reconstructs comprehensive prompts from: background, onAirStyle,
 * quirksAndHabits, atmosphere, voiceDescription, musicalFocus, vibe, hometown, showFormat.
 */

async function main() {
  const weekdayDJs = await prisma.dJ.findMany({
    where: { slug: { in: ["hank-westwood", "loretta-merrick", "doc-holloway", "cody-rampart"] } },
  });

  for (const dj of weekdayDJs) {
    const prompt = buildRichPrompt(dj);
    const catchPhrases = buildCatchPhrases(dj);

    await prisma.dJ.update({
      where: { id: dj.id },
      data: {
        // Restore bio from the original seed data (short version for display)
        bio: dj.background ? dj.background.split("\n\n").slice(0, 2).join(" ").substring(0, 300) : dj.bio,
        gptSystemPrompt: prompt,
        catchPhrases,
        additionalKnowledge: buildAdditionalKnowledge(dj),
      },
    });

    console.log(`REBUILT: ${dj.name} — ${prompt.length} char prompt, ${catchPhrases.split("\n").length} phrases`);
  }

  console.log("\nDone. All weekday DJ prompts rebuilt from character data.");
  await prisma.$disconnect();
}

function buildRichPrompt(dj: any): string {
  const sections: string[] = [];

  sections.push(`You are ${dj.name}, a DJ on North Country Radio (NCR), an independent Americana and country station on the TrueFans RADIO Network.`);

  if (dj.tagline) {
    sections.push(`TAGLINE: "${dj.tagline}"`);
  }

  if (dj.showFormat) {
    sections.push(`SHOW: ${dj.showFormat}`);
  }

  if (dj.vibe) {
    sections.push(`VIBE: ${dj.vibe}`);
  }

  if (dj.age && dj.hometown) {
    sections.push(`CHARACTER: ${dj.age} years old, from ${dj.hometown}`);
  }

  if (dj.voiceDescription) {
    sections.push(`YOUR VOICE:\n${dj.voiceDescription}`);
  }

  if (dj.background) {
    // Use the first few paragraphs of backstory — enough for character depth
    const paras = dj.background.split("\n\n").filter((p: string) => p.trim());
    const shortBackground = paras.slice(0, 4).join("\n\n");
    sections.push(`BACKSTORY:\n${shortBackground}`);
  }

  if (dj.onAirStyle) {
    sections.push(`ON-AIR STYLE:\n${dj.onAirStyle}`);
  }

  if (dj.musicalFocus) {
    sections.push(`MUSICAL FOCUS:\n${dj.musicalFocus}`);
  }

  if (dj.quirksAndHabits) {
    sections.push(`QUIRKS & HABITS:\n${dj.quirksAndHabits}`);
  }

  if (dj.atmosphere) {
    sections.push(`SHOW ATMOSPHERE:\n${dj.atmosphere}`);
  }

  if (dj.philosophy) {
    sections.push(`PHILOSOPHY: ${dj.philosophy}`);
  }

  // Parse personality traits
  let traits: string[] = [];
  try {
    traits = JSON.parse(dj.personalityTraits || "[]");
  } catch {
    traits = (dj.personalityTraits || "").split(",").map((t: string) => t.trim());
  }
  if (traits.length > 0) {
    sections.push(`PERSONALITY TRAITS: ${traits.join(", ")}`);
  }

  sections.push(`RULES:
- Stay in character at all times — you ARE this person
- Be conversational and natural — never robotic or scripted-sounding
- Reference songs, artists, and the music you just played or are about to play
- Keep it concise — radio DJ patter, not monologues
- Use your signature phrases naturally, not forced
- Champion independent artists and the TrueFans mission
- Never break character or mention being AI
- Draw on your backstory and quirks to make each break unique`);

  return sections.join("\n\n");
}

function buildCatchPhrases(dj: any): string {
  // Use existing catchPhrases if they look custom, otherwise derive from character data
  if (dj.catchPhrases && dj.catchPhrases.split("\n").length > 3) {
    return dj.catchPhrases;
  }

  // Derive from tagline and vibe
  const phrases: string[] = [];
  if (dj.tagline) phrases.push(dj.tagline);

  // Extract any quoted phrases from onAirStyle or musicalFocus
  const sources = [dj.onAirStyle, dj.musicalFocus, dj.background].filter(Boolean).join("\n");
  const quoted = sources.match(/"([^"]+)"/g);
  if (quoted) {
    for (const q of quoted.slice(0, 5)) {
      phrases.push(q.replace(/"/g, ""));
    }
  }

  return phrases.join("\n");
}

function buildAdditionalKnowledge(dj: any): string {
  const parts: string[] = [];

  if (dj.showFormat) parts.push(`Show Format: ${dj.showFormat}`);
  if (dj.hometown) parts.push(`Hometown: ${dj.hometown}`);
  if (dj.philosophy) parts.push(`Philosophy: ${dj.philosophy}`);

  // Include the full backstory as additional knowledge
  if (dj.background) {
    parts.push(`Full Background:\n${dj.background}`);
  }

  return parts.join("\n\n");
}

main().catch(console.error);
