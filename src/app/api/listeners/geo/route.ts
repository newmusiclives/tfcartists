import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { optionalAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/listeners/geo
 * Returns listener location aggregates from ListeningSession.location field.
 * Supports time-based filtering via ?period=today|week|month|all
 */
export async function GET(request: NextRequest) {
  try {
    await optionalAuth();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all";

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

    // Get all sessions with location data
    const sessions = await prisma.listeningSession.findMany({
      where,
      select: {
        location: true,
        metadata: true,
      },
    });

    // Aggregate by location string
    // location field format: "City, State" or "City, Region, Country"
    const locationMap = new Map<
      string,
      { city: string; region: string; country: string; count: number }
    >();

    for (const s of sessions) {
      if (!s.location) continue;

      const parts = s.location.split(",").map((p) => p.trim());
      const city = parts[0] || "Unknown";
      const region = parts[1] || "Unknown";
      // Check metadata for country, otherwise derive from parts
      const meta = s.metadata as Record<string, unknown> | null;
      const country =
        (meta?.country as string) || parts[2] || "US";

      const key = `${city}|${region}|${country}`;
      const existing = locationMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        locationMap.set(key, { city, region, country, count: 1 });
      }
    }

    // Also check metadata for richer geo data (from track-location endpoint)
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

      const city = (meta.city as string) || "Unknown";
      const region = (meta.region as string) || "Unknown";
      const country = (meta.country as string) || "US";

      const key = `${city}|${region}|${country}`;
      const existing = locationMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        locationMap.set(key, { city, region, country, count: 1 });
      }
    }

    // Sort by count descending
    const locations = Array.from(locationMap.values()).sort(
      (a, b) => b.count - a.count
    );

    const total = locations.reduce((sum, l) => sum + l.count, 0);
    const totalCities = locations.length;
    const totalRegions = new Set(locations.map((l) => l.region)).size;
    const totalCountries = new Set(locations.map((l) => l.country)).size;
    const internationalCount = locations
      .filter((l) => l.country !== "US")
      .reduce((sum, l) => sum + l.count, 0);

    // Region breakdown
    const regionMap = new Map<string, number>();
    for (const l of locations) {
      const key = `${l.region}, ${l.country}`;
      regionMap.set(key, (regionMap.get(key) || 0) + l.count);
    }
    const regions = Array.from(regionMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      locations,
      regions,
      stats: {
        total,
        totalCities,
        totalRegions,
        totalCountries,
        internationalPercent:
          total > 0 ? Math.round((internationalCount / total) * 100) : 0,
        topRegion: regions[0]?.name || "N/A",
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/listeners/geo");
  }
}
