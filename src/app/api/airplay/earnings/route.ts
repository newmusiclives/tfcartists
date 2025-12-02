import { NextRequest, NextResponse } from "next/server";
import { getArtistEarnings, getCurrentPeriod } from "@/lib/radio/airplay-system";

/**
 * GET /api/airplay/earnings?artistId=xxx&period=2024-12
 * Get artist's radio earnings for a period
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const artistId = searchParams.get("artistId");
    const period = searchParams.get("period") || getCurrentPeriod();

    if (!artistId) {
      return NextResponse.json(
        { error: "Missing required parameter: artistId" },
        { status: 400 }
      );
    }

    const earnings = await getArtistEarnings(artistId, period);

    return NextResponse.json({ earnings });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
