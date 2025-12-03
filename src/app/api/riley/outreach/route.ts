import { NextRequest, NextResponse } from "next/server";
import { riley } from "@/lib/ai/riley-agent";
import { prisma } from "@/lib/db";
import { RILEY_INTENTS } from "@/lib/ai/riley-personality";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { withValidation, triggerOutreachSchema } from "@/lib/validation/schemas";

/**
 * POST /api/riley/outreach
 * Trigger Riley to reach out to a specific artist
 *
 * Rate limited: 10 requests per minute (AI tier)
 * Input validation: artistId
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = await withRateLimit(request, "ai");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate request body
    const validationResult = await withValidation(request, triggerOutreachSchema);
    if (validationResult instanceof Response) {
      return validationResult;
    }

    const { artistId } = validationResult.data;

    // Get artist
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Create initial conversation if doesn't exist
    let conversation = await prisma.conversation.findFirst({
      where: {
        artistId,
        isActive: true,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          artistId,
          channel: "sms",
          isActive: true,
        },
      });
    }

    // Generate initial outreach message
    const message = await riley.generateResponse({
      artistId: artist.id,
      artistName: artist.name,
      genre: artist.genre || undefined,
      conversationHistory: [],
      intent: RILEY_INTENTS.INITIAL_OUTREACH,
    });

    // Send the message
    await riley.sendMessage(artistId, message, RILEY_INTENTS.INITIAL_OUTREACH);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    logger.error("Error sending outreach", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to send outreach" }, { status: 500 });
  }
}
