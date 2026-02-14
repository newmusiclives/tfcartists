import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
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
