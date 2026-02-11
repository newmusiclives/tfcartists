import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, validationError, notFound } from "@/lib/api/errors";
import { withPagination } from "@/lib/api/helpers";

/**
 * GET /api/harper/deals
 *
 * List sponsorships with sponsor details included.
 * Supports: status filter and pagination.
 * Returns: { deals, pagination }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip, sortBy, sortOrder } =
      withPagination(searchParams);

    // Filters
    const status = searchParams.get("status");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [deals, total] = await Promise.all([
      prisma.sponsorship.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          sponsor: {
            select: {
              id: true,
              businessName: true,
              contactName: true,
              email: true,
              phone: true,
              businessType: true,
              city: true,
              state: true,
              status: true,
              pipelineStage: true,
            },
          },
        },
      }),
      prisma.sponsorship.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      deals,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/harper/deals");
  }
}

/**
 * POST /api/harper/deals
 *
 * Create a new sponsorship deal.
 * Required: sponsorId, tier, monthlyAmount.
 * Also updates the sponsor's status to ACTIVE and logs HarperActivity.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { sponsorId, tier, monthlyAmount } = body;

    // Validate required fields
    if (!sponsorId || !tier || monthlyAmount === undefined || monthlyAmount === null) {
      return validationError(
        "Missing required fields: sponsorId, tier, and monthlyAmount are required.",
        [
          ...(!sponsorId
            ? [{ field: "sponsorId", message: "sponsorId is required" }]
            : []),
          ...(!tier
            ? [{ field: "tier", message: "tier is required" }]
            : []),
          ...(monthlyAmount === undefined || monthlyAmount === null
            ? [
                {
                  field: "monthlyAmount",
                  message: "monthlyAmount is required",
                },
              ]
            : []),
        ]
      );
    }

    // Check the sponsor exists
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { id: true, businessName: true, deletedAt: true },
    });

    if (!sponsor || sponsor.deletedAt) {
      return notFound("Sponsor");
    }

    // Create sponsorship, update sponsor status, and log activity in a transaction
    const deal = await prisma.$transaction(async (tx) => {
      const sponsorship = await tx.sponsorship.create({
        data: {
          sponsorId,
          tier,
          monthlyAmount: parseFloat(String(monthlyAmount)),
          startDate: body.startDate ? new Date(body.startDate) : new Date(),
          endDate: body.endDate ? new Date(body.endDate) : null,
          status: body.status || "active",
          adSpotsPerMonth: body.adSpotsPerMonth || null,
          socialMentions: body.socialMentions || null,
          eventPromotion: body.eventPromotion || false,
        },
        include: {
          sponsor: {
            select: {
              id: true,
              businessName: true,
              contactName: true,
              email: true,
            },
          },
        },
      });

      // Update sponsor status to ACTIVE and set deal fields
      await tx.sponsor.update({
        where: { id: sponsorId },
        data: {
          status: "ACTIVE",
          pipelineStage: "active",
          sponsorshipTier: tier,
          monthlyAmount: parseFloat(String(monthlyAmount)),
          contractStart: body.startDate ? new Date(body.startDate) : new Date(),
          contractEnd: body.endDate ? new Date(body.endDate) : null,
          version: { increment: 1 },
        },
      });

      // Log HarperActivity
      await tx.harperActivity.create({
        data: {
          action: "closed_deal",
          sponsorId,
          details: {
            businessName: sponsor.businessName,
            tier,
            monthlyAmount: parseFloat(String(monthlyAmount)),
            sponsorshipId: sponsorship.id,
          },
        },
      });

      return sponsorship;
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/harper/deals");
  }
}
