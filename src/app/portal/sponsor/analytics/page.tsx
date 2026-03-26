"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SharedNav } from "@/components/shared-nav";
import { SponsorPortalNav } from "@/components/sponsor-portal-nav";
import {
  BarChart3,
  Loader2,
  TrendingUp,
  Clock,
  MapPin,
  Building2,
  Megaphone,
} from "lucide-react";

interface MonthlyDataPoint {
  month: string;
  label: string;
  impressions: number;
  listeners: number;
}

interface AnalyticsData {
  monthlyData: MonthlyDataPoint[];
  daypartBreakdown: Record<string, number>;
  topLocations: Array<{ location: string; count: number }>;
  campaignComparison: Array<{
    id: string;
    tier: string;
    startDate: string;
    endDate: string | null;
    monthlyAmount: number;
    impressions: number;
    status: string;
  }>;
  adBreakdown: Array<{
    id: string;
    title: string;
    playCount: number;
    tier: string;
    isActive: boolean;
  }>;
}

const DAYPART_LABELS: Record<string, { name: string; time: string; color: string }> = {
  morning: { name: "Morning", time: "6am-10am", color: "bg-amber-500" },
  midday: { name: "Midday", time: "10am-3pm", color: "bg-blue-500" },
  afternoon: { name: "Afternoon", time: "3pm-7pm", color: "bg-orange-500" },
  evening: { name: "Evening", time: "7pm-12am", color: "bg-purple-500" },
  late_night: { name: "Late Night", time: "12am-6am", color: "bg-indigo-700" },
};

export default function SponsorAnalyticsPage() {
  const searchParams = useSearchParams();
  const sponsorId = searchParams.get("sponsorId") || "";

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(6);

  const fetchAnalytics = useCallback(async () => {
    if (!sponsorId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/portal/sponsor/analytics?sponsorId=${encodeURIComponent(sponsorId)}&months=${months}`
      );
      if (res.ok) {
        setData(await res.json());
      } else if (res.status === 404) {
        setError("Sponsor not found.");
      } else {
        setError("Failed to load analytics.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [sponsorId, months]);

  useEffect(() => {
    if (sponsorId) fetchAnalytics();
  }, [sponsorId, fetchAnalytics]);

  if (!sponsorId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Building2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sponsor Analytics</h1>
          <p className="text-gray-600 mb-4">Please access this page from the sponsor dashboard.</p>
          <a href="/portal/sponsor" className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-600">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <SponsorPortalNav sponsorId={sponsorId} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500">Ad performance and audience insights</p>
          </div>
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value, 10))}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
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
            {/* Impressions Over Time (bar chart) */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Ad Impressions Over Time</h2>
              </div>
              {data.monthlyData.length === 0 ? (
                <p className="text-sm text-gray-500">No impression data available yet.</p>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const maxImpressions = Math.max(...data.monthlyData.map((d) => d.impressions), 1);
                    return data.monthlyData.map((point) => {
                      const pct = (point.impressions / maxImpressions) * 100;
                      return (
                        <div key={point.month} className="flex items-center gap-4">
                          <div className="w-24 flex-shrink-0 text-right">
                            <p className="text-sm font-medium text-gray-700">{point.label}</p>
                          </div>
                          <div className="flex-1 relative">
                            <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-lg transition-all duration-500"
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-28 flex-shrink-0 text-right">
                            <span className="text-sm font-semibold text-gray-900">
                              {point.impressions.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">imp</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Listener Reach Over Time */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Listener Reach Over Time</h2>
              </div>
              {data.monthlyData.length === 0 ? (
                <p className="text-sm text-gray-500">No listener data available yet.</p>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const maxListeners = Math.max(...data.monthlyData.map((d) => d.listeners), 1);
                    return data.monthlyData.map((point) => {
                      const pct = (point.listeners / maxListeners) * 100;
                      return (
                        <div key={point.month} className="flex items-center gap-4">
                          <div className="w-24 flex-shrink-0 text-right">
                            <p className="text-sm font-medium text-gray-700">{point.label}</p>
                          </div>
                          <div className="flex-1 relative">
                            <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-lg transition-all duration-500"
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-28 flex-shrink-0 text-right">
                            <span className="text-sm font-semibold text-gray-900">
                              {point.listeners.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">listeners</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Peak Listening Hours */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Peak Listening Hours</h2>
                </div>
                {(() => {
                  const maxDaypart = Math.max(...Object.values(data.daypartBreakdown), 1);
                  return (
                    <div className="space-y-4">
                      {["morning", "midday", "afternoon", "evening", "late_night"].map((dp) => {
                        const info = DAYPART_LABELS[dp];
                        const plays = data.daypartBreakdown[dp] || 0;
                        const pct = (plays / maxDaypart) * 100;
                        return (
                          <div key={dp} className="flex items-center gap-3">
                            <div className="w-20 flex-shrink-0">
                              <p className="text-sm font-medium text-gray-700">{info.name}</p>
                              <p className="text-xs text-gray-400">{info.time}</p>
                            </div>
                            <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                              <div
                                className={`h-full ${info.color} rounded-lg transition-all`}
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 w-12 text-right">
                              {plays}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Audience Locations */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Audience Locations</h2>
                </div>
                {data.topLocations.length === 0 ? (
                  <p className="text-sm text-gray-500">Location data not yet available.</p>
                ) : (
                  <div className="space-y-3">
                    {data.topLocations.map((loc, i) => (
                      <div key={loc.location} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-medium flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-900">{loc.location}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {loc.count} sessions
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Comparison */}
            {data.campaignComparison.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <Megaphone className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Campaign Comparison</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-4 text-gray-500 font-medium">Campaign</th>
                        <th className="text-left py-2 pr-4 text-gray-500 font-medium">Period</th>
                        <th className="text-right py-2 pr-4 text-gray-500 font-medium">Monthly</th>
                        <th className="text-right py-2 pr-4 text-gray-500 font-medium">Impressions</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.campaignComparison.map((c) => (
                        <tr key={c.id} className="border-b border-gray-50">
                          <td className="py-3 pr-4 font-medium text-gray-900">
                            {c.tier.charAt(0).toUpperCase() + c.tier.slice(1)}
                          </td>
                          <td className="py-3 pr-4 text-gray-600">
                            {new Date(c.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            {c.endDate
                              ? ` - ${new Date(c.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                              : " - Now"}
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-900 font-medium">${c.monthlyAmount}</td>
                          <td className="py-3 pr-4 text-right text-gray-900 font-medium">{c.impressions.toLocaleString()}</td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            }`}>
                              {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Ad Performance Breakdown */}
            {data.adBreakdown.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Megaphone className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Ad Performance Breakdown</h2>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const maxPlays = Math.max(...data.adBreakdown.map((a) => a.playCount), 1);
                    return data.adBreakdown.map((ad) => {
                      const pct = (ad.playCount / maxPlays) * 100;
                      return (
                        <div key={ad.id} className="flex items-center gap-4">
                          <div className="w-48 flex-shrink-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{ad.title}</p>
                            <p className="text-xs text-gray-400">
                              {ad.tier} {ad.isActive ? "" : "(inactive)"}
                            </p>
                          </div>
                          <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className={`h-full rounded-lg transition-all ${ad.isActive ? "bg-blue-500" : "bg-gray-300"}`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                            {ad.playCount.toLocaleString()} plays
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
