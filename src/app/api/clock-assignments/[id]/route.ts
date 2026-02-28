import { NextRequest, NextResponse } from "next/server";
import { railwayFetch } from "@/lib/api/railway";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return false;
  return ["admin", "parker"].includes(session.user.role || "");
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
