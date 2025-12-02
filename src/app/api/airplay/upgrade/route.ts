import { NextRequest, NextResponse } from "next/server";
import { upgradeAirplayTier, AirplayTier } from "@/lib/radio/airplay-system";

/**
 * POST /api/airplay/upgrade
 * Upgrade an artist's airplay tier
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, tier, paymentDetails } = body;

    if (!artistId || !tier) {
      return NextResponse.json(
        { error: "Missing required fields: artistId, tier" },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers: AirplayTier[] = ["FREE", "TIER_5", "TIER_20", "TIER_50", "TIER_120"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    await upgradeAirplayTier(artistId, tier, paymentDetails);

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${tier}`,
    });
  } catch (error) {
    console.error("Error upgrading airplay tier:", error);
    return NextResponse.json(
      { error: "Failed to upgrade tier" },
      { status: 500 }
    );
  }
}
