import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, notFound, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/harper/sponsors/[id]
 *
 * Retrieve a single sponsor with related conversations, calls, and sponsorships.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("harper");
    if (!session) return unauthorized();

    const { id } = await params;

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { createdAt: "desc" },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 20,
            },
          },
        },
        calls: {
          orderBy: { createdAt: "desc" },
        },
        sponsorships: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!sponsor || sponsor.deletedAt) {
      return notFound("Sponsor");
    }

    return NextResponse.json({ sponsor });
  } catch (error) {
    return handleApiError(error, "/api/harper/sponsors/[id]");
  }
}

/**
 * PATCH /api/harper/sponsors/[id]
 *
 * Update sponsor fields. Accepts any valid Sponsor fields in the body.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("harper");
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    // Check the sponsor exists
    const existing = await prisma.sponsor.findUnique({
      where: { id },
      select: { id: true, deletedAt: true, version: true },
    });

    if (!existing || existing.deletedAt) {
      return notFound("Sponsor");
    }

    // Extract only allowed update fields
    const allowedFields = [
      "businessName",
      "contactName",
      "email",
      "phone",
      "businessType",
      "discoverySource",
      "sourceUrl",
      "city",
      "state",
      "status",
      "pipelineStage",
      "lastContactedAt",
      "nextFollowUpAt",
      "emailsSent",
      "textsSent",
      "callsCompleted",
      "sponsorshipTier",
      "monthlyAmount",
      "contractStart",
      "contractEnd",
      "assignedTo",
      "metadata",
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Convert date strings to Date objects for DateTime fields
        if (
          [
            "lastContactedAt",
            "nextFollowUpAt",
            "contractStart",
            "contractEnd",
          ].includes(field) &&
          body[field] !== null
        ) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        ...updateData,
        version: { increment: 1 },
      },
    });

    return NextResponse.json({ sponsor });
  } catch (error) {
    return handleApiError(error, "/api/harper/sponsors/[id]");
  }
}
