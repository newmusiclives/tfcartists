import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, validationError } from "@/lib/api/errors";
import { withPagination } from "@/lib/api/helpers";

/**
 * GET /api/harper/sponsors
 *
 * List sponsors with pagination, search, and filters.
 * Supports: status, pipelineStage, tier (sponsorshipTier) filters.
 * Returns: { sponsors, pagination }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip, sortBy, sortOrder, search } =
      withPagination(searchParams);

    // Filters
    const status = searchParams.get("status");
    const pipelineStage = searchParams.get("pipelineStage");
    const tier = searchParams.get("tier");

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactName: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (pipelineStage) {
      where.pipelineStage = pipelineStage;
    }

    if (tier) {
      where.sponsorshipTier = tier;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries in parallel
    const [sponsors, total] = await Promise.all([
      prisma.sponsor.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          sponsorships: {
            where: { status: "active" },
            select: {
              id: true,
              tier: true,
              monthlyAmount: true,
              status: true,
            },
          },
          _count: {
            select: {
              calls: true,
              conversations: true,
            },
          },
        },
      }),
      prisma.sponsor.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      sponsors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/harper/sponsors");
  }
}

/**
 * POST /api/harper/sponsors
 *
 * Create a new sponsor.
 * Required: businessName, businessType, discoverySource.
 * Logs a HarperActivity entry on creation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { businessName, businessType, discoverySource } = body;

    // Validate required fields
    if (!businessName || !businessType || !discoverySource) {
      return validationError(
        "Missing required fields: businessName, businessType, and discoverySource are required.",
        [
          ...(!businessName
            ? [{ field: "businessName", message: "businessName is required" }]
            : []),
          ...(!businessType
            ? [{ field: "businessType", message: "businessType is required" }]
            : []),
          ...(!discoverySource
            ? [
                {
                  field: "discoverySource",
                  message: "discoverySource is required",
                },
              ]
            : []),
        ]
      );
    }

    // Create sponsor and log activity in a transaction
    const sponsor = await prisma.$transaction(async (tx) => {
      const newSponsor = await tx.sponsor.create({
        data: {
          businessName,
          businessType,
          discoverySource,
          contactName: body.contactName || null,
          email: body.email || null,
          phone: body.phone || null,
          sourceUrl: body.sourceUrl || null,
          city: body.city || null,
          state: body.state || null,
          status: body.status || "DISCOVERED",
          pipelineStage: body.pipelineStage || "discovery",
          sponsorshipTier: body.sponsorshipTier || null,
          monthlyAmount: body.monthlyAmount || null,
          assignedTo: body.assignedTo || null,
        },
      });

      // Log HarperActivity
      await tx.harperActivity.create({
        data: {
          action: "discovered_sponsor",
          sponsorId: newSponsor.id,
          details: {
            businessName: newSponsor.businessName,
            businessType: newSponsor.businessType,
            discoverySource: newSponsor.discoverySource,
          },
        },
      });

      return newSponsor;
    });

    return NextResponse.json({ sponsor }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/harper/sponsors");
  }
}
