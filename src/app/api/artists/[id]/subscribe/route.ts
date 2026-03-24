import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import type { AirplayTier } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST — subscribe/upgrade artist to a paid tier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await request.json();
    const { tier, paymentMethodId, email, name } = body;

    // Validate tier — amounts in dollars matching schema (Float, not cents)
    const validTiers: Record<string, number> = {
      FREE: 0,
      TIER_5: 5,
      TIER_20: 15,
      TIER_50: 40,
      TIER_120: 100,
    };

    if (!(tier in validTiers)) {
      return NextResponse.json(
        { error: `Invalid tier. Valid tiers: ${Object.keys(validTiers).join(", ")}` },
        { status: 400 }
      );
    }

    const amount = validTiers[tier];
    const artist = await prisma.artist.findUnique({ where: { id } });
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // For free tier, just update
    if (amount === 0) {
      await prisma.artist.update({
        where: { id },
        data: { airplayTier: "FREE" as AirplayTier },
      });
      return NextResponse.json({ success: true, tier: "FREE", amount: 0 });
    }

    // Try Manifest Financial for paid subscriptions
    const { manifest } = await import("@/lib/payments/manifest");

    if (manifest.isConfigured()) {
      try {
        const subscription = await manifest.createAirplaySubscription({
          artistId: id,
          tier: tier as "TIER_5" | "TIER_20" | "TIER_50" | "TIER_120",
          email: email || "",
          name: name || artist.name,
        });

        // Update tier immediately — webhook will confirm payment
        await prisma.artist.update({
          where: { id },
          data: { airplayTier: tier as AirplayTier },
        });

        return NextResponse.json({
          success: true,
          tier,
          amount,
          subscriptionId: subscription.subscriptionId,
          checkoutUrl: subscription.checkoutUrl,
          message: `Redirecting to payment for ${tier} ($${amount}/mo)`,
        });
      } catch (err) {
        logger.error("Manifest subscription failed, falling back to local", { error: err });
        // Fall through to local handling
      }
    }

    // Fallback: local-only (Manifest not configured or failed)
    const period = new Date().toISOString().slice(0, 7); // "2026-03"

    await prisma.$transaction([
      prisma.artist.update({
        where: { id },
        data: { airplayTier: tier as AirplayTier },
      }),
      prisma.airplayPayment.create({
        data: {
          artistId: id,
          tier: tier as AirplayTier,
          amount, // Dollar amount (Float) per schema
          period,
          status: "active",
          ...(paymentMethodId && { paymentMethod: paymentMethodId }),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      tier,
      amount,
      message: `Subscribed to ${tier} ($${amount}/mo)`,
    });
  } catch (error) {
    return handleApiError(error, "/api/artists/[id]/subscribe");
  }
}
