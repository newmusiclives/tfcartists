import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { embedListenSchema, embedListenPatchSchema } from "@/lib/validation/schemas";

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
    // Rate limit embed session creation
    const rateLimitResponse = await withRateLimit(request, "api");
    if (rateLimitResponse) return rateLimitResponse;

    // Validate input
    const body = await request.json();
    const parsed = embedListenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { ref, device } = parsed.data;

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
    const rateLimitResponse = await withRateLimit(request, "api");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const parsed = embedListenPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { sessionId } = parsed.data;

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
