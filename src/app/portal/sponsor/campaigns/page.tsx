"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SharedNav } from "@/components/shared-nav";
import { SponsorPortalNav } from "@/components/sponsor-portal-nav";
import {
  Megaphone,
  Loader2,
  Calendar,
  DollarSign,
  Eye,
  ChevronRight,
  Filter,
  Building2,
} from "lucide-react";

interface Campaign {
  id: string;
  tier: string;
  monthlyAmount: number;
  startDate: string;
  endDate: string | null;
  status: string;
  computedStatus: string;
  adSpotsPerMonth: number | null;
  socialMentions: number | null;
  eventPromotion: boolean;
  estimatedImpressions: number;
}

interface CampaignData {
  campaigns: Campaign[];
  summary: {
    total: number;
    active: number;
    completed: number;
    upcoming: number;
  };
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
  completed: { bg: "bg-gray-100", text: "text-gray-700", label: "Completed" },
  upcoming: { bg: "bg-blue-100", text: "text-blue-700", label: "Upcoming" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
  paused: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Paused" },
};

export default function SponsorCampaignsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sponsorId = searchParams.get("sponsorId") || "";

  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!sponsorId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/portal/sponsor/campaigns?sponsorId=${encodeURIComponent(sponsorId)}`
      );
      if (res.ok) {
        setData(await res.json());
      } else if (res.status === 404) {
        setError("Sponsor not found.");
      } else {
        setError("Failed to load campaigns.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [sponsorId]);

  useEffect(() => {
    if (sponsorId) fetchCampaigns();
  }, [sponsorId, fetchCampaigns]);

  if (!sponsorId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Building2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sponsor Campaigns</h1>
          <p className="text-gray-600 mb-4">Please access this page from the sponsor dashboard.</p>
          <a
            href="/portal/sponsor"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-600"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const filteredCampaigns = data?.campaigns.filter((c) =>
    filter === "all" ? true : c.computedStatus === filter
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <SponsorPortalNav sponsorId={sponsorId} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-500">View and manage your sponsorship campaigns</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-6 text-sm">{error}</div>
        )}

        {data && !loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SummaryCard label="Total" value={data.summary.total} color="gray" />
              <SummaryCard label="Active" value={data.summary.active} color="green" />
              <SummaryCard label="Completed" value={data.summary.completed} color="blue" />
              <SummaryCard label="Upcoming" value={data.summary.upcoming} color="purple" />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-4 h-4 text-gray-400" />
              {["all", "active", "completed", "upcoming"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filter === f
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Campaign List */}
            {filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-gray-500">
                No {filter === "all" ? "" : filter} campaigns found.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign) => {
                  const style = STATUS_STYLES[campaign.computedStatus] || STATUS_STYLES.active;
                  const isExpanded = expandedId === campaign.id;

                  return (
                    <div
                      key={campaign.id}
                      className="bg-white rounded-xl shadow-sm border overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : campaign.id)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {campaign.tier.charAt(0).toUpperCase() + campaign.tier.slice(1)} Sponsorship
                              </p>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                                {style.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(campaign.startDate).toLocaleDateString()}
                              {campaign.endDate
                                ? ` - ${new Date(campaign.endDate).toLocaleDateString()}`
                                : " - Ongoing"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900">
                              ${campaign.monthlyAmount}/mo
                            </p>
                            <p className="text-xs text-gray-500">
                              {campaign.estimatedImpressions.toLocaleString()} impressions
                            </p>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <DetailItem
                              icon={<DollarSign className="w-4 h-4 text-green-500" />}
                              label="Monthly Amount"
                              value={`$${campaign.monthlyAmount}`}
                            />
                            <DetailItem
                              icon={<Eye className="w-4 h-4 text-blue-500" />}
                              label="Est. Impressions"
                              value={campaign.estimatedImpressions.toLocaleString()}
                            />
                            <DetailItem
                              icon={<Megaphone className="w-4 h-4 text-amber-500" />}
                              label="Ad Spots/Month"
                              value={campaign.adSpotsPerMonth ? String(campaign.adSpotsPerMonth) : "N/A"}
                            />
                            <DetailItem
                              icon={<Calendar className="w-4 h-4 text-purple-500" />}
                              label="Status"
                              value={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            />
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {campaign.socialMentions && campaign.socialMentions > 0 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                {campaign.socialMentions} social mentions/mo
                              </span>
                            )}
                            {campaign.eventPromotion && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                                Event promotion included
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gray: "text-gray-900",
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color] || "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
