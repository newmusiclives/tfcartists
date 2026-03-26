import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/sponsor/billing?sponsorId=xxx
 * Returns billing and payment history for a sponsor via Manifest Financial
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get("sponsorId");

    if (!sponsorId) {
      return NextResponse.json({ error: "sponsorId is required" }, { status: 400 });
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      include: {
        sponsorships: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const activeSponsorships = sponsor.sponsorships.filter((s) => s.status === "active");
    const currentTier = sponsor.sponsorshipTier || activeSponsorships[0]?.tier || null;
    const monthlyAmount = sponsor.monthlyAmount || activeSponsorships[0]?.monthlyAmount || 0;

    // Generate invoice history from sponsorship records
    // Each active month of a sponsorship = one invoice
    const invoices: Array<{
      id: string;
      invoiceNumber: string;
      month: string;
      monthLabel: string;
      amount: number;
      status: string;
      tier: string;
      downloadUrl: string;
    }> = [];

    for (const sp of sponsor.sponsorships) {
      const start = new Date(sp.startDate);
      const end = sp.endDate ? new Date(sp.endDate) : new Date();
      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

      while (cursor <= end) {
        const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const shortId = sponsorId.slice(0, 6).toUpperCase();
        const invoiceNumber = `INV-${cursor.getFullYear()}${String(cursor.getMonth() + 1).padStart(2, "0")}-${shortId}`;

        const isPast = cursor < new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        invoices.push({
          id: `${sp.id}-${monthKey}`,
          invoiceNumber,
          month: monthKey,
          monthLabel,
          amount: sp.monthlyAmount,
          status: isPast ? "paid" : "pending",
          tier: sp.tier,
          downloadUrl: `/api/sponsors/${sponsorId}/invoice?month=${monthKey}`,
        });

        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    // Sort invoices newest first
    invoices.sort((a, b) => b.month.localeCompare(a.month));

    // Calculate totals
    const totalPaid = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalPending = invoices
      .filter((inv) => inv.status === "pending")
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Next renewal date
    const activeSponsorship = activeSponsorships[0];
    let nextRenewalDate: string | null = null;
    if (activeSponsorship) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      nextRenewalDate = nextMonth.toISOString();
    }

    // Contract dates
    const contractStart = sponsor.contractStart;
    const contractEnd = sponsor.contractEnd;

    return NextResponse.json({
      billing: {
        currentTier,
        monthlyAmount,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalPending: Math.round(totalPending * 100) / 100,
        paymentMethod: "Manifest Financial",
        nextRenewalDate,
        contractStart,
        contractEnd,
        isActive: activeSponsorships.length > 0,
      },
      invoices,
      sponsor: {
        id: sponsor.id,
        businessName: sponsor.businessName,
        contactName: sponsor.contactName,
        email: sponsor.email,
      },
    });
  } catch (error) {
    logger.error("Error fetching sponsor billing", { error });
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}
