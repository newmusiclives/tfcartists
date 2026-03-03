import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";
import { orgWhere } from "@/lib/db-scoped";

export const dynamic = "force-dynamic";

/**
 * GET /api/elliot/analytics
 *
 * Returns time-series analytics data for charts:
 * - Daily new listeners (30 days)
 * - Session duration distribution
 * - Referral source breakdown
 * - Weekly retention cohorts
 */
export async function GET() {
  try {
    const session = await requireRole("elliot");
    if (!session) return unauthorized();

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // --- Daily new listeners (last 30 days) ---
    const dailyListeners = await prisma.$queryRaw<
      { day: Date; count: bigint }[]
    >`
      SELECT DATE("createdAt") as day, COUNT(*)::bigint as count
      FROM "Listener"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY day ASC
    `;

    // Fill in missing days with 0
    const dailyGrowth: { date: string; count: number }[] = [];
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const match = dailyListeners.find(
        (r) => new Date(r.day).toISOString().split("T")[0] === dateStr
      );
      dailyGrowth.push({
        date: dateStr,
        count: match ? Number(match.count) : 0,
      });
    }

    // --- Session duration distribution ---
    const durationBuckets = await prisma.$queryRaw<
      { bucket: string; count: bigint }[]
    >`
      SELECT
        CASE
          WHEN duration < 5 THEN '0-5 min'
          WHEN duration < 15 THEN '5-15 min'
          WHEN duration < 30 THEN '15-30 min'
          WHEN duration < 60 THEN '30-60 min'
          ELSE '60+ min'
        END as bucket,
        COUNT(*)::bigint as count
      FROM "ListeningSession"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY bucket
      ORDER BY MIN(duration) ASC
    `;

    const sessionDistribution = [
      "0-5 min", "5-15 min", "15-30 min", "30-60 min", "60+ min",
    ].map((bucket) => ({
      bucket,
      count: Number(
        durationBuckets.find((b) => b.bucket === bucket)?.count || 0
      ),
    }));

    // --- Referral source breakdown ---
    const referralSources = await prisma.listener.groupBy({
      by: ["discoverySource"],
      where: { ...orgWhere(session) },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const sourceLabels: Record<string, string> = {
      artist_referral: "Artist Referral",
      social_media: "Social Media",
      organic: "Organic / Direct",
      search: "Search",
      ad: "Paid Ads",
      embed: "Embed Widget",
      scout: "Scout Referral",
    };

    const referralFunnel = referralSources.map((s) => ({
      source: sourceLabels[s.discoverySource] || s.discoverySource,
      count: s._count.id,
    }));

    // --- Weekly retention cohorts (last 4 weeks) ---
    const cohorts: { week: string; total: number; active: number; rate: number }[] = [];
    for (let w = 4; w >= 1; w--) {
      const cohortStart = new Date(now);
      cohortStart.setDate(cohortStart.getDate() - w * 7);
      const cohortEnd = new Date(cohortStart);
      cohortEnd.setDate(cohortEnd.getDate() + 7);

      const cohortTotal = await prisma.listener.count({
        where: {
          ...orgWhere(session),
          createdAt: { gte: cohortStart, lt: cohortEnd },
        },
      });

      const cohortActive = await prisma.listener.count({
        where: {
          ...orgWhere(session),
          createdAt: { gte: cohortStart, lt: cohortEnd },
          lastListenedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      const weekLabel = `Week -${w}`;
      cohorts.push({
        week: weekLabel,
        total: cohortTotal,
        active: cohortActive,
        rate: cohortTotal > 0 ? Math.round((cohortActive / cohortTotal) * 100) : 0,
      });
    }

    return NextResponse.json({
      dailyGrowth,
      sessionDistribution,
      referralFunnel,
      retentionCohorts: cohorts,
    });
  } catch (error) {
    return handleApiError(error, "/api/elliot/analytics");
  }
}
