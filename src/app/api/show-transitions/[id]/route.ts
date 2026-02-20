import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const { id } = await params;
    const transition = await prisma.showTransition.findUnique({ where: { id } });
    if (!transition) {
      return NextResponse.json({ error: "Transition not found" }, { status: 404 });
    }
    return NextResponse.json({ transition });
  } catch (error) {
    return handleApiError(error, "/api/show-transitions/[id]");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const { stationId: _s, id: _id, createdAt: _c, updatedAt: _u, ...data } = body;

    const transition = await prisma.showTransition.update({
      where: { id },
      data,
    });

    return NextResponse.json({ transition });
  } catch (error) {
    return handleApiError(error, "/api/show-transitions/[id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const { id } = await params;
    await prisma.showTransition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/show-transitions/[id]");
  }
}
