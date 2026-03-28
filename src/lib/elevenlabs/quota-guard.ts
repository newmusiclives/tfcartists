/**
 * ElevenLabs Quota Guard
 *
 * Checks ElevenLabs subscription quota and enforces the rule:
 * North Country Radio MUST use ElevenLabs voices. If credits run out,
 * the station goes off-air and the owner is notified.
 *
 * Call `enforceElevenLabsQuota()` before any voice generation cron.
 */

import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import { setCronSuspended } from "@/lib/cron/log";

// Minimum characters remaining before we trigger off-air (buffer zone)
// Flash v2.5 uses 0.5 credits/char so effective chars are 2x the credit count
const MIN_CHARS_BUFFER = 500;

// Config keys for persisting state
const CONFIG_KEY_OFFAIR = "elevenlabs:station_offair";
const CONFIG_KEY_LAST_ALERT = "elevenlabs:last_alert_date";
const CONFIG_KEY_QUOTA_SNAPSHOT = "elevenlabs:quota_snapshot";

export interface ElevenLabsQuota {
  characterCount: number;     // chars used this period
  characterLimit: number;     // total chars in plan
  charactersRemaining: number;
  tier: string;               // plan name
  nextResetDate: string | null;
}

/**
 * Fetch current ElevenLabs subscription quota from their API.
 * Returns null if API key is missing or call fails.
 */
export async function getElevenLabsQuota(): Promise<ElevenLabsQuota | null> {
  const apiKey = await getConfig("ELEVENLABS_API_KEY");
  if (!apiKey) {
    logger.warn("ElevenLabs quota check: API key not configured");
    return null;
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) {
      logger.error("ElevenLabs subscription API failed", { status: response.status });
      return null;
    }

    const data = await response.json();

    const quota: ElevenLabsQuota = {
      characterCount: data.character_count ?? 0,
      characterLimit: data.character_limit ?? 0,
      charactersRemaining: (data.character_limit ?? 0) - (data.character_count ?? 0),
      tier: data.tier ?? "unknown",
      nextResetDate: data.next_character_count_reset_unix
        ? new Date(data.next_character_count_reset_unix * 1000).toISOString()
        : null,
    };

    // Persist snapshot for dashboard display
    await prisma.config.upsert({
      where: { key: CONFIG_KEY_QUOTA_SNAPSHOT },
      update: { value: JSON.stringify({ ...quota, checkedAt: new Date().toISOString() }) },
      create: { key: CONFIG_KEY_QUOTA_SNAPSHOT, value: JSON.stringify({ ...quota, checkedAt: new Date().toISOString() }) },
    }).catch(() => {});

    return quota;
  } catch (err) {
    logger.error("ElevenLabs quota check failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Check if the station has been taken off-air due to quota exhaustion.
 */
export async function isStationOffAir(): Promise<boolean> {
  try {
    const config = await prisma.config.findUnique({
      where: { key: CONFIG_KEY_OFFAIR },
    });
    return config?.value === "true";
  } catch {
    return false;
  }
}

/**
 * Take the station off-air:
 * 1. Suspend all voice generation cron jobs
 * 2. Mark station as off-air in config
 * 3. Send alert notification
 */
export async function takeStationOffAir(reason: string, quota?: ElevenLabsQuota): Promise<void> {
  logger.error("TAKING STATION OFF-AIR", { reason, quota });

  // 1. Suspend all voice generation crons
  const cronJobs = [
    "voice-tracks-daily",
    "voice-tracks-hour",
    "voice-tracks-dispatch",
    "voice-tracks-catchup",
    "features-daily",
    "pool-generic-tracks",
  ];

  for (const job of cronJobs) {
    await setCronSuspended(job, true).catch(() => {});
  }

  // 2. Mark station as off-air
  await prisma.config.upsert({
    where: { key: CONFIG_KEY_OFFAIR },
    update: { value: "true" },
    create: { key: CONFIG_KEY_OFFAIR, value: "true" },
  }).catch(() => {});

  // 3. Send notification
  await sendOffAirAlert(reason, quota);
}

/**
 * Bring the station back on-air:
 * 1. Resume all voice generation cron jobs
 * 2. Clear off-air flag
 */
export async function bringStationOnAir(): Promise<void> {
  logger.info("BRINGING STATION BACK ON-AIR");

  const cronJobs = [
    "voice-tracks-daily",
    "voice-tracks-hour",
    "voice-tracks-dispatch",
    "voice-tracks-catchup",
    "features-daily",
    "pool-generic-tracks",
  ];

  for (const job of cronJobs) {
    await setCronSuspended(job, false).catch(() => {});
  }

  await prisma.config.deleteMany({
    where: { key: CONFIG_KEY_OFFAIR },
  }).catch(() => {});

  // Clear last alert date so we don't suppress future alerts
  await prisma.config.deleteMany({
    where: { key: CONFIG_KEY_LAST_ALERT },
  }).catch(() => {});
}

/**
 * The main guard function. Call before voice generation.
 *
 * Returns true if generation should proceed, false if station is off-air.
 */
export async function enforceElevenLabsQuota(): Promise<{
  proceed: boolean;
  reason?: string;
  quota?: ElevenLabsQuota;
}> {
  // 1. Check if any DJ uses ElevenLabs (the constraint)
  const elevenLabsDjs = await prisma.dJ.findMany({
    where: {
      ttsProvider: "elevenlabs",
      voiceProfileId: { not: null },
      isActive: true,
    },
    select: { id: true, name: true },
  });

  if (elevenLabsDjs.length === 0) {
    // No ElevenLabs DJs — station can still broadcast using Gemini/OpenAI fallback
    logger.warn("No active DJs with ElevenLabs voices — TTS will use Gemini/OpenAI fallback");
    return { proceed: true };
  }

  // 2. Check ElevenLabs quota
  const quota = await getElevenLabsQuota();

  if (!quota) {
    // Can't check quota (API key missing or API down) — check if already off-air
    if (await isStationOffAir()) {
      return { proceed: false, reason: "Station off-air and unable to verify ElevenLabs quota" };
    }
    // If we can't check, allow generation to proceed but log warning
    logger.warn("Could not check ElevenLabs quota — proceeding with generation");
    return { proceed: true };
  }

  // 3. Check if credits are exhausted — switch to degraded mode, NOT off-air
  if (quota.charactersRemaining <= MIN_CHARS_BUFFER) {
    const reason = `ElevenLabs credits exhausted: ${quota.charactersRemaining} chars remaining of ${quota.characterLimit} (${quota.tier} plan). Next reset: ${quota.nextResetDate || "unknown"}`;
    logger.warn("ElevenLabs credits exhausted — TTS will use Gemini/OpenAI fallback", { reason });
    // Still proceed — the TTS fallback chain in voice-track-tts.ts handles this
    return { proceed: true, reason, quota };
  }

  // 4. Credits available — if station was off-air, bring it back
  if (await isStationOffAir()) {
    logger.info("ElevenLabs credits restored — bringing station back on-air", {
      remaining: quota.charactersRemaining,
    });
    await bringStationOnAir();
    await sendRestoredAlert(quota);
  }

  // 5. Warn if running low (< 20% remaining)
  const usagePercent = quota.characterCount / quota.characterLimit;
  if (usagePercent >= 0.8) {
    logger.warn("ElevenLabs credits running low", {
      used: quota.characterCount,
      limit: quota.characterLimit,
      remaining: quota.charactersRemaining,
      percent: `${Math.round(usagePercent * 100)}%`,
    });
    await sendLowCreditAlert(quota);
  }

  return { proceed: true, quota };
}

/**
 * Send off-air alert via webhook and email.
 */
async function sendOffAirAlert(reason: string, quota?: ElevenLabsQuota): Promise<void> {
  // Prevent duplicate alerts on the same day
  const today = new Date().toISOString().slice(0, 10);
  const lastAlert = await prisma.config.findUnique({ where: { key: CONFIG_KEY_LAST_ALERT } });
  if (lastAlert?.value === today) return;

  await prisma.config.upsert({
    where: { key: CONFIG_KEY_LAST_ALERT },
    update: { value: today },
    create: { key: CONFIG_KEY_LAST_ALERT, value: today },
  }).catch(() => {});

  const message = [
    "STATION OFF-AIR: North Country Radio has been taken off-air.",
    "",
    `Reason: ${reason}`,
    "",
    quota ? [
      `ElevenLabs Plan: ${quota.tier}`,
      `Characters Used: ${quota.characterCount.toLocaleString()} / ${quota.characterLimit.toLocaleString()}`,
      `Characters Remaining: ${quota.charactersRemaining.toLocaleString()}`,
      `Next Reset: ${quota.nextResetDate || "Unknown"}`,
    ].join("\n") : "",
    "",
    "ACTION REQUIRED:",
    "- Upgrade your ElevenLabs plan, or",
    "- Wait for the monthly character reset, then resume via Admin > Settings",
    "",
    "All voice generation cron jobs have been suspended.",
    "The station will automatically resume when credits are restored.",
  ].filter(Boolean).join("\n");

  // Webhook notification (Slack/Discord)
  const webhookUrl = process.env.CRON_ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[CRITICAL] Station Off-Air: ElevenLabs credits exhausted`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: [
                "*STATION OFF-AIR*",
                `*Reason:* ${reason}`,
                quota ? `*Credits:* ${quota.charactersRemaining.toLocaleString()} remaining of ${quota.characterLimit.toLocaleString()}` : "",
                quota?.nextResetDate ? `*Next Reset:* ${new Date(quota.nextResetDate).toLocaleDateString()}` : "",
                "",
                "_All voice generation has been suspended. Station will auto-resume when credits reset._",
              ].filter(Boolean).join("\n"),
            },
          },
        ],
      }),
    }).catch(() => {});
  }

  // Email notification via GHL
  try {
    const { messageDelivery } = await import("@/lib/messaging/delivery-service");
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GHL_ADMIN_EMAIL;
    if (adminEmail && messageDelivery?.send) {
      await messageDelivery.send({
        channel: "email",
        to: adminEmail,
        subject: "URGENT: North Country Radio Off-Air - ElevenLabs Credits Exhausted",
        content: message,
      }).catch(() => {});
    }
  } catch {
    // Email delivery not available
  }

  logger.error("OFF-AIR ALERT SENT", { reason });
}

/**
 * Send low credit warning (at 80% usage).
 */
async function sendLowCreditAlert(quota: ElevenLabsQuota): Promise<void> {
  // Only send once per day
  const today = new Date().toISOString().slice(0, 10);
  const key = "elevenlabs:low_credit_alert";
  const last = await prisma.config.findUnique({ where: { key } });
  if (last?.value === today) return;

  await prisma.config.upsert({
    where: { key },
    update: { value: today },
    create: { key, value: today },
  }).catch(() => {});

  const webhookUrl = process.env.CRON_ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[WARNING] ElevenLabs credits running low: ${quota.charactersRemaining.toLocaleString()} remaining`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: [
                "*ElevenLabs Credits Low*",
                `*Used:* ${quota.characterCount.toLocaleString()} / ${quota.characterLimit.toLocaleString()} (${Math.round((quota.characterCount / quota.characterLimit) * 100)}%)`,
                `*Remaining:* ${quota.charactersRemaining.toLocaleString()} characters`,
                quota.nextResetDate ? `*Next Reset:* ${new Date(quota.nextResetDate).toLocaleDateString()}` : "",
                "",
                "_Station will go off-air when credits are exhausted._",
              ].filter(Boolean).join("\n"),
            },
          },
        ],
      }),
    }).catch(() => {});
  }
}

/**
 * Send station restored notification.
 */
async function sendRestoredAlert(quota: ElevenLabsQuota): Promise<void> {
  const webhookUrl = process.env.CRON_ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[RESOLVED] North Country Radio is back on-air! ElevenLabs credits restored.`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: [
                "*STATION BACK ON-AIR*",
                `*Credits Available:* ${quota.charactersRemaining.toLocaleString()} / ${quota.characterLimit.toLocaleString()}`,
                "",
                "_All voice generation cron jobs have been resumed._",
              ].join("\n"),
            },
          },
        ],
      }),
    }).catch(() => {});
  }

  // Email notification
  try {
    const { messageDelivery } = await import("@/lib/messaging/delivery-service");
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GHL_ADMIN_EMAIL;
    if (adminEmail && messageDelivery?.send) {
      await messageDelivery.send({
        channel: "email",
        to: adminEmail,
        subject: "North Country Radio Back On-Air - ElevenLabs Credits Restored",
        content: `Good news! ElevenLabs credits have been restored (${quota.charactersRemaining.toLocaleString()} available). All voice generation has resumed.`,
      }).catch(() => {});
    }
  } catch {
    // Email delivery not available
  }
}
