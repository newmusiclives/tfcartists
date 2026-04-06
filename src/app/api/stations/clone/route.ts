import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { z } from "zod";
import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const cloneSchema = z.object({
  sourceStationId: z.string().min(1),
  newName: z.string().min(2, "Station name must be at least 2 characters"),
  newCallSign: z.string().regex(/^[A-Z]{2,5}$/i, "Call sign must be 2-5 letters").optional(),
  newGenre: z.string().optional(),
});

/**
 * POST /api/stations/clone
 * One-click station clone — duplicates a station with all its DJs,
 * clock templates, schedule assignments, feature schedules, imaging voices,
 * and music beds.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = cloneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { sourceStationId, newName, newCallSign, newGenre } = parsed.data;

    // Verify organization access
    const orgId = session.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Verify source station belongs to this org
    const source = await prisma.station.findFirst({
      where: { id: sourceStationId, organizationId: orgId, deletedAt: null },
    });
    if (!source) {
      return NextResponse.json({ error: "Source station not found" }, { status: 404 });
    }

    // Check station limit
    const stationCount = await prisma.station.count({
      where: { organizationId: orgId, deletedAt: null },
    });
    if (stationCount >= org.maxStations) {
      return NextResponse.json(
        { error: `Station limit reached (${org.maxStations}). Upgrade your plan for more.` },
        { status: 403 }
      );
    }

    // Clone everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Clone station
      const stationCode = newCallSign?.toLowerCase() || newName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const newStation = await tx.station.create({
        data: {
          name: newName,
          callSign: newCallSign?.toUpperCase() || null,
          stationCode,
          tagline: source.tagline,
          description: source.description,
          stationMode: source.stationMode,
          formatType: source.formatType,
          musicEra: source.musicEra,
          logoUrl: source.logoUrl,
          primaryColor: source.primaryColor,
          secondaryColor: source.secondaryColor,
          genre: newGenre || source.genre,
          maxTracksPerMonth: source.maxTracksPerMonth,
          maxAdsPerMonth: source.maxAdsPerMonth,
          maxArtistCapacity: source.maxArtistCapacity,
          maxSponsorCapacity: source.maxSponsorCapacity,
          targetDAU: source.targetDAU,
          primeHoursStart: source.primeHoursStart,
          primeHoursEnd: source.primeHoursEnd,
          streamBitrate: source.streamBitrate,
          streamFormat: source.streamFormat,
          crossfadeEnabled: source.crossfadeEnabled,
          crossfadeDuration: source.crossfadeDuration,
          crossfadeStartNext: source.crossfadeStartNext,
          crossfadeFadeIn: source.crossfadeFadeIn,
          crossfadeFadeOut: source.crossfadeFadeOut,
          crossfadeCurve: source.crossfadeCurve,
          normalizationEnabled: source.normalizationEnabled,
          normalizationTarget: source.normalizationTarget,
          normalizationWindow: source.normalizationWindow,
          normalizationGainMax: source.normalizationGainMax,
          normalizationGainMin: source.normalizationGainMin,
          compressionEnabled: source.compressionEnabled,
          compressionAttack: source.compressionAttack,
          compressionRelease: source.compressionRelease,
          compressionRatio: source.compressionRatio,
          compressionThreshold: source.compressionThreshold,
          compressionKnee: source.compressionKnee,
          eqEnabled: source.eqEnabled,
          eqLowFreq: source.eqLowFreq,
          eqLowGain: source.eqLowGain,
          eqMidFreq: source.eqMidFreq,
          eqMidGain: source.eqMidGain,
          eqHighFreq: source.eqHighFreq,
          eqHighGain: source.eqHighGain,
          duckingEnabled: source.duckingEnabled,
          duckingAmount: source.duckingAmount,
          duckingAttack: source.duckingAttack,
          duckingRelease: source.duckingRelease,
          subscriptionTier: source.subscriptionTier,
          organizationId: orgId,
          setupStep: 5,
          setupComplete: true,
          isActive: true,
          launchDate: new Date(),
          metadata: source.metadata as Prisma.InputJsonValue ?? undefined,
        },
      });

      // 2. Clone DJs — build old-to-new ID mapping
      const sourceDJs = await tx.dJ.findMany({
        where: { stationId: sourceStationId, isActive: true },
      });

      const djIdMap = new Map<string, string>(); // oldId -> newId
      for (const dj of sourceDJs) {
        const djSlug = `${dj.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${newStation.id.slice(-6)}`;
        const newDJ = await tx.dJ.create({
          data: {
            stationId: newStation.id,
            name: dj.name,
            slug: djSlug,
            fullName: dj.fullName,
            bio: dj.bio,
            age: dj.age,
            background: dj.background,
            vibe: dj.vibe,
            tagline: dj.tagline,
            voiceDescription: dj.voiceDescription,
            personalityTraits: dj.personalityTraits,
            musicalFocus: dj.musicalFocus,
            voiceProfileId: dj.voiceProfileId,
            voiceStability: dj.voiceStability,
            voiceSimilarityBoost: dj.voiceSimilarityBoost,
            ttsVoice: dj.ttsVoice,
            ttsProvider: dj.ttsProvider,
            gptSystemPrompt: dj.gptSystemPrompt,
            gptTemperature: dj.gptTemperature,
            catchPhrases: dj.catchPhrases,
            additionalKnowledge: dj.additionalKnowledge,
            hometown: dj.hometown,
            showFormat: dj.showFormat,
            onAirStyle: dj.onAirStyle,
            quirksAndHabits: dj.quirksAndHabits,
            atmosphere: dj.atmosphere,
            philosophy: dj.philosophy,
            photoUrl: dj.photoUrl,
            colorPrimary: dj.colorPrimary,
            colorSecondary: dj.colorSecondary,
            isActive: true,
            isWeekend: dj.isWeekend,
            priority: dj.priority,
            metadata: dj.metadata as Prisma.InputJsonValue ?? undefined,
          },
        });
        djIdMap.set(dj.id, newDJ.id);
      }

      // 3. Clone clock templates — build old-to-new ID mapping
      const sourceTemplates = await tx.clockTemplate.findMany({
        where: { stationId: sourceStationId, isActive: true },
      });

      const templateIdMap = new Map<string, string>();
      for (const tpl of sourceTemplates) {
        const newTpl = await tx.clockTemplate.create({
          data: {
            stationId: newStation.id,
            name: tpl.name,
            description: tpl.description,
            clockType: tpl.clockType,
            tempo: tpl.tempo,
            energyLevel: tpl.energyLevel,
            hitsPerHour: tpl.hitsPerHour,
            indiePerHour: tpl.indiePerHour,
            genderBalanceTarget: tpl.genderBalanceTarget,
            clockPattern: tpl.clockPattern,
            transitionCrossfadeDuration: tpl.transitionCrossfadeDuration,
            transitionCurve: tpl.transitionCurve,
            isActive: true,
            metadata: tpl.metadata as Prisma.InputJsonValue ?? undefined,
          },
        });
        templateIdMap.set(tpl.id, newTpl.id);
      }

      // 4. Clone clock assignments (remapping DJ and template IDs)
      const sourceAssignments = await tx.clockAssignment.findMany({
        where: { stationId: sourceStationId, isActive: true },
      });

      for (const assignment of sourceAssignments) {
        const newDjId = djIdMap.get(assignment.djId);
        const newTemplateId = templateIdMap.get(assignment.clockTemplateId);
        if (!newDjId || !newTemplateId) continue; // skip if DJ or template was inactive

        await tx.clockAssignment.create({
          data: {
            stationId: newStation.id,
            djId: newDjId,
            clockTemplateId: newTemplateId,
            dayType: assignment.dayType,
            timeSlotStart: assignment.timeSlotStart,
            timeSlotEnd: assignment.timeSlotEnd,
            priority: assignment.priority,
            isActive: true,
            metadata: assignment.metadata as Prisma.InputJsonValue ?? undefined,
          },
        });
      }

      // 5. Clone feature schedules (remapping DJ IDs)
      const sourceFeatures = await tx.featureSchedule.findMany({
        where: { stationId: sourceStationId, isActive: true },
      });

      for (const feat of sourceFeatures) {
        const newDjId = feat.djId ? djIdMap.get(feat.djId) : null;
        await tx.featureSchedule.create({
          data: {
            stationId: newStation.id,
            featureTypeId: feat.featureTypeId,
            djId: newDjId || feat.djId,
            djName: feat.djName,
            frequencyPerShow: feat.frequencyPerShow,
            minSongsBetween: feat.minSongsBetween,
            priority: feat.priority,
            isActive: true,
            metadata: feat.metadata,
          },
        });
      }

      // 6. Clone station imaging voices
      const sourceVoices = await tx.stationImagingVoice.findMany({
        where: { stationId: sourceStationId, isActive: true },
      });

      for (const voice of sourceVoices) {
        await tx.stationImagingVoice.create({
          data: {
            stationId: newStation.id,
            displayName: voice.displayName,
            voiceType: voice.voiceType,
            elevenlabsVoiceId: voice.elevenlabsVoiceId, // legacy field — retained for DB compatibility
            voiceStability: voice.voiceStability,
            voiceSimilarityBoost: voice.voiceSimilarityBoost,
            voiceStyle: voice.voiceStyle,
            usageTypes: voice.usageTypes,
            isActive: true,
            metadata: voice.metadata as Prisma.InputJsonValue ?? undefined,
          },
        });
      }

      // 7. Clone music beds
      const sourceBeds = await tx.musicBed.findMany({
        where: { stationId: sourceStationId, isActive: true },
      });

      for (const bed of sourceBeds) {
        await tx.musicBed.create({
          data: {
            stationId: newStation.id,
            name: bed.name,
            fileName: bed.fileName,
            filePath: bed.filePath,
            durationSeconds: bed.durationSeconds,
            category: bed.category,
            isActive: true,
            metadata: bed.metadata as Prisma.InputJsonValue ?? undefined,
          },
        });
      }

      return {
        station: newStation,
        djCount: djIdMap.size,
        templateCount: templateIdMap.size,
        assignmentCount: sourceAssignments.length,
        featureCount: sourceFeatures.length,
        voiceCount: sourceVoices.length,
        bedCount: sourceBeds.length,
      };
    });

    logger.info("Station cloned", {
      sourceStationId,
      newStationId: result.station.id,
      djCount: result.djCount,
      templateCount: result.templateCount,
    });

    return NextResponse.json({
      success: true,
      stationId: result.station.id,
      stationName: result.station.name,
      djCount: result.djCount,
      templateCount: result.templateCount,
      assignmentCount: result.assignmentCount,
      featureCount: result.featureCount,
      voiceCount: result.voiceCount,
      bedCount: result.bedCount,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/stations/clone");
  }
}
