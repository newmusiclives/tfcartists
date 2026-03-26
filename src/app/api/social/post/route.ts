import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  postToTwitter,
  postToFacebook,
  postToInstagram,
  postToTikTok,
  type Platform,
  type SocialPostResult,
} from "@/lib/social/platforms";

export const dynamic = "force-dynamic";

/** Default post template */
const DEFAULT_TEMPLATE =
  '\u{1F3B5} Now Playing on {station}: "{title}" by {artist} | Listen live: {url} #NowPlaying #{stationHashtag}';

interface SocialPostBody {
  platform: "twitter" | "facebook" | "instagram" | "tiktok";
  content?: string;
  imageUrl?: string;
  songTitle: string;
  artistName: string;
  stationId?: string;
}

const PLATFORM_POSTERS: Record<
  string,
  (content: string, mediaUrl?: string) => Promise<SocialPostResult>
> = {
  twitter: postToTwitter,
  facebook: postToFacebook,
  instagram: postToInstagram,
  tiktok: postToTikTok,
};

/**
 * Fill a post template with track data.
 */
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
 * POST /api/social/post
 *
 * Creates a social media post record. Currently stores the generated post
 * text in the Config table as a JSON log. When real platform API keys are
 * configured, this endpoint will dispatch the post to Twitter/Facebook/Instagram.
 */
export async function POST(req: NextRequest) {
  try {
    const body: SocialPostBody = await req.json();
    const { platform, imageUrl, songTitle, artistName } = body;

    if (!platform || !songTitle || !artistName) {
      return NextResponse.json(
        { error: "platform, songTitle, and artistName are required" },
        { status: 400 }
      );
    }

    if (!["twitter", "facebook", "instagram", "tiktok"].includes(platform)) {
      return NextResponse.json(
        { error: "platform must be twitter, facebook, instagram, or tiktok" },
        { status: 400 }
      );
    }

    // Load station info
    const station = await prisma.station.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, callSign: true },
    });
    if (!station) {
      return NextResponse.json({ error: "No active station" }, { status: 404 });
    }

    // Load social settings from Config
    const settingsRow = await prisma.config.findUnique({
      where: { key: "social_settings" },
    });
    const settings = settingsRow ? JSON.parse(settingsRow.value) : {};

    const template = settings.postTemplate || DEFAULT_TEMPLATE;
    const hashtags: string[] = settings.hashtags || [];
    const stationHashtag =
      hashtags[0] ||
      (station.callSign || station.name).replace(/[^a-zA-Z0-9]/g, "");
    const siteUrl = settings.siteUrl || "https://truefans-radio.netlify.app";

    // Build post text
    let content =
      body.content ||
      fillPostTemplate(template, {
        title: songTitle,
        artist: artistName,
        station: station.name,
        url: siteUrl,
        dj: settings.currentDj || "",
        stationHashtag,
      });

    // Append extra hashtags
    if (hashtags.length > 1) {
      const extra = hashtags
        .slice(1)
        .map((h: string) => (h.startsWith("#") ? h : `#${h}`))
        .join(" ");
      content = `${content} ${extra}`;
    }

    // Attempt to post to the real platform API
    const posterFn = PLATFORM_POSTERS[platform];
    let apiResult: SocialPostResult | null = null;
    let postStatus: "sent" | "logged" = "logged";

    if (posterFn) {
      apiResult = await posterFn(content, imageUrl || undefined);
      if (apiResult.success) {
        postStatus = "sent";
      }
    }

    // Build the post record
    const postRecord = {
      id: crypto.randomUUID(),
      platform,
      content,
      imageUrl: imageUrl || null,
      songTitle,
      artistName,
      stationId: station.id,
      stationName: station.name,
      status: postStatus,
      platformPostId: apiResult?.postId || null,
      error: apiResult?.error || null,
      createdAt: new Date().toISOString(),
    };

    // Store the post in a Config-based JSON log
    const logKey = "social_post_log";
    const existingLog = await prisma.config.findUnique({ where: { key: logKey } });
    const posts: typeof postRecord[] = existingLog
      ? JSON.parse(existingLog.value)
      : [];

    // Keep last 100 posts to prevent unbounded growth
    posts.unshift(postRecord);
    if (posts.length > 100) posts.length = 100;

    await prisma.config.upsert({
      where: { key: logKey },
      update: { value: JSON.stringify(posts) },
      create: { key: logKey, value: JSON.stringify(posts) },
    });

    logger.info("Social post created", {
      platform,
      songTitle,
      artistName,
      status: postRecord.status,
      platformPostId: postRecord.platformPostId,
    });

    return NextResponse.json({
      success: true,
      post: postRecord,
    });
  } catch (error) {
    logger.error("Social post failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create social post" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/post
 *
 * Returns the social post log (last 100 posts).
 */
export async function GET() {
  try {
    const logRow = await prisma.config.findUnique({
      where: { key: "social_post_log" },
    });
    const posts = logRow ? JSON.parse(logRow.value) : [];
    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ posts: [] });
  }
}
