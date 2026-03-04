import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const SAFE_FIELDS = {
  id: true,
  businessName: true,
  contactName: true,
  email: true,
  businessType: true,
  status: true,
  sponsorshipTier: true,
  monthlyAmount: true,
  pipelineStage: true,
  city: true,
  state: true,
} as const;

/**
 * GET /api/sponsors/[id]
 * Public endpoint — returns safe subset of sponsor data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      select: SAFE_FIELDS,
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    return NextResponse.json({ sponsor });
  } catch (error) {
    logger.error("Error fetching sponsor", { error });
    return NextResponse.json({ error: "Failed to fetch sponsor" }, { status: 500 });
  }
}
