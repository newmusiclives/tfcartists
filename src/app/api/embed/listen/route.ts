import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

function getTimeSlot(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "midday";
  if (hour >= 17 && hour < 22) return "evening";
  return "late_night";
}

// POST: Start an embed listening session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ref, device } = body;

    // Create listening session
    const session = await prisma.listeningSession.create({
      data: {
        startTime: new Date(),
        timeSlot: getTimeSlot(),
        device: device || "embed",
      },
    });

    // If referral code provided, try to find the referrer
    let referrerType: string | null = null;
    let referrerId: string | null = null;

    if (ref) {
      // Check Scout referral codes
      const scout = await prisma.scout.findUnique({
        where: { referralCode: ref },
      }).catch(() => null);

      if (scout) {
        referrerType = "scout";
        referrerId = scout.id;
      } else {
        // Check SponsorGrowthPartner referral codes
        const partner = await prisma.sponsorGrowthPartner.findUnique({
          where: { referralCode: ref },
        }).catch(() => null);

        if (partner) {
          referrerType = "sponsor";
          referrerId = partner.id;
        }
      }
    }

    return NextResponse.json({
      sessionId: session.id,
      referrerType,
      referrerId,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/embed/listen");
  }
}

// PATCH: End an embed listening session
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    await prisma.listeningSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "/api/embed/listen");
  }
}
