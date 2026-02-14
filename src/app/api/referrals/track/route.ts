import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

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
    }).catch(() => null);

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
      }).catch(() => {
        // May already exist (unique constraint)
      });

      // Update scout stats
      await prisma.scout.update({
        where: { id: scout.id },
        data: {
          listenerReferrals: { increment: 1 },
        },
      }).catch(() => {});

      // Award XP to scout's listener account
      await prisma.xPTransaction.create({
        data: {
          userId: scout.listenerId,
          userType: "listener",
          action: "referral",
          xpAmount: 100,
          metadata: JSON.stringify({ listenerId, referralCode }),
        },
      }).catch(() => {});

      // Update listener XP
      await prisma.listener.update({
        where: { id: scout.listenerId },
        data: { xpTotal: { increment: 100 } },
      }).catch(() => {});
    } else {
      // Check SponsorGrowthPartner referral codes
      const partner = await prisma.sponsorGrowthPartner.findUnique({
        where: { referralCode },
      }).catch(() => null);

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
        }).catch(() => {
          // May already exist
        });

        // Update partner stats
        await prisma.sponsorGrowthPartner.update({
          where: { id: partner.id },
          data: {
            listenersReferred: { increment: 1 },
          },
        }).catch(() => {});
      }
    }

    // Update listener's referral fields
    await prisma.listener.update({
      where: { id: listenerId },
      data: {
        referredByCode: referralCode,
        referredByType: referrerType,
      },
    }).catch(() => {});

    return NextResponse.json({
      tracked: true,
      referrerType,
      referrerId,
    });
  } catch (error) {
    return handleApiError(error, "/api/referrals/track");
  }
}
