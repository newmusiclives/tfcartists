import { NextRequest, NextResponse } from "next/server";
import { manifest } from "@/lib/payments/manifest";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth/config";

/**
 * POST /api/payments/subscribe
 * Create a subscription (airplay or sponsorship)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, entityId, tier, email, name } = body;

    // Validate input
    if (!type || !entityId || !tier || !email || !name) {
      return NextResponse.json(
        { error: "Missing required fields: type, entityId, tier, email, name" },
        { status: 400 }
      );
    }

    let subscriptionResult;

    if (type === "airplay") {
      // Create airplay subscription for artist
      const artist = await prisma.artist.findUnique({
        where: { id: entityId },
      });

      if (!artist) {
        return NextResponse.json({ error: "Artist not found" }, { status: 404 });
      }

      subscriptionResult = await manifest.createAirplaySubscription({
        artistId: entityId,
        tier,
        email,
        name,
      });

      logger.info("Airplay subscription created", {
        artistId: entityId,
        tier,
      });

    } else if (type === "sponsorship") {
      // Create sponsorship subscription
      const sponsor = await prisma.sponsor.findUnique({
        where: { id: entityId },
      });

      if (!sponsor) {
        return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
      }

      subscriptionResult = await manifest.createSponsorshipSubscription({
        sponsorId: entityId,
        tier,
        email,
        businessName: name,
      });

      logger.info("Sponsorship subscription created", {
        sponsorId: entityId,
        tier,
      });

    } else {
      return NextResponse.json(
        { error: "Invalid subscription type. Must be 'airplay' or 'sponsorship'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionResult.subscriptionId,
      checkoutUrl: subscriptionResult.checkoutUrl,
    });

  } catch (error) {
    logger.error("Subscription creation failed", { error });

    return NextResponse.json(
      {
        error: "Failed to create subscription",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
