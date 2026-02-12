import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STATION_DEFAULTS = {
  name: "North Country Radio",
  callSign: "NCR",
  tagline: "Where the music finds you.",
  description:
    "North Country Radio is an AI-powered Americana and Country radio station on the TrueFans RADIO Network that champions independent artists through free airplay, community-driven curation, and direct fan support.",
  genre: "Americana, Country, Singer-Songwriter",
  primaryColor: "#B45309",
  secondaryColor: "#EA580C",
  maxArtistCapacity: 340,
  maxSponsorCapacity: 125,
  targetDAU: 1250,
  isActive: true,
};

/**
 * GET /api/station
 * Returns the station singleton config from DB, with fallback defaults
 */
export async function GET(request: NextRequest) {
  // If no database is configured, return defaults immediately
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      source: "defaults",
      ...STATION_DEFAULTS,
    });
  }

  try {
    // Dynamic import to avoid module-level crash when DB is unavailable
    const { prisma } = await import("@/lib/db");

    const station = await prisma.station.findFirst({
      where: { isActive: true },
    });

    if (!station) {
      return NextResponse.json({
        source: "defaults",
        ...STATION_DEFAULTS,
      });
    }

    return NextResponse.json({
      source: "database",
      id: station.id,
      name: station.name,
      callSign: station.callSign,
      tagline: station.tagline,
      description: station.description,
      genre: station.genre,
      primaryColor: station.primaryColor,
      secondaryColor: station.secondaryColor,
      maxTracksPerMonth: station.maxTracksPerMonth,
      maxAdsPerMonth: station.maxAdsPerMonth,
      maxArtistCapacity: station.maxArtistCapacity,
      maxSponsorCapacity: station.maxSponsorCapacity,
      targetDAU: station.targetDAU,
      isActive: station.isActive,
    });
  } catch (error) {
    // If DB query fails, return defaults
    return NextResponse.json({
      source: "defaults",
      ...STATION_DEFAULTS,
    });
  }
}
