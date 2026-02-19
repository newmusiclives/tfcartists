import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/** PATCH /api/voice-tracks/generic/[id] — toggle isActive */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const track = await prisma.genericVoiceTrack.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({ track });
  } catch (error) {
    return handleApiError(error, "/api/voice-tracks/generic/[id]");
  }
}

/** DELETE /api/voice-tracks/generic/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.genericVoiceTrack.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/voice-tracks/generic/[id]");
  }
}
