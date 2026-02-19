import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

/**
 * Parker Daily Station Management Cron Job
 * Runs every day at 7:00 AM (before first live shift)
 *
 * Tasks:
 * 1. Audit schedule coverage — flag uncovered shifts
 * 2. Check format compliance — verify clock assignments exist for all active DJs
 * 3. Monitor music library health — category balance, rotation freshness
 * 4. Verify ad inventory — check fill rates, expiring sponsors
 * 5. Log daily station health metrics
 */
export async function GET(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV === "development";

    if (!isDev) {
      const authHeader = req.headers.get("authorization");
      const cronSecret = env.CRON_SECRET;
      if (!cronSecret) {
        logger.error("CRON_SECRET not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
      }
      if (authHeader !== `Bearer ${cronSecret}`) {
        logger.warn("Unauthorized cron attempt", { path: "/api/cron/parker-daily" });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    logger.info("Starting Parker daily station management");

    const station = await prisma.station.findFirst();
    if (!station) {
      return NextResponse.json({ error: "No station found" }, { status: 404 });
    }

    const results = {
      scheduleAudit: { coveredShifts: 0, gaps: 0 },
      musicHealth: { totalSongs: 0, categories: {} as Record<string, number> },
      adInventory: { activeAds: 0, totalWeight: 0, expiringSoon: 0 },
      clockCoverage: { templates: 0, assignments: 0 },
      alerts: [] as string[],
    };

    // 1. Schedule coverage audit — check clock assignments exist
    const clockAssignments = await prisma.clockAssignment.findMany({
      where: { stationId: station.id },
      include: { dj: true, clockTemplate: true },
    });

    results.scheduleAudit.coveredShifts = clockAssignments.length;

    // Check for day types without coverage
    const dayTypes = ["weekday", "saturday", "sunday"];
    for (const dayType of dayTypes) {
      const assignments = clockAssignments.filter((a) => a.dayType === dayType);
      if (assignments.length === 0) {
        results.scheduleAudit.gaps++;
        results.alerts.push(`No clock assignments for ${dayType}`);
      }
    }

    // 2. Music library health
    const songsByCategory = await prisma.song.groupBy({
      by: ["rotationCategory"],
      where: { stationId: station.id },
      _count: { id: true },
    });

    let totalSongs = 0;
    for (const cat of songsByCategory) {
      const category = cat.rotationCategory || "uncategorized";
      results.musicHealth.categories[category] = cat._count.id;
      totalSongs += cat._count.id;
    }
    results.musicHealth.totalSongs = totalSongs;

    if (totalSongs < 500) {
      results.alerts.push(`Music library low: ${totalSongs} songs (recommend 500+)`);
    }

    // 3. Ad inventory check
    const activeAds = await prisma.sponsorAd.findMany({
      where: { stationId: station.id, isActive: true },
    });

    results.adInventory.activeAds = activeAds.length;
    results.adInventory.totalWeight = activeAds.reduce((s, a) => s + a.weight, 0);

    if (activeAds.length < 5) {
      results.alerts.push(`Ad inventory low: only ${activeAds.length} active ads`);
    }

    // Check for expiring sponsorships (next 14 days)
    const expiringSponsorships = await prisma.sponsorship.count({
      where: {
        status: "active",
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      },
    });
    results.adInventory.expiringSoon = expiringSponsorships;
    if (expiringSponsorships > 0) {
      results.alerts.push(`${expiringSponsorships} sponsorship(s) expiring within 14 days`);
    }

    // 4. Clock template coverage
    results.clockCoverage.templates = await prisma.clockTemplate.count({
      where: { stationId: station.id },
    });
    results.clockCoverage.assignments = clockAssignments.length;

    logger.info("Parker daily station management completed", results);

    return NextResponse.json({
      success: true,
      message: "Parker daily station management completed",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Parker daily station management failed", { error });

    return NextResponse.json(
      {
        error: "Daily automation failed",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
