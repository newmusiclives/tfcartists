import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";

export const dynamic = "force-dynamic";

/**
 * POST /api/requests/vote — upvote a song request
 * Uses a cookie to track which requests a session has voted on.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, "api");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { requestId } = body;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    // Check cookie for already-voted requests
    const votedCookie = request.cookies.get("voted_requests")?.value || "";
    const votedIds = votedCookie ? votedCookie.split(",") : [];

    if (votedIds.includes(requestId)) {
      return NextResponse.json(
        { error: "You have already voted for this request" },
        { status: 409 }
      );
    }

    // Verify request exists and is still active
    const songRequest = await prisma.songRequest.findUnique({
      where: { id: requestId },
    });

    if (!songRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (songRequest.status === "played" || songRequest.status === "rejected") {
      return NextResponse.json(
        { error: "Cannot vote on a completed or rejected request" },
        { status: 400 }
      );
    }

    // Increment votes
    const updated = await prisma.songRequest.update({
      where: { id: requestId },
      data: { votes: { increment: 1 } },
    });

    // Update voted cookie — keep last 200 IDs to prevent cookie overflow
    votedIds.push(requestId);
    const trimmedIds = votedIds.slice(-200);

    const response = NextResponse.json({
      votes: updated.votes,
      requestId: updated.id,
    });

    response.cookies.set("voted_requests", trimmedIds.join(","), {
      httpOnly: false, // Accessible from JS for UI state
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error, "/api/requests/vote");
  }
}
