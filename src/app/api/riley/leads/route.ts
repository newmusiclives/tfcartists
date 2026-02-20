import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

// GET /api/riley/leads - Get all leads (artists in discovery pipeline)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    const where: any = { deletedAt: null };

    // Filter by status (mapped to ArtistStatus)
    if (status && status !== "all") {
      const statusMap: Record<string, string> = {
        new: "DISCOVERED",
        contacted: "CONTACTED",
        engaged: "ENGAGED",
        qualified: "QUALIFIED",
        onboarding: "ONBOARDING",
        activated: "ACTIVATED",
        active: "ACTIVE",
      };
      where.status = statusMap[status] || status.toUpperCase();
    }

    // Filter by source
    if (source && source !== "all") {
      where.discoverySource = source;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { genre: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const artists = await prisma.artist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        genre: true,
        email: true,
        phone: true,
        discoverySource: true,
        sourceHandle: true,
        sourceUrl: true,
        followerCount: true,
        status: true,
        pipelineStage: true,
        lastContactedAt: true,
        nextFollowUpAt: true,
        nextShowVenue: true,
        nextShowCity: true,
        nextShowDate: true,
        conversationCount: true,
        airplayTier: true,
        createdAt: true,
        updatedAt: true,
        metadata: true,
      },
    });

    // Map to lead format for frontend compatibility
    const leads = artists.map((a) => ({
      id: a.id,
      name: a.name,
      genre: a.genre || "",
      location: a.nextShowCity || "",
      source: a.discoverySource,
      socialHandle: a.sourceHandle,
      email: a.email,
      phone: a.phone,
      website: a.sourceUrl,
      followers: a.followerCount,
      lastShow: a.nextShowVenue
        ? `${a.nextShowVenue}${a.nextShowDate ? ` - ${new Date(a.nextShowDate).toLocaleDateString()}` : ""}`
        : null,
      status: a.pipelineStage,
      firstContact: a.lastContactedAt?.toISOString() || null,
      lastContact: a.lastContactedAt?.toISOString() || null,
      nextFollowUp: a.nextFollowUpAt?.toISOString() || null,
      notes: typeof a.metadata === "object" && a.metadata !== null ? (a.metadata as any).notes || "" : "",
      airplayTier: a.airplayTier,
      conversationCount: a.conversationCount,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: leads,
      count: leads.length,
    });
  } catch (error) {
    return handleApiError(error, "/api/riley/leads");
  }
}

// POST /api/riley/leads - Create new lead (artist)
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const body = await request.json();

    if (!body.name || !body.source) {
      return NextResponse.json(
        { success: false, error: "Name and source are required" },
        { status: 400 }
      );
    }

    const artist = await prisma.artist.create({
      data: {
        name: body.name,
        genre: body.genre || null,
        email: body.email || null,
        phone: body.phone || null,
        discoverySource: body.source,
        sourceHandle: body.socialHandle || null,
        sourceUrl: body.website || null,
        followerCount: body.followers || null,
        nextShowVenue: body.lastShow || null,
        nextShowCity: body.location || null,
        status: "DISCOVERED",
        pipelineStage: "discovery",
        metadata: body.notes ? { notes: body.notes } : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: artist.id,
        name: artist.name,
        genre: artist.genre,
        source: artist.discoverySource,
        status: artist.pipelineStage,
        createdAt: artist.createdAt.toISOString(),
      },
      message: "Lead created successfully",
    });
  } catch (error) {
    return handleApiError(error, "/api/riley/leads");
  }
}

// PUT /api/riley/leads - Update lead
export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Lead ID is required" },
        { status: 400 }
      );
    }

    const statusMap: Record<string, { status: string; pipelineStage: string }> = {
      new: { status: "DISCOVERED", pipelineStage: "discovery" },
      contacted: { status: "CONTACTED", pipelineStage: "contacted" },
      engaged: { status: "ENGAGED", pipelineStage: "engaged" },
      qualified: { status: "QUALIFIED", pipelineStage: "qualified" },
      onboarding: { status: "ONBOARDING", pipelineStage: "onboarding" },
      activated: { status: "ACTIVATED", pipelineStage: "activated" },
    };

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.genre) updateData.genre = body.genre;
    if (body.email) updateData.email = body.email;
    if (body.phone) updateData.phone = body.phone;
    if (body.source) updateData.discoverySource = body.source;
    if (body.socialHandle) updateData.sourceHandle = body.socialHandle;
    if (body.website) updateData.sourceUrl = body.website;
    if (body.followers !== undefined) updateData.followerCount = body.followers;
    if (body.location) updateData.nextShowCity = body.location;
    if (body.status && statusMap[body.status]) {
      updateData.status = statusMap[body.status].status;
      updateData.pipelineStage = statusMap[body.status].pipelineStage;
    }
    if (body.notes) {
      updateData.metadata = { notes: body.notes };
    }

    const artist = await prisma.artist.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { id: artist.id, name: artist.name },
      message: "Lead updated successfully",
    });
  } catch (error) {
    return handleApiError(error, "/api/riley/leads");
  }
}

// DELETE /api/riley/leads - Soft delete lead
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireRole("riley");
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Lead ID is required" },
        { status: 400 }
      );
    }

    await prisma.artist.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    return handleApiError(error, "/api/riley/leads");
  }
}
