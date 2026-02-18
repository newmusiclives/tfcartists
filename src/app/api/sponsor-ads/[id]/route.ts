import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const ad = await prisma.sponsorAd.update({
      where: { id },
      data: {
        ...(body.sponsorName !== undefined && { sponsorName: body.sponsorName }),
        ...(body.adTitle !== undefined && { adTitle: body.adTitle }),
        ...(body.scriptText !== undefined && { scriptText: body.scriptText }),
        ...(body.musicBedId !== undefined && { musicBedId: body.musicBedId || null }),
        ...(body.audioFilePath !== undefined && { audioFilePath: body.audioFilePath }),
        ...(body.durationSeconds !== undefined && { durationSeconds: body.durationSeconds }),
        ...(body.tier !== undefined && { tier: body.tier }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: { musicBed: true },
    });

    return NextResponse.json({ ad });
  } catch (error) {
    return handleApiError(error, "/api/sponsor-ads/[id]");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.sponsorAd.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/sponsor-ads/[id]");
  }
}

// POST /api/sponsor-ads/[id] with body { action: "played" }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.action === "played") {
      const ad = await prisma.sponsorAd.update({
        where: { id },
        data: {
          playCount: { increment: 1 },
          lastPlayedAt: new Date(),
        },
      });
      return NextResponse.json({ ad });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return handleApiError(error, "/api/sponsor-ads/[id]");
  }
}
