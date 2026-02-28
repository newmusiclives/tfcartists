import { prisma } from "@/lib/db";

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
