import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  generateRoiEmail,
  generateRoiMarkdown,
  type RoiEmailData,
} from "@/lib/sponsors/roi-email";

export const dynamic = "force-dynamic";

/**
 * GET /api/sponsors/[id]/roi-report?month=2026-03
 *
 * Generates a monthly ROI report for a sponsor, including:
 * - Total ad plays, listeners reached, cities reached
 * - Cost per impression estimate
 * - Ad spots used vs allocated (fill rate)
 * - Daypart breakdown
 * - Markdown and HTML email versions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");

    // Default to current month
    const now = new Date();
    const month = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM (e.g., 2026-03)" },
        { status: 400 }
      );
    }

    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: "Invalid month. Must be 01-12." },
        { status: 400 }
      );
    }

    const periodStart = new Date(year, monthNum - 1, 1);
    const periodEnd = new Date(year, monthNum, 1);

    // Fetch sponsor with active sponsorship
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        sponsorships: {
          where: {
            status: "active",
            startDate: { lte: periodEnd },
            OR: [
              { endDate: null },
              { endDate: { gte: periodStart } },
            ],
          },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const activeSponsorships = sponsor.sponsorships;
    const sponsorship = activeSponsorships[0] || null;

    // Fetch sponsor ads and their play counts for this period
    const sponsorAds = await prisma.sponsorAd.findMany({
      where: {
        OR: [
          { sponsorId: id },
          { sponsorName: sponsor.businessName },
        ],
      },
      select: {
        id: true,
        adTitle: true,
        playCount: true,
        lastPlayedAt: true,
        tier: true,
        createdAt: true,
        metadata: true,
      },
    });

    // Total ad plays - use playCount from ads created/active during this period
    // Since playCount is cumulative, we use it as the best available metric
    const totalAdPlays = sponsorAds.reduce((sum, ad) => sum + ad.playCount, 0);

    // Fetch listening sessions in the period for audience metrics
    const listeningSessions = await prisma.listeningSession.findMany({
      where: {
        startTime: { gte: periodStart, lt: periodEnd },
      },
      select: {
        id: true,
        listenerId: true,
        location: true,
        duration: true,
        timeSlot: true,
        adsHeard: true,
        sponsorsHeard: true,
      },
    });

    // Calculate unique listeners reached
    // A listener is "reached" if they heard ads during a session
    const sessionsWithAds = listeningSessions.filter(
      (s) => {
        if (s.sponsorsHeard) {
          try {
            const sponsors = JSON.parse(s.sponsorsHeard);
            return Array.isArray(sponsors) && sponsors.includes(sponsor.businessName);
          } catch {
            return false;
          }
        }
        return (s.adsHeard || 0) > 0;
      }
    );

    const uniqueListenerIds = new Set(
      sessionsWithAds
        .filter((s) => s.listenerId)
        .map((s) => s.listenerId)
    );
    const listenersReached = uniqueListenerIds.size || sessionsWithAds.length;

    // Calculate unique cities
    const cities = new Set(
      sessionsWithAds
        .map((s) => s.location)
        .filter((loc): loc is string => !!loc && loc.trim() !== "")
    );
    const citiesReached = cities.size;
    const cityList = Array.from(cities).sort();

    // Estimated impressions = total ad plays * average listeners per play
    // Conservative estimate: each ad play reaches at least 1 listener
    const estimatedImpressions = Math.max(totalAdPlays, listenersReached);

    // Cost per impression
    const monthlyAmount = sponsorship?.monthlyAmount || 0;
    const costPerImpression =
      estimatedImpressions > 0
        ? monthlyAmount / estimatedImpressions
        : 0;

    // Ad spots used vs allocated
    const adSpotsAllocated = sponsorship?.adSpotsPerMonth || 0;
    const adSpotsUsed = totalAdPlays;
    const fillRate =
      adSpotsAllocated > 0
        ? Math.min((adSpotsUsed / adSpotsAllocated) * 100, 100)
        : 0;

    // Daypart breakdown - plays by time of day
    const daypartBreakdown: Record<string, number> = {
      morning: 0,
      midday: 0,
      afternoon: 0,
      evening: 0,
      late_night: 0,
    };

    for (const session of sessionsWithAds) {
      const slot = session.timeSlot || "midday";
      if (slot in daypartBreakdown) {
        daypartBreakdown[slot] += session.adsHeard || 1;
      }
    }

    // If no session-level daypart data, estimate from total plays
    const totalDaypartPlays = Object.values(daypartBreakdown).reduce((a, b) => a + b, 0);
    if (totalDaypartPlays === 0 && totalAdPlays > 0) {
      // Distribute proportionally based on typical radio listening patterns
      daypartBreakdown.morning = Math.round(totalAdPlays * 0.30);
      daypartBreakdown.midday = Math.round(totalAdPlays * 0.25);
      daypartBreakdown.afternoon = Math.round(totalAdPlays * 0.20);
      daypartBreakdown.evening = Math.round(totalAdPlays * 0.18);
      daypartBreakdown.late_night = totalAdPlays - daypartBreakdown.morning - daypartBreakdown.midday - daypartBreakdown.afternoon - daypartBreakdown.evening;
    }

    // Estimated market value
    // Industry avg CPM for local radio: ~$10-$25; we use $15 CPM
    const industryCpm = 15;
    const estimatedMarketValue = Math.round(
      (estimatedImpressions / 1000) * industryCpm
    );

    // Format month label
    const monthDate = new Date(year, monthNum - 1, 1);
    const monthLabel = monthDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const roiData: RoiEmailData = {
      sponsorName: sponsor.businessName,
      contactName: sponsor.contactName || sponsor.businessName,
      month: monthLabel,
      tier: sponsorship?.tier || "none",
      monthlyAmount,
      totalAdPlays,
      listenersReached,
      citiesReached,
      cityList,
      costPerImpression,
      adSpotsUsed,
      adSpotsAllocated,
      fillRate,
      estimatedMarketValue,
      daypartBreakdown,
    };

    // Generate email and markdown versions
    const emailHtml = generateRoiEmail(roiData);
    const markdown = generateRoiMarkdown(roiData);

    return NextResponse.json({
      report: {
        sponsorId: id,
        sponsorName: sponsor.businessName,
        contactName: sponsor.contactName,
        contactEmail: sponsor.email,
        month,
        monthLabel,
        tier: sponsorship?.tier || "none",
        monthlyAmount,
        metrics: {
          totalAdPlays,
          listenersReached,
          citiesReached,
          cityList,
          costPerImpression: parseFloat(costPerImpression.toFixed(4)),
          estimatedImpressions,
          estimatedMarketValue,
        },
        adPerformance: {
          adSpotsUsed,
          adSpotsAllocated,
          fillRate: parseFloat(fillRate.toFixed(1)),
          daypartBreakdown,
          ads: sponsorAds.map((ad) => ({
            id: ad.id,
            title: ad.adTitle,
            plays: ad.playCount,
            tier: ad.tier,
            lastPlayed: ad.lastPlayedAt,
          })),
        },
        reachSummary: `Your ads were heard by ${listenersReached.toLocaleString()} listeners across ${citiesReached} cities.`,
        valueStatement: `At industry rates, this exposure would cost $${estimatedMarketValue.toLocaleString()}.`,
      },
      emailHtml,
      markdown,
    });
  } catch (error) {
    logger.error("Error generating ROI report", { error });
    return NextResponse.json(
      { error: "Failed to generate ROI report" },
      { status: 500 }
    );
  }
}
