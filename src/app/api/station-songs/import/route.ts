import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

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

        await prisma.song.create({
          data: {
            stationId,
            title: song.title,
            artistName: song.artistName,
            album: song.album || null,
            duration: song.duration ? parseInt(song.duration) : null,
            genre: song.genre || null,
            fileUrl: song.fileUrl || null,
            artworkUrl: song.artworkUrl || null,
            bpm: song.bpm ? parseInt(song.bpm) : null,
            musicalKey: song.musicalKey || null,
            energy: song.energy ? parseFloat(song.energy) : null,
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
