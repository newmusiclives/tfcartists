import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireRole } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";
import { orgWhere } from "@/lib/db-scoped";

export const dynamic = "force-dynamic";

// GET /api/riley/communications - Get all communications
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");

    const where: Record<string, string> = {};
    if (leadId) where.artistId = leadId;

    const communications = await prisma.rileyCommunication.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: communications,
      count: communications.length,
    });
  } catch (error) {
    logger.error("Error fetching communications", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch communications" },
      { status: 500 }
    );
  }
}

// POST /api/riley/communications - Log new communication
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const body = await request.json();

    // Validate required fields
    if (!body.leadId || !body.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const communication = await prisma.rileyCommunication.create({
      data: {
        artistId: body.leadId,
        type: body.type,
        subject: body.subject,
        content: body.content,
        status: body.status || "sent",
        sentAt: new Date(),
        openedAt: body.openedAt ? new Date(body.openedAt) : null,
        respondedAt: body.respondedAt ? new Date(body.respondedAt) : null,
        campaignId: body.campaignId || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: communication,
      message: "Communication logged successfully",
    });
  } catch (error) {
    logger.error("Error logging communication", { error });
    return NextResponse.json(
      { success: false, error: "Failed to log communication" },
      { status: 500 }
    );
  }
}

// PUT /api/riley/communications - Update communication status
export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Communication ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.rileyCommunication.findUnique({
      where: { id: body.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Communication not found" },
        { status: 404 }
      );
    }

    const { id, ...updateFields } = body;
    const communication = await prisma.rileyCommunication.update({
      where: { id },
      data: updateFields,
    });

    return NextResponse.json({
      success: true,
      data: communication,
      message: "Communication updated successfully",
    });
  } catch (error) {
    logger.error("Error updating communication", { error });
    return NextResponse.json(
      { success: false, error: "Failed to update communication" },
      { status: 500 }
    );
  }
}
