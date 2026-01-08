import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import type { CassidyStats } from "@/types/cassidy";

/**
 * GET /api/cassidy/stats
 *
 * Returns dashboard statistics for Cassidy's submission review panel
 *
 * Requires authentication: cassidy or admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role authorization
    const userRole = session.user.role;
    if (userRole !== "cassidy" && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current date range for "this month"
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get start of week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Parallel queries for better performance
    const [
      tierPlacements,
      submissionsThisMonth,
      allSubmissions,
      pendingSubmissions,
      inReviewSubmissions,
      judgedThisWeek,
      rotationSlots,
    ] = await Promise.all([
      // Count artists in each tier (most recent placement per artist)
      prisma.$queryRaw<Array<{ newTier: string; count: bigint }>>`
        SELECT
          tp.newTier,
          COUNT(DISTINCT tp.artistId) as count
        FROM TierPlacement tp
        INNER JOIN (
          SELECT artistId, MAX(createdAt) as maxDate
          FROM TierPlacement
          GROUP BY artistId
        ) latest ON tp.artistId = latest.artistId AND tp.createdAt = latest.maxDate
        GROUP BY tp.newTier
      `,

      // Submissions this month
      prisma.submission.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // All submissions (for placement rate calculation)
      prisma.submission.count(),

      // Pending submissions
      prisma.submission.count({
        where: {
          status: "PENDING",
        },
      }),

      // In review submissions
      prisma.submission.count({
        where: {
          status: "IN_REVIEW",
        },
      }),

      // Judged this week
      prisma.submission.count({
        where: {
          status: "JUDGED",
          judgingCompletedAt: {
            gte: startOfWeek,
          },
        },
      }),

      // Rotation slots for 80/20 transformation
      prisma.rotationSlot.groupBy({
        by: ["indieVsMainstream"],
        _count: true,
      }),
    ]);

    // Process tier distribution
    const tierDistribution = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
    };

    tierPlacements.forEach((tier) => {
      if (tier.newTier in tierDistribution) {
        tierDistribution[tier.newTier as keyof typeof tierDistribution] = Number(tier.count);
      }
    });

    const totalArtistsInRotation = Object.values(tierDistribution).reduce((sum, count) => sum + count, 0);

    // Calculate placement rate
    const placedSubmissions = await prisma.submission.count({
      where: {
        status: {
          in: ["JUDGED", "PLACED"],
        },
        tierAwarded: {
          not: null,
        },
      },
    });

    const placementRate = allSubmissions > 0 ? Math.round((placedSubmissions / allSubmissions) * 100) : 95;

    // Calculate average review time
    const judgedSubmissions = await prisma.submission.findMany({
      where: {
        status: {
          in: ["JUDGED", "PLACED"],
        },
        judgingStartedAt: {
          not: null,
        },
        judgingCompletedAt: {
          not: null,
        },
      },
      select: {
        judgingStartedAt: true,
        judgingCompletedAt: true,
      },
      take: 50, // Last 50 for average
    });

    let avgReviewTime = 5.3; // Default
    if (judgedSubmissions.length > 0) {
      const totalDays = judgedSubmissions.reduce((sum, sub) => {
        if (sub.judgingStartedAt && sub.judgingCompletedAt) {
          const start = new Date(sub.judgingStartedAt);
          const end = new Date(sub.judgingCompletedAt);
          const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      avgReviewTime = Math.round((totalDays / judgedSubmissions.length) * 10) / 10;
    }

    // Calculate 80/20 transformation progress
    let indieCount = 0;
    let mainstreamCount = 0;

    rotationSlots.forEach((slot) => {
      if (slot.indieVsMainstream === "indie") {
        indieCount = slot._count;
      } else if (slot.indieVsMainstream === "mainstream") {
        mainstreamCount = slot._count;
      }
    });

    const totalSlots = indieCount + mainstreamCount;
    const indiePercentage = totalSlots > 0 ? Math.round((indieCount / totalSlots) * 100) : 45;
    const mainstreamPercentage = totalSlots > 0 ? Math.round((mainstreamCount / totalSlots) * 100) : 55;

    // Build response
    const stats: CassidyStats = {
      totalArtistsInRotation,
      byTier: tierDistribution,
      submissionsThisMonth,
      placementRate,
      avgReviewTime,
      rotationTransformation: {
        indie: indiePercentage,
        mainstream: mainstreamPercentage,
        target: 80,
      },
      pendingSubmissions,
      inReview: inReviewSubmissions,
      judgedThisWeek,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching Cassidy stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
