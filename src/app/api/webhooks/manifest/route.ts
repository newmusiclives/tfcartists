import { NextRequest, NextResponse } from "next/server";
import { manifest, InvalidWebhookSignatureError } from "@/lib/payments/manifest";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

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
    // A bad signature is the caller's problem, not ours. Returning 500 told
    // Manifest to retry a request that can never succeed, and echoed internal
    // error text back to an unauthenticated caller.
    if (error instanceof InvalidWebhookSignatureError) {
      logger.warn("Rejected Manifest webhook with invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (error instanceof SyntaxError) {
      logger.warn("Rejected malformed Manifest webhook payload");
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    logger.error("Manifest webhook processing failed", { error });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
