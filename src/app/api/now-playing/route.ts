import { NextResponse } from "next/server";

const NOW_PLAYING_URL =
  "https://tfc-radio-backend-production.up.railway.app/api/now_playing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(NOW_PLAYING_URL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream error" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch now playing" },
      { status: 502 }
    );
  }
}
