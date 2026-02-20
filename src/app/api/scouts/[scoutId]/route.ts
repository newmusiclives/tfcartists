import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getScoutLifetimeEarnings } from "@/lib/scout/monthly-payout";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

/**
 * GET /api/scouts/[scoutId]
 * Get scout profile with stats
 *
 * Rate limited: 60 requests per minute (API tier)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { scoutId: string } }
) {
  try {
    // Check rate limit
    const rateLimitResponse = await withRateLimit(req, "api");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { scoutId } = params;

    // Get scout with related data
    const scout = await prisma.scout.findUnique({
      where: { id: scoutId },
      include: {
        listener: {
          select: {
            id: true,
            name: true,
            email: true,
            tier: true,
            engagementScore: true,
          },
        },
        discoveries: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
                email: true,
                airplayTier: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        referrals: {
          include: {
            listener: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!scout) {
      return NextResponse.json({ error: "Scout not found" }, { status: 404 });
    }

    // Get lifetime earnings
    const earnings = await getScoutLifetimeEarnings(scoutId);

    return NextResponse.json({
      success: true,
      scout: {
        id: scout.id,
        referralCode: scout.referralCode,
        status: scout.status,
        activatedAt: scout.activatedAt,
        totalEarnings: scout.totalEarnings,
        artistDiscoveries: scout.artistDiscoveries,
        listenerReferrals: scout.listenerReferrals,
        activeArtists: scout.activeArtists,
        listener: scout.listener,
        discoveries: scout.discoveries,
        referrals: scout.referrals,
        earnings: {
          lifetime: earnings.totalAmount,
          paid: earnings.paidAmount,
          pending: earnings.pendingAmount,
          commissionCount: earnings.commissionCount,
          periods: earnings.periods,
        },
      },
    });
  } catch (error) {
    logger.error("Failed to get scout details", { error });

    return NextResponse.json(
      {
        error: "Failed to get scout details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
