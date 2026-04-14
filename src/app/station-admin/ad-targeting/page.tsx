"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Target,
  Loader2,
  BarChart3,
  TrendingUp,
  DollarSign,
  Radio,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface AdStat {
  id: string;
  sponsorName: string;
  adTitle: string;
  tier: string;
  isActive: boolean;
  weight: number;
  impressions: number;
  maxImpressions: number | null;
  remaining: number | null;
  fillRate: number | null;
  lastPlayedAt: string | null;
  daypartTargets: string[];
  estimatedRevenue: number;
}

interface Summary {
  totalAds: number;
  activeAds: number;
  totalImpressions: number;
  activeAdsPlayedToday: number;
  activeAdsPlayedThisWeek: number;
  overallFillRate: number | null;
  monthlyRevenueEstimate: number;
  daypartDistribution: Record<string, number>;
}

interface TargetingConfig {
  daypartTargets: string[];
  maxImpressions: number;
  frequencyCap: number;
  priorityOverride: number;
}

const DAYPARTS = [
  { key: "overnight", label: "Overnight", time: "12a-6a" },
  { key: "morning", label: "Morning", time: "6a-10a" },
  { key: "midday", label: "Midday", time: "10a-3p" },
  { key: "afternoon", label: "Afternoon", time: "3p-7p" },
  { key: "evening", label: "Evening", time: "7p-12a" },
];

const TIER_COLOR: Record<string, string> = {
  bronze: "bg-orange-900/30 text-orange-400 border-orange-800",
  silver: "bg-zinc-700/30 text-zinc-300 border-zinc-600",
  gold: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  platinum: "bg-purple-900/30 text-purple-400 border-purple-800",
};

export default function AdTargetingPage() {
  const [stationId, setStationId] = useState<string | null>(null);
  const [ads, setAds] = useState<AdStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<Record<string, TargetingConfig>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const loadData = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/ads/performance?stationId=${sid}`);
      const data = await res.json();
      setAds(data.ads || []);
      setSummary(data.summary || null);

      // Initialize targeting configs from ad data
      const cfgs: Record<string, TargetingConfig> = {};
      (data.ads || []).forEach((ad: AdStat) => {
        cfgs[ad.id] = {
          daypartTargets: ad.daypartTargets || [],
          maxImpressions: ad.maxImpressions || 0,
          frequencyCap: 0,
          priorityOverride: 1,
        };
      });
      setConfigs(cfgs);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          const sid = stations[0].id;
          setStationId(sid);
          return loadData(sid);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadData]);

  const updateConfig = (adId: string, patch: Partial<TargetingConfig>) => {
    setConfigs((prev) => ({
      ...prev,
      [adId]: { ...prev[adId], ...patch },
    }));
  };

  const toggleDaypart = (adId: string, daypart: string) => {
    const current = configs[adId]?.daypartTargets || [];
    const next = current.includes(daypart)
      ? current.filter((d) => d !== daypart)
      : [...current, daypart];
    updateConfig(adId, { daypartTargets: next });
  };

  const saveTargeting = async (adId: string) => {
    setSavingId(adId);
    try {
      const config = configs[adId];
      await fetch(`/api/sponsor-ads/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            daypartTargets: config.daypartTargets,
            maxImpressions: config.maxImpressions || undefined,
            frequencyCap: config.frequencyCap || undefined,
            priorityOverride: config.priorityOverride || undefined,
          },
        }),
      });
      setSavedId(adId);
      setTimeout(() => setSavedId(null), 2000);
    } catch {
      // silently fail
    }
    setSavingId(null);
  };

  const activeAds = ads.filter((a) => a.isActive);
  const maxDaypart = summary
    ? Math.max(...Object.values(summary.daypartDistribution), 1)
    : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <SharedNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <Target className="w-8 h-8 text-green-500" />
            Ad Targeting & Performance
          </h1>
          <p className="text-zinc-400 mt-1">
            Configure daypart targeting, frequency caps, and monitor ad performance
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                    <Radio className="w-4 h-4" />
                    Active Ads
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {summary.activeAds}
                    <span className="text-sm text-zinc-500 font-normal ml-1">
                      / {summary.totalAds}
                    </span>
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                    <BarChart3 className="w-4 h-4" />
                    Total Impressions
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {summary.totalImpressions.toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Fill Rate
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {summary.overallFillRate !== null
                      ? `${summary.overallFillRate}%`
                      : "--"}
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    Est. Monthly Revenue
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    ${summary.monthlyRevenueEstimate.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Daypart Distribution Chart */}
            {summary && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">
                  Ad Coverage by Daypart
                </h2>
                <div className="space-y-3">
                  {DAYPARTS.map((dp) => {
                    const count = summary.daypartDistribution[dp.key] || 0;
                    const pct = Math.round((count / maxDaypart) * 100);
                    return (
                      <div key={dp.key} className="flex items-center gap-3">
                        <div className="w-28 text-sm text-zinc-400 shrink-0">
                          <span className="font-medium text-zinc-300">
                            {dp.label}
                          </span>
                          <span className="text-xs text-zinc-500 ml-1">
                            {dp.time}
                          </span>
                        </div>
                        <div className="flex-1 bg-zinc-800 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          >
                            <span className="text-xs font-medium text-white">
                              {count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Per-Ad Targeting Config */}
            {activeAds.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No active ads to configure.</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Create sponsor ads first, then configure targeting here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-zinc-100">
                  Per-Ad Targeting Configuration
                </h2>
                {activeAds.map((ad) => {
                  const cfg = configs[ad.id] || {
                    daypartTargets: [],
                    maxImpressions: 0,
                    frequencyCap: 0,
                    priorityOverride: 1,
                  };
                  const isSaving = savingId === ad.id;
                  const justSaved = savedId === ad.id;

                  return (
                    <div
                      key={ad.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                    >
                      {/* Ad Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold text-zinc-100">
                              {ad.adTitle}
                            </h3>
                            <p className="text-sm text-zinc-400">
                              {ad.sponsorName}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border ${
                              TIER_COLOR[ad.tier] || "bg-zinc-700 text-zinc-300"
                            }`}
                          >
                            {ad.tier}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                          <span>
                            <span className="font-medium text-zinc-200">
                              {ad.impressions.toLocaleString()}
                            </span>{" "}
                            plays
                          </span>
                          {ad.fillRate !== null && (
                            <span>
                              <span className="font-medium text-zinc-200">
                                {ad.fillRate}%
                              </span>{" "}
                              fill
                            </span>
                          )}
                          <span className="text-green-400 font-medium">
                            ${ad.estimatedRevenue}/mo
                          </span>
                        </div>
                      </div>

                      {/* Daypart Checkboxes */}
                      <div className="mb-4">
                        <label className="text-xs text-zinc-500 block mb-2 uppercase tracking-wider">
                          Daypart Targeting
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DAYPARTS.map((dp) => {
                            const isSelected = cfg.daypartTargets.includes(
                              dp.key
                            );
                            return (
                              <button
                                key={dp.key}
                                onClick={() => toggleDaypart(ad.id, dp.key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                  isSelected
                                    ? "bg-green-900/40 text-green-400 border-green-700"
                                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                                }`}
                              >
                                {dp.label}
                                <span className="text-xs opacity-60 ml-1">
                                  {dp.time}
                                </span>
                              </button>
                            );
                          })}
                          {cfg.daypartTargets.length === 0 && (
                            <span className="text-xs text-zinc-500 self-center ml-2">
                              No targeting = runs in all dayparts
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Numeric configs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">
                            Max Impressions
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={cfg.maxImpressions || ""}
                            onChange={(e) =>
                              updateConfig(ad.id, {
                                maxImpressions: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="Unlimited"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-green-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">
                            Frequency Cap / hr
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={cfg.frequencyCap || ""}
                            onChange={(e) =>
                              updateConfig(ad.id, {
                                frequencyCap: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="No limit"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-green-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">
                            Priority Override
                          </label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={cfg.priorityOverride || ""}
                            onChange={(e) =>
                              updateConfig(ad.id, {
                                priorityOverride:
                                  parseFloat(e.target.value) || 1,
                              })
                            }
                            placeholder="1.0"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-green-600 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => saveTargeting(ad.id)}
                            disabled={isSaving}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                              justSaved
                                ? "bg-green-900/40 text-green-400 border border-green-700"
                                : "bg-green-600 text-white hover:bg-green-700"
                            } disabled:opacity-50`}
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : justSaved ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {justSaved ? "Saved" : "Save"}
                          </button>
                        </div>
                      </div>

                      {/* Impression budget bar */}
                      {ad.maxImpressions !== null && ad.maxImpressions > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-zinc-500 mb-1">
                            <span>
                              {ad.impressions.toLocaleString()} /{" "}
                              {ad.maxImpressions.toLocaleString()} impressions
                            </span>
                            <span>
                              {ad.remaining?.toLocaleString()} remaining
                            </span>
                          </div>
                          <div className="bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                (ad.fillRate || 0) > 90
                                  ? "bg-red-500"
                                  : (ad.fillRate || 0) > 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(ad.fillRate || 0, 100)}%`,
                              }}
                            />
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
