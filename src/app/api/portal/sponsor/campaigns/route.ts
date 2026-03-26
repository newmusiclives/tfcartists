import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/sponsor/campaigns?sponsorId=xxx&status=active
 * Returns list of sponsorship campaigns for a sponsor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get("sponsorId");
    const statusFilter = searchParams.get("status"); // active, cancelled, paused, or "all"

    if (!sponsorId) {
      return NextResponse.json({ error: "sponsorId is required" }, { status: 400 });
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { id: true, businessName: true },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const whereClause: Record<string, unknown> = { sponsorId };
    if (statusFilter && statusFilter !== "all") {
      whereClause.status = statusFilter;
    }

    const sponsorships = await prisma.sponsorship.findMany({
      where: whereClause,
      orderBy: { startDate: "desc" },
    });

    // Get sponsor ads for impression data
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
      },
    });

    const totalImpressions = sponsorAds.reduce((sum, ad) => sum + ad.playCount, 0);

    const now = new Date();
    const campaigns = sponsorships.map((sp) => {
      const isUpcoming = sp.startDate > now;
      const isCompleted = sp.status === "cancelled" || (sp.endDate && sp.endDate < now);
      const computedStatus = isUpcoming ? "upcoming" : isCompleted ? "completed" : sp.status;

      // Estimate impressions per campaign proportionally
      const campaignMonths = sp.endDate
        ? Math.max(1, Math.ceil((sp.endDate.getTime() - sp.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
        : Math.max(1, Math.ceil((Math.min(now.getTime(), now.getTime()) - sp.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

      const totalMonths = sponsorships.reduce((sum, s) => {
        const m = s.endDate
          ? Math.max(1, Math.ceil((s.endDate.getTime() - s.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
          : Math.max(1, Math.ceil((now.getTime() - s.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        return sum + m;
      }, 0);

      const impressionShare = totalMonths > 0 ? campaignMonths / totalMonths : 0;

      return {
        id: sp.id,
        tier: sp.tier,
        monthlyAmount: sp.monthlyAmount,
        startDate: sp.startDate,
        endDate: sp.endDate,
        status: sp.status,
        computedStatus,
        adSpotsPerMonth: sp.adSpotsPerMonth,
        socialMentions: sp.socialMentions,
        eventPromotion: sp.eventPromotion,
        estimatedImpressions: Math.round(totalImpressions * impressionShare),
      };
    });

    return NextResponse.json({
      campaigns,
      summary: {
        total: campaigns.length,
        active: campaigns.filter((c) => c.computedStatus === "active").length,
        completed: campaigns.filter((c) => c.computedStatus === "completed").length,
        upcoming: campaigns.filter((c) => c.computedStatus === "upcoming").length,
      },
    });
  } catch (error) {
    logger.error("Error fetching sponsor campaigns", { error });
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
