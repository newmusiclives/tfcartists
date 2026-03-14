import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { sendToAllSubscribers, sendToListener } from "@/lib/push/push-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/send
 * Admin-only: Send a push notification to all subscribers or a specific listener.
 *
 * Body:
 *   title: string (required)
 *   body: string (required)
 *   url?: string
 *   listenerId?: string — if provided, send only to this listener
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, url, listenerId } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Missing required fields: title, body" },
        { status: 400 }
      );
    }

    let result;
    if (listenerId) {
      result = await sendToListener(listenerId, title, body, url);
    } else {
      result = await sendToAllSubscribers(title, body, url);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error, "/api/push/send");
  }
}
