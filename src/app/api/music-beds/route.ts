import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");
    if (!stationId) {
      return NextResponse.json(
        { error: "stationId is required" },
        { status: 400 }
      );
    }

    const musicBeds = await prisma.musicBed.findMany({
      where: { stationId, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ musicBeds });
  } catch (error) {
    return handleApiError(error, "/api/music-beds");
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const stationId = formData.get("stationId") as string;
    const name = formData.get("name") as string;
    const category = (formData.get("category") as string) || "general";
    const file = formData.get("file") as File;

    if (!stationId || !name || !file) {
      return NextResponse.json(
        { error: "stationId, name, and file are required" },
        { status: 400 }
      );
    }

    // Save file to public/audio/music-beds/
    const outputDir = path.join(process.cwd(), "public", "audio", "music-beds");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const safeName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const ext = path.extname(file.name) || ".mp3";
    const fileName = `${safeName}-${Date.now()}${ext}`;
    const filePath = `/audio/music-beds/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(outputDir, fileName), buffer);

    const musicBed = await prisma.musicBed.create({
      data: {
        stationId,
        name,
        fileName,
        filePath,
        category,
      },
    });

    return NextResponse.json({ musicBed }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/music-beds");
  }
}
