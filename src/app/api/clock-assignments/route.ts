import { NextRequest, NextResponse } from "next/server";
import { railwayFetch } from "@/lib/api/railway";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return false;
  return ["admin", "parker"].includes(session.user.role || "");
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const res = await railwayFetch("/api/clocks/assignments");
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return NextResponse.json({ error: errBody || "Railway API error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clock assignments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const res = await railwayFetch("/api/clocks/assignments", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create clock assignment" }, { status: 500 });
  }
}
