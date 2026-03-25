import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

/**
 * POST /api/listeners/track-location
 * Records listener location on a listening session.
 * Called once per listening session from the client.
 *
 * Body: { sessionId, city, region, country, listenerId? }
 *
 * The ListeningSession model has:
 * - location: String? (stores "City, Region" format)
 * - metadata: Json?   (stores full geo details)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit to prevent abuse
    const rateLimitResponse = await withRateLimit(request, "api");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { sessionId, city, region, country, listenerId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    if (!city && !region && !country) {
      return NextResponse.json(
        { error: "At least one location field (city, region, country) is required" },
        { status: 400 }
      );
    }

    // Build location string for the location field
    const locationParts = [city, region].filter(Boolean);
    const locationString = locationParts.join(", ") || null;

    // Build rich metadata
    const geoMeta: Record<string, string> = {};
    if (city) geoMeta.city = String(city);
    if (region) geoMeta.region = String(region);
    if (country) geoMeta.country = String(country);
    geoMeta.trackedAt = new Date().toISOString();

    // Update the session with location data
    // Use metadata to store structured geo data alongside the location string
    const session = await prisma.listeningSession.update({
      where: { id: sessionId },
      data: {
        location: locationString,
        metadata: geoMeta,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      location: locationString,
    });
  } catch (error) {
    return handleApiError(error, "/api/listeners/track-location");
  }
}
