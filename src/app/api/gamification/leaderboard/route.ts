import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/errors";
import { getLeaderboard } from "@/lib/gamification/xp-engine";

export const dynamic = "force-dynamic";

// GET: Get leaderboard for a user type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "listener") as "listener" | "artist";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    if (type !== "listener" && type !== "artist") {
      return NextResponse.json({ error: "type must be 'listener' or 'artist'" }, { status: 400 });
    }

    const leaderboard = await getLeaderboard(type, limit);

    return NextResponse.json({ leaderboard, type });
  } catch (error) {
    return handleApiError(error, "/api/gamification/leaderboard");
  }
}
