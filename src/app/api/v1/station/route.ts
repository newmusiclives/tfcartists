import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/api-key-auth";
import { prisma } from "@/lib/db";
import { streamUrlFor } from "@/lib/stream";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/station
 * Public API: Returns station info (name, genre, tagline, stream URL).
 * Requires valid API key.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireApiKey(request);

  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error, timestamp: new Date().toISOString() },
      { status: authResult.status, headers: authResult.headers }
    );
  }

  try {
    const stationId = authResult.auth.stationId;

    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: {
        id: true,
        name: true,
        callSign: true,
        tagline: true,
        description: true,
        genre: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true,
      },
    });

    if (!station) {
      return NextResponse.json(
        {
          success: false,
          error: "Station not found",
          timestamp: new Date().toISOString(),
        },
        { status: 404, headers: authResult.headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: station.id,
          name: station.name,
          callSign: station.callSign,
          tagline: station.tagline,
          description: station.description,
          genre: station.genre,
          primaryColor: station.primaryColor,
          secondaryColor: station.secondaryColor,
          // 320k only when the hq_stream addon is on for this station;
          // otherwise the standard 128k mount.
          streamUrl: await streamUrlFor(stationId),
          isActive: station.isActive,
        },
        timestamp: new Date().toISOString(),
      },
      { headers: authResult.headers }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch station data",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: authResult.headers }
    );
  }
}
