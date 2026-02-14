import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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
    const { id } = await params;
    const body = await request.json();
    const template = await prisma.clockTemplate.update({ where: { id }, data: body });
    return NextResponse.json({ template });
  } catch (error) {
    return handleApiError(error, "/api/clock-templates/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.clockTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/clock-templates/[id]");
  }
}
