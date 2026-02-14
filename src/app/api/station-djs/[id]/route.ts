import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dj = await prisma.dJ.findUnique({
      where: { id },
      include: {
        shows: true,
        clockAssignments: {
          include: { clockTemplate: { select: { id: true, name: true, clockType: true } } },
        },
      },
    });
    if (!dj) return NextResponse.json({ error: "DJ not found" }, { status: 404 });
    return NextResponse.json({ dj });
  } catch (error) {
    return handleApiError(error, "/api/station-djs/[id]");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const dj = await prisma.dJ.update({ where: { id }, data: body });
    return NextResponse.json({ dj });
  } catch (error) {
    return handleApiError(error, "/api/station-djs/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.dJ.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/station-djs/[id]");
  }
}
