import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const musicBed = await prisma.musicBed.findUnique({ where: { id } });
    if (!musicBed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete the file from disk (skip for data URIs on Netlify)
    if (!musicBed.filePath.startsWith("data:")) {
      try {
        const fullPath = path.join(process.cwd(), "public", musicBed.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Read-only filesystem on Netlify — just delete the DB record
      }
    }

    await prisma.musicBed.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/music-beds/[id]");
  }
}
