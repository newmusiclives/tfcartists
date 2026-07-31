import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logCronExecution } from "@/lib/cron/log";
import { withCronLock } from "@/lib/cron/lock";
import { syncPlays } from "@/lib/plays/sync";

export const dynamic = "force-dynamic";

/**
 * Pull recent plays from the playout engine into TrackPlayback.
 *
 * Runs often because everything downstream - analytics, royalty reporting, the
 * fairness protocol - is only as current as this table, and before this existed
 * the platform's most recent playback was over a day old.
 *
 * The sync is idempotent, so overlapping or repeated runs are harmless; the
 * lock is here to avoid pointless duplicate fetching, not for correctness.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronLock("sync-plays", async () => {
    const start = Date.now();
    const startedAt = new Date();

    try {
      // ?all=1 forces a full backfill rather than an incremental pull.
      const all = req.nextUrl.searchParams.get("all") === "1";
      const result = await syncPlays({ commit: true, all });

      await logCronExecution({
        jobName: "sync-plays",
        status: "success",
        duration: Date.now() - start,
        summary: {
          fetched: result.fetched,
          inserted: result.inserted,
          alreadyHeld: result.alreadyHeld,
          unmappedDjs: result.unmappedDjs,
          latestAfter: result.latestAfter?.toISOString() ?? null,
        },
        startedAt,
      });

      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      await logCronExecution({
        jobName: "sync-plays",
        status: "error",
        duration: Date.now() - start,
        error: String(error),
        startedAt,
      });
      return NextResponse.json({ error: "Play sync failed" }, { status: 500 });
    }
  });
}
