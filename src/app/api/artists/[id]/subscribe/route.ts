import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
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
    const { tier, paymentMethodId } = body;

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

    // For paid tiers, create payment record
    // In production, this would process payment via Manifest Financial
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
