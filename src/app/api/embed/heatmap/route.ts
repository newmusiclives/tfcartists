import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Pre-mapped coordinates for top 50 US cities.
 * Values are percentage-based (0-100) for positioning on a container.
 * Approximate x/y based on a simple US projection.
 */
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  "New York": { x: 83, y: 28 },
  "Los Angeles": { x: 10, y: 52 },
  "Chicago": { x: 64, y: 28 },
  "Houston": { x: 48, y: 72 },
  "Phoenix": { x: 18, y: 58 },
  "Philadelphia": { x: 82, y: 32 },
  "San Antonio": { x: 42, y: 72 },
  "San Diego": { x: 10, y: 56 },
  "Dallas": { x: 46, y: 64 },
  "San Jose": { x: 6, y: 44 },
  "Austin": { x: 44, y: 70 },
  "Jacksonville": { x: 76, y: 62 },
  "Fort Worth": { x: 45, y: 64 },
  "Columbus": { x: 72, y: 34 },
  "Charlotte": { x: 76, y: 48 },
  "San Francisco": { x: 5, y: 42 },
  "Indianapolis": { x: 67, y: 34 },
  "Seattle": { x: 8, y: 10 },
  "Denver": { x: 30, y: 38 },
  "Washington": { x: 80, y: 36 },
  "Nashville": { x: 67, y: 48 },
  "Oklahoma City": { x: 44, y: 54 },
  "El Paso": { x: 24, y: 64 },
  "Boston": { x: 87, y: 22 },
  "Portland": { x: 7, y: 14 },
  "Las Vegas": { x: 15, y: 48 },
  "Memphis": { x: 60, y: 52 },
  "Louisville": { x: 68, y: 40 },
  "Baltimore": { x: 80, y: 34 },
  "Milwaukee": { x: 63, y: 24 },
  "Albuquerque": { x: 24, y: 54 },
  "Tucson": { x: 18, y: 62 },
  "Fresno": { x: 8, y: 46 },
  "Sacramento": { x: 7, y: 40 },
  "Mesa": { x: 19, y: 58 },
  "Kansas City": { x: 50, y: 42 },
  "Atlanta": { x: 72, y: 52 },
  "Omaha": { x: 46, y: 32 },
  "Colorado Springs": { x: 30, y: 42 },
  "Raleigh": { x: 78, y: 46 },
  "Miami": { x: 80, y: 78 },
  "Minneapolis": { x: 52, y: 18 },
  "Tampa": { x: 76, y: 72 },
  "New Orleans": { x: 58, y: 70 },
  "Cleveland": { x: 72, y: 30 },
  "Pittsburgh": { x: 75, y: 32 },
  "Cincinnati": { x: 70, y: 38 },
  "St. Louis": { x: 58, y: 42 },
  "Orlando": { x: 78, y: 70 },
  "Detroit": { x: 70, y: 26 },
  "Salt Lake City": { x: 20, y: 34 },
  "Boise": { x: 16, y: 22 },
  "Honolulu": { x: 2, y: 88 },
  "Anchorage": { x: 2, y: 6 },
};

/**
 * GET /api/embed/heatmap?stationId=x&period=week
 * Returns geo data with city coordinates for heatmap rendering.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week";

    // Build date filter
    const now = new Date();
    let dateFilter: Date | undefined;
    switch (period) {
      case "today": {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        dateFilter = start;
        break;
      }
      case "week": {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        dateFilter = start;
        break;
      }
      case "month": {
        const start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        dateFilter = start;
        break;
      }
      default:
        dateFilter = undefined;
    }

    const where: Record<string, unknown> = {
      location: { not: null },
    };
    if (dateFilter) {
      where.startTime = { gte: dateFilter };
    }

    const sessions = await prisma.listeningSession.findMany({
      where,
      select: { location: true, metadata: true },
    });

    // Aggregate by city
    const cityMap = new Map<string, { city: string; region: string; count: number }>();

    for (const s of sessions) {
      if (!s.location) continue;
      const parts = s.location.split(",").map((p) => p.trim());
      const city = parts[0] || "Unknown";
      const region = parts[1] || "Unknown";
      const key = city;
      const existing = cityMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        cityMap.set(key, { city, region, count: 1 });
      }
    }

    // Also check metadata-only sessions
    const metaSessions = await prisma.listeningSession.findMany({
      where: {
        location: null,
        metadata: { not: undefined },
        ...(dateFilter ? { startTime: { gte: dateFilter } } : {}),
      },
      select: { metadata: true },
    });

    for (const s of metaSessions) {
      const meta = s.metadata as Record<string, unknown> | null;
      if (!meta?.city) continue;
      const city = meta.city as string;
      const region = (meta.region as string) || "Unknown";
      const key = city;
      const existing = cityMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        cityMap.set(key, { city, region, count: 1 });
      }
    }

    // Build response with coordinates
    const cities = Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .map((c) => {
        const coords = CITY_COORDS[c.city] || null;
        return {
          city: c.city,
          region: c.region,
          count: c.count,
          x: coords?.x ?? null,
          y: coords?.y ?? null,
        };
      });

    const total = cities.reduce((sum, c) => sum + c.count, 0);
    const citiesWithCoords = cities.filter((c) => c.x !== null);

    return NextResponse.json({
      cities,
      citiesWithCoords,
      stats: {
        totalListeners: total,
        totalCities: cities.length,
        mappedCities: citiesWithCoords.length,
      },
    });
  } catch (error) {
    console.error("[heatmap-api]", error);
    return NextResponse.json(
      { error: "Failed to load heatmap data" },
      { status: 500 }
    );
  }
}
