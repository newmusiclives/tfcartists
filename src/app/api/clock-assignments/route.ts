import { NextRequest, NextResponse } from "next/server";
import { railwayFetch } from "@/lib/api/railway";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await railwayFetch("/api/clocks/assignments");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clock assignments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await railwayFetch("/api/clocks/assignments", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create clock assignment" }, { status: 500 });
  }
}
