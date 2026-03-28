import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/imaging-packages/[id]/deploy
 * Push audio_ready elements into the station's active imaging rotation.
 * Creates ProducedImaging records for each element.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const pkg = await prisma.imagingPackage.findUnique({
    where: { id },
    include: {
      elements: {
        where: { status: "audio_ready", audioFilePath: { not: null } },
      },
    },
  });

  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  if (pkg.elements.length === 0) {
    return NextResponse.json({ error: "No audio elements ready to deploy" }, { status: 400 });
  }

  // Map element types to ProducedImaging types
  const typeMap: Record<string, string> = {
    toh: "id",
    station_id: "id",
    sweeper: "sweeper",
    promo: "promo",
    show_intro: "other",
    show_outro: "other",
    handoff: "other",
    feature_bumper: "other",
  };

  let deployed = 0;

  for (const el of pkg.elements) {
    if (!el.audioFilePath) continue;

    const fileName = `${el.elementType}-${el.variationNum}${el.djName ? `-${el.djName}` : ""}.wav`;

    // Create or update ProducedImaging record
    await prisma.producedImaging.create({
      data: {
        stationId: pkg.stationId,
        name: el.label || `${el.elementType} #${el.variationNum}`,
        fileName,
        filePath: el.audioFilePath,
        category: typeMap[el.elementType] || "sweeper",
        durationSeconds: el.audioDuration || 0,
        isActive: true,
      },
    });

    deployed++;
  }

  return NextResponse.json({
    success: true,
    deployed,
    message: `Deployed ${deployed} imaging elements to station rotation`,
  });
}
