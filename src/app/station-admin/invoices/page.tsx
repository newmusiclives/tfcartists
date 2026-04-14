"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  FileText,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SponsorEntry {
  id: string;
  businessName: string;
  contactName: string | null;
  email: string | null;
  sponsorshipTier: string | null;
  monthlyAmount: number | null;
}

export default function InvoicesPage() {
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sponsors/inquiry?status=ACTIVE,CLOSED_WON&limit=200");
      if (res.ok) {
        const data = await res.json();
        setSponsors(data.sponsors || data || []);
      }
    } catch {
      // try alternate endpoint
      try {
        const res = await fetch("/api/growth-partners");
        if (res.ok) {
          const data = await res.json();
          setSponsors(
            (data.sponsors || data || []).map((s: any) => ({
              id: s.id,
              businessName: s.businessName || s.name || "Unknown",
              contactName: s.contactName || null,
              email: s.email || null,
              sponsorshipTier: s.sponsorshipTier || s.tier || null,
              monthlyAmount: s.monthlyAmount || 0,
            }))
          );
        }
      } catch {
        // ignore
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const generateInvoice = async (sponsorId: string) => {
    setGenerating(sponsorId);
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}/invoice?month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewHtml(data.html);
      }
    } catch {
      // ignore
    }
    setGenerating(null);
  };

  const generateAll = async () => {
    if (sponsors.length === 0) return;
    // Generate first one as preview
    await generateInvoice(sponsors[0].id);
  };

  const openInNewTab = () => {
    if (!previewHtml) return;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(previewHtml);
      w.document.close();
    }
  };

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthLabel = new Date(`${month}-01`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              Sponsor Invoices
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Generate and preview monthly sponsor invoices
            </p>
          </div>
          <button
            onClick={fetchSponsors}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-zinc-800 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold min-w-[200px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-zinc-800 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <>
            {/* Generate All */}
            <div className="flex justify-end mb-4">
              <button
                onClick={generateAll}
                disabled={sponsors.length === 0}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                Generate All Invoices
              </button>
            </div>

            {/* Sponsor List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-800/50 border-b border-zinc-700">
                    <th className="text-left px-6 py-3 font-medium text-zinc-400">
                      Business
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-400">
                      Contact
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-zinc-400">
                      Tier
                    </th>
                    <th className="text-right px-6 py-3 font-medium text-zinc-400">
                      Amount
                    </th>
                    <th className="text-right px-6 py-3 font-medium text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {sponsors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                        No active sponsors found.
                      </td>
                    </tr>
                  ) : (
                    sponsors.map((sp) => (
                      <tr key={sp.id} className="hover:bg-zinc-800/30">
                        <td className="px-6 py-3 font-medium text-zinc-200">
                          {sp.businessName}
                        </td>
                        <td className="px-6 py-3 text-zinc-400">
                          {sp.contactName || sp.email || "—"}
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs capitalize">
                            {sp.sponsorshipTier || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-zinc-300">
                          {sp.monthlyAmount
                            ? `$${sp.monthlyAmount.toLocaleString()}`
                            : "—"}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => generateInvoice(sp.id)}
                            disabled={generating === sp.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 disabled:opacity-50"
                          >
                            {generating === sp.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            Generate Invoice
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Preview Modal */}
        {previewHtml && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-200">Invoice Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openInNewTab}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30"
                  >
                    <Download className="w-3 h-3" />
                    Open for Print
                  </button>
                  <button
                    onClick={() => setPreviewHtml(null)}
                    className="p-2 hover:bg-zinc-800 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full min-h-[600px]"
                  style={{ border: "none" }}
                  title="Invoice Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
