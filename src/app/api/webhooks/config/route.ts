import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { auth } from "@/lib/auth/config";
import {
  getWebhookEndpoints,
  saveWebhookEndpoints,
  WEBHOOK_EVENTS,
  type WebhookEndpoint,
  type WebhookEvent,
} from "@/lib/webhooks/dispatch";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/config
 * List all configured webhook endpoints.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const endpoints = await getWebhookEndpoints();
  return NextResponse.json({ endpoints });
}

/**
 * POST /api/webhooks/config
 * Add a new webhook endpoint.
 * Body: { name, url, events: string[], secret?: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, url, events, secret } = body as {
      name?: string;
      url?: string;
      events?: string[];
      secret?: string;
    };

    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { error: "name, url, and at least one event are required" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Validate events
    const validEvents = events.filter((e) =>
      WEBHOOK_EVENTS.includes(e as WebhookEvent)
    );
    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: "No valid events provided" },
        { status: 400 }
      );
    }

    const endpoint: WebhookEndpoint = {
      id: randomUUID(),
      name,
      url,
      secret: secret || randomBytes(32).toString("hex"),
      events: validEvents as WebhookEvent[],
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    const endpoints = await getWebhookEndpoints();
    endpoints.push(endpoint);
    await saveWebhookEndpoints(endpoints);

    return NextResponse.json({ endpoint }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/webhooks/config
 * Remove a webhook endpoint by id.
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const endpoints = await getWebhookEndpoints();
    const filtered = endpoints.filter((ep) => ep.id !== id);

    if (filtered.length === endpoints.length) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    await saveWebhookEndpoints(filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
