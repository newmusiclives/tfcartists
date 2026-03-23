import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

/**
 * Expected cron jobs and their max allowed gap (in hours).
 * If a job hasn't run within this window, it's considered stale.
 */
const EXPECTED_JOBS: Record<string, number> = {
  "voice-tracks-hour": 2,
  "voice-tracks-daily": 26,
  "voice-tracks-catchup": 26,
  "riley-daily": 26,
  "harper-daily": 26,
  "cassidy-daily": 26,
  "elliot-daily": 26,
  "parker-daily": 26,
  "features-daily": 26,
  "newsletter-weekly": 170, // ~7 days
  "revenue-monthly": 770, // ~32 days
  "promoter-payouts": 770,
};

/**
 * GET /api/admin/cron-health
 *
 * Returns the last run status of each expected cron job.
 * Flags jobs that are overdue or have recent failures.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const jobNames = Object.keys(EXPECTED_JOBS);

  // Get the most recent log for each job
  const latestLogs = await prisma.cronLog.findMany({
    where: { jobName: { in: jobNames } },
    orderBy: { createdAt: "desc" },
    distinct: ["jobName"],
  });

  const now = Date.now();
  const jobs = jobNames.map((name) => {
    const log = latestLogs.find((l) => l.jobName === name);
    const maxGapMs = EXPECTED_JOBS[name] * 60 * 60 * 1000;

    if (!log) {
      return { name, status: "never_run" as const, lastRun: null, overdue: true };
    }

    const lastRunAt = new Date(log.createdAt).getTime();
    const overdue = now - lastRunAt > maxGapMs;

    return {
      name,
      status: log.status as string,
      lastRun: log.createdAt,
      duration: log.duration,
      overdue,
      error: log.error || undefined,
    };
  });

  const healthy = jobs.every((j) => !j.overdue && j.status === "success");

  return NextResponse.json({
    healthy,
    checkedAt: new Date().toISOString(),
    jobs,
  });
}
