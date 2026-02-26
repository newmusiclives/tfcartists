import { NextResponse } from "next/server";
import { railwayFetch } from "@/lib/api/railway";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await railwayFetch("/api/clocks/djs");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch DJs" }, { status: 500 });
  }
}
