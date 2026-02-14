/**
 * Generate DJ portrait photos using DALL-E 3
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-dj-photos.ts
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-dj-photos.ts --slug hank-westwood
 */

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUTPUT_DIR = path.join(process.cwd(), "public", "djs");

function buildDJPhotoPrompt(dj: {
  name: string;
  age: string | null;
  background: string | null;
  vibe: string | null;
}): string {
  const parts = [
    `Professional radio DJ portrait photo. ${dj.name}`,
    dj.age ? `${dj.age} years old` : null,
    dj.background ? `${dj.background}` : null,
    dj.vibe ? `Vibe: ${dj.vibe}.` : null,
    "Style: photorealistic headshot, warm studio lighting, radio station setting. No text or watermarks.",
  ];
  return parts.filter(Boolean).join(". ");
}

async function generatePhoto(dj: {
  id: string;
  name: string;
  slug: string;
  age: string | null;
  background: string | null;
  vibe: string | null;
}) {
  const prompt = buildDJPhotoPrompt(dj);
  const outputPath = path.join(OUTPUT_DIR, `${dj.slug}.png`);

  console.log(`Generating photo for ${dj.name}...`);
  console.log(`  Prompt: ${prompt.slice(0, 120)}...`);

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    console.error(`  No image URL returned for ${dj.name}`);
    return;
  }

  // Download the image
  const imageResponse = await fetch(imageUrl);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`  Saved to ${outputPath}`);

  // Update database
  const photoUrl = `/djs/${dj.slug}.png`;
  await prisma.dJ.update({
    where: { id: dj.id },
    data: { photoUrl },
  });
  console.log(`  Updated DB: photoUrl = ${photoUrl}`);
}

async function main() {
  // Parse --slug flag
  const slugIndex = process.argv.indexOf("--slug");
  const targetSlug = slugIndex !== -1 ? process.argv[slugIndex + 1] : null;

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get DJs from database
  const where = targetSlug ? { slug: targetSlug } : {};
  const djs = await prisma.dJ.findMany({ where, orderBy: { priority: "asc" } });

  if (djs.length === 0) {
    console.log(targetSlug ? `No DJ found with slug "${targetSlug}"` : "No DJs in database");
    return;
  }

  console.log(`\nGenerating photos for ${djs.length} DJ(s)...\n`);

  for (const dj of djs) {
    try {
      await generatePhoto(dj);
      // Small delay between requests to avoid rate limits
      if (djs.length > 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (error) {
      console.error(`  Error generating photo for ${dj.name}:`, error);
    }
  }

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
