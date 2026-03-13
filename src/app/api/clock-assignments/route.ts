import { NextRequest, NextResponse } from "next/server";
import { railwayFetch } from "@/lib/api/railway";
import { requireAuth } from "@/lib/api/auth";
import { unauthorized } from "@/lib/api/errors";
import { verifyStationAccess } from "@/lib/db-scoped";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
    const session = await requireAuth();
    if (!session) return unauthorized();
    const body = await request.json();

    if (body.stationId) {
      const station = await verifyStationAccess(session, body.stationId);
      if (!station) return NextResponse.json({ error: "Station not found or access denied" }, { status: 404 });
    }

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
