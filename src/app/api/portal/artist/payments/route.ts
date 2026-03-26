import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/artist/payments?artistId=xxx
 * Payment history from AirplayPayment records (Manifest Financial)
 */
export async function GET(request: NextRequest) {
  try {
    const artistId = request.nextUrl.searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json({ error: "Missing artistId" }, { status: 400 });
    }

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, email: true },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Get airplay payments (tier subscription payments)
    const payments = await prisma.airplayPayment.findMany({
      where: { artistId },
      orderBy: { createdAt: "desc" },
    });

    // Get earnings that have been paid out
    const paidEarnings = await prisma.radioEarnings.findMany({
      where: { artistId, paid: true },
      orderBy: { period: "desc" },
    });

    // Get pending earnings
    const pendingEarnings = await prisma.radioEarnings.findMany({
      where: { artistId, paid: false },
      orderBy: { period: "desc" },
    });

    logger.info("Fetched artist payment history", { artistId });

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        tier: p.tier,
        amount: p.amount,
        period: p.period,
        status: p.status,
        paymentMethod: p.paymentMethod || "Manifest Financial",
        transactionId: p.transactionId,
        date: p.createdAt,
      })),
      payouts: paidEarnings.map((e) => ({
        id: e.id,
        period: e.period,
        earnings: e.earnings,
        shares: e.shares,
        tier: e.tier,
        paidAt: e.paidAt,
      })),
      pendingPayouts: pendingEarnings.map((e) => ({
        id: e.id,
        period: e.period,
        earnings: e.earnings,
        shares: e.shares,
        tier: e.tier,
      })),
      summary: {
        totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
        totalPayouts: paidEarnings.reduce((sum, e) => sum + e.earnings, 0),
        pendingAmount: pendingEarnings.reduce((sum, e) => sum + e.earnings, 0),
      },
    });
  } catch (error) {
    logger.error("Error fetching artist payments", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
