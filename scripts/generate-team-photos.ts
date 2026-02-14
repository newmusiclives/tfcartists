/**
 * Generate team member portrait photos using DALL-E 3
 *
 * Usage:
 *   npx tsx scripts/generate-team-photos.ts
 *   npx tsx scripts/generate-team-photos.ts --team riley
 *   npx tsx scripts/generate-team-photos.ts --name "Grace Holland"
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUTPUT_DIR = path.join(process.cwd(), "public", "team");

interface TeamMemberDef {
  slug: string;
  name: string;
  team: string;
  role: string;
  appearance: string;
}

const TEAM_MEMBERS: TeamMemberDef[] = [
  // --- Team Riley (Artist Airplay) ---
  {
    slug: "riley-carpenter",
    name: "Riley Carpenter",
    team: "riley",
    role: "AI Sales Director",
    appearance: "Confident woman in her early 30s, warm smile, stylish business-casual attire, dark hair pulled back, energetic and approachable demeanor",
  },
  {
    slug: "grace-holland",
    name: "Grace Holland",
    team: "riley",
    role: "Outreach & Artist Relations",
    appearance: "Friendly woman in her late 20s, auburn hair, expressive eyes, wearing a creative blouse, welcoming and personable energy",
  },
  {
    slug: "marcus-tate",
    name: "Marcus Tate",
    team: "riley",
    role: "Tier Management & Analytics",
    appearance: "Thoughtful Black man in his mid-30s, clean-cut with glasses, professional button-down shirt, analytical and composed expression",
  },
  {
    slug: "sienna-park",
    name: "Sienna Park",
    team: "riley",
    role: "Content Vetting & Quality Control",
    appearance: "Detail-oriented Korean-American woman in her late 20s, sleek dark hair, wearing headphones around her neck, focused and precise look",
  },
  {
    slug: "jordan-cross",
    name: "Jordan Cross",
    team: "riley",
    role: "Payment Processing & Artist Support",
    appearance: "Reliable man in his early 30s, short brown hair, neat appearance, wearing a smart polo shirt, trustworthy and organized look",
  },

  // --- Team Harper (Sponsor Sales) ---
  {
    slug: "harper-ai",
    name: "Harper AI",
    team: "harper",
    role: "Sponsor Sales Director",
    appearance: "Polished woman in her mid-30s, blonde highlights in brown hair, sharp business attire with a confident stance, sales leader energy",
  },
  {
    slug: "blake-morrison",
    name: "Blake Morrison",
    team: "harper",
    role: "Outreach & Business Development",
    appearance: "Charismatic man in his late 20s, wavy brown hair, casual blazer over a t-shirt, warm handshake-ready smile, outgoing personality",
  },
  {
    slug: "cameron-wells",
    name: "Cameron Wells",
    team: "harper",
    role: "Account Management & Analytics",
    appearance: "Professional woman in her early 30s, straight dark hair, smart blouse, calm and reassuring demeanor, data-driven look",
  },
  {
    slug: "dakota-chen",
    name: "Dakota Chen",
    team: "harper",
    role: "Ad Operations & Quality Control",
    appearance: "Focused Chinese-American man in his late 20s, modern haircut, casual tech-company style clothing, meticulous and detail-oriented expression",
  },
  {
    slug: "riley-nguyen",
    name: "Riley Nguyen",
    team: "harper",
    role: "Billing & Revenue Operations",
    appearance: "Organized Vietnamese-American woman in her early 30s, glasses, neat professional appearance, competent and reliable energy",
  },

  // --- Team Cassidy (Music Curation) ---
  {
    slug: "cassidy-monroe",
    name: "Cassidy Monroe",
    team: "cassidy",
    role: "Music Director",
    appearance: "Creative woman in her mid-30s, wavy red-brown hair, bohemian-chic style with layered jewelry, artistic and authoritative presence",
  },
  {
    slug: "dakota-wells",
    name: "Dakota Wells",
    team: "cassidy",
    role: "Production Engineer",
    appearance: "Technical man in his early 30s, short beard, wearing a flannel shirt, studio headphones around neck, hands-on audio engineer vibe",
  },
  {
    slug: "maya-reeves",
    name: "Maya Reeves",
    team: "cassidy",
    role: "Program Director",
    appearance: "Strategic Black woman in her mid-30s, natural hair styled elegantly, smart blazer, commanding and creative radio programming leader",
  },
  {
    slug: "jesse-coleman",
    name: "Jesse Coleman",
    team: "cassidy",
    role: "Artist Relations",
    appearance: "Warm man in his late 20s, curly dark hair, casual denim jacket, approachable musician-turned-mentor look, empathetic smile",
  },
  {
    slug: "dr-sam-chen",
    name: "Dr. Sam Chen",
    team: "cassidy",
    role: "Musicologist",
    appearance: "Scholarly Chinese-American man in his early 40s, silver-streaked hair, round glasses, tweed jacket, intellectual and passionate about music history",
  },
  {
    slug: "whitley-cross",
    name: "Whitley Cross",
    team: "cassidy",
    role: "Audience Development",
    appearance: "Data-savvy woman in her late 20s, blonde pixie cut, modern fashion, laptop or tablet in hand, sharp analytical energy with creative flair",
  },

  // --- Team Elliot (Listener Growth) ---
  {
    slug: "elliot-brooks",
    name: "Elliot Brooks",
    team: "elliot",
    role: "AI Director of Listener Growth",
    appearance: "Visionary man in his early 30s, warm brown skin, neatly groomed beard, stylish casual wear, strategic thinker with approachable charisma",
  },
  {
    slug: "nova-lane",
    name: "Nova Lane",
    team: "elliot",
    role: "Social Amplification Lead",
    appearance: "Energetic young woman in her mid-20s, colorful streaks in dark hair, trendy streetwear, holding a phone, TikTok creator energy, vibrant and fun",
  },
  {
    slug: "river-maxwell",
    name: "River Maxwell",
    team: "elliot",
    role: "Artist Fan Activation Lead",
    appearance: "Empathetic man in his late 20s, shoulder-length hair, casual flannel and jeans, warm smile, artist-community bridge builder vibe",
  },
  {
    slug: "sage-hart",
    name: "Sage Hart",
    team: "elliot",
    role: "Community & Loyalty Lead",
    appearance: "Warm-hearted woman in her early 30s, soft curly brown hair, cozy sweater, gentle smile, community-builder who makes everyone feel welcome",
  },
  {
    slug: "orion-pike",
    name: "Orion Pike",
    team: "elliot",
    role: "Data & Habit Formation Lead",
    appearance: "Analytical man in his early 30s, sharp features, wire-frame glasses, clean modern style, behavioral scientist who understands human patterns",
  },
];

function buildPrompt(member: TeamMemberDef): string {
  return [
    `Professional corporate team headshot portrait photo.`,
    `${member.name}, ${member.role} at a modern music/radio company.`,
    member.appearance,
    `Style: photorealistic headshot, clean modern office or studio background, professional lighting, shallow depth of field.`,
    `No text, no watermarks, no logos.`,
  ].join(" ");
}

async function generatePhoto(member: TeamMemberDef) {
  const prompt = buildPrompt(member);
  const outputPath = path.join(OUTPUT_DIR, `${member.slug}.png`);

  console.log(`\n[${member.team.toUpperCase()}] Generating photo for ${member.name}...`);
  console.log(`  Role: ${member.role}`);

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    console.error(`  No image URL returned for ${member.name}`);
    return false;
  }

  const imageResponse = await fetch(imageUrl);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`  Saved: public/team/${member.slug}.png`);
  return true;
}

async function main() {
  const teamFlag = process.argv.indexOf("--team");
  const nameFlag = process.argv.indexOf("--name");
  const targetTeam = teamFlag !== -1 ? process.argv[teamFlag + 1] : null;
  const targetName = nameFlag !== -1 ? process.argv[nameFlag + 1] : null;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let members = TEAM_MEMBERS;
  if (targetTeam) {
    members = members.filter((m) => m.team === targetTeam);
  }
  if (targetName) {
    members = members.filter((m) => m.name.toLowerCase().includes(targetName.toLowerCase()));
  }

  if (members.length === 0) {
    console.log("No matching team members found.");
    return;
  }

  console.log(`Generating photos for ${members.length} team member(s)...\n`);

  let success = 0;
  let failed = 0;

  for (const member of members) {
    try {
      const ok = await generatePhoto(member);
      if (ok) success++;
      else failed++;
      // Delay between requests
      if (members.length > 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (error: any) {
      console.error(`  ERROR for ${member.name}:`, error?.message || error);
      failed++;
    }
  }

  console.log(`\nDone! ${success} generated, ${failed} failed.`);

  if (failed > 0) {
    console.log("Re-run with --name to retry individual members.");
  }
}

main().catch(console.error);
