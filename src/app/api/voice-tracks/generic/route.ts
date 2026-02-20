import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/** GET /api/voice-tracks/generic?djId=xxx — list generic voice tracks for a DJ */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const djId = request.nextUrl.searchParams.get("djId");
    if (!djId) {
      return NextResponse.json({ error: "djId is required" }, { status: 400 });
    }

    const tracks = await prisma.genericVoiceTrack.findMany({
      where: { djId },
      orderBy: [{ isActive: "desc" }, { useCount: "asc" }, { createdAt: "desc" }],
    });

    const active = tracks.filter((t) => t.isActive).length;

    return NextResponse.json({
      tracks,
      total: tracks.length,
      active,
    });
  } catch (error) {
    return handleApiError(error, "/api/voice-tracks/generic");
  }
}
