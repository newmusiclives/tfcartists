import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// DJ shift boundaries for show transitions (weekday schedule)
const DJ_SHIFT_STARTS: Record<number, boolean> = { 6: true, 9: true, 12: true, 15: true };

// Handoff hours and their group IDs
const HANDOFF_HOURS: Record<number, string> = {
  9: "hank-to-loretta",
  12: "loretta-to-doc",
  15: "doc-to-cody",
};

// Seconds of breathing room after a song before the next element starts.
// Prevents the song's natural tail/decay from being clipped into ads or imaging.
const SONG_TAIL_PAD_SEC = 1.5;

// Default durations (seconds) when actual duration is unknown
// Kept tight to minimize dead air — real radio has no silence between elements
const DEFAULT_DURATION: Record<string, number> = {
  imaging: 5,
  sweeper: 5,
  promo: 10,
  station_id: 4,
  feature: 45,
  voice_break: 10,
  song: 210,
  ad: 20,
  commercial: 20,
  transition: 8,
};

/**
 * GET /api/playout/hour — full program log for one broadcast hour.
 *
 * The Railway backend calls this to build the actual stream.
 * Returns every slot in order: songs, voice tracks, features, imaging, ads, transitions.
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

    // --- Resolve ads for ad slots ---
    const adSlots = slots.filter((s: { type: string }) =>
      s.type === "ad" || s.type === "commercial"
    );
    type ResolvedAd = {
      id: string;
      sponsorName: string;
      adTitle: string;
      audioFilePath: string | null;
      durationSeconds: number | null;
    };
    const resolvedAds = new Map<number, [ResolvedAd, ResolvedAd]>();

    if (adSlots.length > 0) {
      // Get all active ads with audio
      // Include ads that have EITHER a file path or a stored data URI
      const activeAds = await prisma.sponsorAd.findMany({
        where: {
          stationId,
          isActive: true,
          OR: [
            { audioFilePath: { not: null } },
            { audioDataUri: { not: null } },
          ],
        },
      });

      if (activeAds.length > 0) {
        // Sort by weighted rotation score (lowest plays-per-weight first)
        // then by oldest lastPlayedAt — least-played ads surface first
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

        // Pick ads for each slot, advancing through the sorted list
        // and tracking which ads we've used so we don't repeat in the same hour
        const usedIds = new Set<string>();
        const pickNextAd = () => {
          // First pass: pick the first unused ad from the sorted list
          for (const ad of activeAds) {
            if (!usedIds.has(ad.id)) {
              usedIds.add(ad.id);
              return ad;
            }
          }
          // All used this hour — allow repeats, pick lowest rotation
          return activeAds[0];
        };

        const adsToUpdate: string[] = [];

        for (let i = 0; i < adSlots.length; i++) {
          const ad1 = pickNextAd();
          const ad2 = pickNextAd();
          adsToUpdate.push(ad1.id, ad2.id);

          resolvedAds.set(adSlots[i].position as number, [
            {
              id: ad1.id,
              sponsorName: ad1.sponsorName,
              adTitle: ad1.adTitle,
              audioFilePath: ad1.audioFilePath || ad1.audioDataUri,
              durationSeconds: ad1.durationSeconds,
            },
            {
              id: ad2.id,
              sponsorName: ad2.sponsorName,
              adTitle: ad2.adTitle,
              audioFilePath: ad2.audioFilePath || ad2.audioDataUri,
              durationSeconds: ad2.durationSeconds,
            },
          ]);
        }

        // Update play counts so rotation actually progresses across hours
        const uniqueAdIds = [...new Set(adsToUpdate)];
        await prisma.sponsorAd.updateMany({
          where: { id: { in: uniqueAdIds } },
          data: {
            playCount: { increment: 1 },
            lastPlayedAt: new Date(),
          },
        });
      }
    }

    // --- Warnings for debugging ---
    const warnings: string[] = [];

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
        if (!intro.audioFilePath) {
          warnings.push(`Show intro "${intro.name}" has no audioFilePath`);
        }
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
        if (parts.length === 0) {
          warnings.push(`Handoff hour ${hourOfDay} (group "${handoffGroupId}") has no matching transitions`);
        }
        for (const p of parts) {
          if (!p.audioFilePath) {
            warnings.push(`Handoff part ${p.handoffPart} "${p.name}" has no audioFilePath`);
          }
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
        if (!outro.audioFilePath) {
          warnings.push(`Show outro "${outro.name}" has no audioFilePath`);
        }
      }
    }

    // --- Resolve imaging for imaging/sweeper/promo/station_id slots ---
    const imagingSlots = slots.filter((s: { type: string }) =>
      s.type === "sweeper" || s.type === "promo" || s.type === "station_id" || s.type === "imaging"
    );
    const resolvedImaging = new Map<number, { type: string; audioFilePath: string | null; audioDuration?: number }>();

    // Imaging voice metadata — shared between standalone imaging slots and ad break bookends
    let imagingVoiceMeta: { scripts?: Record<string, Array<{ label: string; audioFilePath?: string; audioDuration?: number }>> } | null = null;

    if (imagingSlots.length > 0 || adSlots.length > 0) {
      // Find imaging voice with audio metadata
      const imagingVoice = await prisma.stationImagingVoice.findFirst({
        where: { stationId, isActive: true },
      });

      if (imagingVoice?.metadata) {
        imagingVoiceMeta = imagingVoice.metadata as any;
        if (imagingVoiceMeta?.scripts) {
          for (const slot of imagingSlots) {
            const slotType = slot.type as string;
            const scripts = imagingVoiceMeta.scripts[slotType] || imagingVoiceMeta.scripts["sweeper"] || [];
            if (scripts.length > 0) {
              // Pick a random imaging script for variety
              const pick = scripts[Math.floor(Math.random() * scripts.length)];
              if (pick.audioFilePath) {
                resolvedImaging.set(slot.position as number, {
                  type: slotType,
                  audioFilePath: pick.audioFilePath,
                  audioDuration: pick.audioDuration,
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
      sequenceOrder?: number;
      cumulativeStartSec?: number;
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
      transition?: { id: string; type: string; name: string; audioFilePath: string | null; durationSeconds: number; handoffPart: number | null };
      imaging?: { type: string; audioFilePath: string | null; audioDuration?: number };
    }

    const programLog: ProgramSlot[] = [];

    // Prepend handoff parts at distinct negative positions before show intro (-2)
    if (handoffParts.length > 0) {
      for (let idx = 0; idx < handoffParts.length; idx++) {
        const part = handoffParts[idx];
        programLog.push({
          position: -(handoffParts.length + 2) + idx,
          minute: 0,
          type: "transition",
          category: "handoff",
          transition: part,
        });
      }
    }

    // Show intro at position -2 (always clear of handoff parts above and slot 0)
    if (showIntro) {
      programLog.push({
        position: -2,
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
          if (!song.fileUrl) {
            warnings.push(`Song "${song.title}" by ${song.artistName} (pos ${slot.position}) has no fileUrl`);
          }
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
        } else {
          warnings.push(`Voice break at position ${slot.position} has no audio_ready track`);
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

      // Expand ad break into 4-element block: sweeper, ad, ad, promo
      if (slot.type === "ad" || slot.type === "commercial") {
        const adPair = resolvedAds.get(slot.position as number);
        const pos = slot.position as number;
        const min = slot.minute as number;

        // Pick a random imaging script by type
        const pickImaging = (scriptType: string) => {
          if (!imagingVoiceMeta?.scripts) return undefined;
          const scripts = imagingVoiceMeta.scripts[scriptType] || [];
          if (scripts.length === 0) return undefined;
          const pick = scripts[Math.floor(Math.random() * scripts.length)];
          return pick.audioFilePath ? { type: scriptType, audioFilePath: pick.audioFilePath, audioDuration: pick.audioDuration } : undefined;
        };

        // Sweeper opener (transition into the ad break)
        programLog.push({
          position: pos + 0.0,
          minute: min,
          type: "sweeper",
          category: "Imaging",
          imaging: pickImaging("sweeper"),
        });

        // Sponsor Ad 1
        programLog.push({
          position: pos + 0.1,
          minute: min,
          type: "ad",
          category: "Sponsor",
          ad: adPair?.[0],
        });

        // Sponsor Ad 2
        programLog.push({
          position: pos + 0.2,
          minute: min,
          type: "ad",
          category: "Sponsor",
          ad: adPair?.[1],
        });

        // Promo closer (transition back to music)
        programLog.push({
          position: pos + 0.3,
          minute: min,
          type: "promo",
          category: "Imaging",
          imaging: pickImaging("promo"),
        });

        continue; // Skip the normal programLog.push(entry)
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

    // --- Sort by position and assign sequenceOrder + cumulativeStartSec ---
    programLog.sort((a, b) => a.position - b.position);

    let cumulativeSec = 0;
    for (let i = 0; i < programLog.length; i++) {
      const entry = programLog[i];
      entry.sequenceOrder = i;
      entry.cumulativeStartSec = cumulativeSec;

      // Calculate this entry's duration for cumulative timing
      // Use actual measured duration whenever available to eliminate dead air
      let durationSec = DEFAULT_DURATION[entry.type] ?? 8;
      if (entry.song?.duration != null) {
        durationSec = entry.song.duration;
      } else if (entry.voiceTrack?.audioDuration != null) {
        durationSec = entry.voiceTrack.audioDuration;
      } else if (entry.transition?.durationSeconds != null) {
        durationSec = entry.transition.durationSeconds;
      } else if (entry.ad?.durationSeconds != null) {
        durationSec = entry.ad.durationSeconds;
      } else if (entry.imaging?.audioDuration != null) {
        durationSec = entry.imaging.audioDuration;
      }

      cumulativeSec += durationSec;

      // Add tail padding after songs so the natural decay isn't clipped
      if (entry.type === "song") {
        cumulativeSec += SONG_TAIL_PAD_SEC;
      }
    }

    return NextResponse.json({
      playlistId: playlist.id,
      stationId: playlist.stationId,
      djId: playlist.djId,
      airDate: playlist.airDate,
      hourOfDay: playlist.hourOfDay,
      status: playlist.status,
      programLog,
      warnings,
    });
  } catch (error) {
    return handleApiError(error, "/api/playout/hour");
  }
}
