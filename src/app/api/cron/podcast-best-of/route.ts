import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { logCronExecution, isCronSuspended } from "@/lib/cron/log";
import { withCronLock } from "@/lib/cron/lock";

export const dynamic = "force-dynamic";

/**
 * Weekly "Best Of" podcast episode generation cron.
 *
 * Designed to be triggered every Sunday morning by an external scheduler.
 * Aggregates the past 7 days of playback data and feature content into
 * a single WEEKLY_BEST_OF PodcastEpisode.
 */
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
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/podcast-best-of" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return withCronLock("podcast-best-of", async () => {
      // Check if this job is suspended
      const suspended = await isCronSuspended("podcast-best-of");
      if (suspended) return suspended;

      logger.info("Starting podcast-best-of cron");

      // 1. Get station
      const station = await prisma.station.findFirst();
      if (!station) {
        return NextResponse.json({ error: "No station found" }, { status: 404 });
      }

      // 2. Calculate the week window (past 7 days)
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setHours(0, 0, 0, 0);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      const airDateStr = weekStart.toISOString().split("T")[0]; // YYYY-MM-DD of week start

      // 3. Skip if a WEEKLY_BEST_OF episode already exists for this week's airDate
      const existing = await prisma.podcastEpisode.findFirst({
        where: {
          stationId: station.id,
          episodeType: "WEEKLY_BEST_OF",
          airDate: airDateStr,
        },
      });

      if (existing) {
        logger.info("WEEKLY_BEST_OF episode already exists for this week", { airDate: airDateStr });
        await logCronExecution({
          jobName: "podcast-best-of",
          status: "success",
          duration: Date.now() - _cronStart,
          summary: { created: 0, skipped: 1, message: "Episode already exists for this week" },
          startedAt: _cronStartedAt,
        });
        return NextResponse.json({ success: true, created: 0, skipped: 1, message: "Already exists" });
      }

      // 4a. Top 20 most-played songs (group by trackTitle + artistName)
      const playbacks = await prisma.trackPlayback.groupBy({
        by: ["trackTitle", "artistName"],
        where: {
          playedAt: { gte: weekStart, lt: weekEnd },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 20,
      });

      // 4b. Top 5 feature content used in the past week
      const features = await prisma.featureContent.findMany({
        where: {
          stationId: station.id,
          isUsed: true,
          playedAt: { gte: weekStart, lt: weekEnd },
        },
        orderBy: { playedAt: "desc" },
        take: 5,
        select: {
          title: true,
          content: true,
          djPersonalityId: true,
        },
      });

      // Resolve DJ names for features
      const djPersonalityIds = features
        .map((f) => f.djPersonalityId)
        .filter((id): id is string => id != null);

      const djs = djPersonalityIds.length > 0
        ? await prisma.dJ.findMany({
            where: { id: { in: djPersonalityIds } },
            select: { id: true, name: true },
          })
        : [];
      const djMap = new Map(djs.map((d) => [d.id, d.name]));

      // 4c. Active DJs this week (from playbacks)
      const activeDJRows = await prisma.trackPlayback.groupBy({
        by: ["djId"],
        where: {
          playedAt: { gte: weekStart, lt: weekEnd },
          djId: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      });

      const activeDJIds = activeDJRows
        .map((r) => r.djId)
        .filter((id): id is string => id != null);

      const activeDJs = activeDJIds.length > 0
        ? await prisma.dJ.findMany({
            where: { id: { in: activeDJIds } },
            select: { id: true, name: true },
          })
        : [];
      const activeDJNames = activeDJs.map((d) => d.name);

      // 5. Build episode content
      const weekStartLabel = weekStart.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });

      const title = `Best of North Country Radio — Week of ${weekStartLabel}`;

      // Top 20 section
      let descriptionParts: string[] = [];

      descriptionParts.push("## Top 20 Songs This Week\n");
      if (playbacks.length > 0) {
        playbacks.forEach((p, i) => {
          descriptionParts.push(`${i + 1}. **${p.trackTitle}** — ${p.artistName} (${p._count.id} plays)`);
        });
      } else {
        descriptionParts.push("_No playback data available for this week._");
      }

      // Featured Moments section
      descriptionParts.push("\n## Featured Moments\n");
      if (features.length > 0) {
        features.forEach((f) => {
          const djName = f.djPersonalityId ? djMap.get(f.djPersonalityId) || "Unknown DJ" : "Station";
          const featureTitle = f.title || "Untitled Feature";
          descriptionParts.push(`- **${featureTitle}** (${djName}): ${f.content.slice(0, 200)}${f.content.length > 200 ? "..." : ""}`);
        });
      } else {
        descriptionParts.push("_No featured moments this week._");
      }

      // This Week's DJs section
      descriptionParts.push("\n## This Week's DJs\n");
      if (activeDJNames.length > 0) {
        activeDJNames.forEach((name) => {
          descriptionParts.push(`- ${name}`);
        });
      } else {
        descriptionParts.push("_No DJ data available for this week._");
      }

      const description = descriptionParts.join("\n");

      // 6. Calculate seasonNumber (ISO week number) and episodeNumber
      const seasonNumber = getISOWeekNumber(weekStart);
      const weeklyEpisodeCount = await prisma.podcastEpisode.count({
        where: {
          stationId: station.id,
          episodeType: "WEEKLY_BEST_OF",
        },
      });
      const episodeNumber = weeklyEpisodeCount + 1;

      // 7. Create the PodcastEpisode
      const episode = await prisma.podcastEpisode.create({
        data: {
          stationId: station.id,
          title,
          description,
          audioFilePath: null,
          duration: null,
          fileSize: null,
          publishedAt: new Date(),
          episodeType: "WEEKLY_BEST_OF",
          seasonNumber,
          episodeNumber,
          djName: activeDJNames.length > 0 ? activeDJNames.join(", ") : null,
          hourOfDay: null,
          airDate: airDateStr,
          isPublished: true,
        },
      });

      logger.info("Created WEEKLY_BEST_OF podcast episode", {
        episodeId: episode.id,
        airDate: airDateStr,
        topSongs: playbacks.length,
        features: features.length,
        activeDJs: activeDJNames.length,
      });

      await logCronExecution({
        jobName: "podcast-best-of",
        status: "success",
        duration: Date.now() - _cronStart,
        summary: {
          created: 1,
          episodeId: episode.id,
          topSongs: playbacks.length,
          features: features.length,
          activeDJs: activeDJNames.length,
        } as Record<string, unknown>,
        startedAt: _cronStartedAt,
      });

      return NextResponse.json({
        success: true,
        created: 1,
        episodeId: episode.id,
        title,
        topSongs: playbacks.length,
        features: features.length,
        activeDJs: activeDJNames.length,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error("Podcast-best-of cron failed", { error });

    await logCronExecution({
      jobName: "podcast-best-of",
      status: "error",
      duration: Date.now() - _cronStart,
      error: error instanceof Error ? error.message : String(error),
      startedAt: _cronStartedAt,
    });

    return NextResponse.json(
      {
        error: "Podcast best-of cron failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}

/** Returns ISO 8601 week number for a given date. */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
