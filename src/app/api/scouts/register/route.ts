import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/scout/referral-codes";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth/config";
import { withRateLimit } from "@/lib/rate-limit/limiter";

/**
 * POST /api/scouts/register
 * Convert a listener to a scout
 *
 * Rate limited: 60 requests per minute (API tier)
 */
export async function POST(req: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await withRateLimit(req, "api");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // SECURITY: Require authentication
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { listenerId, email, name } = body;

    if (!listenerId) {
      return NextResponse.json(
        { error: "listenerId is required" },
        { status: 400 }
      );
    }

    // Check if listener exists
    const listener = await prisma.listener.findUnique({
      where: { id: listenerId },
    });

    if (!listener) {
      return NextResponse.json(
        { error: "Listener not found" },
        { status: 404 }
      );
    }

    // Check if listener is already a scout
    const existingScout = await prisma.scout.findUnique({
      where: { listenerId },
    });

    if (existingScout) {
      return NextResponse.json(
        {
          error: "Listener is already registered as a scout",
          scout: existingScout,
        },
        { status: 400 }
      );
    }

    // Generate unique referral code
    const referralCode = await generateReferralCode();

    // Create scout record
    const scout = await prisma.scout.create({
      data: {
        listenerId,
        referralCode,
        status: "ACTIVE", // Activate immediately
        activatedAt: new Date(),
        payoutEmail: email || listener.email,
      },
      include: {
        listener: {
          select: {
            id: true,
            name: true,
            email: true,
            tier: true,
          },
        },
      },
    });

    logger.info(`Scout registered: ${scout.id} for listener ${listenerId}`);

    return NextResponse.json({
      success: true,
      message: "Scout registered successfully",
      scout: {
        id: scout.id,
        listenerId: scout.listenerId,
        referralCode: scout.referralCode,
        status: scout.status,
        activatedAt: scout.activatedAt,
        listener: scout.listener,
      },
    });
  } catch (error) {
    logger.error("Scout registration failed", { error });

    return NextResponse.json(
      {
        error: "Scout registration failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
