import { NextRequest, NextResponse } from "next/server";
import { railwayFetch } from "@/lib/api/railway";
import { requireAdmin } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();
    const { id } = await params;
    const res = await railwayFetch(`/api/clocks/assignments/${id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
