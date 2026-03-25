import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getWebhookEndpoints,
  sendWebhook,
  WEBHOOK_EVENT_EXAMPLES,
} from "@/lib/webhooks/dispatch";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/test
 * Send a test ping to a specific webhook endpoint.
 * Body: { endpointId }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { endpointId } = (await req.json()) as { endpointId?: string };
    if (!endpointId) {
      return NextResponse.json(
        { error: "endpointId is required" },
        { status: 400 }
      );
    }

    const endpoints = await getWebhookEndpoints();
    const endpoint = endpoints.find((ep) => ep.id === endpointId);

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint not found" },
        { status: 404 }
      );
    }

    // Send a test event with example payload
    const testEvent = "song.played";
    const testPayload = {
      _test: true,
      _message: "This is a test webhook delivery from TrueFans Radio",
      ...WEBHOOK_EVENT_EXAMPLES[testEvent],
    };

    const delivery = await sendWebhook(endpoint, testEvent, testPayload);

    return NextResponse.json({ delivery });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
