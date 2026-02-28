import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("admin");
    if (!session) return unauthorized();

    const { id } = await params;

    const item = await prisma.producedImaging.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete the file from disk (skip for data URIs on Netlify)
    if (!item.filePath.startsWith("data:")) {
      try {
        const fullPath = path.join(process.cwd(), "public", item.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Read-only filesystem on Netlify — just delete the DB record
      }
    }

    await prisma.producedImaging.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/produced-imaging/[id]");
  }
}
