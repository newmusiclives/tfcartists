import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateInvoiceHtml, type InvoiceData, type InvoiceLineItem } from "@/lib/sponsors/invoice-template";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    // Fetch sponsor
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        sponsorships: {
          where: { status: "active" },
        },
      },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    // Get the first station for header info
    const station = await prisma.station.findFirst({
      where: { deletedAt: null, isActive: true },
      select: { name: true },
    });

    const [year, monthNum] = month.split("-");
    const shortId = id.slice(0, 6).toUpperCase();
    const invoiceNumber = `INV-${year}${monthNum}-${shortId}`;

    // Build line items from active sponsorships
    const lineItems: InvoiceLineItem[] = sponsor.sponsorships.map((sp) => ({
      description: `${sp.tier.charAt(0).toUpperCase() + sp.tier.slice(1)} Sponsorship — ${month}`,
      quantity: 1,
      unitPrice: sp.monthlyAmount,
      total: sp.monthlyAmount,
    }));

    // Add ad spots if any
    const adCount = await prisma.sponsorAd.count({
      where: { sponsorId: id, isActive: true },
    });

    if (adCount > 0 && lineItems.length === 0) {
      lineItems.push({
        description: `Active Ad Spots (${adCount}) — ${month}`,
        quantity: adCount,
        unitPrice: 0,
        total: 0,
      });
    }

    if (lineItems.length === 0) {
      lineItems.push({
        description: `Sponsorship — ${month}`,
        quantity: 1,
        unitPrice: sponsor.monthlyAmount || 0,
        total: sponsor.monthlyAmount || 0,
      });
    }

    const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
    const total = subtotal;

    const invoiceDate = new Date(`${month}-01`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dueDateObj = new Date(`${month}-01`);
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDate = dueDateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const invoiceData: InvoiceData = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      stationName: station?.name || "TrueFans RADIO",
      billTo: {
        businessName: sponsor.businessName,
        contactName: sponsor.contactName || undefined,
        email: sponsor.email || undefined,
        phone: sponsor.phone || undefined,
      },
      lineItems,
      subtotal,
      total,
      paymentTerms: "Net 30 — Payment due within 30 days of invoice date.",
    };

    const html = generateInvoiceHtml(invoiceData);

    logger.info("Generated invoice", { sponsorId: id, month, invoiceNumber });

    return NextResponse.json({
      invoiceNumber,
      month,
      sponsor: {
        id: sponsor.id,
        businessName: sponsor.businessName,
        contactName: sponsor.contactName,
        email: sponsor.email,
      },
      invoiceData,
      html,
    });
  } catch (error) {
    logger.error("Failed to generate invoice", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
