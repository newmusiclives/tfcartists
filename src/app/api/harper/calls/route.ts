import { NextRequest, NextResponse } from "next/server";
import { HarperAgent } from "@/lib/ai/harper-agent";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/harper/calls
 * Log a call with a sponsor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("harper");
    if (!session) return unauthorized();

    const body = await request.json();
    const {
      sponsorId,
      callType = "human",
      duration,
      outcome,
      recordingUrl,
      transcript,
    } = body;

    if (!sponsorId || !duration || !outcome) {
      return NextResponse.json(
        { error: "sponsorId, duration, and outcome are required" },
        { status: 400 }
      );
    }

    const harperAgent = new HarperAgent();

    await harperAgent.logCall(
      sponsorId,
      callType,
      duration,
      outcome,
      recordingUrl,
      transcript
    );

    logger.info("Harper call logged", { sponsorId, callType, duration, outcome });

    return NextResponse.json({
      success: true,
      message: "Call logged successfully",
      sponsorId,
      callType,
      duration,
    });
  } catch (error: any) {
    logger.error("Failed to log Harper call", { error: error.message });
    return NextResponse.json(
      { error: "Failed to log call" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/harper/calls
 * Get call history for a sponsor
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("harper");
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get("sponsorId");

    if (!sponsorId) {
      return NextResponse.json({ error: "sponsorId is required" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/db");

    const calls = await prisma.sponsorCall.findMany({
      where: { sponsorId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      calls,
      totalCalls: calls.length,
    });
  } catch (error: any) {
    logger.error("Failed to retrieve Harper calls", { error: error.message });
    return NextResponse.json(
      { error: "Failed to retrieve calls" },
      { status: 500 }
    );
  }
}
