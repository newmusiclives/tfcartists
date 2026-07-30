import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { flagStates, setFlag, isFlagKey, type FlagKey } from "@/lib/flags";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "admin") {
    return null;
  }
  return session;
}

/** GET /api/admin/flags?stationId=... - every flag with its resolved value and source */
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden - admin only" }, { status: 403 });
  }

  const stationId = request.nextUrl.searchParams.get("stationId");

  try {
    const states = await flagStates(stationId);
    return NextResponse.json({ stationId: stationId ?? null, flags: states });
  } catch (error) {
    logger.error("Failed to read flags", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to read flags" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/flags
 * Body: { key: string, value: boolean | null, stationId?: string }
 * value=null clears the override and falls back to the next level down.
 */
export async function PUT(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden - admin only" }, { status: 403 });
  }

  let body: { key?: string; value?: boolean | null; stationId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { key, value, stationId } = body;

  if (!key || !isFlagKey(key)) {
    return NextResponse.json(
      { error: `Unknown flag: ${key ?? "(missing)"}` },
      { status: 400 }
    );
  }
  if (value !== null && typeof value !== "boolean") {
    return NextResponse.json(
      { error: "value must be true, false, or null to clear" },
      { status: 400 }
    );
  }

  try {
    await setFlag(key as FlagKey, value ?? null, {
      stationId: stationId ?? null,
      actor: session.user?.email ?? session.user?.name ?? "admin",
    });
    const states = await flagStates(stationId ?? null);
    return NextResponse.json({
      ok: true,
      flag: states.find((f) => f.key === key),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to set flag", { flag: key, error: message });
    // A scope violation is the caller's mistake, not a server fault
    const clientError = message.includes("cannot be set per station");
    return NextResponse.json(
      { error: clientError ? message : "Failed to set flag" },
      { status: clientError ? 400 : 500 }
    );
  }
}
