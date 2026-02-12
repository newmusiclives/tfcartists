import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
export async function GET() {
  try {
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
    // If DB is unavailable, return defaults
    return NextResponse.json({
      source: "defaults",
      ...STATION_DEFAULTS,
    });
  }
}
