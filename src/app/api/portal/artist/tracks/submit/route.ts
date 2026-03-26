import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { uploadFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/artist/tracks/submit
 * Submit a new track for review. Accepts multipart form data with audio file.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const artistId = formData.get("artistId") as string;
    const trackTitle = formData.get("trackTitle") as string;
    const genre = formData.get("genre") as string | null;
    const notes = formData.get("notes") as string | null;
    const audioFile = formData.get("audioFile") as File | null;

    if (!artistId || !trackTitle) {
      return NextResponse.json(
        { error: "Missing required fields: artistId, trackTitle" },
        { status: 400 }
      );
    }

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    let trackUrl: string | null = null;
    let duration: number | null = null;

    // Upload audio file to R2 if provided
    if (audioFile && audioFile.size > 0) {
      // Validate file type
      const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav", "audio/ogg"];
      if (!allowedTypes.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|ogg)$/i)) {
        return NextResponse.json(
          { error: "Invalid file type. Accepted formats: MP3, WAV, OGG" },
          { status: 400 }
        );
      }

      // Max 50MB
      if (audioFile.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 50MB." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await audioFile.arrayBuffer());
      const ext = audioFile.name.split(".").pop() || "mp3";
      const safeTitle = trackTitle.replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
      const filename = `${safeTitle}-${Date.now()}.${ext}`;

      trackUrl = await uploadFile(buffer, "submissions", filename);

      logger.info("Uploaded submission audio", {
        artistId,
        filename,
        size: audioFile.size,
      });
    }

    // Create submission record
    const submission = await prisma.trackSubmission.create({
      data: {
        artistId,
        trackTitle,
        trackUrl,
        genre: genre || null,
        duration,
        status: "pending",
        metadata: notes ? { curatorNotes: notes } : undefined,
      },
    });

    logger.info("Track submitted via artist portal", {
      submissionId: submission.id,
      artistId,
      trackTitle,
    });

    return NextResponse.json({
      submission: {
        id: submission.id,
        trackTitle: submission.trackTitle,
        status: submission.status,
        submittedAt: submission.createdAt,
      },
      message: "Track submitted for review. You will be notified when it is reviewed.",
    });
  } catch (error) {
    logger.error("Error submitting track", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to submit track" }, { status: 500 });
  }
}
