import { NextRequest, NextResponse } from "next/server";
import { manifest } from "@/lib/payments/manifest";
import { logger } from "@/lib/logger";

/**
 * POST /api/webhooks/manifest
 * Webhook endpoint for Manifest Financial events
 *
 * Handles:
 * - subscription.created
 * - subscription.updated
 * - subscription.cancelled
 * - payment.succeeded
 * - payment.failed
 * - payout.paid
 * - payout.failed
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body and signature
    const body = await req.text();
    const signature = req.headers.get("manifest-signature") || "";

    // Verify and parse webhook
    const { event, data } = await manifest.handleWebhook(body, signature);

    logger.info("Manifest webhook received", { event });

    // Process the webhook event
    await manifest.processWebhookEvent(event, data);

    return NextResponse.json({
      success: true,
      received: true,
    });

  } catch (error) {
    logger.error("Manifest webhook processing failed", { error });

    return NextResponse.json(
      {
        error: "Webhook processing failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
