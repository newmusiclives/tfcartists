import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

/**
 * GET /api/imaging-packages/[id]/download
 * Download all audio_ready elements as a ZIP file.
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
        where: { status: "audio_ready", audioFilePath: { not: null } },
        orderBy: [{ elementType: "asc" }, { variationNum: "asc" }],
      },
    },
  });

  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  if (pkg.elements.length === 0) {
    return NextResponse.json({ error: "No audio elements ready for download" }, { status: 400 });
  }

  // Build ZIP in memory
  const archive = archiver("zip", { zlib: { level: 5 } });
  const chunks: Buffer[] = [];

  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  // Add each element to ZIP organized by type
  for (const el of pkg.elements) {
    if (!el.audioFilePath) continue;

    const folder = el.elementType.replace(/_/g, "-");
    const djSuffix = el.djName ? `-${el.djName.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "";
    const filename = `${folder}/${el.elementType}${djSuffix}-${String(el.variationNum).padStart(2, "0")}.wav`;

    // Try to read the audio file
    const fullPath = el.audioFilePath.startsWith("/")
      ? path.join(process.cwd(), "public", el.audioFilePath)
      : path.join(process.cwd(), el.audioFilePath);

    if (fs.existsSync(fullPath)) {
      archive.file(fullPath, { name: filename });
    }
  }

  // Add a manifest
  const manifest = pkg.elements.map((el) => ({
    type: el.elementType,
    variation: el.variationNum,
    dj: el.djName,
    label: el.label,
    script: el.scriptText,
    duration: el.audioDuration,
  }));
  archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

  await archive.finalize();

  const zipBuffer = Buffer.concat(chunks);
  const safeName = (pkg.stationName || "station").toLowerCase().replace(/[^a-z0-9]/g, "-");

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}-${pkg.tier}-imaging.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
