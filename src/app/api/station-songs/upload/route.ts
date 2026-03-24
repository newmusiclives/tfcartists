import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";
import { verifyStationAccess } from "@/lib/db-scoped";
import { uploadFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/station-songs/upload
 *
 * Upload a song audio file (to R2 or local fallback) and create a Song record.
 * Accepts multipart form data with:
 *   - file: audio file (required)
 *   - stationId: station ID (required)
 *   - title: song title (required)
 *   - artistName: artist name (required)
 *   - album, genre, duration, bpm, musicalKey, energy,
 *     rotationCategory, vocalGender, tempoCategory (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("admin", "cassidy");
    if (!session) return unauthorized();

    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const stationId = formData.get("stationId") as string | null;
    const title = formData.get("title") as string | null;
    const artistName = formData.get("artistName") as string | null;

    if (!file || !stationId || !title || !artistName) {
      return NextResponse.json(
        { error: "Missing required fields: file, stationId, title, artistName" },
        { status: 400 },
      );
    }

    // Verify station access
    const station = await verifyStationAccess(session, stationId);
    if (!station) {
      return NextResponse.json({ error: "Station not found or access denied" }, { status: 404 });
    }

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/x-wav"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: mp3, wav, ogg" },
        { status: 400 },
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename
    const ext = file.name.match(/\.\w+$/)?.[0] || ".mp3";
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
    const safeArtist = artistName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
    const filename = `${safeArtist}-${safeTitle}-${Date.now()}${ext}`;

    // Upload to R2 (or local fallback) under songs/ directory
    const fileUrl = await uploadFile(buffer, "songs", filename);

    // Parse optional metadata
    const album = formData.get("album") as string | null;
    const genre = formData.get("genre") as string | null;
    const durationStr = formData.get("duration") as string | null;
    const bpmStr = formData.get("bpm") as string | null;
    const musicalKey = formData.get("musicalKey") as string | null;
    const energyStr = formData.get("energy") as string | null;
    const rotationCategory = (formData.get("rotationCategory") as string) || "C";
    const vocalGender = (formData.get("vocalGender") as string) || "unknown";
    const tempoCategory = (formData.get("tempoCategory") as string) || "medium";

    const duration = durationStr ? parseInt(durationStr, 10) : null;
    const bpm = bpmStr ? parseInt(bpmStr, 10) : null;
    const energy = energyStr ? parseFloat(energyStr) : null;

    // Create the Song record
    const song = await prisma.song.create({
      data: {
        stationId,
        title,
        artistName,
        album: album || null,
        genre: genre || null,
        fileUrl,
        duration: duration && duration > 0 ? duration : null,
        bpm: bpm && bpm >= 20 && bpm <= 300 ? bpm : null,
        musicalKey: musicalKey || null,
        energy: energy !== null && energy >= 0 && energy <= 1 ? energy : null,
        rotationCategory,
        vocalGender,
        tempoCategory,
      },
    });

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/station-songs/upload");
  }
}
