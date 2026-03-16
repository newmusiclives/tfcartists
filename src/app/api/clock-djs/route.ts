import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!station) {
      return NextResponse.json([]);
    }

    const djs = await prisma.dJ.findMany({
      where: { stationId: station.id, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        showFormat: true,
        colorPrimary: true,
      },
      orderBy: { name: "asc" },
    });

    const result = djs.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      show_format: d.showFormat,
      color_primary: d.colorPrimary,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch DJs" }, { status: 500 });
  }
}
