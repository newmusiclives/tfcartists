import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cron-logs
 *
 * Returns recent cron job execution logs.
 * Query params: ?limit=50&jobName=parker-daily&status=error
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const jobName = url.searchParams.get("jobName") || undefined;
  const status = url.searchParams.get("status") || undefined;

  const where: Record<string, string> = {};
  if (jobName) where.jobName = jobName;
  if (status) where.status = status;

  const [logs, total] = await Promise.all([
    prisma.cronLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.cronLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total });
}
