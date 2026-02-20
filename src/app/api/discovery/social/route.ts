import { NextRequest, NextResponse } from "next/server";
import { socialDiscovery, DiscoveredArtist } from "@/lib/discovery/social-discovery";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/discovery/social
 * Manually trigger social media discovery
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, keywords, limit } = body;

    if (!platform) {
      return NextResponse.json(
        { error: "platform parameter required" },
        { status: 400 }
      );
    }

    let discovered: DiscoveredArtist[] = [];

    switch (platform) {
      case "instagram":
        discovered = await socialDiscovery.discoverFromInstagram(
          keywords || ["americana", "countrymusic"],
          limit || 20
        );
        break;

      case "tiktok":
        discovered = await socialDiscovery.discoverFromTikTok(
          keywords || ["country music", "americana"],
          limit || 20
        );
        break;

      case "spotify":
        discovered = await socialDiscovery.discoverFromSpotify(
          keywords || ["americana", "alt-country"],
          limit || 20
        );
        break;

      case "all":
        const results = await socialDiscovery.runDailyDiscovery();
        return NextResponse.json({
          success: true,
          results,
        });

      default:
        return NextResponse.json(
          { error: "Invalid platform. Must be: instagram, tiktok, spotify, or all" },
          { status: 400 }
        );
    }

    // Import discovered artists
    const importResults = await socialDiscovery.importArtists(discovered);

    logger.info("Manual discovery completed", {
      platform,
      discovered: discovered.length,
      imported: importResults.imported,
    });

    return NextResponse.json({
      success: true,
      platform,
      discovered: discovered.length,
      imported: importResults.imported,
      duplicates: importResults.duplicates,
      errors: importResults.errors,
    });

  } catch (error) {
    logger.error("Social discovery API error", { error });

    return NextResponse.json(
      {
        error: "Discovery failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
