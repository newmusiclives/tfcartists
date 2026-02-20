import { NextRequest, NextResponse } from "next/server";
import { elliot } from "@/lib/ai/elliot-agent";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/elliot/campaigns
 * Launch a new growth campaign
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("elliot");
    if (!session) return unauthorized();

    const body = await req.json();
    const { name, type, targetAudience, goalType, goalTarget } = body;

    // Validate input
    if (!name || !type || !targetAudience || !goalType || !goalTarget) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, type, targetAudience, goalType, goalTarget",
        },
        { status: 400 }
      );
    }

    // Launch campaign
    const campaignId = await elliot.launchCampaign({
      name,
      type,
      targetAudience,
      goalType,
      goalTarget,
    });

    logger.info("Campaign launched via API", { campaignId, name });

    return NextResponse.json({
      success: true,
      campaignId,
      message: "Campaign launched successfully",
    });
  } catch (error) {
    logger.error("Campaign launch API error", { error });

    return NextResponse.json(
      {
        error: "Failed to launch campaign",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/elliot/campaigns
 * List active campaigns and their performance
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole("elliot");
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";

    const campaigns = await prisma.growthCampaign.findMany({
      where: status !== "all" ? { status } : undefined,
      include: {
        responses: {
          select: {
            action: true,
            converted: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calculate performance metrics
    const campaignsWithMetrics = campaigns.map((campaign) => ({
      ...campaign,
      metrics: {
        totalResponses: campaign.responses.length,
        conversions: campaign.responses.filter((r) => r.converted).length,
        conversionRate:
          campaign.responses.length > 0
            ? (campaign.responses.filter((r) => r.converted).length /
                campaign.responses.length) *
              100
            : 0,
        progress: (campaign.goalReached / campaign.goalTarget) * 100,
      },
    }));

    return NextResponse.json({
      success: true,
      campaigns: campaignsWithMetrics,
      count: campaigns.length,
    });
  } catch (error) {
    logger.error("Failed to fetch campaigns", { error });

    return NextResponse.json(
      {
        error: "Failed to fetch campaigns",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
