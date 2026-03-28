import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stationNow, stationToday, stationDayType } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * GET /api/next_hour
 *
 * Compatibility endpoint for get_track.py on the Hetzner playout server.
 * Determines the current hour in Mountain Time, loads the locked playlist,
 * and returns it in the format get_track.py expects.
 */
export async function GET(request: NextRequest) {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true, deletedAt: null },
    });
    if (!station) {
      return NextResponse.json({ error: "No active station" }, { status: 404 });
    }

    // Determine current hour in Mountain Time
    const now = stationNow();
    const hourOfDay = now.getUTCHours();
    const today = stationToday();
    const dateStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;

    // Find which DJ is assigned to this hour
    const dayType = stationDayType();
    const assignments = await prisma.clockAssignment.findMany({
      where: {
        stationId: station.id,
        isActive: true,
        dayType: { in: [dayType, "all"] },
      },
      include: { dj: { select: { id: true, slug: true } } },
      orderBy: { priority: "desc" },
    });

    let scheduledDj: { djId: string; djSlug: string } | null = null;
    for (const a of assignments) {
      if (!a.dj) continue;
      const start = parseInt(a.timeSlotStart.split(":")[0], 10);
      const end = parseInt(a.timeSlotEnd.split(":")[0], 10);
      const inSlot = end > start
        ? hourOfDay >= start && hourOfDay < end
        : hourOfDay >= start || hourOfDay < end;
      if (inSlot) {
        scheduledDj = { djId: a.dj.id, djSlug: a.dj.slug };
        break;
      }
    }

    // Find the locked playlist
    const playlist = await prisma.hourPlaylist.findFirst({
      where: {
        stationId: station.id,
        airDate: today,
        hourOfDay,
        status: { in: ["locked", "aired"] },
        ...(scheduledDj ? { djId: scheduledDj.djId } : {}),
      },
      include: { voiceTracks: true },
      orderBy: { createdAt: "desc" },
    });

    if (!playlist) {
      return NextResponse.json({
        hour_sequence: [],
        clock_template: `hour-${hourOfDay}`,
        dj_id: null,
        hour: hourOfDay,
        date: dateStr,
        message: "No locked playlist for this hour",
      });
    }

    const slots = JSON.parse(
      typeof playlist.slots === "string" ? playlist.slots : JSON.stringify(playlist.slots),
    );

    // Build voice track map
    const vtByPosition = new Map(
      playlist.voiceTracks
        .filter((vt) => vt.status === "audio_ready")
        .map((vt) => [vt.position, vt]),
    );

    // Load songs
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

    // Load features
    const featureIds = slots
      .filter((s: { featureContentId?: string }) => s.featureContentId)
      .map((s: { featureContentId: string }) => s.featureContentId);
    const features = featureIds.length > 0
      ? await prisma.featureContent.findMany({ where: { id: { in: featureIds } } })
      : [];
    const featureMap = new Map(features.map((f) => [f.id, f]));

    // Audio base URL for serving data-URI audio
    const baseUrl = request.nextUrl.origin;
    const audioBaseUrl = `${baseUrl}/api/playout/audio`;

    // Helper to resolve audio path — always use the API route for database-stored audio
    // so Hetzner can download it regardless of where the file was originally saved
    const resolveAudio = (path: string | null | undefined, id: string) => {
      if (!path) return null;
      // Always serve through the playout audio API for reliability
      return `${audioBaseUrl}/${id}`;
    };

    // Build hour sequence
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hourSequence: Array<{ type: string; audio_file_path: string | null; metadata: Record<string, any> }> = [];

    for (const slot of slots) {
      if (slot.type === "song" && slot.songId) {
        const song = songMap.get(slot.songId);
        if (song) {
          // Construct file path for the Hetzner playout server
          // Songs are stored as "{artistName} - {title}.mp3" in /mnt/audio_library/
          const songFilePath = song.fileUrl || `${song.artistName} - ${song.title}.mp3`;
          hourSequence.push({
            type: "song",
            audio_file_path: songFilePath,
            metadata: {
              artist: song.artistName,
              title: song.title,
              duration: song.duration,
              song_id: song.id,
              rotation_category: slot.category,
              clock_minute: slot.minute,
            },
          });
        }
      } else if (slot.type === "voice_break") {
        const vt = vtByPosition.get(slot.position);
        if (vt) {
          hourSequence.push({
            type: "intro",
            audio_file_path: resolveAudio(vt.audioFilePath, vt.id),
            metadata: {
              track_type: vt.trackType,
              clock_minute: slot.minute,
              duration: vt.audioDuration,
              next_song: vt.nextSongTitle,
              next_artist: vt.nextArtistName,
            },
          });
        }
      } else if (slot.type === "feature" && slot.featureContentId) {
        const fc = featureMap.get(slot.featureContentId);
        if (fc) {
          hourSequence.push({
            type: "feature",
            audio_file_path: resolveAudio(fc.audioFilePath, fc.id),
            metadata: {
              title: fc.title,
              clock_minute: slot.minute,
              duration: fc.audioDuration,
            },
          });
        }
      } else if (slot.type === "sweeper" || slot.type === "station_id" || slot.category === "Imaging" || slot.category === "TOH") {
        // Imaging slots — resolve from ProducedImaging if audio exists
        const imagingType = slot.category === "TOH" ? "toh" : slot.type === "station_id" ? "id" : "sweeper";
        hourSequence.push({
          type: "imaging",
          audio_file_path: null, // get_track.py will inject from static assets
          metadata: {
            imaging_type: imagingType,
            clock_minute: slot.minute,
            no_crossfade: true,
            dj_id: scheduledDj?.djSlug || null,
          },
        });
      } else if (slot.type === "sponsor" || slot.category === "Sponsor") {
        // Sponsor ad slots — load active ads
        const ad = await prisma.sponsorAd.findFirst({
          where: { stationId: station.id, isActive: true },
          orderBy: { playCount: "asc" }, // least-played first
          select: { id: true, adTitle: true, audioFilePath: true, durationSeconds: true, sponsorId: true },
        });
        if (ad?.audioFilePath) {
          hourSequence.push({
            type: "ad",
            audio_file_path: resolveAudio(ad.audioFilePath, ad.id),
            metadata: {
              sponsor_name: ad.adTitle,
              clock_minute: slot.minute,
              duration: ad.durationSeconds,
              no_crossfade: true,
            },
          });
        }
      }
    }

    // Look up clock template name for show structure (Hour 1 Opener vs Hour 2 vs Hour 3 Closer)
    const clockTemplate = playlist.clockTemplateId
      ? await prisma.clockTemplate.findUnique({
          where: { id: playlist.clockTemplateId },
          select: { name: true },
        })
      : null;

    // Load show transitions (intro/outro/handoff) for this hour
    const dayOfWeek = now.getUTCDay();
    const transitions = await prisma.showTransition.findMany({
      where: {
        stationId: station.id,
        dayOfWeek,
        hourOfDay,
        isActive: true,
        audioFilePath: { not: null },
      },
      orderBy: { handoffPart: "asc" },
    });

    // Prepend show intro, append show outro/handoff
    const finalSequence = [...hourSequence];
    for (const t of transitions) {
      if (!t.audioFilePath) continue;
      const item = {
        type: "transition",
        audio_file_path: resolveAudio(t.audioFilePath, t.id),
        metadata: {
          transition_subtype: t.transitionType,
          dj_id: scheduledDj?.djSlug || null,
          no_crossfade: true,
        },
      };
      if (t.transitionType === "show_intro") {
        finalSequence.unshift(item);
      } else {
        finalSequence.push(item);
      }
    }

    return NextResponse.json({
      hour_sequence: finalSequence,
      clock_template: clockTemplate?.name || `hour-${hourOfDay}`,
      dj_id: playlist.djId,
      dj_slug: scheduledDj?.djSlug ?? null,
      hour: hourOfDay,
      date: dateStr,
      playlist_id: playlist.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to build hour sequence", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
