import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, optionalAuth, getOrgScope } from "@/lib/api/auth";
import { handleApiError, unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await optionalAuth();
    const orgScope = session ? getOrgScope(session) : {};
    const stationId = request.nextUrl.searchParams.get("stationId");
    const activeOnly = request.nextUrl.searchParams.get("active") !== "false";

    const where: any = {
      ...(stationId && { stationId }),
      ...(activeOnly && {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      }),
      ...(orgScope.organizationId && { station: { organizationId: orgScope.organizationId } }),
    };

    const announcements = await prisma.townAnnouncement.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    return handleApiError(error, "/api/community/announcements");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const { stationId, title, content, priority, category, expiresAt, readOnAir } = body;

    if (!stationId || !title || !content) {
      return NextResponse.json({ error: "stationId, title, and content are required" }, { status: 400 });
    }

    const announcement = await prisma.townAnnouncement.create({
      data: {
        stationId,
        title,
        content,
        priority: priority || "normal",
        category: category || "general",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        readOnAir: readOnAir !== false,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/community/announcements");
  }
}
