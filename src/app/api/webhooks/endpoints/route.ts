import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requireAuth, getOrgScope } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { WEBHOOK_EVENT_LIST } from "@/lib/webhooks/events";
import type { WebhookEventType } from "@/lib/webhooks/events";

export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/endpoints
 * List all webhook endpoints for the current organization.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const orgScope = getOrgScope(session);

    const endpoints = await prisma.webhookEndpoint.findMany({
      where: orgScope,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { deliveries: true } },
        deliveries: {
          orderBy: { deliveredAt: "desc" },
          take: 1,
          select: { success: true, deliveredAt: true },
        },
      },
    });

    const result = endpoints.map((ep) => ({
      id: ep.id,
      name: ep.name,
      url: ep.url,
      secret: ep.secret,
      events: ep.events,
      active: ep.active,
      createdAt: ep.createdAt.toISOString(),
      updatedAt: ep.updatedAt.toISOString(),
      totalDeliveries: ep._count.deliveries,
      lastDelivery: ep.deliveries[0]
        ? {
            success: ep.deliveries[0].success,
            deliveredAt: ep.deliveries[0].deliveredAt.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({ endpoints: result, availableEvents: WEBHOOK_EVENT_LIST });
  } catch (error) {
    return handleApiError(error, "/api/webhooks/endpoints");
  }
}

/**
 * POST /api/webhooks/endpoints
 * Create a new webhook endpoint.
 * Body: { name, url, events: string[], secret?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const orgId = session.user?.organizationId;

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
      WEBHOOK_EVENT_LIST.includes(e as WebhookEventType)
    );
    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: "No valid events provided. Valid events: " + WEBHOOK_EVENT_LIST.join(", ") },
        { status: 400 }
      );
    }

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        name,
        url,
        secret: secret || randomBytes(32).toString("hex"),
        events: validEvents,
        active: true,
        organizationId: orgId || "default",
      },
    });

    return NextResponse.json(
      {
        endpoint: {
          id: endpoint.id,
          name: endpoint.name,
          url: endpoint.url,
          secret: endpoint.secret,
          events: endpoint.events,
          active: endpoint.active,
          createdAt: endpoint.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/webhooks/endpoints POST");
  }
}

/**
 * PUT /api/webhooks/endpoints
 * Update a webhook endpoint.
 * Body: { id, name?, url?, events?, active? }
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const orgScope = getOrgScope(session);

    const body = await req.json();
    const { id, name, url, events, active } = body as {
      id: string;
      name?: string;
      url?: string;
      events?: string[];
      active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id, ...orgScope },
    });
    if (!existing) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }
    }

    // Validate events if provided
    let validEvents: string[] | undefined;
    if (events) {
      validEvents = events.filter((e) =>
        WEBHOOK_EVENT_LIST.includes(e as WebhookEventType)
      );
      if (validEvents.length === 0) {
        return NextResponse.json({ error: "No valid events provided" }, { status: 400 });
      }
    }

    const updated = await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(validEvents && { events: validEvents }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json({
      endpoint: {
        id: updated.id,
        name: updated.name,
        url: updated.url,
        events: updated.events,
        active: updated.active,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/webhooks/endpoints PUT");
  }
}

/**
 * DELETE /api/webhooks/endpoints
 * Remove a webhook endpoint by id.
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const orgScope = getOrgScope(session);

    const { id } = (await req.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id, ...orgScope },
    });
    if (!existing) {
      return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    }

    await prisma.webhookEndpoint.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/webhooks/endpoints DELETE");
  }
}
