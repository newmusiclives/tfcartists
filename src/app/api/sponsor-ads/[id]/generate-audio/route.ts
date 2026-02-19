import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import {
  generateWithOpenAI,
  saveAudioFile,
} from "@/lib/radio/voice-track-tts";

export const dynamic = "force-dynamic";

// Map imaging voice type to OpenAI TTS voice (matches bulk generate-audio route)
const voiceMap: Record<string, string> = {
  male: "onyx",
  female: "nova",
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ad = await prisma.sponsorAd.findUnique({
      where: { id },
      include: { musicBed: true },
    });

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    if (!ad.scriptText) {
      return NextResponse.json(
        { error: "Ad has no scriptText to generate audio from" },
        { status: 400 }
      );
    }

    // Pick voice from station's imaging voice settings
    let openaiVoice = "onyx";
    const imagingVoice = await prisma.stationImagingVoice.findFirst({
      where: { stationId: ad.stationId, isActive: true },
    });
    if (imagingVoice) {
      openaiVoice = voiceMap[imagingVoice.voiceType] || "onyx";
    }

    const { buffer, ext } = await generateWithOpenAI(ad.scriptText, openaiVoice);

    const safeName = ad.adTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const filename = `ad-${safeName}-${id.slice(-6)}.${ext}`;
    const audioFilePath = saveAudioFile(buffer, "commercials", filename);

    // Estimate duration (~150 words per minute)
    const wordCount = ad.scriptText.split(/\s+/).length;
    const durationSeconds = Math.round((wordCount / 150) * 60 * 10) / 10;

    const updatedAd = await prisma.sponsorAd.update({
      where: { id },
      data: { audioFilePath, durationSeconds },
      include: { musicBed: true },
    });

    return NextResponse.json({ ad: updatedAd });
  } catch (error) {
    return handleApiError(error, "/api/sponsor-ads/[id]/generate-audio");
  }
}
