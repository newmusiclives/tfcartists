import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

// GET feature types + content stats (no auth — matches /api/stations pattern)
export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");

    // Feature types (always returned)
    const featureTypes = await prisma.featureType.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Content stats per DJ if stationId provided
    let contentStats: Record<string, { total: number; available: number }> = {};
    if (stationId) {
      const content = await prisma.featureContent.groupBy({
        by: ["djPersonalityId", "isUsed"],
        where: { stationId },
        _count: true,
      });
      for (const row of content) {
        const djId = row.djPersonalityId || "unassigned";
        if (!contentStats[djId]) contentStats[djId] = { total: 0, available: 0 };
        contentStats[djId].total += row._count;
        if (!row.isUsed) contentStats[djId].available += row._count;
      }
    }

    return NextResponse.json({ featureTypes, contentStats });
  } catch (error) {
    return handleApiError(error, "/api/show-features");
  }
}

// POST — generate content (or create feature type)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const { action } = body;

    if (action === "seed-types") {
      // Bulk upsert feature types
      const { types } = body;
      let count = 0;
      for (const t of types) {
        await prisma.featureType.upsert({
          where: { id: t.id },
          update: { name: t.name, description: t.description, category: t.category, trackPlacement: t.trackPlacement, gptPromptTemplate: t.gptPromptTemplate, suggestedDuration: t.suggestedDuration, includesPoll: t.includesPoll, includesCallIn: t.includesCallIn, socialMediaFriendly: t.socialMediaFriendly },
          create: t,
        });
        count++;
      }
      return NextResponse.json({ seeded: count });
    }

    if (action === "generate") {
      // Create feature content
      const { stationId, featureTypeId, djPersonalityId, title, content, contextData } = body;
      if (!stationId || !featureTypeId || !content) {
        return NextResponse.json({ error: "stationId, featureTypeId, and content required" }, { status: 400 });
      }
      const fc = await prisma.featureContent.create({
        data: {
          stationId,
          featureTypeId,
          djPersonalityId,
          title,
          content,
          contextData: contextData ? JSON.stringify(contextData) : null,
          generatedBy: "manual",
        },
      });
      return NextResponse.json({ featureContent: fc }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return handleApiError(error, "/api/show-features");
  }
}
