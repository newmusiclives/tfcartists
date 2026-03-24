import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { logCronExecution } from "@/lib/cron/log";
import { runDataCleanup } from "@/lib/cron/cleanup";
import { withCronLock } from "@/lib/cron/lock";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronLock("maintenance", async () => {
    const start = Date.now();
    const startedAt = new Date();

    try {
      const results = await runDataCleanup();

      await logCronExecution({
        jobName: "maintenance",
        status: "success",
        duration: Date.now() - start,
        summary: results as Record<string, unknown>,
        startedAt,
      });

      return NextResponse.json({ success: true, ...results });
    } catch (error) {
      await logCronExecution({
        jobName: "maintenance",
        status: "error",
        duration: Date.now() - start,
        error: String(error),
        startedAt,
      });
      return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
  });
}
