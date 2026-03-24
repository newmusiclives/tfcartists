import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { pick, djFirstName, fillTemplate, type SongData } from "@/lib/radio/template-utils";
import { logCronExecution, isCronSuspended } from "@/lib/cron/log";
import { withCronLock } from "@/lib/cron/lock";

export const dynamic = "force-dynamic";

const POOL_TARGET = 2; // unused items per DJ per feature type
const MAX_TOTAL_FEATURES = 500; // hard cap — delete oldest used features beyond this
const MAX_GENERATE_PER_RUN = 20; // prevent runaway generation

export async function GET(req: NextRequest) {
  const _cronStart = Date.now();
  const _cronStartedAt = new Date();
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret) {
      logger.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/features-daily" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return withCronLock("features-daily", async () => {
      // Check if this job is suspended
      const suspended = await isCronSuspended("features-daily");
      if (suspended) return suspended;

      logger.info("Starting features-daily cron");

      // 1. Get station
      const station = await prisma.station.findFirst();
      if (!station) {
        return NextResponse.json({ error: "No station found" }, { status: 404 });
      }

      // 2. Fetch all active schedules with their feature types
      const schedules = await prisma.featureSchedule.findMany({
        where: { stationId: station.id, isActive: true },
        include: { featureType: true },
      });

      // 3. Fetch all DJs for name mapping
      const allDJs = await prisma.dJ.findMany({
        where: { stationId: station.id, isActive: true },
      });
      const djMap = new Map(allDJs.map((d) => [d.id, d.name]));

      // 4. Fetch all active songs for track-linked features
      const allSongs = await prisma.song.findMany({
        where: { stationId: station.id, isActive: true },
        select: { id: true, artistName: true, title: true, genre: true, album: true },
      });

      // 5. Build unique DJ+featureType combos from schedules
      const combos = new Map<string, { djId: string; djName: string; featureTypeId: string; trackPlacement: string | null; template: string | null }>();
      for (const sched of schedules) {
        if (!sched.djId || !sched.featureType.isActive) continue;
        const key = `${sched.djId}::${sched.featureTypeId}`;
        if (!combos.has(key)) {
          combos.set(key, {
            djId: sched.djId,
            djName: djMap.get(sched.djId) || sched.djName,
            featureTypeId: sched.featureTypeId,
            trackPlacement: sched.featureType.trackPlacement,
            template: sched.featureType.gptPromptTemplate,
          });
        }
      }

      // 5b. Expire stale unused content (older than 18 hours) so day-specific
      //     references like {date} and {day_name} stay accurate
      const staleThreshold = new Date(Date.now() - 18 * 60 * 60 * 1000);
      const { count: expired } = await prisma.featureContent.updateMany({
        where: {
          stationId: station.id,
          isUsed: false,
          generatedBy: "auto",
          createdAt: { lt: staleThreshold },
          featureType: { preProducible: false }, // skip pre-producible (reusable TTS)
        },
        data: { isUsed: true },
      });
      if (expired > 0) {
        logger.info("Expired stale feature content", { expired });
      }

      // Guardrail: hard cap on total features — delete oldest used ones beyond limit
      const totalFeatures = await prisma.featureContent.count({ where: { stationId: station.id } });
      let cleaned = 0;
      if (totalFeatures > MAX_TOTAL_FEATURES) {
        const excess = totalFeatures - MAX_TOTAL_FEATURES;
        const oldestUsed = await prisma.featureContent.findMany({
          where: { stationId: station.id, isUsed: true, audioFilePath: null },
          orderBy: { createdAt: "asc" },
          take: excess,
          select: { id: true },
        });
        if (oldestUsed.length > 0) {
          const { count } = await prisma.featureContent.deleteMany({
            where: { id: { in: oldestUsed.map((f) => f.id) } },
          });
          cleaned = count;
          logger.info("Cleaned excess features", { cleaned, totalBefore: totalFeatures });
        }
      }

      let generated = 0;
      let skipped = 0;
      const byDj: Record<string, number> = {};

      // 6. For each combo, check pool and generate if needed
      for (const combo of combos.values()) {
        if (!combo.template) {
          skipped++;
          continue;
        }

        // Count existing unused content for this DJ + feature type
        const available = await prisma.featureContent.count({
          where: {
            stationId: station.id,
            featureTypeId: combo.featureTypeId,
            djPersonalityId: combo.djId,
            isUsed: false,
          },
        });

        const needed = POOL_TARGET - available;
        if (needed <= 0) {
          skipped++;
          continue;
        }

        // Guardrail: stop generating if we've hit the per-run cap
        if (generated >= MAX_GENERATE_PER_RUN) {
          skipped++;
          continue;
        }

        const firstName = djFirstName(combo.djName);
        const isTrackLinked = combo.trackPlacement === "before" || combo.trackPlacement === "after";

        // Get song IDs already referenced by unused content for this feature type (for variety)
        const usedSongIds = isTrackLinked
          ? (
              await prisma.featureContent.findMany({
                where: {
                  stationId: station.id,
                  featureTypeId: combo.featureTypeId,
                  isUsed: false,
                  relatedSongId: { not: null },
                },
                select: { relatedSongId: true },
              })
            ).map((c) => c.relatedSongId).filter(Boolean) as string[]
          : [];

        const availableSongs = isTrackLinked
          ? allSongs.filter((s) => !usedSongIds.includes(s.id))
          : [];

        // Generate needed items (capped by per-run limit)
        const toGenerate = Math.min(needed, MAX_GENERATE_PER_RUN - generated);
        for (let i = 0; i < toGenerate; i++) {
          let song: SongData | undefined;
          if (isTrackLinked && availableSongs.length > 0) {
            // Pick a random song from available pool
            const idx = Math.floor(Math.random() * availableSongs.length);
            song = availableSongs[idx];
            // Remove so we don't pick the same song twice in this batch
            availableSongs.splice(idx, 1);
          } else if (isTrackLinked && allSongs.length > 0) {
            // Fallback: pick any random song if we've exhausted unique ones
            song = pick(allSongs);
          }

          const content = fillTemplate(combo.template, firstName, song);

          await prisma.featureContent.create({
            data: {
              stationId: station.id,
              featureTypeId: combo.featureTypeId,
              djPersonalityId: combo.djId,
              title: `${combo.featureTypeId.replace(/_/g, " ")} — ${combo.djName}`,
              content,
              generatedBy: "auto",
              relatedSongId: song?.id || null,
              contextData: JSON.stringify({
                artistName: song?.artistName || null,
                songTitle: song?.title || null,
                genre: song?.genre || null,
              }),
            },
          });

          generated++;
          byDj[combo.djName] = (byDj[combo.djName] || 0) + 1;
        }
      }

      logger.info("Features-daily cron completed", { generated, skipped, expired, cleaned, byDj });

      await logCronExecution({ jobName: "features-daily", status: "success", duration: Date.now() - _cronStart, summary: { generated, skipped, expired, cleaned, byDj } as Record<string, unknown>, startedAt: _cronStartedAt });

      return NextResponse.json({
        success: true,
        generated,
        skipped,
        expired,
        cleaned,
        byDj,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error("Features-daily cron failed", { error });

    await logCronExecution({ jobName: "features-daily", status: "error", duration: Date.now() - _cronStart, error: error instanceof Error ? error.message : String(error), startedAt: _cronStartedAt });

    return NextResponse.json(
      {
        error: "Features daily cron failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
