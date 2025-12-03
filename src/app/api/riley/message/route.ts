import { NextRequest, NextResponse } from "next/server";
import { riley } from "@/lib/ai/riley-agent";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { withValidation, handleArtistMessageSchema } from "@/lib/validation/schemas";

/**
 * POST /api/riley/message
 * Handle incoming messages from artists
 *
 * Rate limited: 10 requests per minute (AI tier)
 * Input validation: artistId, message, channel
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = await withRateLimit(request, "ai");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate request body
    const validationResult = await withValidation(request, handleArtistMessageSchema);
    if (validationResult instanceof Response) {
      return validationResult;
    }

    const { artistId, message, channel } = validationResult.data;

    // Process the message and get Riley's response
    const response = await riley.handleArtistMessage(artistId, message, channel);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    logger.error("Error handling artist message", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
