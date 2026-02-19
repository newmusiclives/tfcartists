import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/playout/hour — full program log for one broadcast hour.
 *
 * The Railway backend calls this to build the actual stream.
 * Returns every slot in order: songs, voice tracks, features, imaging, ads.
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const stationId = sp.get("stationId");
    const date = sp.get("date");
    const hour = sp.get("hour");

    if (!stationId || !date || hour === null) {
      return NextResponse.json(
        { error: "stationId, date, and hour are required" },
        { status: 400 }
      );
    }

    const airDate = new Date(date);
    airDate.setHours(0, 0, 0, 0);
    const hourOfDay = parseInt(hour, 10);

    // Find the hour playlist
    const playlist = await prisma.hourPlaylist.findFirst({
      where: {
        stationId,
        airDate,
        hourOfDay,
        status: { in: ["locked", "aired"] },
      },
      include: { voiceTracks: true },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: "No locked playlist found for this hour" },
        { status: 404 }
      );
    }

    const slots = JSON.parse(playlist.slots);

    // Build voice track lookup by position
    const vtByPosition = new Map(
      playlist.voiceTracks
        .filter((vt) => vt.status === "audio_ready")
        .map((vt) => [vt.position, vt])
    );

    // Look up feature content for feature slots
    const featureSlots = slots.filter((s: { type: string; featureContentId?: string }) =>
      s.type === "feature" && s.featureContentId
    );
    const featureIds = featureSlots.map((s: { featureContentId: string }) => s.featureContentId);
    const features = featureIds.length > 0
      ? await prisma.featureContent.findMany({
          where: { id: { in: featureIds } },
        })
      : [];
    const featureMap = new Map(features.map((f) => [f.id, f]));

    // Look up songs for file URLs
    const songIds = slots
      .filter((s: { type: string; songId?: string }) => s.type === "song" && s.songId)
      .map((s: { songId: string }) => s.songId);
    const songs = songIds.length > 0
      ? await prisma.song.findMany({
          where: { id: { in: songIds } },
          select: { id: true, title: true, artistName: true, fileUrl: true, duration: true },
        })
      : [];
    const songMap = new Map(songs.map((s) => [s.id, s]));

    // Assemble the full program log
    interface ProgramSlot {
      position: number;
      minute: number;
      type: string;
      category: string;
      song?: { id: string; title: string; artistName: string; fileUrl: string | null; duration: number | null };
      voiceTrack?: {
        id: string;
        trackType: string;
        scriptText: string | null;
        audioFilePath: string | null;
        audioDuration: number | null;
        prevSongTitle: string | null;
        prevArtistName: string | null;
        nextSongTitle: string | null;
        nextArtistName: string | null;
      };
      feature?: { id: string; title: string | null; content: string; audioFilePath: string | null };
    }

    const programLog: ProgramSlot[] = slots.map((slot: Record<string, unknown>) => {
      const entry: ProgramSlot = {
        position: slot.position as number,
        minute: slot.minute as number,
        type: slot.type as string,
        category: slot.category as string,
      };

      // Attach song data
      if (slot.type === "song" && slot.songId) {
        const song = songMap.get(slot.songId as string);
        if (song) {
          entry.song = song;
        }
      }

      // Attach voice track
      if (slot.type === "voice_break") {
        const vt = vtByPosition.get(slot.position as number);
        if (vt) {
          entry.voiceTrack = {
            id: vt.id,
            trackType: vt.trackType,
            scriptText: vt.scriptText,
            audioFilePath: vt.audioFilePath,
            audioDuration: vt.audioDuration,
            prevSongTitle: vt.prevSongTitle,
            prevArtistName: vt.prevArtistName,
            nextSongTitle: vt.nextSongTitle,
            nextArtistName: vt.nextArtistName,
          };
        }
      }

      // Attach feature content
      if (slot.type === "feature" && slot.featureContentId) {
        const fc = featureMap.get(slot.featureContentId as string);
        if (fc) {
          entry.feature = {
            id: fc.id,
            title: fc.title,
            content: fc.content,
            audioFilePath: fc.audioFilePath,
          };
        }
      }

      return entry;
    });

    return NextResponse.json({
      playlistId: playlist.id,
      stationId: playlist.stationId,
      djId: playlist.djId,
      airDate: playlist.airDate,
      hourOfDay: playlist.hourOfDay,
      status: playlist.status,
      programLog,
    });
  } catch (error) {
    return handleApiError(error, "/api/playout/hour");
  }
}
