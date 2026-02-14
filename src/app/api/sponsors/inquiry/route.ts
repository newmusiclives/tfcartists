import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      contactName,
      email,
      phone,
      city,
      businessType,
      sponsorshipTier,
    } = body;

    if (!businessName || !email) {
      return NextResponse.json(
        { error: "Business name and email are required" },
        { status: 400 }
      );
    }

    // Check for existing sponsor by email
    const existing = await prisma.sponsor.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A sponsor with this email already exists", sponsorId: existing.id },
        { status: 409 }
      );
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        businessName,
        contactName: contactName || null,
        email,
        phone: phone || null,
        city: city || null,
        businessType: businessType || "other",
        discoverySource: "website_inquiry",
        status: "DISCOVERED",
        pipelineStage: "discovery",
        sponsorshipTier: sponsorshipTier || null,
      },
    });

    // Log activity
    await prisma.harperActivity.create({
      data: {
        action: "sponsor_inquiry_received",
        sponsorId: sponsor.id,
        details: {
          sponsorName: businessName,
          tier: sponsorshipTier,
          source: "website",
        },
        successful: true,
      },
    });

    return NextResponse.json({ sponsor }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/sponsors/inquiry");
  }
}
