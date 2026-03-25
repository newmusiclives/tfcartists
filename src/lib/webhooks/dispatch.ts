import { createHmac } from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Webhook event types supported by TrueFans Radio.
 */
export const WEBHOOK_EVENTS = [
  "song.played",
  "sponsor.new",
  "artist.new",
  "request.submitted",
  "listener.milestone",
  "ad.played",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
  lastStatus?: "success" | "failed";
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  endpointName: string;
  event: string;
  status: "success" | "failed";
  statusCode?: number;
  timestamp: string;
  duration?: number;
  error?: string;
}

/** Example payloads for each event type (used in docs / test pings). */
export const WEBHOOK_EVENT_EXAMPLES: Record<WebhookEvent, object> = {
  "song.played": {
    songId: "clx123abc",
    title: "Summer Breeze",
    artist: "The Sunny Days",
    duration: 234,
    playedAt: new Date().toISOString(),
  },
  "sponsor.new": {
    sponsorId: "clx456def",
    name: "Acme Corp",
    dealValue: 500,
    startDate: new Date().toISOString(),
  },
  "artist.new": {
    artistId: "clx789ghi",
    name: "New Artist",
    genre: "Indie Rock",
    submittedAt: new Date().toISOString(),
  },
  "request.submitted": {
    requestId: "clx012jkl",
    songTitle: "Midnight Drive",
    requestedBy: "listener42",
    submittedAt: new Date().toISOString(),
  },
  "listener.milestone": {
    listenerId: "clx345mno",
    milestone: "100_hours",
    totalHours: 100,
    achievedAt: new Date().toISOString(),
  },
  "ad.played": {
    adId: "clx678pqr",
    sponsorName: "Acme Corp",
    duration: 30,
    playedAt: new Date().toISOString(),
  },
};

const WEBHOOK_CONFIG_KEY = "webhook_endpoints";
const WEBHOOK_DELIVERIES_KEY = "webhook_deliveries";
const MAX_DELIVERIES = 50;

/**
 * Sign a payload body with HMAC-SHA256.
 */
export function signPayload(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Load all webhook endpoints from SystemConfig.
 */
export async function getWebhookEndpoints(): Promise<WebhookEndpoint[]> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: WEBHOOK_CONFIG_KEY },
    });
    if (!config) return [];
    return JSON.parse(config.value) as WebhookEndpoint[];
  } catch (err) {
    logger.error("Failed to load webhook endpoints", { error: String(err) });
    return [];
  }
}

/**
 * Save webhook endpoints to SystemConfig.
 */
export async function saveWebhookEndpoints(endpoints: WebhookEndpoint[]): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: WEBHOOK_CONFIG_KEY },
    create: {
      key: WEBHOOK_CONFIG_KEY,
      value: JSON.stringify(endpoints),
      category: "webhooks",
      label: "Webhook Endpoints",
      encrypted: false,
    },
    update: {
      value: JSON.stringify(endpoints),
      updatedAt: new Date(),
    },
  });
}

/**
 * Load recent webhook deliveries from SystemConfig.
 */
export async function getWebhookDeliveries(): Promise<WebhookDelivery[]> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: WEBHOOK_DELIVERIES_KEY },
    });
    if (!config) return [];
    return JSON.parse(config.value) as WebhookDelivery[];
  } catch {
    return [];
  }
}

/**
 * Record a webhook delivery attempt.
 */
async function recordDelivery(delivery: WebhookDelivery): Promise<void> {
  try {
    const existing = await getWebhookDeliveries();
    const updated = [delivery, ...existing].slice(0, MAX_DELIVERIES);
    await prisma.systemConfig.upsert({
      where: { key: WEBHOOK_DELIVERIES_KEY },
      create: {
        key: WEBHOOK_DELIVERIES_KEY,
        value: JSON.stringify(updated),
        category: "webhooks",
        label: "Webhook Delivery Log",
        encrypted: false,
      },
      update: {
        value: JSON.stringify(updated),
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    logger.error("Failed to record webhook delivery", { error: String(err) });
  }
}

/**
 * Update an endpoint's last-triggered metadata after dispatch.
 */
async function updateEndpointStatus(
  endpointId: string,
  status: "success" | "failed"
): Promise<void> {
  try {
    const endpoints = await getWebhookEndpoints();
    const idx = endpoints.findIndex((e) => e.id === endpointId);
    if (idx === -1) return;
    endpoints[idx].lastTriggered = new Date().toISOString();
    endpoints[idx].lastStatus = status;
    await saveWebhookEndpoints(endpoints);
  } catch {
    // best-effort
  }
}

/**
 * Send a webhook to a single endpoint. Returns the delivery record.
 */
export async function sendWebhook(
  endpoint: WebhookEndpoint,
  event: string,
  payload: object
): Promise<WebhookDelivery> {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const signature = signPayload(body, endpoint.secret);
  const start = Date.now();
  const deliveryId = `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event,
        "User-Agent": "TrueFans-Radio-Webhook/1.0",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const duration = Date.now() - start;
    const status = res.ok ? "success" : "failed";

    const delivery: WebhookDelivery = {
      id: deliveryId,
      endpointId: endpoint.id,
      endpointName: endpoint.name,
      event,
      status,
      statusCode: res.status,
      timestamp: new Date().toISOString(),
      duration,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };

    return delivery;
  } catch (err) {
    const duration = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);

    const delivery: WebhookDelivery = {
      id: deliveryId,
      endpointId: endpoint.id,
      endpointName: endpoint.name,
      event,
      status: "failed",
      timestamp: new Date().toISOString(),
      duration,
      error: errorMsg,
    };

    return delivery;
  }
}

/**
 * Dispatch a webhook event to all subscribed endpoints.
 * Fire-and-forget: does not throw, logs failures.
 */
export async function dispatchWebhook(event: string, payload: object): Promise<void> {
  try {
    const endpoints = await getWebhookEndpoints();
    const subscribers = endpoints.filter(
      (ep) => ep.enabled && ep.events.includes(event as WebhookEvent)
    );

    if (subscribers.length === 0) return;

    logger.info("Dispatching webhook", { event, endpointCount: subscribers.length });

    // Fire-and-forget: run all in parallel, don't await in caller's hot path
    Promise.allSettled(
      subscribers.map(async (endpoint) => {
        const delivery = await sendWebhook(endpoint, event, payload);
        await recordDelivery(delivery);
        await updateEndpointStatus(endpoint.id, delivery.status);

        if (delivery.status === "failed") {
          logger.warn("Webhook delivery failed", {
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
