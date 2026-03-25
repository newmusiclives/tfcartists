import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const UPTIME_KEY = "stream_uptime_stats";

/**
 * GET /api/monitoring/stream/uptime
 *
 * Returns extended uptime statistics (7d, 30d) stored by the cron job.
 */
export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: UPTIME_KEY },
    });

    if (!config?.value) {
      return NextResponse.json({
        totalChecks: 0,
        onlineChecks: 0,
        firstCheck: null,
        lastCheck: null,
        checks7d: [],
        checks30d: [],
      });
    }

    return NextResponse.json(JSON.parse(config.value));
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch uptime stats" },
      { status: 500 }
    );
  }
}
