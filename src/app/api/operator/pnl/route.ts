import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/** Tier price map for artist subscriptions */
const TIER_PRICES: Record<string, number> = {
  FREE: 0,
  TIER_5: 5,
  TIER_20: 20,
  TIER_50: 50,
  TIER_120: 120,
};

/** Get YYYY-MM string for a given date */
function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Generate array of YYYY-MM keys going back N months from ref date */
function getMonthRange(months: number, refDate: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    keys.push(toMonthKey(d));
  }
  return keys.reverse();
}

/**
 * GET /api/operator/pnl?period=month|quarter|year
 *
 * Returns operator profit & loss data with monthly breakdowns.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    const monthCount = period === "year" ? 12 : period === "quarter" ? 3 : 1;
    const monthKeys = getMonthRange(monthCount);

    // --- Fetch all data in parallel ---
    const [
      activeSponsorships,
      allArtists,
      revenuePoolRecords,
      aiCostConfigs,
    ] = await Promise.all([
      // Active sponsorships
      prisma.sponsorship.findMany({
        where: { status: "active" },
        include: { sponsor: { select: { businessName: true } } },
      }),

      // All non-deleted artists with airplay tier
      prisma.artist.findMany({
        where: { deletedAt: null },
        select: { airplayTier: true },
      }),

      // Revenue pool records for the period
      prisma.radioRevenuePool.findMany({
        where: { period: { in: monthKeys } },
        orderBy: { period: "asc" },
      }),

      // AI cost data from SystemConfig
      prisma.systemConfig.findMany({
        where: {
          category: "ai",
          key: { startsWith: "ai_spend" },
        },
      }),
    ]);

    // --- REVENUE CALCULATIONS ---

    // Sponsor revenue (monthly)
    const totalSponsorMonthly = activeSponsorships.reduce(
      (sum, s) => sum + s.monthlyAmount,
      0
    );

    // Sponsor breakdown by tier
    const sponsorByTier: Record<string, { count: number; total: number }> = {};
    for (const s of activeSponsorships) {
      const tier = s.tier.toLowerCase();
      if (!sponsorByTier[tier]) sponsorByTier[tier] = { count: 0, total: 0 };
      sponsorByTier[tier].count++;
      sponsorByTier[tier].total += s.monthlyAmount;
    }

    // Sponsor detail list
    const sponsorDetails = activeSponsorships.map((s) => ({
      name: s.sponsor.businessName,
      tier: s.tier,
      monthlyAmount: s.monthlyAmount,
    }));

    // Artist subscription revenue (monthly)
    const artistCountByTier: Record<string, number> = {
      FREE: 0,
      TIER_5: 0,
      TIER_20: 0,
      TIER_50: 0,
      TIER_120: 0,
    };
    for (const a of allArtists) {
      const tier = a.airplayTier || "FREE";
      artistCountByTier[tier] = (artistCountByTier[tier] || 0) + 1;
    }

    const artistTierBreakdown = Object.entries(artistCountByTier).map(
      ([tier, count]) => ({
        tier,
        count,
        pricePerMonth: TIER_PRICES[tier] || 0,
        totalMonthly: count * (TIER_PRICES[tier] || 0),
      })
    );

    const totalArtistSubscriptionMonthly = artistTierBreakdown.reduce(
      (sum, t) => sum + t.totalMonthly,
      0
    );

    const totalRevenueMonthly =
      totalSponsorMonthly + totalArtistSubscriptionMonthly;

    // --- COST CALCULATIONS ---

    // AI costs from SystemConfig (e.g. ai_spend_monthly stored as dollar amount)
    let aiMonthlyCost = 0;
    for (const cfg of aiCostConfigs) {
      const val = parseFloat(cfg.value);
      if (!isNaN(val)) aiMonthlyCost += val;
    }
    // Default estimate if no config data
    if (aiMonthlyCost === 0) aiMonthlyCost = 75;

    const hostingMonthlyCost = 50;
    const streamingMonthlyCost = 30;
    const totalCostsMonthly =
      aiMonthlyCost + hostingMonthlyCost + streamingMonthlyCost;

    // --- PROFIT ---
    const netProfitMonthly = totalRevenueMonthly - totalCostsMonthly;
    const grossMarginPct =
      totalRevenueMonthly > 0
        ? ((totalRevenueMonthly - totalCostsMonthly) / totalRevenueMonthly) *
          100
        : 0;
    const netMarginPct = grossMarginPct; // Same for now (no separate COGS)

    // --- MONTHLY BREAKDOWN (trend) ---
    const monthlyBreakdown = monthKeys.map((month) => {
      const poolRecord = revenuePoolRecords.find((r) => r.period === month);
      // Use pool record if available, otherwise estimate from current rates
      const sponsorRev = poolRecord
        ? poolRecord.totalAdRevenue
        : totalSponsorMonthly;
      const artistRev = totalArtistSubscriptionMonthly;
      const totalRev = sponsorRev + artistRev;
      const totalCost = totalCostsMonthly;

      return {
        month,
        sponsorRevenue: Math.round(sponsorRev * 100) / 100,
        artistRevenue: Math.round(artistRev * 100) / 100,
        totalRevenue: Math.round(totalRev * 100) / 100,
        totalCosts: Math.round(totalCost * 100) / 100,
        netProfit: Math.round((totalRev - totalCost) * 100) / 100,
      };
    });

    // --- RESPONSE ---
    return NextResponse.json({
      period,
      monthCount,
      summary: {
        monthlyRevenue: Math.round(totalRevenueMonthly * 100) / 100,
        monthlyCosts: Math.round(totalCostsMonthly * 100) / 100,
        netProfit: Math.round(netProfitMonthly * 100) / 100,
        grossMarginPct: Math.round(grossMarginPct * 10) / 10,
        netMarginPct: Math.round(netMarginPct * 10) / 10,
      },
      revenue: {
        sponsorTotal: Math.round(totalSponsorMonthly * 100) / 100,
        artistSubscriptionTotal:
          Math.round(totalArtistSubscriptionMonthly * 100) / 100,
        total: Math.round(totalRevenueMonthly * 100) / 100,
        sponsorByTier,
        artistTierBreakdown,
        sponsorDetails,
      },
      costs: {
        ai: Math.round(aiMonthlyCost * 100) / 100,
        hosting: hostingMonthlyCost,
        streaming: streamingMonthlyCost,
        total: Math.round(totalCostsMonthly * 100) / 100,
      },
      monthlyBreakdown,
    });
  } catch (error) {
    return handleApiError(error, "/api/operator/pnl");
  }
}
