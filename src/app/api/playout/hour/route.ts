import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { stationDayType } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * Check if a given hour (0-23) falls within a time slot range.
 * Handles midnight-crossing shifts (e.g. 21:00-00:00) where the
 * end time is less than the start time.
 */
function hourInSlot(hourOfDay: number, timeSlotStart: string, timeSlotEnd: string): boolean {
  const start = parseInt(timeSlotStart.split(":")[0], 10);
  const end = parseInt(timeSlotEnd.split(":")[0], 10);

  if (end > start) {
    // Normal shift: 06:00-09:00 → hours 6, 7, 8
    return hourOfDay >= start && hourOfDay < end;
  }
  if (end <= start && end !== start) {
    // Midnight-crossing shift: 21:00-02:00 → hours 21, 22, 23, 0, 1
    return hourOfDay >= start || hourOfDay < end;
  }
  // end === start means full 24h or degenerate — treat as no match
  return false;
}

/**
 * Look up which DJ is assigned to a given hour from ClockAssignment.
 * Returns the DJ's id, slug, and time slot, or null if no assignment exists.
 *
 * Fetches all active assignments and filters programmatically to correctly
 * handle midnight-crossing shifts where string comparison would fail.
 */
async function getDjForHour(stationId: string, hourOfDay: number): Promise<{
  djId: string;
  djSlug: string;
  timeSlotStart: string;
  timeSlotEnd: string;
} | null> {
  const dayType = stationDayType();

  const assignments = await prisma.clockAssignment.findMany({
    where: {
      stationId,
      isActive: true,
      dayType: { in: [dayType, "all"] },
    },
    include: { dj: { select: { id: true, slug: true } } },
    orderBy: { priority: "desc" },
  });

  // Find the highest-priority assignment whose time slot covers this hour
  for (const assignment of assignments) {
    if (!assignment.dj) continue;
    if (hourInSlot(hourOfDay, assignment.timeSlotStart, assignment.timeSlotEnd)) {
      return {
        djId: assignment.dj.id,
        djSlug: assignment.dj.slug,
        timeSlotStart: assignment.timeSlotStart,
        timeSlotEnd: assignment.timeSlotEnd,
      };
    }
  }

  return null;
}

/**
 * Determine if a DJ shift change happens at this hour by comparing
 * the current hour's DJ to the previous hour's DJ from ClockAssignment.
 * Returns the previous DJ's slug for handoff group ID construction, or null.
 */
async function getShiftTransitionInfo(stationId: string, hourOfDay: number): Promise<{
  isShiftStart: boolean;
  isShiftEnd: boolean;
  prevDjSlug: string | null;
  nextDjSlug: string | null;
  currentDjSlug: string | null;
}> {
  const [prevDj, currentDj, nextDj] = await Promise.all([
    getDjForHour(stationId, (hourOfDay + 23) % 24),  // wrap: hour 0 → check hour 23
    getDjForHour(stationId, hourOfDay),
    getDjForHour(stationId, (hourOfDay + 1) % 24),   // wrap: hour 23 → check hour 0
  ]);

  const isShiftStart = !prevDj || prevDj.djId !== currentDj?.djId;
  const isShiftEnd = !nextDj || nextDj.djId !== currentDj?.djId;

  return {
    isShiftStart,
    isShiftEnd,
    prevDjSlug: prevDj?.djSlug ?? null,
    nextDjSlug: nextDj?.djSlug ?? null,
    currentDjSlug: currentDj?.djSlug ?? null,
  };
}

// No padding between songs — crossfade handles seamless transitions.
// Only adds padding when crossfade is disabled (fallback).
const SONG_TAIL_PAD_SEC = 0;

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

    // Normalize to UTC midnight — must match stationToday() which stores
    // dates as UTC midnight with the Mountain Time calendar date
    const airDate = new Date(date + "T00:00:00.000Z");
    const hourOfDay = parseInt(hour, 10);

    // Look up which DJ is assigned to this hour from ClockAssignment
    const scheduledDj = await getDjForHour(stationId, hourOfDay);

    // Find the hour playlist — filter by the scheduled DJ to prevent
    // serving the wrong DJ's playlist (e.g., Cody's playlist during Doc's hour)
    const playlist = await prisma.hourPlaylist.findFirst({
      where: {
        stationId,
        airDate,
        hourOfDay,
        status: { in: ["locked", "aired"] },
        ...(scheduledDj ? { djId: scheduledDj.djId } : {}),
      },
      include: { voiceTracks: true },
      orderBy: { createdAt: "desc" }, // Always use the most recent playlist
    });

    if (!playlist) {
      return NextResponse.json(
        { error: "No locked playlist found for this hour" },
        { status: 404 }
      );
    }

    const slots = JSON.parse(playlist.slots);

    // --- Warnings for debugging (declared early so feature/ad code can push to it) ---
    const warnings: string[] = [];

    // Build voice track lookup by position
    const vtByPosition = new Map(
      playlist.voiceTracks
        .filter((vt) => vt.status === "audio_ready")
        .map((vt) => [vt.position, vt])
    );

    // Look up feature content for feature slots — both linked and unlinked
    const allFeatureSlots = slots.filter((s: { type: string }) => s.type === "feature");
    const linkedFeatureSlots = allFeatureSlots.filter(
      (s: { featureContentId?: string }) => s.featureContentId
    );
    const unlinkedFeatureSlots = allFeatureSlots.filter(
      (s: { featureContentId?: string }) => !s.featureContentId
    );

    const featureIds = linkedFeatureSlots.map((s: { featureContentId: string }) => s.featureContentId);
    const features = featureIds.length > 0
      ? await prisma.featureContent.findMany({
          where: { id: { in: featureIds } },
        })
      : [];
    const featureMap = new Map(features.map((f) => [f.id, f]));

    // Fill unlinked feature slots from the available pool
    // This ensures 2 features per hour even if relinkFeatures didn't run or failed
    if (unlinkedFeatureSlots.length > 0) {
      const usedFeatureIds = new Set<string>(featureIds);
      const availableFeatures = await prisma.featureContent.findMany({
        where: {
          stationId,
          djPersonalityId: playlist.djId,
          isUsed: false,
          id: { notIn: [...usedFeatureIds] },
          content: { not: "" },
        },
        orderBy: { createdAt: "desc" },
        take: unlinkedFeatureSlots.length,
      });

      // Also try used features with audio as a fallback
      const fallbackFeatures = availableFeatures.length < unlinkedFeatureSlots.length
        ? await prisma.featureContent.findMany({
            where: {
              stationId,
              djPersonalityId: playlist.djId,
              audioFilePath: { not: null },
              id: { notIn: [...usedFeatureIds, ...availableFeatures.map((f) => f.id)] },
            },
            orderBy: { createdAt: "desc" },
            take: unlinkedFeatureSlots.length - availableFeatures.length,
          })
        : [];

      const allAvailable = [...availableFeatures, ...fallbackFeatures];

      for (let i = 0; i < unlinkedFeatureSlots.length && i < allAvailable.length; i++) {
        const fc = allAvailable[i];
        const slot = unlinkedFeatureSlots[i];
        slot.featureContentId = fc.id;
        featureMap.set(fc.id, fc);
        usedFeatureIds.add(fc.id);

        // Mark as used so it doesn't get picked again
        await prisma.featureContent.update({
          where: { id: fc.id },
          data: { isUsed: true },
        });
      }

      // Update playlist slots with newly linked feature IDs
      if (allAvailable.length > 0) {
        await prisma.hourPlaylist.update({
          where: { id: playlist.id },
          data: { slots: JSON.stringify(slots) },
        });
      }

      // Warn if we still couldn't fill all feature slots
      const unfilled = unlinkedFeatureSlots.length - allAvailable.length;
      if (unfilled > 0) {
        warnings.push(
          `${unfilled} feature slot(s) have no content. ` +
          `Check that FeatureSchedules are active and features-daily cron is running.`
        );
      }
    }

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
      s.type === "ad" || s.type === "commercial" || s.type === "sponsor"
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
      // Get ALL active ads (not just ones with audio — include scriptText-only ads too)
      const activeAds = await prisma.sponsorAd.findMany({
        where: {
          stationId,
          isActive: true,
        },
      });

      // Separate ads with audio from those without
      const adsWithAudio = activeAds.filter(
        (a) => a.audioFilePath || a.audioDataUri
      );

      if (adsWithAudio.length > 0) {
        // Sort by weighted rotation score (lowest plays-per-weight first)
        // then by oldest lastPlayedAt — least-played ads surface first
        adsWithAudio.sort((a, b) => {
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

        // Pick ads for each slot using round-robin through the sorted list.
        // When we exhaust unique ads, wrap around instead of always picking [0].
        let adCursor = 0;
        const pickNextAd = () => {
          const ad = adsWithAudio[adCursor % adsWithAudio.length];
          adCursor++;
          return ad;
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

        // Only update play counts ONCE per playlist lock — not on every GET.
        // Check if this playlist's ads have already been counted by looking at
        // the playlist status. "locked" = first fetch, "aired" = already counted.
        if (playlist.status === "locked") {
          const uniqueAdIds = [...new Set(adsToUpdate)];
          await prisma.$transaction([
            prisma.sponsorAd.updateMany({
              where: { id: { in: uniqueAdIds } },
              data: {
                playCount: { increment: 1 },
                lastPlayedAt: new Date(),
              },
            }),
            prisma.hourPlaylist.update({
              where: { id: playlist.id },
              data: { status: "aired" },
            }),
          ]);
        }
      } else if (activeAds.length > 0) {
        // Ads exist but have no audio — warn so operator knows to generate audio
        warnings.push(
          `${activeAds.length} sponsor ad(s) exist but none have audio files. ` +
          `Go to Station Admin → Sponsor Ads to generate audio.`
        );
      }
    }

    // --- Resolve show transitions for this hour (derived from ClockAssignment, not hardcoded) ---
    type TransitionEntry = { id: string; type: string; name: string; audioFilePath: string | null; durationSeconds: number; handoffPart: number | null };

    let showIntro: TransitionEntry | null = null;
    let showOutro: TransitionEntry | null = null;
    const handoffParts: TransitionEntry[] = [];

    const shiftInfo = await getShiftTransitionInfo(stationId, hourOfDay);

    if (shiftInfo.isShiftStart) {
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
      if (shiftInfo.prevDjSlug) {
        const parts = await prisma.showTransition.findMany({
          where: {
            stationId,
            transitionType: "handoff",
            hourOfDay,
            isActive: true,
          },
          orderBy: { handoffPart: "asc" },
        });
        if (parts.length === 0) {
          warnings.push(`Handoff hour ${hourOfDay} has no matching transitions`);
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

    // Check if this is the last hour of a shift (next hour has a different DJ)
    if (shiftInfo.isShiftEnd) {
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

    // Load ProducedImaging records grouped by category
    const producedImaging = await prisma.producedImaging.findMany({
      where: { stationId, isActive: true, filePath: { not: "" } },
      select: { id: true, category: true, filePath: true, durationSeconds: true },
    });
    const imagingByCategory = new Map<string, typeof producedImaging>();
    for (const pi of producedImaging) {
      if (!imagingByCategory.has(pi.category)) imagingByCategory.set(pi.category, []);
      imagingByCategory.get(pi.category)!.push(pi);
    }

    // Map slot types to ProducedImaging categories
    const categoryMap: Record<string, string[]> = {
      station_id: ["station_id", "id"],
      sweeper: ["sweeper"],
      promo: ["promo"],
      imaging: ["sweeper"],
    };

    if (imagingSlots.length > 0) {
      for (const slot of imagingSlots) {
        const slotType = slot.type as string;
        const cats = categoryMap[slotType] || [slotType, "sweeper"];
        for (const cat of cats) {
          const items = imagingByCategory.get(cat);
          if (items && items.length > 0) {
            const pick = items[Math.floor(Math.random() * items.length)];
            resolvedImaging.set(slot.position as number, {
              type: slotType,
              audioFilePath: pick.filePath,
              audioDuration: pick.durationSeconds ?? undefined,
            });
            break;
          }
        }
      }
    }

    // Imaging voice metadata — still needed for ad break bookend imaging
    let imagingVoiceMeta: { scripts?: Record<string, Array<{ label: string; audioFilePath?: string; audioDuration?: number }>> } | null = null;
    const imagingVoice = await prisma.stationImagingVoice.findFirst({
      where: { stationId, isActive: true },
    });
    if (imagingVoice?.metadata) {
      imagingVoiceMeta = imagingVoice.metadata as any;
    }

    // Time-of-day period for filtering ad break imaging scripts
    const timePeriod =
      hourOfDay < 6 ? "overnight" :
      hourOfDay < 10 ? "morning" :
      hourOfDay < 14 ? "midday" :
      hourOfDay < 18 ? "afternoon" : "evening";
    const wrongTimePeriods = ["morning", "midday", "afternoon", "evening", "overnight", "late night"]
      .filter((p: string) => p !== timePeriod && !(timePeriod === "overnight" && p === "late night"));

    // --- Load station production settings for crossfade/transition hints ---
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: {
        crossfadeEnabled: true,
        crossfadeDuration: true,
        crossfadeStartNext: true,
        crossfadeFadeIn: true,
        crossfadeFadeOut: true,
        crossfadeCurve: true,
        duckingEnabled: true,
        duckingAmount: true,
        duckingAttack: true,
        duckingRelease: true,
      },
    });

    // Load per-song cue points (outroStart, crossfadeStart) for tighter transitions
    const songCuePoints = songIds.length > 0
      ? await prisma.song.findMany({
          where: { id: { in: songIds } },
          select: { id: true, outroStart: true, crossfadeStart: true, introEnd: true },
        })
      : [];
    const cuePointMap = new Map(songCuePoints.map((s) => [s.id, s]));

    // --- Assemble the full program log ---
    interface TransitionHint {
      fadeIn?: number;   // seconds — fade in this element over N seconds
      fadeOut?: number;  // seconds — fade out this element over N seconds
      overlapNext?: number; // seconds — start next element N seconds before this one ends
      duck?: boolean;    // auto-duck music under this voice element
      curve?: string;    // equal_power | linear | logarithmic
    }

    interface ProgramSlot {
      position: number;
      sequenceOrder?: number;
      cumulativeStartSec?: number;
      minute: number;
      type: string;
      category: string;
      transitionHint?: TransitionHint;
      song?: { id: string; title: string; artistName: string; fileUrl: string | null; duration: number | null; outroStart?: number | null; crossfadeStart?: number | null; introEnd?: number | null };
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

      // Attach song data with per-song cue points
      if (slot.type === "song" && slot.songId) {
        const song = songMap.get(slot.songId as string);
        if (song) {
          const cues = cuePointMap.get(slot.songId as string);
          entry.song = {
            ...song,
            outroStart: cues?.outroStart ?? null,
            crossfadeStart: cues?.crossfadeStart ?? null,
            introEnd: cues?.introEnd ?? null,
          };
          if (!song.fileUrl) {
            warnings.push(`Song "${song.title}" by ${song.artistName} (pos ${slot.position}) has no fileUrl`);
          }
        }
      }

      // Attach voice track — cross-validate song references against actual playlist
      if (slot.type === "voice_break") {
        const vt = vtByPosition.get(slot.position as number);
        if (vt) {
          // Cross-validate: check that the VT's stored song references match
          // the actual songs in the current playlist slots
          if (vt.prevSongId) {
            const actualPrevSlot = slots
              .filter((s: { type: string; position: number; songId?: string }) =>
                s.type === "song" && s.songId && s.position < (slot.position as number))
              .sort((a: { position: number }, b: { position: number }) => b.position - a.position)[0];
            if (actualPrevSlot && actualPrevSlot.songId !== vt.prevSongId) {
              const actualSong = songMap.get(actualPrevSlot.songId as string);
              warnings.push(
                `Voice track at pos ${slot.position} references prev song "${vt.prevSongTitle}" ` +
                `but actual prev song is "${actualSong?.title || "unknown"}" by ${actualSong?.artistName || "unknown"} — ` +
                `stale voice track from a previous playlist build`
              );
            }
          }
          if (vt.nextSongId) {
            const actualNextSlot = slots
              .filter((s: { type: string; position: number; songId?: string }) =>
                s.type === "song" && s.songId && s.position > (slot.position as number))
              .sort((a: { position: number }, b: { position: number }) => a.position - b.position)[0];
            if (actualNextSlot && actualNextSlot.songId !== vt.nextSongId) {
              const actualSong = songMap.get(actualNextSlot.songId as string);
              warnings.push(
                `Voice track at pos ${slot.position} references next song "${vt.nextSongTitle}" ` +
                `but actual next song is "${actualSong?.title || "unknown"}" by ${actualSong?.artistName || "unknown"} — ` +
                `stale voice track from a previous playlist build`
              );
            }
          }

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
      if (slot.type === "ad" || slot.type === "commercial" || slot.type === "sponsor") {
        const adPair = resolvedAds.get(slot.position as number);
        const pos = slot.position as number;
        const min = slot.minute as number;

        // Pick a random imaging script by type, filtered by time of day
        const pickImaging = (scriptType: string) => {
          if (!imagingVoiceMeta?.scripts) return undefined;
          const allScripts = imagingVoiceMeta.scripts[scriptType] || [];
          if (allScripts.length === 0) return undefined;
          const timeFiltered = allScripts.filter((s) => {
            const label = s.label.toLowerCase();
            return !wrongTimePeriods.some((wp) => label.includes(wp));
          });
          const scripts = timeFiltered.length > 0 ? timeFiltered : allScripts;
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

    // Filter out elements with no playable audio — prevents dead air
    const playableLog = programLog.filter((entry) => {
      // Songs: keep even without fileUrl (Railway may have its own copy)
      if (entry.type === "song") return true;
      // Voice tracks: skip if no audio
      if (entry.type === "voice_break" && !entry.voiceTrack?.audioFilePath) {
        warnings.push(`Voice break at pos ${entry.position} skipped — no audio`);
        return false;
      }
      // Features: skip if no audio
      if (entry.type === "feature" && !entry.feature?.audioFilePath) {
        warnings.push(`Feature at pos ${entry.position} skipped — no audio`);
        return false;
      }
      // Ads: skip if no audio
      if (entry.type === "ad" && !entry.ad?.audioFilePath) {
        return false; // Already warned during ad resolution
      }
      // Imaging/sweeper/promo: skip if no audio (pickImaging already handles this)
      if ((entry.type === "sweeper" || entry.type === "promo" || entry.type === "station_id") && !entry.imaging?.audioFilePath) {
        return false;
      }
      // Transitions: skip if no audio
      if (entry.type === "transition" && !entry.transition?.audioFilePath) {
        warnings.push(`Transition "${entry.transition?.name}" skipped — no audio`);
        return false;
      }
      return true;
    });

    // --- Sort by position and assign sequenceOrder + cumulativeStartSec ---
    playableLog.sort((a, b) => a.position - b.position);

    // Crossfade settings from station config
    const xfEnabled = station?.crossfadeEnabled ?? true;
    const xfDuration = station?.crossfadeDuration ?? 4.0;
    const xfFadeIn = station?.crossfadeFadeIn ?? 1.0;
    const xfFadeOut = station?.crossfadeFadeOut ?? 3.0;
    const xfCurve = station?.crossfadeCurve ?? "equal_power";
    const duckEnabled = station?.duckingEnabled ?? true;

    let cumulativeSec = 0;
    for (let i = 0; i < playableLog.length; i++) {
      const entry = playableLog[i];
      const prev = i > 0 ? playableLog[i - 1] : null;
      const next = i < playableLog.length - 1 ? playableLog[i + 1] : null;
      entry.sequenceOrder = i;
      entry.cumulativeStartSec = cumulativeSec;

      // --- Compute transition hints for Railway ---
      const hint: TransitionHint = {};

      if (entry.type === "song") {
        // Song → voice_break/feature: fade out the song tail
        if (next && (next.type === "voice_break" || next.type === "feature")) {
          hint.fadeOut = xfEnabled ? xfFadeOut : 0.5;
          // Use per-song crossfadeStart if available, otherwise use station default
          const cues = entry.song?.crossfadeStart;
          hint.overlapNext = cues ?? (xfEnabled ? station?.crossfadeStartNext ?? 1.0 : 0);
          hint.curve = xfCurve;
        }
        // Song → song: tight crossfade — next song starts before this one ends
        if (next?.type === "song" && xfEnabled) {
          hint.fadeOut = xfFadeOut;
          // Use per-song crossfadeStart cue if available, otherwise default to
          // 4 seconds of overlap for tight, radio-style transitions with no silence
          const songCue = entry.song?.crossfadeStart;
          hint.overlapNext = songCue ?? (station?.crossfadeStartNext ?? 4.0);
          hint.curve = xfCurve;
        }
        // Voice/feature → song: fade in the song
        if (prev && (prev.type === "voice_break" || prev.type === "feature")) {
          hint.fadeIn = xfEnabled ? xfFadeIn : 0.3;
        }
      }

      if (entry.type === "voice_break" || entry.type === "feature") {
        // Auto-duck music under voice elements
        if (duckEnabled) hint.duck = true;
      }

      // Only attach hint if it has properties
      if (Object.keys(hint).length > 0) {
        entry.transitionHint = hint;
      }

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

      // Subtract overlap from cumulative time (elements play sooner when crossfading)
      const overlapSec = entry.transitionHint?.overlapNext ?? 0;

      cumulativeSec += durationSec - overlapSec;

      // Add minimal tail padding after songs (crossfade handles the rest)
      if (entry.type === "song" && !entry.transitionHint?.overlapNext) {
        cumulativeSec += SONG_TAIL_PAD_SEC;
      }
    }

    // Production settings for Railway to apply DSP
    const productionSettings = station ? {
      crossfadeEnabled: station.crossfadeEnabled,
      crossfadeDuration: station.crossfadeDuration,
      crossfadeFadeIn: station.crossfadeFadeIn,
      crossfadeFadeOut: station.crossfadeFadeOut,
      crossfadeCurve: station.crossfadeCurve,
      duckingEnabled: station.duckingEnabled,
      duckingAmount: station.duckingAmount,
      duckingAttack: station.duckingAttack,
      duckingRelease: station.duckingRelease,
    } : null;

    return NextResponse.json({
      playlistId: playlist.id,
      stationId: playlist.stationId,
      djId: playlist.djId,
      scheduledDjSlug: scheduledDj?.djSlug ?? null,
      scheduledDjShift: scheduledDj
        ? { start: scheduledDj.timeSlotStart, end: scheduledDj.timeSlotEnd }
        : null,
      airDate: playlist.airDate,
      hourOfDay: playlist.hourOfDay,
      status: playlist.status,
      productionSettings,
      programLog: playableLog,
      warnings,
    });
  } catch (error) {
    return handleApiError(error, "/api/playout/hour");
  }
}
