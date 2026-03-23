import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/** Config key prefix for suspended cron jobs */
const SUSPEND_KEY_PREFIX = "cron_suspended:";

/**
 * Check if a cron job is suspended via the Config table.
 * Returns a 200 JSON response with `suspended: true` if the job is suspended,
 * or null if the job should proceed.
 *
 * Usage at the top of a cron route handler:
 *   const suspended = await isCronSuspended("riley-daily");
 *   if (suspended) return suspended;
 */
export async function isCronSuspended(jobName: string): Promise<NextResponse | null> {
  try {
    const config = await prisma.config.findUnique({
      where: { key: `${SUSPEND_KEY_PREFIX}${jobName}` },
    });
    if (config?.value === "true") {
      logger.info(`Cron job ${jobName} is suspended — skipping`);
      return NextResponse.json({
        success: true,
        message: `${jobName} is suspended`,
        suspended: true,
      });
    }
  } catch {
    // If the Config table doesn't exist or query fails, proceed anyway
  }
  return null;
}

/**
 * Suspend or resume a cron job by name.
 */
export async function setCronSuspended(jobName: string, suspended: boolean): Promise<void> {
  const key = `${SUSPEND_KEY_PREFIX}${jobName}`;
  if (suspended) {
    await prisma.config.upsert({
      where: { key },
      update: { value: "true" },
      create: { key, value: "true" },
    });
  } else {
    await prisma.config.deleteMany({ where: { key } });
  }
}

/**
 * Get suspension status for all known AI team jobs.
 */
export async function getSuspendedJobs(): Promise<Record<string, boolean>> {
  const configs = await prisma.config.findMany({
    where: { key: { startsWith: SUSPEND_KEY_PREFIX } },
  });
  const result: Record<string, boolean> = {};
  for (const c of configs) {
    const jobName = c.key.replace(SUSPEND_KEY_PREFIX, "");
    result[jobName] = c.value === "true";
  }
  return result;
}

/**
 * Log a cron job execution to the database.
 * Call at the end of each cron job handler.
 */
export async function logCronExecution(opts: {
  jobName: string;
  status: "success" | "error" | "timeout";
  duration: number;
  summary?: Record<string, unknown>;
  error?: string;
  startedAt: Date;
}) {
  try {
    await prisma.cronLog.create({
      data: {
        jobName: opts.jobName,
        status: opts.status,
        duration: opts.duration,
        summary: (opts.summary ?? undefined) as any,
        error: opts.error?.slice(0, 2000),
        startedAt: opts.startedAt,
      },
    });
    // Send alert for failed cron jobs
    if (opts.status === "error" || opts.status === "timeout") {
      await notifyCronFailure({
        jobName: opts.jobName,
        status: opts.status,
        duration: opts.duration,
        error: opts.error,
        startedAt: opts.startedAt,
      });
    }
  } catch {
    // Don't let logging failures break the cron job
    console.error(`[cron-log] Failed to log ${opts.jobName} execution`);
  }
}

/**
 * Wrap a cron job handler with automatic execution logging.
 * Usage: export const GET = withCronLog("parker-daily", handler);
 */
export function withCronLog(
  jobName: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const startedAt = new Date();
    const start = Date.now();

    try {
      const response = await handler(req);
      const duration = Date.now() - start;
      const status = response.ok ? "success" : "error";

      // Try to extract summary from response body
      let summary: Record<string, unknown> | undefined;
      let errorMsg: string | undefined;
      try {
        const cloned = response.clone();
        const body = await cloned.json();
        if (body.results) summary = body.results;
        else if (body.success !== undefined) summary = body;
        if (!response.ok) errorMsg = body.error || body.message;
      } catch {
        // Body not JSON, skip
      }

      await logCronExecution({ jobName, status, duration, summary, error: errorMsg, startedAt });
      return response;
    } catch (err) {
      const duration = Date.now() - start;
      await logCronExecution({
        jobName,
        status: "error",
        duration,
        error: String(err),
        startedAt,
      });
      throw err;
    }
  };
}

/**
 * Cron failure notification helper.
 * Logs structured failure data via the logger (which reports to Sentry)
 * and optionally sends a webhook notification if CRON_ALERT_WEBHOOK_URL is set.
 */
export async function notifyCronFailure(opts: {
  jobName: string;
  status: "error" | "timeout";
  duration: number;
  error?: string;
  startedAt: Date;
}) {
  // Always log structured data for monitoring
  logger.error(`Cron job failed: ${opts.jobName}`, {
    type: "cron_failure",
    jobName: opts.jobName,
    status: opts.status,
    durationMs: opts.duration,
    error: opts.error,
    startedAt: opts.startedAt.toISOString(),
  });

  // Send webhook notification if configured (Slack, Discord, PagerDuty, etc.)
  const webhookUrl = process.env.CRON_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[CRON ALERT] *${opts.jobName}* failed (${opts.status})`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: [
                `*Cron Job Failed:* \`${opts.jobName}\``,
                `*Status:* ${opts.status}`,
                `*Duration:* ${opts.duration}ms`,
                `*Started:* ${opts.startedAt.toISOString()}`,
                opts.error ? `*Error:* \`\`\`${opts.error.slice(0, 500)}\`\`\`` : "",
              ]
                .filter(Boolean)
                .join("\n"),
            },
          },
        ],
      }),
    }).catch(() => {}); // Fire and forget
  } catch {
    // Don't let notification failures break anything
  }
}
