import { createHmac } from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { WEBHOOK_EVENT_LIST, WEBHOOK_EVENT_EXAMPLES } from "./events";
import type { WebhookEventType } from "./events";

// Re-export for backward compatibility with existing imports
export { WEBHOOK_EVENT_LIST as WEBHOOK_EVENTS, WEBHOOK_EVENT_EXAMPLES };
export type { WebhookEventType as WebhookEvent };

// Re-export types used by old UI/config routes (backward compat)
export type WebhookEndpoint = {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  active?: boolean;
  createdAt: string;
  lastTriggered?: string;
  lastStatus?: "success" | "failed";
  organizationId?: string;
};

export type WebhookDelivery = {
  id: string;
  endpointId: string;
  endpointName: string;
  event: string;
  status: "success" | "failed";
  statusCode?: number;
  timestamp: string;
  duration?: number;
  error?: string;
};

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000; // 1s, 2s, 4s exponential backoff
const DELIVERY_TIMEOUT_MS = 10000;

/**
 * Sign a payload body with HMAC-SHA256.
 */
export function signPayload(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Load all webhook endpoints from the database.
 * If organizationId is provided, only returns that org's endpoints.
 */
export async function getWebhookEndpoints(organizationId?: string): Promise<WebhookEndpoint[]> {
  try {
    const where: Record<string, unknown> = {};
    if (organizationId) where.organizationId = organizationId;

    const endpoints = await prisma.webhookEndpoint.findMany({ where, orderBy: { createdAt: "desc" } });
    return endpoints.map((ep) => ({
      id: ep.id,
      name: ep.name,
      url: ep.url,
      secret: ep.secret,
      events: ep.events,
      enabled: ep.active,
      active: ep.active,
      createdAt: ep.createdAt.toISOString(),
      organizationId: ep.organizationId,
    }));
  } catch (err) {
    logger.error("Failed to load webhook endpoints", { error: String(err) });
    return [];
  }
}

/**
 * Save / upsert a webhook endpoint (used by old config route for backward compat).
 */
export async function saveWebhookEndpoints(endpoints: WebhookEndpoint[]): Promise<void> {
  // This is kept for backward compatibility but the new system uses direct Prisma calls.
  // The old config route will be updated to use the new endpoints API.
  for (const ep of endpoints) {
    await prisma.webhookEndpoint.upsert({
      where: { id: ep.id },
      create: {
        id: ep.id,
        name: ep.name,
        url: ep.url,
        secret: ep.secret,
        events: ep.events,
        active: ep.enabled ?? true,
        organizationId: ep.organizationId || "default",
      },
      update: {
        name: ep.name,
        url: ep.url,
        secret: ep.secret,
        events: ep.events,
        active: ep.enabled ?? true,
      },
    });
  }
}

/**
 * Load recent webhook deliveries.
 */
export async function getWebhookDeliveries(endpointId?: string, limit = 50): Promise<WebhookDelivery[]> {
  try {
    const where: Record<string, unknown> = {};
    if (endpointId) where.endpointId = endpointId;

    const deliveries = await prisma.webhookDelivery.findMany({
      where,
      orderBy: { deliveredAt: "desc" },
      take: limit,
      include: { endpoint: { select: { name: true } } },
    });

    return deliveries.map((d) => ({
      id: d.id,
      endpointId: d.endpointId,
      endpointName: d.endpoint.name,
      event: d.event,
      status: d.success ? "success" : "failed",
      statusCode: d.statusCode ?? undefined,
      timestamp: d.deliveredAt.toISOString(),
      duration: d.duration ?? undefined,
      error: d.error ?? undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Record a webhook delivery attempt in the database.
 */
async function recordDelivery(delivery: {
  endpointId: string;
  event: string;
  payload: object;
  statusCode?: number;
  response?: string;
  success: boolean;
  error?: string;
  duration?: number;
}): Promise<void> {
  try {
    await prisma.webhookDelivery.create({
      data: {
        endpointId: delivery.endpointId,
        event: delivery.event,
        payload: JSON.parse(JSON.stringify(delivery.payload)),
        statusCode: delivery.statusCode ?? null,
        response: delivery.response ? delivery.response.slice(0, 1024) : null,
        success: delivery.success,
        error: delivery.error ?? null,
        duration: delivery.duration ?? null,
      },
    });
  } catch (err) {
    logger.error("Failed to record webhook delivery", { error: String(err) });
  }
}

/**
 * Send a single webhook with retry logic.
 * Retries up to MAX_RETRIES times with exponential backoff on failure.
 */
export async function sendWebhook(
  endpoint: { id: string; name: string; url: string; secret: string },
  event: string,
  payload: object
): Promise<WebhookDelivery> {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const signature = signPayload(body, endpoint.secret);
  const timestamp = new Date().toISOString();
  let lastError: string | undefined;
  let lastStatusCode: number | undefined;
  let lastDuration: number | undefined;
  let lastResponse: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
          "X-Webhook-Timestamp": timestamp,
          "User-Agent": "TrueFans-Radio-Webhook/2.0",
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      lastDuration = Date.now() - start;
      lastStatusCode = res.status;

      try {
        lastResponse = await res.text();
      } catch {
        lastResponse = undefined;
      }

      if (res.ok) {
        // Success: record and return
        await recordDelivery({
          endpointId: endpoint.id,
          event,
          payload,
          statusCode: res.status,
          response: lastResponse,
          success: true,
          duration: lastDuration,
        });

        return {
          id: `del_${Date.now()}`,
          endpointId: endpoint.id,
          endpointName: endpoint.name,
          event,
          status: "success",
          statusCode: res.status,
          timestamp,
          duration: lastDuration,
        };
      }

      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastDuration = Date.now() - start;
      lastError = err instanceof Error ? err.message : String(err);
    }

    // Log retry attempt
    if (attempt < MAX_RETRIES) {
      logger.info("Webhook delivery retry", {
        endpointId: endpoint.id,
        event,
        attempt: attempt + 1,
        error: lastError,
      });
    }
  }

  // All retries exhausted: record failure
  await recordDelivery({
    endpointId: endpoint.id,
    event,
    payload,
    statusCode: lastStatusCode,
    response: lastResponse,
    success: false,
    error: lastError,
    duration: lastDuration,
  });

  return {
    id: `del_${Date.now()}`,
    endpointId: endpoint.id,
    endpointName: endpoint.name,
    event,
    status: "failed",
    statusCode: lastStatusCode,
    timestamp,
    duration: lastDuration,
    error: lastError,
  };
}

/**
 * Dispatch a webhook event to all subscribed, active endpoints.
 *
 * This is the main entry point. Call it from any API route:
 *   dispatchWebhook("artist.created", { artistId: "...", name: "..." }, "org_123")
 *
 * Fire-and-forget: does not throw, logs failures.
 * If organizationId is omitted, dispatches to ALL active endpoints subscribed to the event.
 */
export async function dispatchWebhook(
  event: string,
  payload: object,
  organizationId?: string
): Promise<void> {
  try {
    const where: Record<string, unknown> = {
      active: true,
      events: { has: event },
    };
    if (organizationId) where.organizationId = organizationId;

    const endpoints = await prisma.webhookEndpoint.findMany({ where });

    if (endpoints.length === 0) return;

    logger.info("Dispatching webhook", { event, endpointCount: endpoints.length });

    // Fire-and-forget: run all in parallel
    Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const delivery = await sendWebhook(
          {
            id: endpoint.id,
            name: endpoint.name,
            url: endpoint.url,
            secret: endpoint.secret,
          },
          event,
          payload
        );

        if (delivery.status === "failed") {
          logger.warn("Webhook delivery failed after retries", {
            endpointId: endpoint.id,
            endpointName: endpoint.name,
            event,
            error: delivery.error,
          });
        }
      })
    ).catch(() => {});
  } catch (err) {
    logger.error("Webhook dispatch error", { event, error: String(err) });
  }
}
