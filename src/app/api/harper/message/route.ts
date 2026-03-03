import { NextRequest, NextResponse } from "next/server";
import { HarperAgent } from "@/lib/ai/harper-agent";
import { prisma } from "@/lib/db";
import { orgWhere } from "@/lib/db-scoped";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

/**
 * POST /api/harper/message
 * Handle incoming sponsor message or send a message in an ongoing conversation
 *
 * Rate limited: 10 requests per minute (AI tier)
 */
export async function POST(request: NextRequest) {
  const session = await requireRole("harper");
  if (!session) return unauthorized();

  // Check rate limit
  const rateLimitResponse = await withRateLimit(request, "ai");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { sponsorId, content, channel = "email" } = body;

    if (!sponsorId || !content) {
      return NextResponse.json(
        { error: "sponsorId and content are required" },
        { status: 400 }
      );
    }

    // Verify sponsor belongs to user's org
    const sponsor = await prisma.sponsor.findFirst({
      where: { id: sponsorId, ...orgWhere(session) },
      select: { id: true },
    });
    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const harperAgent = new HarperAgent();

    // Handle the sponsor's message and generate response
    const response = await harperAgent.handleSponsorMessage(sponsorId, content, channel);

    logger.info("Harper message handled", { sponsorId, channel });

    return NextResponse.json({
      success: true,
      response,
      sponsorId,
    });
  } catch (error: any) {
    logger.error("Harper message handling failed", { error: error.message });
    return NextResponse.json(
      { error: "Failed to handle message" },
      { status: 500 }
    );
  }
}
