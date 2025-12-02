import { NextRequest, NextResponse } from "next/server";
import { discoveryEngine } from "@/lib/discovery/discovery-engine";

/**
 * POST /api/discovery/run
 * Manually trigger a discovery cycle
 */
export async function POST(request: NextRequest) {
  try {
    const count = await discoveryEngine.runDiscoveryCycle();

    return NextResponse.json({
      success: true,
      artistsDiscovered: count,
    });
  } catch (error) {
    console.error("Error running discovery:", error);
    return NextResponse.json(
      { error: "Failed to run discovery cycle" },
      { status: 500 }
    );
  }
}
