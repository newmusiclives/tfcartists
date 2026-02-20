import { NextRequest, NextResponse } from "next/server";
import { manifest } from "@/lib/payments/manifest";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/payouts
 * Create payouts for artist earnings
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { artistId, period, bankAccountId } = body;

    // Validate input
    if (!artistId || !period || !bankAccountId) {
      return NextResponse.json(
        { error: "Missing required fields: artistId, period, bankAccountId" },
        { status: 400 }
      );
    }

    // Get earnings record
    const earnings = await prisma.radioEarnings.findUnique({
      where: {
        artistId_period: {
          artistId,
          period,
        },
      },
    });

    if (!earnings) {
      return NextResponse.json(
        { error: "Earnings record not found" },
        { status: 404 }
      );
    }

    if (earnings.paid) {
      return NextResponse.json(
        { error: "Earnings already paid" },
        { status: 400 }
      );
    }

    if (earnings.earnings <= 0) {
      return NextResponse.json(
        { error: "No earnings to payout" },
        { status: 400 }
      );
    }

    // Create payout
    const payout = await manifest.createArtistPayout({
      artistId,
      amount: earnings.earnings,
      bankAccountId,
      period,
    });

    logger.info("Artist payout initiated", {
      artistId,
      period,
      amount: earnings.earnings,
      payoutId: payout.id,
    });

    return NextResponse.json({
      success: true,
      payoutId: payout.id,
      amount: earnings.earnings,
      status: payout.status,
    });

  } catch (error) {
    logger.error("Payout creation failed", { error });

    return NextResponse.json(
      {
        error: "Failed to create payout",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/payouts
 * List artist payouts
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const artistId = searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json(
        { error: "artistId query parameter required" },
        { status: 400 }
      );
    }

    // Get earnings for this artist (paginated)
    const earnings = await prisma.radioEarnings.findMany({
      where: { artistId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      earnings,
      totalEarnings: earnings.reduce((sum, e) => sum + e.earnings, 0),
      totalPaid: earnings.filter((e) => e.paid).reduce((sum, e) => sum + e.earnings, 0),
      pendingPayouts: earnings.filter((e) => !e.paid).reduce((sum, e) => sum + e.earnings, 0),
    });

  } catch (error) {
    logger.error("Failed to fetch payouts", { error });

    return NextResponse.json(
      {
        error: "Failed to fetch payouts",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
