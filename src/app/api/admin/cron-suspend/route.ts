import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { setCronSuspended, getSuspendedJobs } from "@/lib/cron/log";

export const dynamic = "force-dynamic";

/** AI team cron jobs that can be suspended */
const SUSPENDABLE_JOBS = [
  "riley-daily",
  "harper-daily",
  "cassidy-daily",
  "elliot-daily",
  "parker-daily",
  "features-daily",
  "voice-tracks-daily",
  "voice-tracks-hour",
  "newsletter-weekly",
  "promoter-payouts",
  "revenue-monthly",
];

/**
 * GET /api/admin/cron-suspend
 * Returns suspension status for all jobs.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const suspended = await getSuspendedJobs();
  const jobs = SUSPENDABLE_JOBS.map((name) => ({
    name,
    suspended: suspended[name] || false,
  }));

  return NextResponse.json({ jobs });
}

/**
 * POST /api/admin/cron-suspend
 * Toggle suspension for a cron job.
 * Body: { "jobName": "riley-daily", "suspended": true }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { jobName, suspended } = body;

  if (!jobName || typeof suspended !== "boolean") {
    return NextResponse.json(
      { error: "Required: jobName (string) and suspended (boolean)" },
      { status: 400 }
    );
  }

  if (!SUSPENDABLE_JOBS.includes(jobName)) {
    return NextResponse.json(
      { error: `Unknown job: ${jobName}. Valid jobs: ${SUSPENDABLE_JOBS.join(", ")}` },
      { status: 400 }
    );
  }

  await setCronSuspended(jobName, suspended);

  return NextResponse.json({
    success: true,
    jobName,
    suspended,
    message: suspended ? `${jobName} suspended` : `${jobName} resumed`,
  });
}
