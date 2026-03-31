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

    // Load features — fill unlinked feature slots from available pool
    const featureSlots = slots.filter((s: { type: string }) => s.type === "feature");
    const linkedFeatureIds = featureSlots
      .filter((s: { featureContentId?: string }) => s.featureContentId)
      .map((s: { featureContentId: string }) => s.featureContentId);
    const unlinkedFeatureSlots = featureSlots.filter((s: { featureContentId?: string }) => !s.featureContentId);

    // Fill unlinked feature slots from available FeatureContent pool
    if (unlinkedFeatureSlots.length > 0) {
      const availableFeatures = await prisma.featureContent.findMany({
        where: {
          stationId: station.id,
          audioFilePath: { not: "" },
          id: { notIn: linkedFeatureIds },
        },
        orderBy: { createdAt: "desc" },
        take: unlinkedFeatureSlots.length,
      });
      for (let i = 0; i < Math.min(unlinkedFeatureSlots.length, availableFeatures.length); i++) {
        unlinkedFeatureSlots[i].featureContentId = availableFeatures[i].id;
        linkedFeatureIds.push(availableFeatures[i].id);
      }
    }

    const features = linkedFeatureIds.length > 0
      ? await prisma.featureContent.findMany({ where: { id: { in: linkedFeatureIds } } })
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

    // --- Resolve imaging audio from ProducedImaging records ---
    // Group by category for random selection per slot type
    const producedImaging = await prisma.producedImaging.findMany({
      where: { stationId: station.id, isActive: true, filePath: { not: "" } },
      select: { id: true, name: true, category: true, filePath: true, durationSeconds: true },
    });

    // Get all DJ names so we can filter out promos that mention off-air DJs
    const allDjs = await prisma.dJ.findMany({
      where: { stationId: station.id, isActive: true },
      select: { name: true, slug: true },
    });
    const currentDjName = scheduledDj ? allDjs.find(d => d.slug === scheduledDj.djSlug)?.name : null;
    const otherDjNames = allDjs
      .filter(d => d.slug !== scheduledDj?.djSlug)
      .map(d => d.name.toLowerCase());

    const imagingByCategory = new Map<string, typeof producedImaging>();
    for (const pi of producedImaging) {
      // Filter out promos/imaging that mention another DJ's name
      const nameLower = pi.name.toLowerCase();
      const mentionsOtherDj = otherDjNames.some(dj => nameLower.includes(dj.split(" ")[0].toLowerCase()));
      if (mentionsOtherDj) continue;

      const cat = pi.category;
      if (!imagingByCategory.has(cat)) imagingByCategory.set(cat, []);
      imagingByCategory.get(cat)!.push(pi);
    }

    // Map clock slot types to ProducedImaging categories
    const pickImagingAudio = (slotType: string): { id: string; audioFilePath: string; duration?: number | null } | null => {
      // Try exact category match, then fallback to sweeper
      const categoryMap: Record<string, string[]> = {
        station_id: ["station_id", "id"],
        sweeper: ["sweeper"],
        promo: ["promo"],
        toh: ["station_id", "id", "toh"],
      };
      const cats = categoryMap[slotType] || [slotType, "sweeper"];
      for (const cat of cats) {
        const items = imagingByCategory.get(cat);
        if (items && items.length > 0) {
          const pick = items[Math.floor(Math.random() * items.length)];
          return { id: pick.id, audioFilePath: `${audioBaseUrl}/${pick.id}`, duration: pick.durationSeconds };
        }
      }
      return null;
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
      } else if (slot.type === "sweeper" || slot.type === "promo" || slot.type === "station_id" || slot.category === "Imaging" || slot.category === "TOH") {
        // Imaging slots — resolve audio from ProducedImaging records
        const imagingType = slot.category === "TOH" ? "toh" : slot.type === "station_id" ? "id" : slot.type === "promo" ? "promo" : "sweeper";
        const lookupType = slot.category === "TOH" ? "toh" : slot.type === "station_id" ? "station_id" : slot.type === "promo" ? "promo" : "sweeper";
        const imaging = pickImagingAudio(lookupType);
        hourSequence.push({
          type: "imaging",
          audio_file_path: imaging?.audioFilePath || null,
          metadata: {
            imaging_type: imagingType,
            clock_minute: slot.minute,
            duration: imaging?.duration,
            no_crossfade: true,
            dj_id: scheduledDj?.djSlug || null,
          },
        });
      } else if (slot.type === "sponsor" || slot.category === "Sponsor") {
        // Sponsor ad slots — pick random ad from the least-played pool
        const lowestAd = await prisma.sponsorAd.findFirst({
          where: { stationId: station.id, isActive: true },
          orderBy: { playCount: "asc" },
          select: { playCount: true },
        });
        const adPool = lowestAd ? await prisma.sponsorAd.findMany({
          where: { stationId: station.id, isActive: true, playCount: { lte: lowestAd.playCount + 1 } },
          select: { id: true, adTitle: true, audioFilePath: true, durationSeconds: true, sponsorId: true },
        }) : [];
        const adsWithAudio = adPool.filter((a) => a.audioFilePath);
        const ad = adsWithAudio.length > 0 ? adsWithAudio[Math.floor(Math.random() * adsWithAudio.length)] : null;
        if (ad) {
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
