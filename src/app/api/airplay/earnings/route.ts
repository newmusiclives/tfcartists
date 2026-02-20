import { NextRequest, NextResponse } from "next/server";
import { getArtistEarnings, getCurrentPeriod } from "@/lib/radio/airplay-system";
import { logger } from "@/lib/logger";
import { unauthorized } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/airplay/earnings?artistId=xxx&period=2024-12
 * Get artist's radio earnings for a period
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const artistId = searchParams.get("artistId");
    const period = searchParams.get("period") || getCurrentPeriod();

    if (!artistId) {
      logger.warn("Earnings request missing artistId parameter");
      return NextResponse.json(
        { error: "Missing required parameter: artistId" },
        { status: 400 }
      );
    }

    const earnings = await getArtistEarnings(artistId, period);

    logger.info("Fetched earnings", { artistId, period });
    return NextResponse.json({ earnings });
  } catch (error) {
    logger.error("Error fetching earnings", {
      error: error instanceof Error ? error.message : String(error),
      artistId: request.nextUrl.searchParams.get("artistId"),
    });
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
