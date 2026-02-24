import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// POST: Track a referral event when a new listener registers with a ref code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listenerId, referralCode } = body;

    if (!listenerId || !referralCode) {
      return NextResponse.json(
        { error: "listenerId and referralCode are required" },
        { status: 400 }
      );
    }

    // Look up referrer by code
    let referrerType: string | null = null;
    let referrerId: string | null = null;

    // Check Scout referral codes first
    const scout = await prisma.scout.findUnique({
      where: { referralCode },
    }).catch((err) => {
      logger.error("Failed to look up scout by referral code", { referralCode, error: err.message });
      return null;
    });

    if (scout) {
      referrerType = "scout";
      referrerId = scout.id;

      // Create ListenerReferral record
      await prisma.listenerReferral.create({
        data: {
          scoutId: scout.id,
          listenerId,
          referralSource: "embed",
          convertedAt: new Date(),
        },
      }).catch((err) => {
        // May already exist (unique constraint) — log only if unexpected
        if (!err.message?.includes("Unique constraint")) {
          logger.error("Failed to create listener referral", { scoutId: scout.id, listenerId, error: err.message });
        }
      });

      // Update scout stats
      await prisma.scout.update({
        where: { id: scout.id },
        data: {
          listenerReferrals: { increment: 1 },
        },
      }).catch((err) => {
        logger.error("Failed to increment scout referral count", { scoutId: scout.id, error: err.message });
      });

      // Award XP to scout's listener account
      await prisma.xPTransaction.create({
        data: {
          userId: scout.listenerId,
          userType: "listener",
          action: "referral",
          xpAmount: 100,
          metadata: JSON.stringify({ listenerId, referralCode }),
        },
      }).catch((err) => {
        logger.error("Failed to create XP transaction for referral", { listenerId: scout.listenerId, error: err.message });
      });

      // Update listener XP
      await prisma.listener.update({
        where: { id: scout.listenerId },
        data: { xpTotal: { increment: 100 } },
      }).catch((err) => {
        logger.error("Failed to increment listener XP", { listenerId: scout.listenerId, error: err.message });
      });
    } else {
      // Check SponsorGrowthPartner referral codes
      const partner = await prisma.sponsorGrowthPartner.findUnique({
        where: { referralCode },
      }).catch((err) => {
        logger.error("Failed to look up growth partner by referral code", { referralCode, error: err.message });
        return null;
      });

      if (partner) {
        referrerType = "sponsor";
        referrerId = partner.id;

        // Create SponsorListenerReferral record
        await prisma.sponsorListenerReferral.create({
          data: {
            growthPartnerId: partner.id,
            listenerId,
            referralSource: "embed",
            convertedAt: new Date(),
          },
        }).catch((err) => {
          if (!err.message?.includes("Unique constraint")) {
            logger.error("Failed to create sponsor listener referral", { partnerId: partner.id, listenerId, error: err.message });
          }
        });

        // Update partner stats
        await prisma.sponsorGrowthPartner.update({
          where: { id: partner.id },
          data: {
            listenersReferred: { increment: 1 },
          },
        }).catch((err) => {
          logger.error("Failed to increment partner referral count", { partnerId: partner.id, error: err.message });
        });
      }
    }

    // Update listener's referral fields
    await prisma.listener.update({
      where: { id: listenerId },
      data: {
        referredByCode: referralCode,
        referredByType: referrerType,
      },
    }).catch((err) => {
      logger.error("Failed to update listener referral fields", { listenerId, error: err.message });
    });

    return NextResponse.json({
      tracked: true,
      referrerType,
      referrerId,
    });
  } catch (error) {
    return handleApiError(error, "/api/referrals/track");
  }
}
