import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Send a webhook notification to a registered URL.
 * Operators can register webhook URLs in their settings.
 */
export async function sendWebhookNotification(
  organizationId: string,
  event: string,
  data: Record<string, unknown>
) {
  try {
    // Look up webhook URL from org settings
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = org?.settings as Record<string, unknown> | null;
    const webhookUrl = settings?.webhookUrl as string | undefined;
    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
    }).catch(() => {});

    logger.info("Webhook sent", { event, organizationId });
  } catch {
    logger.warn("Webhook notification failed", { event, organizationId });
  }
}
