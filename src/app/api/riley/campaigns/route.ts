import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// GET /api/riley/campaigns - Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: Record<string, string> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const campaigns = await prisma.rileyCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
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

    const campaign = await prisma.rileyCampaign.create({
      data: {
        name: body.name,
        description: body.description || "",
        type: body.type,
        status: "draft",
      },
    });

    return NextResponse.json({
      success: true,
      data: campaign,
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

    const existing = await prisma.rileyCampaign.findUnique({
      where: { id: body.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    const { id, ...updateFields } = body;
    const campaign = await prisma.rileyCampaign.update({
      where: { id },
      data: updateFields,
    });

    return NextResponse.json({
      success: true,
      data: campaign,
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

    const existing = await prisma.rileyCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    await prisma.rileyCampaign.delete({ where: { id } });

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
