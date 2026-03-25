import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { logCronExecution, isCronSuspended } from "@/lib/cron/log";
import { withCronLock } from "@/lib/cron/lock";

export const dynamic = "force-dynamic";

/**
 * Podcast auto-recording cron.
 *
 * Scans HourPlaylists that have status "aired" in the past 24 hours
 * and creates a PodcastEpisode for each one that doesn't already exist.
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
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/podcast-generate" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return withCronLock("podcast-generate", async () => {
      // Check if this job is suspended
      const suspended = await isCronSuspended("podcast-generate");
      if (suspended) return suspended;

      logger.info("Starting podcast-generate cron");

      // 1. Get station
      const station = await prisma.station.findFirst();
      if (!station) {
        return NextResponse.json({ error: "No station found" }, { status: 404 });
      }

      // 2. Find aired playlists from the past 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const airedPlaylists = await prisma.hourPlaylist.findMany({
        where: {
          stationId: station.id,
          status: "aired",
          airDate: { gte: twentyFourHoursAgo },
        },
        orderBy: [{ airDate: "asc" }, { hourOfDay: "asc" }],
      });

      if (airedPlaylists.length === 0) {
        logger.info("No aired playlists found in past 24 hours");
        await logCronExecution({
          jobName: "podcast-generate",
          status: "success",
          duration: Date.now() - _cronStart,
          summary: { created: 0, skipped: 0, errors: 0, message: "No aired playlists" },
          startedAt: _cronStartedAt,
        });
        return NextResponse.json({ success: true, created: 0, skipped: 0, errors: 0 });
      }

      // 3. Fetch all DJs for name lookup
      const allDJs = await prisma.dJ.findMany({
        where: { stationId: station.id },
        select: { id: true, name: true },
      });
      const djMap = new Map(allDJs.map((d) => [d.id, d.name]));

      // 4. Check existing podcast episodes to avoid duplicates
      //    PodcastEpisode.airDate is a String? (YYYY-MM-DD format)
      const existingEpisodes = await prisma.podcastEpisode.findMany({
        where: {
          stationId: station.id,
          episodeType: "HOURLY_REPLAY",
        },
        select: { airDate: true, hourOfDay: true },
      });
      const existingKeys = new Set(
        existingEpisodes.map((e) => `${e.airDate}::${e.hourOfDay}`)
      );

      // 5. Get current episode count for numbering
      let episodeNumber = await prisma.podcastEpisode.count({
        where: { stationId: station.id },
      });

      let created = 0;
      let skipped = 0;
      let errors = 0;

      // 6. Process each aired playlist
      for (const playlist of airedPlaylists) {
        try {
          // Format airDate as YYYY-MM-DD string for dedup key
          const airDateStr = playlist.airDate.toISOString().split("T")[0];
          const dedupeKey = `${airDateStr}::${playlist.hourOfDay}`;

          if (existingKeys.has(dedupeKey)) {
            skipped++;
            continue;
          }

          // Parse slots JSON to build track listing
          let slots: Array<{
            type?: string;
            songTitle?: string;
            artistName?: string;
          }> = [];
          try {
            slots = JSON.parse(playlist.slots);
          } catch {
            logger.warn("Failed to parse slots JSON", { playlistId: playlist.id });
          }

          const songSlots = slots.filter(
            (s) => s.type === "song" && s.songTitle
          );

          const tracklist = songSlots
            .map((s, i) => `${i + 1}. ${s.songTitle} — ${s.artistName || "Unknown"}`)
            .join("\n");

          // Look up DJ name
          const djName = djMap.get(playlist.djId) || "Unknown DJ";

          // Format title: "DJ Name's Show — March 25, 2026 at 3 PM"
          const airDateObj = playlist.airDate;
          const monthDay = airDateObj.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          });
          const hour = playlist.hourOfDay;
          const hourLabel =
            hour === 0
              ? "12 AM"
              : hour < 12
                ? `${hour} AM`
                : hour === 12
                  ? "12 PM"
                  : `${hour - 12} PM`;
          const title = `${djName}'s Show — ${monthDay} at ${hourLabel}`;

          const description = songSlots.length > 0
            ? `Tracklist:\n${tracklist}`
            : "No tracklist available for this episode.";

          episodeNumber++;

          await prisma.podcastEpisode.create({
            data: {
              stationId: station.id,
              title,
              description,
              audioFilePath: null,
              duration: 3600,
              fileSize: null,
              publishedAt: new Date(),
              episodeType: "HOURLY_REPLAY",
              seasonNumber: null,
              episodeNumber,
              djName,
              hourOfDay: playlist.hourOfDay,
              airDate: airDateStr,
              isPublished: true,
            },
          });

          // Track this key so we don't create duplicates within the same run
          existingKeys.add(dedupeKey);
          created++;
        } catch (err) {
          errors++;
          logger.error("Failed to create podcast episode", {
            playlistId: playlist.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      logger.info("Podcast-generate cron completed", { created, skipped, errors });

      await logCronExecution({
        jobName: "podcast-generate",
        status: errors > 0 && created === 0 ? "error" : "success",
        duration: Date.now() - _cronStart,
        summary: { created, skipped, errors } as Record<string, unknown>,
        startedAt: _cronStartedAt,
      });

      return NextResponse.json({
        success: true,
        created,
        skipped,
        errors,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error("Podcast-generate cron failed", { error });

    await logCronExecution({
      jobName: "podcast-generate",
      status: "error",
      duration: Date.now() - _cronStart,
      error: error instanceof Error ? error.message : String(error),
      startedAt: _cronStartedAt,
    });

    return NextResponse.json(
      {
        error: "Podcast generate cron failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
