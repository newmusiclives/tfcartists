import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const dynamic = "force-dynamic";

const AFFILIATE_PREFIX = "affiliate:";

const signupSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  company: z.string().min(1).max(200),
  website: z.string().url().optional().or(z.literal("")),
  referralCode: z.string().min(3).max(30).optional(),
  promotionMethod: z.string().max(500).optional(),
});

/**
 * Generate a referral code from company name.
 * e.g. "Digital Media Agency" -> "DMA-7f3a"
 */
function generateReferralCode(company: string): string {
  const initials = company
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase())
    .filter(Boolean)
    .join("")
    .slice(0, 4);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${initials || "REF"}-${suffix}`;
}

/**
 * POST /api/affiliates — Create a new affiliate record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, company, website, referralCode, promotionMethod } = parsed.data;

    // Check if affiliate already exists
    const existingKey = `${AFFILIATE_PREFIX}${email}`;
    const existing = await prisma.systemConfig.findUnique({
      where: { key: existingKey },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An affiliate account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate or validate referral code
    let code = referralCode || generateReferralCode(company);

    // Ensure code uniqueness
    const allAffiliates = await prisma.systemConfig.findMany({
      where: { category: "affiliate" },
    });
    const existingCodes = new Set(
      allAffiliates.map((a) => {
        try {
          return JSON.parse(a.value).referralCode;
        } catch {
          return null;
        }
      })
    );
    while (existingCodes.has(code)) {
      code = generateReferralCode(company);
    }

    const affiliateData = {
      name,
      email,
      company,
      website: website || "",
      referralCode: code,
      promotionMethod: promotionMethod || "",
      status: "active",
      createdAt: new Date().toISOString(),
      referrals: [] as Array<{
        operatorEmail: string;
        signupDate: string;
        plan: string;
        status: string;
        commission: number;
      }>,
      payouts: [] as Array<{
        month: string;
        amount: number;
        status: string;
        paidAt?: string;
      }>,
      totalClicks: 0,
      lifetimeEarnings: 0,
    };

    await prisma.systemConfig.create({
      data: {
        key: existingKey,
        value: JSON.stringify(affiliateData),
        category: "affiliate",
        label: `Affiliate: ${company} (${name})`,
        encrypted: false,
      },
    });

    logger.info("Affiliate created", { email, company, referralCode: code });

    return NextResponse.json(
      {
        success: true,
        referralCode: code,
        message: "Affiliate account created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/affiliates");
  }
}

/**
 * GET /api/affiliates?email=... — Return affiliate stats
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
    }

    const record = await prisma.systemConfig.findUnique({
      where: { key: `${AFFILIATE_PREFIX}${email}` },
    });
    if (!record) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const data = JSON.parse(record.value);

    // Calculate stats
    const referrals = data.referrals || [];
    const activeStations = referrals.filter(
      (r: { status: string }) => r.status === "active"
    ).length;
    const monthlyCommission = referrals
      .filter((r: { status: string }) => r.status === "active")
      .reduce((sum: number, r: { commission: number }) => sum + (r.commission || 0), 0);

    return NextResponse.json({
      name: data.name,
      email: data.email,
      company: data.company,
      website: data.website,
      referralCode: data.referralCode,
      status: data.status,
      createdAt: data.createdAt,
      stats: {
        totalReferrals: referrals.length,
        activeStations,
        monthlyCommission,
        lifetimeEarnings: data.lifetimeEarnings || 0,
        totalClicks: data.totalClicks || 0,
      },
      referrals,
      payouts: data.payouts || [],
    });
  } catch (error) {
    return handleApiError(error, "/api/affiliates");
  }
}
