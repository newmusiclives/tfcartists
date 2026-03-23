import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/playout/audio/:id
 *
 * Serves voice track or feature audio for the playout server.
 * Handles base64 data URIs (stored in DB when R2 is not configured),
 * R2 URLs (redirects), and local file paths.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  // Try voice track first
  const vt = await prisma.voiceTrack.findUnique({
    where: { id },
    select: { audioFilePath: true },
  });

  let audioPath = vt?.audioFilePath;

  // If not a voice track, try feature content
  if (!audioPath) {
    const fc = await prisma.featureContent.findUnique({
      where: { id },
      select: { audioFilePath: true },
    });
    audioPath = fc?.audioFilePath;
  }

  // If not a feature, try show transition
  if (!audioPath) {
    const st = await prisma.showTransition.findFirst({
      where: { id },
      select: { audioFilePath: true },
    });
    audioPath = st?.audioFilePath;
  }

  // Try sponsor ad
  if (!audioPath) {
    const ad = await prisma.sponsorAd.findFirst({
      where: { id },
      select: { audioFilePath: true, audioDataUri: true },
    });
    audioPath = ad?.audioFilePath || ad?.audioDataUri;
  }

  if (!audioPath) {
    return NextResponse.json({ error: "Audio not found" }, { status: 404 });
  }

  // Handle base64 data URIs
  if (audioPath.startsWith("data:")) {
    const match = audioPath.match(/^data:(audio\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid data URI" }, { status: 500 });
    }
    const [, mimeType, base64Data] = match;
    const buffer = Buffer.from(base64Data, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Handle R2/HTTP URLs — redirect
  if (audioPath.startsWith("http")) {
    return NextResponse.redirect(audioPath);
  }

  // Handle local paths (e.g., /audio/voice-tracks/vt-xxx.wav)
  // Serve from public directory
  try {
    const fs = await import("fs");
    const path = await import("path");
    const fullPath = path.join(process.cwd(), "public", audioPath);
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      const ext = path.extname(audioPath).toLowerCase();
      const mimeType = ext === ".wav" ? "audio/wav" : ext === ".mp3" ? "audio/mpeg" : "audio/octet-stream";
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(buffer.length),
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  } catch {
    // Serverless — can't read local files
  }

  return NextResponse.json({ error: "Audio file not accessible" }, { status: 404 });
}
