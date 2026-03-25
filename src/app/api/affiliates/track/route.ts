import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const AFFILIATE_PREFIX = "affiliate:";
const COOKIE_NAME = "tfr_ref";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * GET /api/affiliates/track?ref=CODE — Record a referral click and set tracking cookie
 */
export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get("ref");
    if (!ref) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    // Find the affiliate with this referral code
    const allAffiliates = await prisma.systemConfig.findMany({
      where: { category: "affiliate" },
    });

    let matchedAffiliate: { key: string; value: string } | null = null;
    for (const record of allAffiliates) {
      try {
        const data = JSON.parse(record.value);
        if (data.referralCode === ref && data.status === "active") {
          matchedAffiliate = record;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!matchedAffiliate) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    // Increment click count
    const data = JSON.parse(matchedAffiliate.value);
    data.totalClicks = (data.totalClicks || 0) + 1;

    await prisma.systemConfig.update({
      where: { key: matchedAffiliate.key },
      data: { value: JSON.stringify(data) },
    });

    logger.info("Affiliate referral click", {
      referralCode: ref,
      affiliate: data.email,
      totalClicks: data.totalClicks,
    });

    // Redirect to operator signup with ref param, setting the tracking cookie
    const redirectUrl = new URL("/operator/signup", request.nextUrl.origin);
    redirectUrl.searchParams.set("ref", ref);

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(COOKIE_NAME, ref, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error, "/api/affiliates/track");
  }
}

/**
 * POST /api/affiliates/track — Attribute a signup to an affiliate
 * Called internally when an operator signs up with a referral cookie.
 * Body: { referralCode, operatorEmail, plan }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, operatorEmail, plan } = body;

    if (!referralCode || !operatorEmail) {
      return NextResponse.json(
        { error: "referralCode and operatorEmail required" },
        { status: 400 }
      );
    }

    // Find the affiliate
    const allAffiliates = await prisma.systemConfig.findMany({
      where: { category: "affiliate" },
    });

    let matchedRecord: { key: string; value: string } | null = null;
    for (const record of allAffiliates) {
      try {
        const data = JSON.parse(record.value);
        if (data.referralCode === referralCode) {
          matchedRecord = record;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!matchedRecord) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const data = JSON.parse(matchedRecord.value);

    // Check for duplicate referral
    const alreadyReferred = (data.referrals || []).some(
      (r: { operatorEmail: string }) => r.operatorEmail === operatorEmail
    );
    if (alreadyReferred) {
      return NextResponse.json({ error: "Operator already referred" }, { status: 409 });
    }

    // Add referral
    const referral = {
      operatorEmail,
      signupDate: new Date().toISOString(),
      plan: plan || "unknown",
      status: "pending",
      commission: 0,
    };
    data.referrals = [...(data.referrals || []), referral];

    await prisma.systemConfig.update({
      where: { key: matchedRecord.key },
      data: { value: JSON.stringify(data) },
    });

    logger.info("Affiliate referral attributed", {
      referralCode,
      operatorEmail,
      affiliate: data.email,
    });

    return NextResponse.json({
      success: true,
      message: "Referral attributed successfully.",
    });
  } catch (error) {
    return handleApiError(error, "/api/affiliates/track");
  }
}
