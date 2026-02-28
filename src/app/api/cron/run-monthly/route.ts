import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/run-monthly
 *
 * Runs monthly revenue distribution.
 * Call on the 1st of each month via external cron.
 *
 * Auth: Bearer {CRON_SECRET}
 */
export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const baseUrl = process.env.URL || process.env.NEXTAUTH_URL || "https://truefans-radio.netlify.app";
  const cronSecret = env.CRON_SECRET || "development-secret";

  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/api/cron/revenue-monthly`, {
      method: "GET",
      headers: { Authorization: `Bearer ${cronSecret}` },
    });

    const body = await res.json().catch(() => ({}));

    return NextResponse.json({
      success: res.ok,
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
      result: body,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
      error: String(err).slice(0, 500),
    }, { status: 500 });
  }
}
