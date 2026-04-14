"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  MapPin,
  Users,
  Globe,
  TrendingUp,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";

interface LocationEntry {
  city: string;
  region: string;
  country: string;
  count: number;
}

interface RegionEntry {
  name: string;
  count: number;
}

interface GeoStats {
  total: number;
  totalCities: number;
  totalRegions: number;
  totalCountries: number;
  internationalPercent: number;
  topRegion: string;
}

interface GeoData {
  locations: LocationEntry[];
  regions: RegionEntry[];
  stats: GeoStats;
}

type Period = "today" | "week" | "month" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-zinc-400" />
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function LocationBar({
  entry,
  maxCount,
  rank,
}: {
  entry: LocationEntry;
  maxCount: number;
  rank: number;
}) {
  const pct = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2.5 px-1 group hover:bg-zinc-800/50 rounded-lg transition-colors">
      <span className="text-xs font-mono text-zinc-500 w-6 text-right">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-zinc-200 truncate">
            {entry.city}
            {entry.region !== "Unknown" && (
              <span className="text-zinc-500">, {entry.region}</span>
            )}
          </span>
          <span className="text-xs font-mono text-zinc-400 ml-2 shrink-0">
            {entry.count} {entry.count === 1 ? "listener" : "listeners"}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function RegionRow({
  entry,
  maxCount,
}: {
  entry: RegionEntry;
  maxCount: number;
}) {
  const pct = maxCount > 0 ? (entry.count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-zinc-800/50 rounded-lg transition-colors">
      <span className="text-sm text-zinc-300 flex-1 truncate">
        {entry.name}
      </span>
      <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden shrink-0">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-zinc-400 w-12 text-right shrink-0">
        {entry.count}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
      <MapPin className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-zinc-300 mb-2">
        No Location Data Yet
      </h3>
      <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
        Listener locations are tracked automatically when sessions include
        geolocation. As listeners tune in and location data is recorded, their
        geographic distribution will appear here.
      </p>
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 max-w-lg mx-auto text-left">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
          How location tracking works
        </h4>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">1.</span>
            When a listener starts a session, the client can send their location
            via <code className="text-xs bg-zinc-700 px-1 rounded">POST /api/listeners/track-location</code>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">2.</span>
            Location is stored on the ListeningSession record
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5">3.</span>
            This dashboard aggregates location data across all sessions
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function ListenerGeoPage() {
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");
  const [copied, setCopied] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listeners/geo?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silently handle fetch errors
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const generateSponsorPitch = () => {
    if (!data || data.stats.total === 0) return "";

    const topCities = data.locations
      .slice(0, 5)
      .map((l) => l.city)
      .join(", ");
    const regionCount = data.stats.totalRegions;
    const cityCount = data.stats.totalCities;

    let pitch = `Your station reaches ${data.stats.total} listeners across ${cityCount} ${cityCount === 1 ? "city" : "cities"}`;
    if (regionCount > 1) {
      pitch += ` in ${regionCount} ${regionCount === 1 ? "region" : "regions"}`;
    }
    if (topCities) {
      pitch += ` including ${topCities}`;
    }
    pitch += ".";
    if (data.stats.internationalPercent > 0) {
      pitch += ` ${data.stats.internationalPercent}% of listeners are international.`;
    }
    return pitch;
  };

  const handleCopyPitch = async () => {
    const pitch = generateSponsorPitch();
    if (!pitch) return;
    try {
      await navigator.clipboard.writeText(pitch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = pitch;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasData = data && data.stats.total > 0;
  const displayLocations = showAllLocations
    ? data?.locations || []
    : (data?.locations || []).slice(0, 10);
  const displayRegions = showAllRegions
    ? data?.regions || []
    : (data?.regions || []).slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-500" />
              Listener Geography
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Where your listeners are tuning in from
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Filter */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === p
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Listeners"
                value={data!.stats.total.toLocaleString()}
                icon={Users}
                sub={`${PERIOD_LABELS[period]} sessions with location`}
              />
              <StatCard
                label="Cities Reached"
                value={data!.stats.totalCities}
                icon={MapPin}
                sub={`Across ${data!.stats.totalRegions} regions`}
              />
              <StatCard
                label="Top Region"
                value={data!.stats.topRegion}
                icon={TrendingUp}
                sub={`${data!.regions[0]?.count || 0} listeners`}
              />
              <StatCard
                label="International"
                value={`${data!.stats.internationalPercent}%`}
                icon={Globe}
                sub={`${data!.stats.totalCountries} ${data!.stats.totalCountries === 1 ? "country" : "countries"}`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Locations */}
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    Top Locations
                  </h2>
                </div>
                <div className="p-4 space-y-0.5">
                  {displayLocations.map((entry, i) => (
                    <LocationBar
                      key={`${entry.city}-${entry.region}`}
                      entry={entry}
                      maxCount={data!.locations[0]?.count || 1}
                      rank={i + 1}
                    />
                  ))}
                  {(data!.locations.length > 10 && !showAllLocations) && (
                    <button
                      onClick={() => setShowAllLocations(true)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 px-1 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Show all {data!.locations.length} locations
                    </button>
                  )}
                  {showAllLocations && data!.locations.length > 10 && (
                    <button
                      onClick={() => setShowAllLocations(false)}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-400 mt-2 px-1 transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>

              {/* Region Breakdown */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Region Breakdown
                  </h2>
                </div>
                <div className="p-4 space-y-0.5">
                  {displayRegions.map((entry) => (
                    <RegionRow
                      key={entry.name}
                      entry={entry}
                      maxCount={data!.regions[0]?.count || 1}
                    />
                  ))}
                  {(data!.regions.length > 8 && !showAllRegions) && (
                    <button
                      onClick={() => setShowAllRegions(true)}
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2 px-1 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Show all {data!.regions.length} regions
                    </button>
                  )}
                  {showAllRegions && data!.regions.length > 8 && (
                    <button
                      onClick={() => setShowAllRegions(false)}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-400 mt-2 px-1 transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sponsor Pitch Export */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Sponsor Pitch Summary
                </h2>
                <button
                  onClick={handleCopyPitch}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600/20 text-amber-400 border border-amber-600/30 rounded-lg hover:bg-amber-600/30 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 font-mono leading-relaxed">
                {generateSponsorPitch()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
