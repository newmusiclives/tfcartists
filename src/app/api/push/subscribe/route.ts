import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/subscribe
 * Save or update a push subscription.
 * Public endpoint — any visitor can subscribe to notifications.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, listenerId, organizationId } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Missing required subscription fields: endpoint, keys.p256dh, keys.auth" },
        { status: 400 }
      );
    }

    // Upsert — if this endpoint already exists, update it
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        listenerId: listenerId || null,
        organizationId: organizationId || null,
        isActive: true,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        listenerId: listenerId || null,
        organizationId: organizationId || null,
      },
    });

    return NextResponse.json({ subscription: { id: subscription.id } }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/push/subscribe");
  }
}
