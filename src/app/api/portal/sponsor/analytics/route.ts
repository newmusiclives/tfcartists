import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/sponsor/analytics?sponsorId=xxx&months=6
 * Returns analytics data for sponsor ad performance over time
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get("sponsorId");
    const monthsBack = parseInt(searchParams.get("months") || "6", 10);

    if (!sponsorId) {
      return NextResponse.json({ error: "sponsorId is required" }, { status: 400 });
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { id: true, businessName: true, sponsorshipTier: true },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    // Get all sponsor ads
    const sponsorAds = await prisma.sponsorAd.findMany({
      where: {
        OR: [
          { sponsorId },
          { sponsorName: sponsor.businessName },
        ],
      },
      select: {
        id: true,
        adTitle: true,
        playCount: true,
        lastPlayedAt: true,
        tier: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Build monthly impressions data from listening sessions
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const sessions = await prisma.listeningSession.findMany({
      where: {
        startTime: { gte: startDate },
        adsHeard: { gt: 0 },
      },
      select: {
        startTime: true,
        listenerId: true,
        location: true,
        timeSlot: true,
        adsHeard: true,
        sponsorsHeard: true,
      },
    });

    // Filter sessions that include this sponsor
    const sponsorSessions = sessions.filter((s) => {
      if (s.sponsorsHeard) {
        try {
          const sponsors = JSON.parse(s.sponsorsHeard);
          return Array.isArray(sponsors) && sponsors.includes(sponsor.businessName);
        } catch {
          return false;
        }
      }
      // If no sponsor-specific tracking, include all sessions with ads
      return (s.adsHeard || 0) > 0;
    });

    // Build monthly data
    const monthlyData: Array<{
      month: string;
      label: string;
      impressions: number;
      listeners: number;
    }> = [];

    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      const monthSessions = sponsorSessions.filter(
        (s) => s.startTime >= d && s.startTime < monthEnd
      );

      const impressions = monthSessions.reduce((sum, s) => sum + (s.adsHeard || 1), 0);
      const uniqueListeners = new Set(
        monthSessions.filter((s) => s.listenerId).map((s) => s.listenerId)
      ).size || monthSessions.length;

      monthlyData.push({
        month: monthKey,
        label,
        impressions,
        listeners: uniqueListeners,
      });
    }

    // Peak listening hours breakdown
    const daypartBreakdown: Record<string, number> = {
      morning: 0,
      midday: 0,
      afternoon: 0,
      evening: 0,
      late_night: 0,
    };

    for (const session of sponsorSessions) {
      const slot = session.timeSlot || "midday";
      if (slot in daypartBreakdown) {
        daypartBreakdown[slot] += session.adsHeard || 1;
      }
    }

    // If no session daypart data, estimate from ad play counts
    const totalDaypart = Object.values(daypartBreakdown).reduce((a, b) => a + b, 0);
    const totalPlays = sponsorAds.reduce((sum, ad) => sum + ad.playCount, 0);
    if (totalDaypart === 0 && totalPlays > 0) {
      daypartBreakdown.morning = Math.round(totalPlays * 0.30);
      daypartBreakdown.midday = Math.round(totalPlays * 0.25);
      daypartBreakdown.afternoon = Math.round(totalPlays * 0.20);
      daypartBreakdown.evening = Math.round(totalPlays * 0.18);
      daypartBreakdown.late_night = totalPlays - daypartBreakdown.morning - daypartBreakdown.midday - daypartBreakdown.afternoon - daypartBreakdown.evening;
    }

    // Audience location breakdown
    const locationCounts: Record<string, number> = {};
    for (const session of sponsorSessions) {
      if (session.location) {
        locationCounts[session.location] = (locationCounts[session.location] || 0) + 1;
      }
    }
    const topLocations = Object.entries(locationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));

    // Campaign comparison
    const sponsorships = await prisma.sponsorship.findMany({
      where: { sponsorId },
      orderBy: { startDate: "desc" },
    });

    const campaignComparison = sponsorships.map((sp) => {
      const spStart = sp.startDate;
      const spEnd = sp.endDate || now;
      const campaignSessions = sponsorSessions.filter(
        (s) => s.startTime >= spStart && s.startTime < spEnd
      );
      const impressions = campaignSessions.reduce((sum, s) => sum + (s.adsHeard || 1), 0);

      return {
        id: sp.id,
        tier: sp.tier,
        startDate: sp.startDate,
        endDate: sp.endDate,
        monthlyAmount: sp.monthlyAmount,
        impressions,
        status: sp.status,
      };
    });

    return NextResponse.json({
      monthlyData,
      daypartBreakdown,
      topLocations,
      campaignComparison,
      adBreakdown: sponsorAds.map((ad) => ({
        id: ad.id,
        title: ad.adTitle,
        playCount: ad.playCount,
        tier: ad.tier,
        isActive: ad.isActive,
      })),
    });
  } catch (error) {
    logger.error("Error fetching sponsor analytics", { error });
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
