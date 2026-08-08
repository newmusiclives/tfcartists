import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { flag } from "@/lib/flags";
import { paymentsStatus } from "@/lib/payments/gate";
import { manifest } from "@/lib/payments/manifest";
import {
  SPONSOR_PACKAGE_LIST,
  resolveSponsorPackage,
  totalAiringsPerMonth,
} from "@/lib/sponsors/packages";

export const dynamic = "force-dynamic";

/**
 * Sponsor self-serve: a local business buys airtime without a sales call.
 *
 * This is the flow the economics require, not a convenience. A $45/month
 * sponsorship is worth $540 a year; winning one by hand takes two to four
 * hours of outreach, a conversation and ad copy, so a human sales process
 * costs more than the sponsorship earns. Ten stations at seven sponsors each
 * is seventy relationships to renew annually - a full-time salesperson costing
 * more than the whole portfolio brings in.
 *
 * Self-serve turns that loss-making sale into a zero-touch subscription. The
 * marginal cost of the ad itself is about a cent, because the TTS pipeline
 * already exists.
 *
 * Deliberately unauthenticated: the buyer is a bakery, not a platform user.
 * Requiring an account here would reintroduce exactly the friction the flow
 * exists to remove. It is gated instead by the `sponsor_self_serve` flag and
 * by the payments gate, and it writes only its own rows.
 */

/** Roughly 30 words. Long enough for a real ad, short enough to read in 15s. */
const MAX_COPY_CHARS = 220;
const MIN_COPY_CHARS = 20;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  // The rate card, so the page and the charge cannot disagree.
  return NextResponse.json({
    enabled: await flag("sponsor_self_serve"),
    packages: SPONSOR_PACKAGE_LIST.map((p) => ({
      key: p.key,
      name: p.name,
      price: p.price,
      spotsPerDay: p.spotsPerDay,
      spotsPerMonth: p.spotsPerMonth,
      bonusSpotsPerMonth: totalAiringsPerMonth(p.key) - p.spotsPerMonth,
      totalAiringsPerMonth: totalAiringsPerMonth(p.key),
      pitch: p.pitch,
    })),
    maxCopyChars: MAX_COPY_CHARS,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!(await flag("sponsor_self_serve"))) {
      return NextResponse.json(
        { error: "Self-serve advertising is not open on this station yet." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
    }

    const { businessName, email, packageKey, adCopy, phone, city, businessType } = body;

    // Validate before touching the database or the payment provider, and say
    // which field is wrong - a generic "invalid request" on a checkout form is
    // how you lose the sale you just spent nothing acquiring.
    if (typeof businessName !== "string" || businessName.trim().length < 2) {
      return NextResponse.json({ error: "Enter your business name.", field: "businessName" }, { status: 400 });
    }
    if (typeof email !== "string" || !EMAIL.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });
    }

    const pkg = typeof packageKey === "string" ? resolveSponsorPackage(packageKey) : null;
    if (!pkg) {
      return NextResponse.json(
        {
          error: "Choose one of the advertising packages.",
          field: "packageKey",
          valid: SPONSOR_PACKAGE_LIST.map((p) => p.key),
        },
        { status: 400 },
      );
    }

    const copy = typeof adCopy === "string" ? adCopy.trim() : "";
    if (copy.length < MIN_COPY_CHARS) {
      return NextResponse.json(
        { error: `Your ad needs at least ${MIN_COPY_CHARS} characters.`, field: "adCopy" },
        { status: 400 },
      );
    }
    if (copy.length > MAX_COPY_CHARS) {
      return NextResponse.json(
        {
          error: `Your ad is ${copy.length} characters. Trim it to ${MAX_COPY_CHARS} so it fits a 15-second spot.`,
          field: "adCopy",
        },
        { status: 400 },
      );
    }

    // Payments must be live before a sponsor is told they are booked. Recording
    // the intent and quietly charging nobody would put an ad on air for free
    // and leave an invoice nobody raised.
    const payments = await paymentsStatus();
    if (!payments.enabled) {
      return NextResponse.json(
        { error: payments.message, reason: payments.reason, charged: false },
        { status: 503 },
      );
    }

    const normalisedEmail = email.trim().toLowerCase();

    // A business coming back to buy again is the same sponsor, not a duplicate.
    // email is unique on Sponsor, so an upsert is also what keeps the insert
    // from failing on a returning customer.
    const sponsor = await prisma.sponsor.upsert({
      where: { email: normalisedEmail },
      create: {
        businessName: businessName.trim(),
        email: normalisedEmail,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
        city: typeof city === "string" && city.trim() ? city.trim() : null,
        businessType: typeof businessType === "string" && businessType.trim() ? businessType.trim() : "unknown",
        discoverySource: "self_serve",
        status: "DISCOVERED",
        pipelineStage: "negotiating",
        assignedTo: "self_serve",
      },
      update: {
        businessName: businessName.trim(),
        pipelineStage: "negotiating",
      },
    });

    let subscription;
    try {
      subscription = await manifest.createSponsorshipSubscription({
        sponsorId: sponsor.id,
        tier: pkg.key,
        email: normalisedEmail,
        businessName: sponsor.businessName,
      });
    } catch (err) {
      logger.error("Self-serve checkout failed at the payment provider", {
        sponsorId: sponsor.id,
        package: pkg.key,
        error: err,
      });
      return NextResponse.json(
        { error: "We could not start the payment. Nothing has been charged - please try again.", charged: false },
        { status: 502 },
      );
    }

    // The ad copy is stored against a pending sponsorship. It is NOT sent for
    // voicing yet: TTS costs money, and rendering copy for a checkout that is
    // never completed pays to produce ads nobody bought. The subscription
    // webhook activates it once the first payment clears.
    const sponsorship = await prisma.sponsorship.create({
      data: {
        sponsorId: sponsor.id,
        tier: pkg.key,
        monthlyAmount: pkg.price,
        adSpotsPerMonth: pkg.spotsPerMonth,
        startDate: new Date(),
        status: "pending_payment",
        metadata: {
          source: "self_serve",
          adCopy: copy,
          // Held so the activation step can render exactly what was bought,
          // and so a dispute can be answered with the words the sponsor typed.
          submittedAt: new Date().toISOString(),
          subscriptionId: subscription.subscriptionId,
          bonusSpotsPerMonth: totalAiringsPerMonth(pkg.key) - pkg.spotsPerMonth,
        },
      },
    });

    logger.info("Self-serve sponsorship started", {
      sponsorId: sponsor.id,
      sponsorshipId: sponsorship.id,
      package: pkg.key,
      amount: pkg.price,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: subscription.checkoutUrl,
      subscriptionId: subscription.subscriptionId,
      sponsorshipId: sponsorship.id,
      package: {
        key: pkg.key,
        name: pkg.name,
        price: pkg.price,
        spotsPerMonth: pkg.spotsPerMonth,
        bonusSpotsPerMonth: totalAiringsPerMonth(pkg.key) - pkg.spotsPerMonth,
      },
    });
  } catch (err) {
    logger.error("Self-serve sponsorship failed", { error: err });
    return NextResponse.json(
      { error: "Something went wrong starting your advertising. Nothing has been charged.", charged: false },
      { status: 500 },
    );
  }
}
