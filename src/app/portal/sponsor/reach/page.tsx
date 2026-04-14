"use client";

import { useState, useEffect, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  MapPin,
  Users,
  Globe,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface CityData {
  city: string;
  region: string;
  count: number;
  x: number | null;
  y: number | null;
}

interface HeatmapResponse {
  cities: CityData[];
  stats: {
    totalListeners: number;
    totalCities: number;
    mappedCities: number;
  };
}

export default function SponsorReachPage() {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("week");
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/embed/heatmap?period=${period}`, {
        cache: "no-store",
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const embedCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/heatmap" width="600" height="400" frameborder="0" style="border-radius:12px;"></iframe>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statsSummary = data
    ? `Listener Reach Summary\n${"-".repeat(30)}\nTotal Listeners: ${data.stats.totalListeners}\nCities Reached: ${data.stats.totalCities}\n\nTop Cities:\n${data.cities
        .slice(0, 10)
        .map((c, i) => `  ${i + 1}. ${c.city}, ${c.region} - ${c.count} listeners`)
        .join("\n")}\n\nPowered by TrueFans Radio`
    : "";

  const [copiedStats, setCopiedStats] = useState(false);
  const copyStats = () => {
    navigator.clipboard.writeText(statsSummary);
    setCopiedStats(true);
    setTimeout(() => setCopiedStats(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <SharedNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/portal/sponsor"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sponsor Portal
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Listener Reach</h1>
            <p className="text-zinc-400 text-sm mt-1">
              See where your ads are reaching listeners across the country
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white border border-zinc-800 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Users className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-sm text-zinc-500">Total Listeners</p>
            <p className="text-2xl font-bold text-white">
              {data?.stats.totalListeners ?? "---"}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <MapPin className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-sm text-zinc-500">Cities Reached</p>
            <p className="text-2xl font-bold text-white">
              {data?.stats.totalCities ?? "---"}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <Globe className="w-5 h-5 text-green-400 mb-2" />
            <p className="text-sm text-zinc-500">Your Ads Reach</p>
            <p className="text-lg font-bold text-green-400">
              {data ? `${data.stats.totalCities} cities` : "---"}
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mb-4">
          {(["today", "week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300"
              }`}
            >
              {p === "all" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Heatmap iframe */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
          <iframe
            src="/embed/heatmap"
            width="100%"
            height="420"
            style={{ border: "none", display: "block" }}
            title="Listener Heatmap"
          />
        </div>

        {/* Top cities list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">
              Top Listener Cities
            </h2>
            {data?.cities.length === 0 && (
              <p className="text-sm text-zinc-500">No location data yet</p>
            )}
            <div className="space-y-2">
              {data?.cities.slice(0, 15).map((city, i) => {
                const pct =
                  data.stats.totalListeners > 0
                    ? (city.count / data.stats.totalListeners) * 100
                    : 0;
                return (
                  <div key={city.city + city.region} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 w-5 text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm text-zinc-300 truncate">
                          {city.city}
                          {city.region !== "Unknown" && (
                            <span className="text-zinc-600">, {city.region}</span>
                          )}
                        </span>
                        <span className="text-xs text-zinc-500 ml-2 flex-shrink-0">
                          {city.count}
                        </span>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500/60 rounded-full transition-all"
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Share section */}
          <div className="space-y-6">
            {/* Embed code */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-2">
                Share with Your Team
              </h2>
              <p className="text-xs text-zinc-500 mb-3">
                Embed this live heatmap on your website or share with stakeholders.
              </p>
              <div className="relative">
                <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400 overflow-x-auto">
                  {embedCode}
                </pre>
                <button
                  onClick={copyEmbed}
                  className="absolute top-2 right-2 flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded text-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-2">
                Copy Stats Summary
              </h2>
              <p className="text-xs text-zinc-500 mb-3">
                Plain-text summary for reports, emails, or presentations.
              </p>
              <button
                onClick={copyStats}
                className="flex items-center gap-2 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {copiedStats ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied to clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Stats Summary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
