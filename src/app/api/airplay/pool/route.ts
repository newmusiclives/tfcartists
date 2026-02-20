import { NextRequest, NextResponse } from "next/server";
import { distributeRevenuePool, calculateRevenuePool, getCurrentPeriod } from "@/lib/radio/airplay-system";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/airplay/pool?period=2024-12
 * Get revenue pool stats for a period
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || getCurrentPeriod();

    const pool = await prisma.radioRevenuePool.findUnique({
      where: { period },
    });

    const currentStats = await calculateRevenuePool(period);

    return NextResponse.json({
      pool,
      currentStats,
      period,
    });
  } catch (error) {
    logger.error("Error fetching pool stats", { error });
    return NextResponse.json(
      { error: "Failed to fetch pool stats" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/airplay/pool/distribute
 * Distribute revenue pool (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const { period, totalAdRevenue } = body;

    if (!period || totalAdRevenue === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: period, totalAdRevenue" },
        { status: 400 }
      );
    }

    const distributedCount = await distributeRevenuePool(period, totalAdRevenue);

    return NextResponse.json({
      success: true,
      distributedCount,
      message: `Distributed revenue to ${distributedCount} artists`,
    });
  } catch (error) {
    logger.error("Error distributing pool", { error });
    return NextResponse.json(
      { error: "Failed to distribute pool" },
      { status: 500 }
    );
  }
}
