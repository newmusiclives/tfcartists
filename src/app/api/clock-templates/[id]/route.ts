import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAuth, requireRole, pickFields } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = [
  "name", "description", "clockType", "tempo", "energyLevel",
  "hitsPerHour", "indiePerHour", "genderBalanceTarget", "isActive",
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const { id } = await params;
    const template = await prisma.clockTemplate.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { dj: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
    if (!template) return NextResponse.json({ error: "Clock template not found" }, { status: 404 });
    return NextResponse.json({ template });
  } catch (error) {
    return handleApiError(error, "/api/clock-templates/[id]");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const template = await prisma.clockTemplate.update({ where: { id }, data: pickFields(body, ALLOWED_FIELDS) });
    return NextResponse.json({ template });
  } catch (error) {
    return handleApiError(error, "/api/clock-templates/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const { id } = await params;
    await prisma.clockTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/clock-templates/[id]");
  }
}
