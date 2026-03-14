/**
 * Push Notification Service
 *
 * Sends Web Push notifications using the web-push library.
 * Requires VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_EMAIL env vars.
 */

import webpush from "web-push";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// Configure VAPID keys if available
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${env.VAPID_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

function isConfigured(): boolean {
  return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send a push notification to a single subscription.
 * Returns true on success, false if the subscription is stale/invalid.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionKeys,
  payload: PushPayload
): Promise<boolean> {
  if (!isConfigured()) {
    logger.warn("Push notifications not configured — missing VAPID env vars");
    return false;
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    // 410 Gone or 404 means the subscription is no longer valid
    if (error.statusCode === 410 || error.statusCode === 404) {
      logger.info("Push subscription expired, deactivating", {
        endpoint: subscription.endpoint,
      });
      await prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: { isActive: false },
      }).catch(() => {});
      return false;
    }

    logger.error("Failed to send push notification", {
      statusCode: error.statusCode,
      message: error.message,
      endpoint: subscription.endpoint,
    });
    return false;
  }
}

/**
 * Send a push notification to all active subscribers.
 * Returns the count of successful deliveries.
 */
export async function sendToAllSubscribers(
  title: string,
  body: string,
  url?: string
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { isActive: true },
  });

  let sent = 0;
  let failed = 0;

  const payload: PushPayload = {
    title,
    body,
    url: url || "/",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
  };

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      sent++;
    } else {
      failed++;
    }
  }

  logger.info("Push broadcast complete", { sent, failed, total: subscriptions.length });
  return { sent, failed };
}

/**
 * Send a push notification to a specific listener's subscriptions.
 * Returns the count of successful deliveries.
 */
export async function sendToListener(
  listenerId: string,
  title: string,
  body: string,
  url?: string
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { listenerId, isActive: true },
  });

  let sent = 0;
  let failed = 0;

  const payload: PushPayload = {
    title,
    body,
    url: url || "/",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
  };

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      sent++;
    } else {
      failed++;
    }
  }

  logger.info("Push to listener complete", { listenerId, sent, failed });
  return { sent, failed };
}
