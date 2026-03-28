import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/imaging-packages/[id]
 * Get a single imaging package with its elements.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const pkg = await prisma.imagingPackage.findUnique({
    where: { id },
    include: {
      elements: {
        orderBy: [{ elementType: "asc" }, { variationNum: "asc" }],
      },
    },
  });

  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  // Group elements by type for easier consumption
  const elementsByType: Record<string, typeof pkg.elements> = {};
  for (const el of pkg.elements) {
    if (!elementsByType[el.elementType]) elementsByType[el.elementType] = [];
    elementsByType[el.elementType].push(el);
  }

  return NextResponse.json({
    package: pkg,
    elementsByType,
    stats: {
      total: pkg.totalElements,
      generated: pkg.generatedCount,
      failed: pkg.failedCount,
      pending: pkg.elements.filter((e) => e.status === "pending").length,
      scriptReady: pkg.elements.filter((e) => e.status === "script_ready").length,
      audioReady: pkg.elements.filter((e) => e.status === "audio_ready").length,
    },
  });
}
