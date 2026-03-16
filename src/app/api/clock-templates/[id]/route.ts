import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const template = await prisma.clockTemplate.findUnique({ where: { id } });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        clock_pattern: template.clockPattern ? JSON.parse(typeof template.clockPattern === "string" ? template.clockPattern : JSON.stringify(template.clockPattern)) : [],
        is_active: template.isActive,
        clock_type: template.clockType || "general",
        tempo: template.tempo,
        programming_notes: template.description,
        hits_per_hour: template.hitsPerHour || 0,
        gender_balance_target: template.genderBalanceTarget || 0.5,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clock template" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();
    const { id } = await params;
    const body = await request.json();

    const template = await prisma.clockTemplate.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || body.programming_notes,
        clockPattern: body.clock_pattern ? JSON.stringify(body.clock_pattern) : undefined,
        isActive: body.is_active,
        clockType: body.clock_type,
        tempo: body.tempo,
        hitsPerHour: body.hits_per_hour,
        genderBalanceTarget: body.gender_balance_target,
      },
    });

    return NextResponse.json({ id: template.id, message: "Updated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update clock template" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.clock_pattern !== undefined) data.clockPattern = JSON.stringify(body.clock_pattern);
    if (body.is_active !== undefined) data.isActive = body.is_active;
    if (body.clock_type !== undefined) data.clockType = body.clock_type;
    if (body.tempo !== undefined) data.tempo = body.tempo;

    const template = await prisma.clockTemplate.update({ where: { id }, data });
    return NextResponse.json({ id: template.id, message: "Updated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update clock template" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();
    const { id } = await params;

    await prisma.clockTemplate.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete clock template" }, { status: 500 });
  }
}
