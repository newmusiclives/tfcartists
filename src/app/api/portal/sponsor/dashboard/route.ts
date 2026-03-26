import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/sponsor/dashboard?sponsorId=xxx
 * Returns overview stats for the sponsor self-service dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get("sponsorId");

    if (!sponsorId) {
      return NextResponse.json({ error: "sponsorId is required" }, { status: 400 });
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      include: {
        sponsorships: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    // Get active sponsorships
    const activeSponsorships = sponsor.sponsorships.filter(
      (s) => s.status === "active"
    );

    // Get sponsor ads
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
        durationSeconds: true,
      },
      orderBy: { playCount: "desc" },
    });

    const totalImpressions = sponsorAds.reduce((sum, ad) => sum + ad.playCount, 0);
    const totalSpend = sponsor.sponsorships.reduce((sum, s) => {
      const months = s.endDate
        ? Math.max(1, Math.ceil((s.endDate.getTime() - s.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
        : Math.max(1, Math.ceil((Date.now() - s.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
      return sum + s.monthlyAmount * months;
    }, 0);

    // Fetch listening sessions for audience reach estimate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await prisma.listeningSession.findMany({
      where: {
        startTime: { gte: thirtyDaysAgo },
        adsHeard: { gt: 0 },
      },
      select: {
        listenerId: true,
      },
    });

    const uniqueListeners = new Set(
      recentSessions.filter((s) => s.listenerId).map((s) => s.listenerId)
    ).size || recentSessions.length;

    const costPerImpression = totalImpressions > 0 ? totalSpend / totalImpressions : 0;
    const engagementRate = uniqueListeners > 0 && totalImpressions > 0
      ? Math.min((uniqueListeners / totalImpressions) * 100, 100)
      : 0;

    return NextResponse.json({
      sponsor: {
        id: sponsor.id,
        businessName: sponsor.businessName,
        contactName: sponsor.contactName,
        email: sponsor.email,
        businessType: sponsor.businessType,
        status: sponsor.status,
        sponsorshipTier: sponsor.sponsorshipTier,
        monthlyAmount: sponsor.monthlyAmount,
        city: sponsor.city,
        state: sponsor.state,
      },
      overview: {
        activeSponsorships: activeSponsorships.length,
        totalImpressions,
        totalSpend: Math.round(totalSpend * 100) / 100,
        costPerImpression: parseFloat(costPerImpression.toFixed(4)),
        listenerReach: uniqueListeners,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
      },
      ads: sponsorAds.map((ad) => ({
        id: ad.id,
        title: ad.adTitle,
        playCount: ad.playCount,
        lastPlayedAt: ad.lastPlayedAt,
        tier: ad.tier,
        isActive: ad.isActive,
        createdAt: ad.createdAt,
        durationSeconds: ad.durationSeconds,
      })),
    });
  } catch (error) {
    logger.error("Error fetching sponsor dashboard", { error });
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
