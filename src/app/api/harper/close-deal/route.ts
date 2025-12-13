import { NextRequest, NextResponse } from "next/server";
import { HarperAgent } from "@/lib/ai/harper-agent";
import { logger } from "@/lib/logger";

/**
 * POST /api/harper/close-deal
 * Close a sponsorship deal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sponsorId, tier, monthlyAmount, startDate } = body;

    if (!sponsorId || !tier || !monthlyAmount) {
      return NextResponse.json(
        { error: "sponsorId, tier, and monthlyAmount are required" },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
    if (!validTiers.includes(tier.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${validTiers.join(", ")}` },
        { status: 400 }
      );
    }

    const harperAgent = new HarperAgent();

    const result = await harperAgent.closeDeal(
      sponsorId,
      tier.toUpperCase() as any,
      monthlyAmount,
      startDate ? new Date(startDate) : undefined
    );

    logger.info("Harper deal closed", { sponsorId, tier, monthlyAmount });

    return NextResponse.json({
      success: true,
      message: "Deal closed successfully",
      sponsorship: result.sponsorship,
      paymentLink: result.paymentLink, // Will be null until Manifest Financial is integrated
      note: result.paymentLink
        ? "Payment link generated"
        : "Payment integration pending - Manifest Financial not configured",
    });
  } catch (error: any) {
    logger.error("Failed to close Harper deal", { error: error.message });
    return NextResponse.json(
      { error: "Failed to close deal", details: error.message },
      { status: 500 }
    );
  }
}
