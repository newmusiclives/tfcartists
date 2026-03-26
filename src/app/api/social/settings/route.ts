import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const CONFIG_KEY = "social_settings";

/**
 * GET /api/social/settings
 *
 * Returns the current social media posting settings.
 */
export async function GET() {
  try {
    const row = await prisma.config.findUnique({ where: { key: CONFIG_KEY } });
    const settings = row ? JSON.parse(row.value) : null;
    return NextResponse.json({ settings });
  } catch (error) {
    logger.error("Failed to load social settings", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ settings: null });
  }
}

/**
 * POST /api/social/settings
 *
 * Saves social media posting settings.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate expected shape
    const settings = {
      twitterEnabled: Boolean(body.twitterEnabled),
      facebookEnabled: Boolean(body.facebookEnabled),
      instagramEnabled: Boolean(body.instagramEnabled),
      tiktokEnabled: Boolean(body.tiktokEnabled),
      twitterApiKey: String(body.twitterApiKey || ""),
      twitterApiSecret: String(body.twitterApiSecret || ""),
      facebookPageToken: String(body.facebookPageToken || ""),
      instagramAccessToken: String(body.instagramAccessToken || ""),
      tiktokAccessToken: String(body.tiktokAccessToken || ""),
      postFrequency: String(body.postFrequency || "every_30min"),
      postTemplate: String(body.postTemplate || ""),
      hashtags: Array.isArray(body.hashtags) ? body.hashtags.map(String) : [],
      siteUrl: String(body.siteUrl || ""),
    };

    await prisma.config.upsert({
      where: { key: CONFIG_KEY },
      update: { value: JSON.stringify(settings) },
      create: { key: CONFIG_KEY, value: JSON.stringify(settings) },
    });

    logger.info("Social settings saved", {
      platforms: [
        settings.twitterEnabled && "twitter",
        settings.facebookEnabled && "facebook",
        settings.instagramEnabled && "instagram",
        settings.tiktokEnabled && "tiktok",
      ].filter(Boolean),
      frequency: settings.postFrequency,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to save social settings", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
