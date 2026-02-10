import { NextRequest, NextResponse } from "next/server";
import { discoveryEngine } from "@/lib/discovery/discovery-engine";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

/**
 * POST /api/discovery/run
 * Manually trigger a discovery cycle
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["riley", "admin"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const count = await discoveryEngine.runDiscoveryCycle();

    return NextResponse.json({
      success: true,
      artistsDiscovered: count,
    });
  } catch (error) {
    logger.error("Error running discovery", { error });
    return NextResponse.json(
      { error: "Failed to run discovery cycle" },
      { status: 500 }
    );
  }
}
