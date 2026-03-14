import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { notifyListenerWelcome } from "@/lib/messaging/notifications";
import { withRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit/limiter";
import { createListenerSchema } from "@/lib/validation/schemas";
import { optionalAuth, getOrgScope } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    const session = await optionalAuth();
    const orgScope = session ? getOrgScope(session) : {};
    const where: Record<string, unknown> = { ...orgScope };
    if (status) where.status = status;

    const [listeners, total] = await Promise.all([
      prisma.listener.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.listener.count({ where }),
    ]);

    return NextResponse.json({ listeners, total });
  } catch (error) {
    return handleApiError(error, "/api/listeners");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit public registration endpoint
    const rateLimitResponse = await withRateLimit(request, "api");
    if (rateLimitResponse) return rateLimitResponse;

    // Validate input
    const body = await request.json();
    const parsed = createListenerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { name, email, discoverySource, referralCode } = parsed.data;

    // Deduplicate by email
    const existing = await prisma.listener.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ listener: existing, existing: true });
    }

    const listener = await prisma.listener.create({
      data: {
        name: name || null,
        email,
        discoverySource: discoverySource || "organic",
        status: "NEW",
        tier: "CASUAL",
        referredByCode: referralCode || null,
      },
    });

    // Log activity
    await prisma.elliotActivity.create({
      data: {
        action: "registered_listener",
        teamMember: "elliot",
        listenerId: listener.id,
        details: {
          name: listener.name,
          source: listener.discoverySource,
        },
        successful: true,
      },
    });

    // Send welcome email via GHL
    if (listener.email && listener.name) {
      notifyListenerWelcome({
        email: listener.email,
        name: listener.name,
      }).catch(() => {});
    }

    return NextResponse.json({ listener, existing: false }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/listeners");
  }
}
