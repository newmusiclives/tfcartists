import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { getConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

function buildDJPhotoPrompt(dj: {
  name: string;
  age: string | null;
  background: string | null;
  vibe: string | null;
}): string {
  const ageDesc = dj.age ? `, ${dj.age} years old` : "";
  const vibeDesc = dj.vibe ? ` Their personality: ${dj.vibe}.` : "";
  const bgDesc = dj.background
    ? ` Background context: ${dj.background.slice(0, 200)}.`
    : "";

  return (
    `Professional headshot photograph of a radio DJ named ${dj.name}${ageDesc}.` +
    `${vibeDesc}${bgDesc} ` +
    `Realistic photograph with natural lighting, shallow depth of field. ` +
    `Natural skin texture, authentic expression, no airbrushing. ` +
    `Casual clothing suitable for a country/Americana radio host. ` +
    `Warm-toned background suggesting a cozy radio studio. ` +
    `Shot in the style of editorial magazine photography. No text, no watermarks, no logos.`
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimited = await withRateLimit(request, "ai");
    if (rateLimited) return rateLimited;

    const { id } = await params;

    const apiKey = await getConfig("OPENAI_API_KEY");
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured. Set it in Admin → Settings." },
        { status: 500 }
      );
    }

    const dj = await prisma.dJ.findUnique({ where: { id } });
    if (!dj) {
      return NextResponse.json({ error: "DJ not found" }, { status: 404 });
    }

    const openai = new OpenAI({ apiKey });
    const prompt = buildDJPhotoPrompt(dj);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL returned from DALL-E" },
        { status: 500 }
      );
    }

    // Download and save the image
    const outputDir = path.join(process.cwd(), "public", "djs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const imageResponse = await fetch(imageUrl);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const filePath = path.join(outputDir, `${dj.slug}.png`);
    fs.writeFileSync(filePath, buffer);

    // Update database
    const photoUrl = `/djs/${dj.slug}.png`;
    await prisma.dJ.update({
      where: { id },
      data: { photoUrl },
    });

    return NextResponse.json({ photoUrl });
  } catch (error) {
    return handleApiError(error, "/api/station-djs/[id]/generate-photo");
  }
}
