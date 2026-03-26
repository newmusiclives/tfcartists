"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface InvoiceData {
  artistName: string;
  artistEmail: string;
  period: string;
  tier: string;
  shares: number;
  earnings: number;
  paid: boolean;
  paidAt: string | null;
}

export default function InvoicePage() {
  const searchParams = useSearchParams();
  const artistId = searchParams.get("artistId");
  const period = searchParams.get("period");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId || !period) return;

    async function fetchInvoice() {
      try {
        // Fetch artist info
        const artistRes = await fetch(`/api/artists?search=${encodeURIComponent(artistId!)}&limit=1`);
        let artistInfo = { name: "Artist", email: "" };
        // Try direct ID lookup
        const directRes = await fetch(`/api/portal/artist/stats?artistId=${artistId}`);

        // Fetch earnings for the period
        const earningsRes = await fetch(
          `/api/portal/artist/earnings?artistId=${artistId}&limit=24`
        );

        if (earningsRes.ok) {
          const earningsData = await earningsRes.json();
          const periodEarnings = earningsData.earnings?.find(
            (e: any) => e.period === period
          );

          if (periodEarnings) {
            // Also fetch artist name from payments
            const paymentsRes = await fetch(`/api/portal/artist/payments?artistId=${artistId}`);
            if (paymentsRes.ok) {
              const payData = await paymentsRes.json();
              // Use payment data if available
            }

            setInvoice({
              artistName: artistId || "Artist",
              artistEmail: "",
              period: periodEarnings.period,
              tier: periodEarnings.tier,
              shares: periodEarnings.shares,
              earnings: periodEarnings.earnings,
              paid: periodEarnings.paid,
              paidAt: periodEarnings.paidAt,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load invoice", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [artistId, period]);

  const formatPeriod = (p: string) => {
    const [year, month] = p.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Invoice not found.</p>
          <Link href="/portal/artist" className="text-amber-600 hover:underline">
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden bg-white border-b px-6 py-3 flex items-center justify-between">
        <Link
          href="/portal/artist"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Portal
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Download PDF
        </button>
      </div>

      {/* Invoice content */}
      <div className="max-w-2xl mx-auto my-8 print:my-0 bg-white rounded-lg shadow-sm print:shadow-none p-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EARNINGS STATEMENT</h1>
            <p className="text-sm text-gray-500 mt-1">TrueFans Radio</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Statement Period</p>
            <p className="text-lg font-semibold">{formatPeriod(invoice.period)}</p>
          </div>
        </div>

        {/* Artist info */}
        <div className="border-t border-b py-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Payee</p>
              <p className="font-medium text-gray-900">{invoice.artistName}</p>
              {invoice.artistEmail && (
                <p className="text-sm text-gray-600">{invoice.artistEmail}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  invoice.paid
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {invoice.paid ? "PAID" : "PENDING"}
              </span>
              {invoice.paidAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Paid {new Date(invoice.paidAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b">
              <th className="text-left text-xs text-gray-500 uppercase py-2">Description</th>
              <th className="text-right text-xs text-gray-500 uppercase py-2">Details</th>
              <th className="text-right text-xs text-gray-500 uppercase py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">
                <p className="font-medium">Radio Airplay Earnings</p>
                <p className="text-sm text-gray-500">
                  {formatPeriod(invoice.period)} revenue share
                </p>
              </td>
              <td className="py-3 text-right text-sm text-gray-600">
                {invoice.shares} shares ({invoice.tier})
              </td>
              <td className="py-3 text-right font-medium">
                ${invoice.earnings.toFixed(2)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="text-right font-semibold py-3">Total</td>
              <td className="text-right font-bold text-lg py-3">
                ${invoice.earnings.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment method */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
          <p className="text-sm font-medium text-gray-900">Manifest Financial</p>
          <p className="text-xs text-gray-500 mt-1">
            Payments are processed through Manifest Financial and deposited to your registered account.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t">
          <p>TrueFans Radio &mdash; Artist Earnings Statement</p>
          <p className="mt-1">
            Generated {new Date().toLocaleDateString()} &middot; For questions, contact support@truefans.fm
          </p>
        </div>
      </div>
    </div>
  );
}
