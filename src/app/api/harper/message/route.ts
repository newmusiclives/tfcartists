import { NextRequest, NextResponse } from "next/server";
import { HarperAgent } from "@/lib/ai/harper-agent";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit/limiter";

/**
 * POST /api/harper/message
 * Handle incoming sponsor message or send a message in an ongoing conversation
 *
 * Rate limited: 10 requests per minute (AI tier)
 */
export async function POST(request: NextRequest) {
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
      { error: "Failed to handle message", details: error.message },
      { status: 500 }
    );
  }
}
