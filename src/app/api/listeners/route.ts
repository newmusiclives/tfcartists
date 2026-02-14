import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
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
    const body = await request.json();
    const { name, email, discoverySource, referralCode } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ listener, existing: false }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/listeners");
  }
}
