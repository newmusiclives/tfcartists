import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/organizations
 * List all organizations (super-admin) or the current user's organization.
 */
export async function GET(request: NextRequest) {
  try {

    const organizations = await prisma.organization.findMany({
      where: {
        deletedAt: null,
        // Non-admin users would filter by their org (future: session.user.organizationId)
      },
      include: {
        _count: {
          select: {
            stations: true,
            users: true,
            artists: true,
            sponsors: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    return handleApiError(error, "/api/organizations");
  }
}

/**
 * POST /api/organizations
 * Create a new organization (super-admin only).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();

    const body = await request.json();
    const { name, slug, ownerName, ownerEmail, plan, maxStations, domain } = body;

    if (!name || !slug || !ownerName || !ownerEmail) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, ownerName, ownerEmail" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.organization.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Organization slug already exists" },
        { status: 409 }
      );
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        ownerName,
        ownerEmail,
        plan: plan || "starter",
        maxStations: maxStations || 1,
        domain: domain || null,
      },
    });

    // Create the owner as the first user
    await prisma.organizationUser.create({
      data: {
        organizationId: organization.id,
        email: ownerEmail,
        name: ownerName,
        role: "owner",
      },
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/organizations");
  }
}
