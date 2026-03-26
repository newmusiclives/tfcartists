import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { logCronExecution, isCronSuspended } from "@/lib/cron/log";
import { withCronLock } from "@/lib/cron/lock";
import {
  postToAllPlatforms,
  type Platform,
  type SocialPostResult,
} from "@/lib/social/platforms";
import { generateNowPlayingPost } from "@/lib/social/content-generator";

export const dynamic = "force-dynamic";

/** Frequency options in milliseconds */
const FREQUENCY_MS: Record<string, number> = {
  every_song: 0, // No cooldown — post on every invocation
  every_15min: 15 * 60 * 1000,
  every_30min: 30 * 60 * 1000,
  every_hour: 60 * 60 * 1000,
};

const DEFAULT_TEMPLATE =
  '\u{1F3B5} Now Playing on {station}: "{title}" by {artist} | Listen live: {url} #NowPlaying #{stationHashtag}';

function fillPostTemplate(
  template: string,
  vars: {
    title: string;
    artist: string;
    station: string;
    url: string;
    dj: string;
    stationHashtag: string;
  }
): string {
  return template
    .replace(/\{title\}/gi, vars.title)
    .replace(/\{artist\}/gi, vars.artist)
    .replace(/\{station\}/gi, vars.station)
    .replace(/\{url\}/gi, vars.url)
    .replace(/\{dj\}/gi, vars.dj)
    .replace(/\{stationHashtag\}/gi, vars.stationHashtag);
}

/**
 * GET /api/cron/social-post
 *
 * Cron endpoint that checks the current now-playing track and posts to
 * enabled social platforms based on frequency settings.
 *
 * Auth: Bearer CRON_SECRET
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
      logger.warn("Unauthorized cron attempt", { path: "/api/cron/social-post" });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return withCronLock("social-post", async () => {
      // Check if this job is suspended
      const suspended = await isCronSuspended("social-post");
      if (suspended) return suspended;

      logger.info("Starting social-post cron");

      // 1. Load social settings
      const settingsRow = await prisma.config.findUnique({
        where: { key: "social_settings" },
      });

      if (!settingsRow) {
        logger.info("Social posting not configured — skipping");
        await logCronExecution({
          jobName: "social-post",
          status: "success",
          duration: Date.now() - _cronStart,
          summary: { message: "Not configured" } as Record<string, unknown>,
          startedAt: _cronStartedAt,
        });
        return NextResponse.json({
          success: true,
          message: "Social posting not configured",
        });
      }

      const settings = JSON.parse(settingsRow.value);
      const enabledPlatforms: Platform[] = [];
      if (settings.twitterEnabled) enabledPlatforms.push("twitter");
      if (settings.facebookEnabled) enabledPlatforms.push("facebook");
      if (settings.instagramEnabled) enabledPlatforms.push("instagram");
      if (settings.tiktokEnabled) enabledPlatforms.push("tiktok");

      if (enabledPlatforms.length === 0) {
        logger.info("No social platforms enabled — skipping");
        await logCronExecution({
          jobName: "social-post",
          status: "success",
          duration: Date.now() - _cronStart,
          summary: { message: "No platforms enabled" } as Record<string, unknown>,
          startedAt: _cronStartedAt,
        });
        return NextResponse.json({
          success: true,
          message: "No social platforms enabled",
        });
      }

      // 2. Check posting frequency
      const frequency = settings.postFrequency || "every_hour";
      const cooldownMs = FREQUENCY_MS[frequency] ?? FREQUENCY_MS.every_hour;

      const lastPostRow = await prisma.config.findUnique({
        where: { key: "social_last_post_time" },
      });
      const lastPostTime = lastPostRow ? parseInt(lastPostRow.value, 10) : 0;
      const elapsed = Date.now() - lastPostTime;

      if (cooldownMs > 0 && elapsed < cooldownMs) {
        const remainingSec = Math.round((cooldownMs - elapsed) / 1000);
        logger.info("Social post cooldown active", { remainingSec, frequency });
        await logCronExecution({
          jobName: "social-post",
          status: "success",
          duration: Date.now() - _cronStart,
          summary: { message: `Cooldown active (${remainingSec}s remaining)` } as Record<string, unknown>,
          startedAt: _cronStartedAt,
        });
        return NextResponse.json({
          success: true,
          message: `Cooldown active — ${remainingSec}s remaining`,
          nextPostIn: remainingSec,
        });
      }

      // 3. Get current now-playing data
      const station = await prisma.station.findFirst({
        where: { isActive: true },
        select: { id: true, name: true, callSign: true },
      });
      if (!station) {
        return NextResponse.json({ error: "No active station" }, { status: 404 });
      }

      // Fetch now-playing from internal API
      let nowPlaying: { title?: string; artist_name?: string; dj_name?: string; status?: string } = {};
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/now-playing`, {
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          nowPlaying = await res.json();
        }
      } catch {
        logger.warn("Failed to fetch now-playing for social post");
      }

      const title = nowPlaying.title || "Music";
      const artist = nowPlaying.artist_name || station.name;
      const djName = nowPlaying.dj_name || "";

      // Don't post generic "Music" tracks
      if (title === "Music" && artist === station.name) {
        logger.info("Skipping social post — no specific track playing");
        await logCronExecution({
          jobName: "social-post",
          status: "success",
          duration: Date.now() - _cronStart,
          summary: { message: "No specific track playing" } as Record<string, unknown>,
          startedAt: _cronStartedAt,
        });
        return NextResponse.json({
          success: true,
          message: "No specific track playing — skipped",
        });
      }

      // 4. Check for duplicate (don't post same song twice in a row)
      const lastSongRow = await prisma.config.findUnique({
        where: { key: "social_last_song" },
      });
      const lastSong = lastSongRow?.value || "";
      const currentSongKey = `${artist} - ${title}`;

      if (lastSong === currentSongKey && cooldownMs > 0) {
        logger.info("Skipping social post — same song as last post", { currentSongKey });
        await logCronExecution({
          jobName: "social-post",
          status: "success",
          duration: Date.now() - _cronStart,
          summary: { message: "Same song as last post" } as Record<string, unknown>,
          startedAt: _cronStartedAt,
        });
        return NextResponse.json({
          success: true,
          message: "Same song as last post — skipped",
        });
      }

      // 5. Generate post content using content generator
      const hashtags: string[] = settings.hashtags || [];
      const extraHashtags = hashtags
        .map((h: string) => (h.startsWith("#") ? h : `#${h}`));
      const siteUrl = settings.siteUrl || "https://truefans-radio.netlify.app";

      // Use the custom template if set, otherwise use the content generator
      const useCustomTemplate = Boolean(settings.postTemplate);

      // Generate platform-specific content via content generator (used for all platforms)
      const generatedByPlatform: Record<string, { text: string; mediaUrl?: string }> = {};
      for (const p of enabledPlatforms) {
        if (useCustomTemplate) {
          // Fill the user-defined template
          const template = settings.postTemplate || DEFAULT_TEMPLATE;
          const stationHashtag =
            hashtags[0]?.replace(/^#/, "") ||
            (station.callSign || station.name).replace(/[^a-zA-Z0-9]/g, "");
          const filled = fillPostTemplate(template, {
            title,
            artist,
            station: station.name,
            url: siteUrl,
            dj: djName,
            stationHashtag,
          });
          generatedByPlatform[p] = { text: filled };
        } else {
          const generated = generateNowPlayingPost(
            { title, artist, djName },
            { name: station.name, listenUrl: siteUrl },
            p,
            extraHashtags
          );
          generatedByPlatform[p] = { text: generated.text, mediaUrl: generated.mediaUrl };
        }
      }

      // 6. Post to all enabled platforms via real APIs
      const apiResults: SocialPostResult[] = await postToAllPlatforms(
        enabledPlatforms,
        // Use the first platform's text as the base (all are similar for now-playing)
        generatedByPlatform[enabledPlatforms[0]]?.text || "",
        generatedByPlatform[enabledPlatforms[0]]?.mediaUrl
      );

      // Build post records and store in log
      const results: { platform: string; status: string; postId?: string | null; error?: string }[] = [];
      const logKey = "social_post_log";
      const existingLog = await prisma.config.findUnique({ where: { key: logKey } });
      const posts = existingLog ? JSON.parse(existingLog.value) : [];

      for (let i = 0; i < enabledPlatforms.length; i++) {
        const platform = enabledPlatforms[i];
        const apiResult = apiResults[i];
        const content = generatedByPlatform[platform]?.text || "";
        const postStatus = apiResult?.success ? "sent" : "logged";

        const postRecord = {
          id: crypto.randomUUID(),
          platform,
          content,
          imageUrl: generatedByPlatform[platform]?.mediaUrl || null,
          songTitle: title,
          artistName: artist,
          stationId: station.id,
          stationName: station.name,
          status: postStatus,
          platformPostId: apiResult?.postId || null,
          error: apiResult?.error || null,
          createdAt: new Date().toISOString(),
        };

        posts.unshift(postRecord);
        results.push({
          platform,
          status: postStatus,
          postId: apiResult?.postId,
          error: apiResult?.error,
        });
        logger.info("Social post processed", { platform, title, artist, status: postStatus });
      }

      // Trim log and persist
      if (posts.length > 100) posts.length = 100;
      await prisma.config.upsert({
        where: { key: logKey },
        update: { value: JSON.stringify(posts) },
        create: { key: logKey, value: JSON.stringify(posts) },
      });

      // 7. Update last post time and last song
      await prisma.config.upsert({
        where: { key: "social_last_post_time" },
        update: { value: String(Date.now()) },
        create: { key: "social_last_post_time", value: String(Date.now()) },
      });

      await prisma.config.upsert({
        where: { key: "social_last_song" },
        update: { value: currentSongKey },
        create: { key: "social_last_song", value: currentSongKey },
      });

      const summary = {
        platforms: enabledPlatforms,
        song: currentSongKey,
        postsCreated: results.length,
        results,
      };

      logger.info("Social-post cron completed", summary);

      await logCronExecution({
        jobName: "social-post",
        status: "success",
        duration: Date.now() - _cronStart,
        summary: summary as Record<string, unknown>,
        startedAt: _cronStartedAt,
      });

      return NextResponse.json({
        success: true,
        ...summary,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error("Social-post cron failed", { error });

    await logCronExecution({
      jobName: "social-post",
      status: "error",
      duration: Date.now() - _cronStart,
      error: error instanceof Error ? error.message : String(error),
      startedAt: _cronStartedAt,
    });

    return NextResponse.json(
      {
        error: "Social post cron failed",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
