import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// In production, these would come from database
let campaigns = [
  {
    id: 1,
    name: "Initial Artist Outreach",
    description: "Introduce TrueFans RADIO and FREE airplay opportunity",
    type: "initial",
    status: "active",
    stats: {
      sent: 23,
      opened: 18,
      responded: 12,
      converted: 8,
    },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Track Submission Invitation",
    description: "Follow-up with artists who showed interest",
    type: "invitation",
    status: "active",
    stats: {
      sent: 12,
      opened: 10,
      responded: 8,
      converted: 6,
    },
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Tier Upgrade Campaign",
    description: "Invite FREE artists to upgrade to paid tiers",
    type: "upgrade",
    status: "active",
    stats: {
      sent: 15,
      opened: 11,
      responded: 5,
      converted: 3,
    },
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "Re-engagement Campaign",
    description: "Reconnect with artists who haven't responded",
    type: "reengagement",
    status: "active",
    stats: {
      sent: 8,
      opened: 4,
      responded: 2,
      converted: 1,
    },
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/riley/campaigns - Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    let filteredCampaigns = [...campaigns];

    // Filter by type
    if (type) {
      filteredCampaigns = filteredCampaigns.filter(
        (campaign) => campaign.type === type
      );
    }

    // Filter by status
    if (status) {
      filteredCampaigns = filteredCampaigns.filter(
        (campaign) => campaign.status === status
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredCampaigns,
      count: filteredCampaigns.length,
    });
  } catch (error) {
    logger.error("Error fetching campaigns", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/riley/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new campaign
    const newCampaign = {
      id: campaigns.length + 1,
      name: body.name,
      description: body.description || "",
      type: body.type,
      status: "draft",
      stats: {
        sent: 0,
        opened: 0,
        responded: 0,
        converted: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    campaigns.push(newCampaign);

    return NextResponse.json({
      success: true,
      data: newCampaign,
      message: "Campaign created successfully",
    });
  } catch (error) {
    logger.error("Error creating campaign", { error });
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

// PUT /api/riley/campaigns - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const campaignIndex = campaigns.findIndex(
      (campaign) => campaign.id === body.id
    );

    if (campaignIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Update campaign
    campaigns[campaignIndex] = {
      ...campaigns[campaignIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: campaigns[campaignIndex],
      message: "Campaign updated successfully",
    });
  } catch (error) {
    logger.error("Error updating campaign", { error });
    return NextResponse.json(
      { success: false, error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE /api/riley/campaigns - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const campaignIndex = campaigns.findIndex(
      (campaign) => campaign.id === parseInt(id)
    );

    if (campaignIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    campaigns.splice(campaignIndex, 1);

    return NextResponse.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting campaign", { error });
    return NextResponse.json(
      { success: false, error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
