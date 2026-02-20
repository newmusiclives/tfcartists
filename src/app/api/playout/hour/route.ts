import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

// DJ shift boundaries for show transitions (weekday schedule)
const DJ_SHIFT_STARTS: Record<number, boolean> = { 6: true, 9: true, 12: true, 15: true };

// Handoff hours and their group IDs
const HANDOFF_HOURS: Record<number, string> = {
  9: "hank-to-loretta",
  12: "loretta-to-doc",
  15: "doc-to-cody",
};

/**
 * GET /api/playout/hour — full program log for one broadcast hour.
 *
 * The Railway backend calls this to build the actual stream.
 * Returns every slot in order: songs, voice tracks, features, imaging, ads, transitions.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

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

    // --- Resolve ads for ad slots ---
    const adSlots = slots.filter((s: { type: string }) =>
      s.type === "ad" || s.type === "commercial"
    );
    const resolvedAds = new Map<number, {
      id: string;
      sponsorName: string;
      adTitle: string;
      audioFilePath: string | null;
      durationSeconds: number | null;
    }>();

    if (adSlots.length > 0) {
      // Get all active ads sorted by weighted rotation (playCount/weight ASC)
      const activeAds = await prisma.sponsorAd.findMany({
        where: { stationId, isActive: true, audioFilePath: { not: null } },
        orderBy: { lastPlayedAt: "asc" },
      });

      if (activeAds.length > 0) {
        // Sort by weighted rotation score
        activeAds.sort((a, b) => {
          const scoreA = a.playCount / (a.weight || 1);
          const scoreB = b.playCount / (b.weight || 1);
          if (scoreA !== scoreB) return scoreA - scoreB;
          if (!a.lastPlayedAt && b.lastPlayedAt) return -1;
          if (a.lastPlayedAt && !b.lastPlayedAt) return 1;
          if (a.lastPlayedAt && b.lastPlayedAt) {
            return a.lastPlayedAt.getTime() - b.lastPlayedAt.getTime();
          }
          return 0;
        });

        // Assign one ad per ad slot, cycling through available ads
        for (let i = 0; i < adSlots.length; i++) {
          const ad = activeAds[i % activeAds.length];
          resolvedAds.set(adSlots[i].position as number, {
            id: ad.id,
            sponsorName: ad.sponsorName,
            adTitle: ad.adTitle,
            audioFilePath: ad.audioFilePath,
            durationSeconds: ad.durationSeconds,
          });
        }
      }
    }

    // --- Resolve show transitions for this hour ---
    type TransitionEntry = { id: string; type: string; name: string; audioFilePath: string | null; durationSeconds: number; handoffPart: number | null };

    let showIntro: TransitionEntry | null = null;
    let showOutro: TransitionEntry | null = null;
    const handoffParts: TransitionEntry[] = [];

    if (DJ_SHIFT_STARTS[hourOfDay]) {
      // This is the first hour of a DJ shift — look for show_intro
      const intro = await prisma.showTransition.findFirst({
        where: {
          stationId,
          transitionType: "show_intro",
          hourOfDay,
          isActive: true,
        },
        orderBy: { priority: "desc" },
      });
      if (intro) {
        showIntro = {
          id: intro.id,
          type: intro.transitionType,
          name: intro.name,
          audioFilePath: intro.audioFilePath,
          durationSeconds: intro.durationSeconds,
          handoffPart: intro.handoffPart,
        };
      }

      // Check for handoff crosstalk at this hour
      const handoffGroupId = HANDOFF_HOURS[hourOfDay];
      if (handoffGroupId) {
        const parts = await prisma.showTransition.findMany({
          where: {
            stationId,
            transitionType: "handoff",
            handoffGroupId,
            isActive: true,
          },
          orderBy: { handoffPart: "asc" },
        });
        for (const p of parts) {
          handoffParts.push({
            id: p.id,
            type: p.transitionType,
            name: p.name,
            audioFilePath: p.audioFilePath,
            durationSeconds: p.durationSeconds,
            handoffPart: p.handoffPart,
          });
        }
      }
    }

    // Check if this is the last hour of a shift (hour before a shift start)
    const nextHour = hourOfDay + 1;
    if (DJ_SHIFT_STARTS[nextHour]) {
      const outro = await prisma.showTransition.findFirst({
        where: {
          stationId,
          transitionType: "show_outro",
          hourOfDay,
          isActive: true,
        },
        orderBy: { priority: "desc" },
      });
      if (outro) {
        showOutro = {
          id: outro.id,
          type: outro.transitionType,
          name: outro.name,
          audioFilePath: outro.audioFilePath,
          durationSeconds: outro.durationSeconds,
          handoffPart: outro.handoffPart,
        };
      }
    }

    // --- Resolve imaging for imaging/sweeper/promo/station_id slots ---
    const imagingSlots = slots.filter((s: { type: string }) =>
      s.type === "sweeper" || s.type === "promo" || s.type === "station_id" || s.type === "imaging"
    );
    const resolvedImaging = new Map<number, { type: string; audioFilePath: string | null }>();

    if (imagingSlots.length > 0) {
      // Find imaging voice with audio metadata
      const imagingVoice = await prisma.stationImagingVoice.findFirst({
        where: { stationId, isActive: true },
      });

      if (imagingVoice?.metadata) {
        const meta = imagingVoice.metadata as {
          scripts?: Record<string, Array<{ label: string; audioFilePath?: string }>>;
        };
        if (meta.scripts) {
          for (const slot of imagingSlots) {
            const slotType = slot.type as string;
            const scripts = meta.scripts[slotType] || meta.scripts["sweeper"] || [];
            if (scripts.length > 0) {
              // Pick a random imaging script for variety
              const pick = scripts[Math.floor(Math.random() * scripts.length)];
              if (pick.audioFilePath) {
                resolvedImaging.set(slot.position as number, {
                  type: slotType,
                  audioFilePath: pick.audioFilePath,
                });
              }
            }
          }
        }
      }
    }

    // --- Assemble the full program log ---
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
      ad?: { id: string; sponsorName: string; adTitle: string; audioFilePath: string | null; durationSeconds: number | null };
      transition?: { id: string; type: string; name: string; audioFilePath: string | null; handoffPart: number | null };
      imaging?: { type: string; audioFilePath: string | null };
    }

    const programLog: ProgramSlot[] = [];

    // Prepend handoff parts + show intro at the very start of the hour
    if (handoffParts.length > 0) {
      for (const part of handoffParts) {
        programLog.push({
          position: -2 + (part.handoffPart ?? 0),
          minute: 0,
          type: "transition",
          category: "handoff",
          transition: part,
        });
      }
    }

    if (showIntro) {
      programLog.push({
        position: -1,
        minute: 0,
        type: "transition",
        category: "show_intro",
        transition: showIntro,
      });
    }

    // Map each slot from the playlist
    for (const slot of slots) {
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

      // Attach ad data
      if (slot.type === "ad" || slot.type === "commercial") {
        const ad = resolvedAds.get(slot.position as number);
        if (ad) {
          entry.ad = ad;
        }
      }

      // Attach imaging data
      if (slot.type === "sweeper" || slot.type === "promo" || slot.type === "station_id" || slot.type === "imaging") {
        const img = resolvedImaging.get(slot.position as number);
        if (img) {
          entry.imaging = img;
        }
      }

      programLog.push(entry);
    }

    // Append show outro at the end of the hour
    if (showOutro) {
      const lastPosition = slots.length > 0 ? (slots[slots.length - 1].position as number) + 1 : 999;
      programLog.push({
        position: lastPosition,
        minute: 59,
        type: "transition",
        category: "show_outro",
        transition: showOutro,
      });
    }

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
