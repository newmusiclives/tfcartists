import { NextRequest, NextResponse } from "next/server";
import { elliot } from "@/lib/ai/elliot-agent";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit/limiter";

/**
 * POST /api/elliot/engage
 * Engage with a specific listener
 *
 * Rate limited: 10 requests per minute (AI tier)
 */
export async function POST(req: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await withRateLimit(req, "ai");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await req.json();
    const { listenerId, engagementType } = body;

    // Validate input
    if (!listenerId || !engagementType) {
      return NextResponse.json(
        { error: "Missing required fields: listenerId, engagementType" },
        { status: 400 }
      );
    }

    // Valid engagement types
    const validTypes = ["welcome", "retention", "reactivation", "reward"];
    if (!validTypes.includes(engagementType)) {
      return NextResponse.json(
        {
          error: `Invalid engagementType. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Engage listener
    await elliot.engageListener(listenerId, engagementType);

    logger.info("Listener engaged via API", { listenerId, engagementType });

    return NextResponse.json({
      success: true,
      message: "Listener engaged successfully",
    });
  } catch (error) {
    logger.error("Listener engagement API error", { error });

    return NextResponse.json(
      {
        error: "Failed to engage listener",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/elliot/engage/batch
 * Engage with multiple listeners at once
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { listenerIds, engagementType } = body;

    if (!listenerIds || !Array.isArray(listenerIds) || listenerIds.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid listenerIds array" },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const listenerId of listenerIds) {
      try {
        await elliot.engageListener(listenerId, engagementType);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `${listenerId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    logger.info("Batch engagement completed", {
      total: listenerIds.length,
      success: results.success,
      failed: results.failed,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    logger.error("Batch engagement API error", { error });

    return NextResponse.json(
      {
        error: "Failed to process batch engagement",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
