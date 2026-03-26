import { dispatchWebhook } from "@/lib/webhooks/dispatch";
import { logger } from "@/lib/logger";

/**
 * Send a webhook notification to all subscribed endpoints for an organization.
 * This is a convenience wrapper around dispatchWebhook.
 */
export async function sendWebhookNotification(
  organizationId: string,
  event: string,
  data: Record<string, unknown>
) {
  try {
    await dispatchWebhook(event, data, organizationId);
    logger.info("Webhook notification dispatched", { event, organizationId });
  } catch {
    logger.warn("Webhook notification failed", { event, organizationId });
  }
}
