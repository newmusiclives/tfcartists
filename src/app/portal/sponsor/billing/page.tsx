"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SharedNav } from "@/components/shared-nav";
import { SponsorPortalNav } from "@/components/sponsor-portal-nav";
import {
  CreditCard,
  Loader2,
  Download,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ArrowUpRight,
} from "lucide-react";

interface BillingData {
  billing: {
    currentTier: string | null;
    monthlyAmount: number;
    totalPaid: number;
    totalPending: number;
    paymentMethod: string;
    nextRenewalDate: string | null;
    contractStart: string | null;
    contractEnd: string | null;
    isActive: boolean;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    month: string;
    monthLabel: string;
    amount: number;
    status: string;
    tier: string;
    downloadUrl: string;
  }>;
  sponsor: {
    id: string;
    businessName: string;
    contactName: string;
    email: string;
  };
}

export default function SponsorBillingPage() {
  const searchParams = useSearchParams();
  const sponsorId = searchParams.get("sponsorId") || "";

  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchBilling = useCallback(async () => {
    if (!sponsorId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/portal/sponsor/billing?sponsorId=${encodeURIComponent(sponsorId)}`
      );
      if (res.ok) {
        setData(await res.json());
      } else if (res.status === 404) {
        setError("Sponsor not found.");
      } else {
        setError("Failed to load billing data.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [sponsorId]);

  useEffect(() => {
    if (sponsorId) fetchBilling();
  }, [sponsorId, fetchBilling]);

  if (!sponsorId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
        <SharedNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Building2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sponsor Billing</h1>
          <p className="text-gray-600 dark:text-zinc-400 mb-4">Please access this page from the sponsor dashboard.</p>
          <a href="/portal/sponsor" className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-600">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const downloadInvoice = async (url: string, invoiceNumber: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (json.html) {
        const blob = new Blob([json.html], { type: "text/html" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${invoiceNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      <SharedNav />
      <SponsorPortalNav sponsorId={sponsorId} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
          <p className="text-gray-500 dark:text-zinc-500">Payment history and invoices via Manifest Financial</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg p-4 mb-6 text-sm">{error}</div>
        )}

        {data && !loading && (
          <>
            {/* Billing Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <BillingCard
                icon={<CreditCard className="w-5 h-5 text-blue-500" />}
                label="Current Plan"
                value={data.billing.currentTier
                  ? data.billing.currentTier.charAt(0).toUpperCase() + data.billing.currentTier.slice(1)
                  : "No Active Plan"}
                sublabel={data.billing.isActive ? "Active" : "Inactive"}
                sublabelColor={data.billing.isActive ? "text-green-600" : "text-gray-400"}
              />
              <BillingCard
                icon={<DollarSign className="w-5 h-5 text-green-500" />}
                label="Monthly Amount"
                value={`$${data.billing.monthlyAmount.toLocaleString()}`}
                sublabel="via Manifest Financial"
                sublabelColor="text-gray-500"
              />
              <BillingCard
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                label="Total Paid"
                value={`$${data.billing.totalPaid.toLocaleString()}`}
                sublabel={`$${data.billing.totalPending.toLocaleString()} pending`}
                sublabelColor="text-amber-600"
              />
              <BillingCard
                icon={<Calendar className="w-5 h-5 text-purple-500" />}
                label="Next Renewal"
                value={
                  data.billing.nextRenewalDate
                    ? new Date(data.billing.nextRenewalDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A"
                }
                sublabel={
                  data.billing.contractEnd
                    ? `Contract ends ${new Date(data.billing.contractEnd).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                    : "No end date"
                }
                sublabelColor="text-gray-500"
              />
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Manifest Financial</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-500">
                      Payments processed securely through Manifest Financial
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    data.billing.isActive
                      ? "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {data.billing.isActive ? (
                      <><CheckCircle2 className="w-3 h-3" /> Active</>
                    ) : (
                      <><Clock className="w-3 h-3" /> Inactive</>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Contract Details */}
            {(data.billing.contractStart || data.billing.contractEnd) && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 mb-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  Contract Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {data.billing.contractStart && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">Start Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(data.billing.contractStart).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  {data.billing.contractEnd && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">End Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(data.billing.contractEnd).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">Renewal Status</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {data.billing.isActive ? "Auto-renewing monthly" : "Not active"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice History */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between p-6 pb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  Invoice History
                </h2>
                <span className="text-sm text-gray-500 dark:text-zinc-500">
                  {data.invoices.length} invoices
                </span>
              </div>

              {data.invoices.length === 0 ? (
                <div className="px-6 pb-6 text-sm text-gray-500 dark:text-zinc-500">
                  No invoices found.
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {(showAll ? data.invoices : data.invoices.slice(0, 12)).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            inv.status === "paid" ? "bg-green-500" : "bg-amber-400"
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-500">{inv.monthLabel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">${inv.amount.toLocaleString()}</p>
                            <p className={`text-xs font-medium ${
                              inv.status === "paid" ? "text-green-600" : "text-amber-600"
                            }`}>
                              {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </p>
                          </div>
                          <button
                            onClick={() => downloadInvoice(inv.downloadUrl, inv.invoiceNumber)}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Download invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {data.invoices.length > 12 && !showAll && (
                    <div className="p-4 border-t border-gray-100 text-center">
                      <button
                        onClick={() => setShowAll(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Show all {data.invoices.length} invoices
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Support Contact */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-blue-900">Billing Questions?</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Our team can help with payment issues, invoice disputes, or plan changes.
              </p>
              <a
                href={`mailto:sponsors@truefansradio.com?subject=Billing Inquiry - ${encodeURIComponent(data.sponsor.businessName)}`}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Contact Billing Support
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BillingCard({
  icon,
  label,
  value,
  sublabel,
  sublabelColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  sublabelColor: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border">
      <div className="mb-3">{icon}</div>
      <p className="text-xs text-gray-500 dark:text-zinc-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      <p className={`text-xs mt-1 ${sublabelColor}`}>{sublabel}</p>
    </div>
  );
}
