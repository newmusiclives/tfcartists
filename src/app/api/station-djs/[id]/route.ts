import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole, pickFields } from "@/lib/api/auth";

const ALLOWED_FIELDS = [
  "name", "slug", "bio", "background", "catchPhrases", "gptSystemPrompt",
  "additionalKnowledge", "gptTemperature", "ttsProvider", "ttsVoice",
  "voiceProfileId", "photoUrl", "priority", "isActive",
];

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
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const dj = await prisma.dJ.update({ where: { id }, data: pickFields(body, ALLOWED_FIELDS) });
    return NextResponse.json({ dj });
  } catch (error) {
    return handleApiError(error, "/api/station-djs/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const { id } = await params;
    await prisma.dJ.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/station-djs/[id]");
  }
}
