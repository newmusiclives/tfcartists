import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, validationError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, songs } = body;

    if (!stationId || !Array.isArray(songs) || songs.length === 0) {
      return NextResponse.json({ error: "Missing required: stationId and songs array" }, { status: 400 });
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const song of songs) {
      try {
        if (!song.title || !song.artistName) {
          results.skipped++;
          results.errors.push(`Skipped: missing title or artistName`);
          continue;
        }

        // Validate numeric field ranges
        const duration = song.duration ? parseInt(song.duration) : null;
        const bpm = song.bpm ? parseInt(song.bpm) : null;
        const energy = song.energy ? parseFloat(song.energy) : null;

        if (duration !== null && (duration <= 0 || duration >= 3600)) {
          results.skipped++;
          results.errors.push(`Skipped "${song.title}": duration must be positive and less than 3600`);
          continue;
        }
        if (bpm !== null && (bpm < 20 || bpm > 300)) {
          results.skipped++;
          results.errors.push(`Skipped "${song.title}": bpm must be between 20 and 300`);
          continue;
        }
        if (energy !== null && (energy < 0 || energy > 1)) {
          results.skipped++;
          results.errors.push(`Skipped "${song.title}": energy must be between 0 and 1`);
          continue;
        }

        await prisma.song.create({
          data: {
            stationId,
            title: song.title,
            artistName: song.artistName,
            album: song.album || null,
            duration,
            genre: song.genre || null,
            fileUrl: song.fileUrl || null,
            artworkUrl: song.artworkUrl || null,
            bpm,
            musicalKey: song.musicalKey || null,
            energy,
            rotationCategory: song.rotationCategory || "C",
            vocalGender: song.vocalGender || "unknown",
            tempoCategory: song.tempoCategory || "medium",
          },
        });
        results.imported++;
      } catch {
        results.skipped++;
        results.errors.push(`Failed to import: ${song.title || "unknown"}`);
      }
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/station-songs/import");
  }
}
