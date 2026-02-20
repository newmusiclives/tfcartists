import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized, validationError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/growth-partners — List all growth partners with sponsor info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const status = request.nextUrl.searchParams.get("status");

    const validStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];
    if (status && !validStatuses.includes(status)) {
      return validationError("Invalid status value", [{ field: "status", message: `Status must be one of: ${validStatuses.join(", ")}` }]);
    }

    const partners = await prisma.sponsorGrowthPartner.findMany({
      where: status ? { status: status as "ACTIVE" | "INACTIVE" | "SUSPENDED" } : undefined,
      include: {
        sponsor: {
          select: {
            id: true,
            businessName: true,
            contactName: true,
            email: true,
            sponsorshipTier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ partners });
  } catch (error) {
    return handleApiError(error, "/api/growth-partners");
  }
}

/**
 * POST /api/growth-partners — Activate a sponsor as a growth partner
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return unauthorized();

    const body = await request.json();
    const { sponsorId } = body;

    if (!sponsorId) {
      return NextResponse.json(
        { error: "sponsorId is required" },
        { status: 400 }
      );
    }

    // Generate unique referral code
    const code = "GP-" + Math.random().toString(36).substr(2, 6).toUpperCase();

    const partner = await prisma.sponsorGrowthPartner.create({
      data: {
        sponsorId,
        status: "ACTIVE",
        tier: "BRONZE",
        referralCode: code,
      },
      include: {
        sponsor: {
          select: { businessName: true, contactName: true },
        },
      },
    });

    return NextResponse.json({ partner }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/growth-partners");
  }
}
