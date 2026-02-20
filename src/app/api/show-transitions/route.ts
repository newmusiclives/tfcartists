import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const stationId = request.nextUrl.searchParams.get("stationId");
    if (!stationId) {
      return NextResponse.json({ error: "stationId required" }, { status: 400 });
    }

    const type = request.nextUrl.searchParams.get("type");

    const where: Record<string, unknown> = { stationId };
    if (type) where.transitionType = type;

    const transitions = await prisma.showTransition.findMany({
      where,
      orderBy: [{ handoffGroupId: "asc" }, { handoffPart: "asc" }, { priority: "desc" }],
    });

    return NextResponse.json({ transitions });
  } catch (error) {
    return handleApiError(error, "/api/show-transitions");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const { stationId, transitionType, name, ...rest } = body;

    if (!stationId || !transitionType || !name) {
      return NextResponse.json(
        { error: "stationId, transitionType, and name are required" },
        { status: 400 }
      );
    }

    const transition = await prisma.showTransition.create({
      data: { stationId, transitionType, name, ...rest },
    });

    return NextResponse.json({ transition }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/show-transitions");
  }
}
