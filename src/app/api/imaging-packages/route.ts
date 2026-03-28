import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createImagingPackage } from "@/lib/radio/imaging-package-generator";

export const dynamic = "force-dynamic";

/**
 * GET /api/imaging-packages?stationId=X
 * List imaging packages for a station.
 */
export async function GET(req: NextRequest) {
  const stationId = req.nextUrl.searchParams.get("stationId");
  if (!stationId) {
    return NextResponse.json({ error: "stationId required" }, { status: 400 });
  }

  const packages = await prisma.imagingPackage.findMany({
    where: { stationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { elements: true } },
    },
  });

  return NextResponse.json({ packages });
}

/**
 * POST /api/imaging-packages
 * Create a new imaging package.
 *
 * Body: { stationId, tier, stationName, tagline, genre, djNames, seasonalTheme? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stationId, tier, stationName, tagline, genre, djNames, seasonalTheme } = body;

    if (!stationId || !tier || !stationName || !genre || !djNames?.length) {
      return NextResponse.json(
        { error: "Required: stationId, tier, stationName, genre, djNames" },
        { status: 400 },
      );
    }

    if (!["basic", "pro", "enterprise"].includes(tier)) {
      return NextResponse.json({ error: "tier must be basic, pro, or enterprise" }, { status: 400 });
    }

    const packageId = await createImagingPackage({
      stationId,
      tier,
      stationName,
      tagline: tagline || "",
      genre,
      djNames,
      seasonalTheme,
    });

    return NextResponse.json({ success: true, packageId });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create imaging package", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
