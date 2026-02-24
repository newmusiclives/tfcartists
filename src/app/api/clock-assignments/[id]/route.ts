import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole, pickFields } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = [
  "djId", "clockTemplateId", "dayType", "timeSlotStart", "timeSlotEnd",
  "priority", "isActive",
];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const assignment = await prisma.clockAssignment.update({
      where: { id },
      data: pickFields(body, ALLOWED_FIELDS),
    });
    return NextResponse.json({ assignment });
  } catch (error) {
    return handleApiError(error, "/api/clock-assignments/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const { id } = await params;
    await prisma.clockAssignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/clock-assignments/[id]");
  }
}
