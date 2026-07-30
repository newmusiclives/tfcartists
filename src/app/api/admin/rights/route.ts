import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import {
  rightsSummary,
  clearSong,
  retireSong,
  isRightsStatus,
  CLEARED_STATUSES,
  type RightsStatus,
} from "@/lib/rights";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "admin") return null;
  return session;
}

/** GET /api/admin/rights?stationId=... — catalogue rights position */
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden - admin only" }, { status: 403 });
  }

  const stationId = request.nextUrl.searchParams.get("stationId");

  try {
    return NextResponse.json(await rightsSummary(stationId));
  } catch (error) {
    logger.error("Failed to build rights summary", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to build rights summary" }, { status: 500 });
  }
}

/**
 * POST /api/admin/rights
 * Body: { action: "clear", songId, status, evidence, notes? }
 *     | { action: "retire", songId, reason }
 */
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden - admin only" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const actor = session.user?.email ?? session.user?.name ?? "admin";
  const action = body.action;
  const songId = typeof body.songId === "string" ? body.songId : "";

  if (!songId) {
    return NextResponse.json({ error: "songId is required" }, { status: 400 });
  }

  try {
    if (action === "clear") {
      const status = String(body.status ?? "");
      const evidence = String(body.evidence ?? "");

      if (!isRightsStatus(status) || !CLEARED_STATUSES.includes(status as RightsStatus)) {
        return NextResponse.json(
          { error: `status must be one of: ${CLEARED_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      if (!evidence.trim()) {
        return NextResponse.json(
          {
            error:
              "Evidence is required. Without it the rights position is an assertion, not a record.",
          },
          { status: 400 }
        );
      }

      await clearSong({
        songId,
        status: status as RightsStatus,
        evidence,
        actor,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      });
      return NextResponse.json({ ok: true, songId, status });
    }

    if (action === "retire") {
      const reason = String(body.reason ?? "").trim();
      if (!reason) {
        return NextResponse.json({ error: "reason is required to retire a song" }, { status: 400 });
      }
      await retireSong({ songId, reason, actor });
      return NextResponse.json({ ok: true, songId, retired: true });
    }

    return NextResponse.json({ error: 'action must be "clear" or "retire"' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Rights update failed", { songId, action, error: message });
    // Validation failures from the rights module are the caller's problem
    const clientError = /required|not a cleared status/i.test(message);
    return NextResponse.json(
      { error: clientError ? message : "Rights update failed" },
      { status: clientError ? 400 : 500 }
    );
  }
}
