import { NextRequest, NextResponse } from "next/server";
import { SPONSOR_PACKAGE_LIST, resolveSponsorPackage } from "@/lib/sponsors/packages";
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

    // This route had its own price list - $30/$80/$150/$300 - which matched
    // neither the rate card ($45/$79/$169/$279) nor the payment layer. It set
    // Sponsor.monthlyAmount, so the figure the station believed it was owed
    // came from here while the card was charged something else entirely.
    const pkg = tier ? resolveSponsorPackage(String(tier)) : null;

    if (!pkg) {
      return NextResponse.json(
        {
          error: `Invalid package. Valid packages: ${SPONSOR_PACKAGE_LIST.map((p) => p.key).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const sponsor = await prisma.sponsor.findUnique({ where: { id } });
    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const monthlyAmount = pkg.price;
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
          tier: pkg.key,
          email: body.email || "",
          businessName: sponsor.businessName,
        });

        // Create local records
        const [sponsorship] = await prisma.$transaction([
          prisma.sponsorship.create({
            data: { sponsorId: id, tier: pkg.key, monthlyAmount, startDate: start, endDate: end, status: "active" },
          }),
          prisma.sponsor.update({
            where: { id },
            data: { sponsorshipTier: pkg.key, monthlyAmount, contractStart: start, contractEnd: end, status: "ACTIVE" },
          }),
        ]);

        return NextResponse.json({
          success: true,
          sponsorship: { id: sponsorship.id, tier: pkg.key, monthlyAmount, startDate: start, endDate: end },
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
          tier: pkg.key,
          monthlyAmount,
          startDate: start,
          endDate: end,
          status: "active",
        },
      }),
      prisma.sponsor.update({
        where: { id },
        data: {
          sponsorshipTier: pkg.key,
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
        tier: pkg.key,
        monthlyAmount,
        startDate: start,
        endDate: end,
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/sponsors/[id]/contract");
  }
}
