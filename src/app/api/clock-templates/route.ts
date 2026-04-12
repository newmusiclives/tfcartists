import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { optionalAuth, requireAuth } from "@/lib/api/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await optionalAuth();
    const station = await prisma.station.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!station) {
      return NextResponse.json([]);
    }

    const templates = await prisma.clockTemplate.findMany({
      where: { stationId: station.id },
      orderBy: { name: "asc" },
    });

    // Count how many assignments use each template
    const assignmentCounts = await prisma.clockAssignment.groupBy({
      by: ["clockTemplateId"],
      where: { stationId: station.id, isActive: true },
      _count: true,
    });
    const countMap = new Map(assignmentCounts.map((a) => [a.clockTemplateId, a._count]));

    const result = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      clock_pattern: t.clockPattern ? JSON.parse(typeof t.clockPattern === "string" ? t.clockPattern : JSON.stringify(t.clockPattern)) : [],
      is_active: t.isActive,
      usage_count: countMap.get(t.id) || 0,
      clock_type: t.clockType || "general",
      tempo: t.tempo,
      programming_notes: t.description || null,
      created_at: t.createdAt?.toISOString() || null,
      hits_per_hour: t.hitsPerHour || 0,
      gender_balance_target: t.genderBalanceTarget || 0.5,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "/api/clock-templates");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();
    const body = await request.json();

    const station = await prisma.station.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!station) {
      return NextResponse.json({ error: "No active station" }, { status: 404 });
    }

    const template = await prisma.clockTemplate.create({
      data: {
        stationId: body.stationId || station.id,
        name: body.name,
        description: body.description || body.programming_notes || null,
        clockPattern: JSON.stringify(body.clock_pattern || []),
        isActive: body.is_active ?? true,
        clockType: body.clock_type || "general",
        tempo: body.tempo || null,
        hitsPerHour: body.hits_per_hour || 0,
        genderBalanceTarget: body.gender_balance_target || 0.5,
      },
    });

    return NextResponse.json({
      id: template.id,
      name: template.name,
      message: "Template created",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create clock template" }, { status: 500 });
  }
}
