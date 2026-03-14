"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Loader2,
  TrendingUp,
  Music,
  Megaphone,
  DollarSign,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsData {
  dailyGrowth: { date: string; count: number }[];
  sessionDistribution: { bucket: string; count: number }[];
  referralFunnel: { source: string; count: number }[];
  retentionCohorts: { week: string; total: number; active: number; rate: number }[];
}

interface StatsData {
  kpis: {
    totalRevenue: number;
    artistSubscriptionRevenue: number;
    sponsorRevenue: number;
    artistCount: number;
    paidArtists: number;
    sponsorCount: number;
    activeSponsors: number;
    listenerCount: number;
    recentSessions: number;
    songCount: number;
  };
  targets: {
    artists: number;
    sponsors: number;
    listeners: number;
    revenue: number;
  };
}

interface TopArtist {
  id: string;
  name: string;
  playCount: number;
  airplayTier: string;
}

interface SponsorAdPerf {
  id: string;
  adTitle: string;
  sponsorName: string;
  tier: string;
  playCount: number;
  isActive: boolean;
}

interface TierBreakdown {
  tier: string;
  count: number;
  rate: number;
  revenue: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OperatorAnalyticsPage() {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "loading";
  const router = useRouter();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [sponsorAds, setSponsorAds] = useState<SponsorAdPerf[]>([]);
  const [tierBreakdown, setTierBreakdown] = useState<TierBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, statsRes, artistsRes, adsRes] = await Promise.all([
        fetch("/api/elliot/analytics").then((r) => {
          if (!r.ok) throw new Error("Failed to load analytics");
          return r.json();
        }),
        fetch("/api/management/stats").then((r) => {
          if (!r.ok) throw new Error("Failed to load stats");
          return r.json();
        }),
        fetch("/api/artists?sortBy=playCount&sortOrder=desc&limit=10")
          .then((r) => r.json())
          .catch(() => ({ artists: [] })),
        fetch("/api/sponsor-ads")
          .then((r) => r.json())
          .catch(() => ({ ads: [], sponsorAds: [] })),
      ]);

      setAnalytics(analyticsRes);
      setStats(statsRes);

      // Top artists
      const artists = (artistsRes.artists || []).slice(0, 10).map((a: any) => ({
        id: a.id,
        name: a.name,
        playCount: a.playCount || 0,
        airplayTier: a.airplayTier || "FREE",
      }));
      setTopArtists(artists);

      // Sponsor ads
      const rawAds = adsRes.ads || adsRes.sponsorAds || [];
      const adPerf: SponsorAdPerf[] = rawAds.map((ad: any) => ({
        id: ad.id,
        adTitle: ad.adTitle,
        sponsorName: ad.sponsorName,
        tier: ad.tier || "bronze",
        playCount: ad.playCount || 0,
        isActive: ad.isActive ?? true,
      }));
      adPerf.sort((a: SponsorAdPerf, b: SponsorAdPerf) => b.playCount - a.playCount);
      setSponsorAds(adPerf);

      // Tier breakdown for revenue
      const tierRates: Record<string, number> = {
        TIER_5: 5,
        TIER_20: 20,
        TIER_50: 50,
        TIER_120: 120,
      };
      const allArtists = artistsRes.artists || [];
      const tierMap: Record<string, number> = {};
      allArtists.forEach((a: any) => {
        const t = a.airplayTier || "FREE";
        tierMap[t] = (tierMap[t] || 0) + 1;
      });
      const breakdown: TierBreakdown[] = Object.entries(tierRates).map(([tier, rate]) => ({
        tier,
        count: tierMap[tier] || 0,
        rate,
        revenue: (tierMap[tier] || 0) * rate,
      }));
      setTierBreakdown(breakdown);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center space-x-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const dailyGrowth = analytics?.dailyGrowth || [];
  const totalListeners = stats?.kpis.listenerCount || 0;
  const recentSessions = stats?.kpis.recentSessions || 0;
  const artistSubRevenue = stats?.kpis.artistSubscriptionRevenue || 0;
  const sponsorRevenue = stats?.kpis.sponsorRevenue || 0;
  const totalRevenue = stats?.kpis.totalRevenue || 0;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-amber-700" />
              <div>
                <h1 className="font-bold text-gray-900">Analytics</h1>
                <p className="text-xs text-gray-500">
                  {session?.user?.name || "Operator"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/operator/dashboard"
                className="inline-flex items-center space-x-1 text-sm text-amber-700 hover:text-amber-800 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={fetchData}
                className="text-sm text-gray-500 hover:text-gray-700"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Listeners"
            value={totalListeners.toLocaleString()}
            sub="all time"
            icon={TrendingUp}
          />
          <KpiCard
            label="Sessions (24h)"
            value={recentSessions.toLocaleString()}
            sub="active today"
            icon={TrendingUp}
          />
          <KpiCard
            label="Monthly Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            sub="subscriptions + sponsors"
            icon={DollarSign}
          />
          <KpiCard
            label="Active Ads"
            value={sponsorAds.filter((a) => a.isActive).length.toString()}
            sub={`${sponsorAds.reduce((s, a) => s + a.playCount, 0).toLocaleString()} total plays`}
            icon={Megaphone}
          />
        </div>

        {/* Listener Trends Chart */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-700" />
            <span>Listener Trends (Last 30 Days)</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            New listeners per day
          </p>
          <BarChart data={dailyGrowth} />
        </section>

        {/* Two-column: Top Artists + Sponsor Ads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Most-Played Artists */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Music className="w-5 h-5 text-amber-700" />
              <span>Top 10 Artists by Plays</span>
            </h2>
            {topArtists.length === 0 ? (
              <p className="text-gray-400 text-sm">No artist data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Artist</th>
                      <th className="pb-2 font-medium text-right">Plays</th>
                      <th className="pb-2 font-medium text-right">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topArtists.map((a, i) => (
                      <tr
                        key={a.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-2 text-gray-400">{i + 1}</td>
                        <td className="py-2 font-medium text-gray-900">
                          {a.name}
                        </td>
                        <td className="py-2 text-right text-gray-700">
                          {a.playCount.toLocaleString()}
                        </td>
                        <td className="py-2 text-right">
                          <TierBadge tier={a.airplayTier} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Sponsor Ad Performance */}
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-amber-700" />
              <span>Sponsor Ad Performance</span>
            </h2>
            {sponsorAds.length === 0 ? (
              <p className="text-gray-400 text-sm">No sponsor ads yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Ad</th>
                      <th className="pb-2 font-medium">Sponsor</th>
                      <th className="pb-2 font-medium text-right">Plays</th>
                      <th className="pb-2 font-medium text-right">Tier</th>
                      <th className="pb-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsorAds.slice(0, 10).map((ad) => (
                      <tr
                        key={ad.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-2 font-medium text-gray-900 max-w-[160px] truncate">
                          {ad.adTitle}
                        </td>
                        <td className="py-2 text-gray-600 max-w-[120px] truncate">
                          {ad.sponsorName}
                        </td>
                        <td className="py-2 text-right text-gray-700">
                          {ad.playCount.toLocaleString()}
                        </td>
                        <td className="py-2 text-right">
                          <span className="capitalize text-gray-600">
                            {ad.tier}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              ad.isActive ? "bg-green-500" : "bg-gray-300"
                            }`}
                            title={ad.isActive ? "Active" : "Inactive"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Revenue Breakdown */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-amber-700" />
            <span>Revenue Breakdown</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Artist Subscriptions by Tier */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Artist Subscriptions by Tier
              </h3>
              <div className="space-y-3">
                {tierBreakdown.map((t) => (
                  <div key={t.tier} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <TierBadge tier={t.tier} />
                      <span className="text-sm text-gray-600">
                        {t.count} artist{t.count !== 1 ? "s" : ""} x ${t.rate}/mo
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${t.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Subtotal
                  </span>
                  <span className="font-bold text-gray-900">
                    ${artistSubRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Split */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Revenue Summary
              </h3>
              <div className="space-y-4">
                <RevenueBar
                  label="Artist Subscriptions"
                  value={artistSubRevenue}
                  total={totalRevenue}
                  color="bg-amber-500"
                />
                <RevenueBar
                  label="Sponsorships"
                  value={sponsorRevenue}
                  total={totalRevenue}
                  color="bg-green-500"
                />
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-bold text-gray-900">
                    Total Monthly Revenue
                  </span>
                  <span className="text-xl font-bold text-amber-700">
                    ${totalRevenue.toLocaleString()}
                  </span>
                </div>
                {stats?.targets.revenue && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress to ${stats.targets.revenue.toLocaleString()} target</span>
                      <span>
                        {Math.min(
                          100,
                          Math.round((totalRevenue / stats.targets.revenue) * 100)
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-amber-700 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (totalRevenue / stats.targets.revenue) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Retention Cohorts */}
        {analytics?.retentionCohorts && analytics.retentionCohorts.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Weekly Retention Cohorts
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analytics.retentionCohorts.map((c) => (
                <div
                  key={c.week}
                  className="bg-gray-50 rounded-lg p-4 text-center"
                >
                  <p className="text-xs text-gray-500 mb-1">{c.week}</p>
                  <p className="text-2xl font-bold text-gray-900">{c.rate}%</p>
                  <p className="text-xs text-gray-400">
                    {c.active}/{c.total} retained
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: any;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="w-4 h-4 text-amber-700" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-600",
    TIER_5: "bg-blue-100 text-blue-700",
    TIER_20: "bg-indigo-100 text-indigo-700",
    TIER_50: "bg-purple-100 text-purple-700",
    TIER_120: "bg-amber-100 text-amber-800",
  };
  const labels: Record<string, string> = {
    FREE: "Free",
    TIER_5: "$5",
    TIER_20: "$20",
    TIER_50: "$50",
    TIER_120: "$120",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
        colors[tier] || "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[tier] || tier}
    </span>
  );
}

function RevenueBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">
          ${value.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        {Math.round(pct)}% of total
      </p>
    </div>
  );
}

/**
 * Simple SVG bar chart -- no external library.
 */
function BarChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm">No listener data yet.</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;
  const barGap = 2;
  const barWidth = Math.max(4, Math.floor((100 / data.length) * 0.8));

  // Show every ~5th label to avoid crowding
  const labelInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${data.length * (barWidth + barGap) + 40} ${chartHeight + 40}`}
        className="w-full h-auto min-w-[480px]"
        preserveAspectRatio="xMinYMid meet"
      >
        {/* Y-axis labels */}
        <text
          x="0"
          y="14"
          className="fill-gray-400"
          fontSize="10"
        >
          {maxCount}
        </text>
        <text
          x="0"
          y={chartHeight}
          className="fill-gray-400"
          fontSize="10"
        >
          0
        </text>

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = maxCount > 0 ? (d.count / maxCount) * (chartHeight - 20) : 0;
          const x = 35 + i * (barWidth + barGap);
          const y = chartHeight - barHeight;

          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                className="fill-amber-600 hover:fill-amber-500 transition-colors"
              >
                <title>
                  {d.date}: {d.count} new listener{d.count !== 1 ? "s" : ""}
                </title>
              </rect>
              {/* X-axis label */}
              {i % labelInterval === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  className="fill-gray-400"
                  fontSize="9"
                >
                  {d.date.slice(5)} {/* MM-DD */}
                </text>
              )}
            </g>
          );
        })}

        {/* baseline */}
        <line
          x1="35"
          y1={chartHeight}
          x2={35 + data.length * (barWidth + barGap)}
          y2={chartHeight}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
