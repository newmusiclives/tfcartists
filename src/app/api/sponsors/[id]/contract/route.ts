import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// POST — create or update sponsor contract/sponsorship
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await request.json();
    const { tier, startDate, durationMonths } = body;

    const tierPricing: Record<string, number> = {
      local_hero: 30,
      tier_1: 80,
      tier_2: 150,
      tier_3: 300,
    };

    if (!tier || !(tier in tierPricing)) {
      return NextResponse.json(
        { error: `Invalid tier. Valid tiers: ${Object.keys(tierPricing).join(", ")}` },
        { status: 400 }
      );
    }

    const sponsor = await prisma.sponsor.findUnique({ where: { id } });
    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const monthlyAmount = tierPricing[tier];
    const start = startDate ? new Date(startDate) : new Date();
    const months = durationMonths || 1;
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    // Try Manifest Financial
    const { manifest } = await import("@/lib/payments/manifest");

    if (manifest.isConfigured()) {
      try {
        const subscription = await manifest.createSponsorshipSubscription({
          sponsorId: id,
          tier: tier as "bronze" | "silver" | "gold" | "platinum",
          email: body.email || "",
          businessName: sponsor.businessName,
        });

        // Create local records
        const [sponsorship] = await prisma.$transaction([
          prisma.sponsorship.create({
            data: { sponsorId: id, tier, monthlyAmount, startDate: start, endDate: end, status: "active" },
          }),
          prisma.sponsor.update({
            where: { id },
            data: { sponsorshipTier: tier, monthlyAmount, contractStart: start, contractEnd: end, status: "ACTIVE" },
          }),
        ]);

        return NextResponse.json({
          success: true,
          sponsorship: { id: sponsorship.id, tier, monthlyAmount, startDate: start, endDate: end },
          subscriptionId: subscription.subscriptionId,
          checkoutUrl: subscription.checkoutUrl,
        });
      } catch (err) {
        logger.error("Manifest sponsorship subscription failed, falling back to local", { error: err });
        // Fall through to local-only
      }
    }

    // Fallback: local-only (Manifest not configured or failed)
    const [sponsorship] = await prisma.$transaction([
      prisma.sponsorship.create({
        data: {
          sponsorId: id,
          tier,
          monthlyAmount,
          startDate: start,
          endDate: end,
          status: "active",
        },
      }),
      prisma.sponsor.update({
        where: { id },
        data: {
          sponsorshipTier: tier,
          monthlyAmount,
          contractStart: start,
          contractEnd: end,
          status: "ACTIVE",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      sponsorship: {
        id: sponsorship.id,
        tier,
        monthlyAmount,
        startDate: start,
        endDate: end,
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/sponsors/[id]/contract");
  }
}
