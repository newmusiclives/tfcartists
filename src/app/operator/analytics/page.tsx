"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Loader2,
  TrendingUp,
  Music,
  Users,
  Megaphone,
  DollarSign,
  RefreshCw,
  Radio,
  UserPlus,
  Target,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsData {
  dailyGrowth: { date: string; count: number }[];
  sessionDistribution: { bucket: string; count: number }[];
  referralFunnel: { source: string; count: number }[];
  retentionCohorts: {
    week: string;
    total: number;
    active: number;
    rate: number;
  }[];
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

interface RileyStats {
  totalArtists: number;
  byTier: Record<string, number>;
  monthlyRevenue: number;
  pendingSubmissions: number;
  approvedThisMonth: number;
}

interface HarperStats {
  totalSponsors: number;
  byStatus: Record<string, number>;
  byStage: Record<string, number>;
  totalMonthlyRevenue: number;
  activeSponsorships: number;
  callsThisMonth: number;
  dealsClosedThisMonth: number;
}

interface ElliotStats {
  totalListeners: number;
  byStatus: Record<string, number>;
  byTier: Record<string, number>;
  behavior: {
    totalSessions: number;
    totalListeningHours: number;
    avgSessionLength: number;
  };
  growth: {
    newThisWeek: number;
    newThisMonth: number;
    returningListenerPercent: number;
  };
}

interface TopSong {
  trackTitle: string;
  artistName: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLATFORM_FEE_PERCENT = 15; // 15% platform fee

function safeJson(response: Response) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
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
  const [rileyStats, setRileyStats] = useState<RileyStats | null>(null);
  const [harperStats, setHarperStats] = useState<HarperStats | null>(null);
  const [elliotStats, setElliotStats] = useState<ElliotStats | null>(null);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [sponsorAds, setSponsorAds] = useState<SponsorAdPerf[]>([]);
  const [tierBreakdown, setTierBreakdown] = useState<TierBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        analyticsRes,
        statsRes,
        rileyRes,
        harperRes,
        elliotRes,
        artistsRes,
        adsRes,
        playbackRes,
      ] = await Promise.all([
        fetch("/api/elliot/analytics", { cache: "no-store" })
          .then(safeJson)
          .catch(() => null),
        fetch("/api/management/stats", { cache: "no-store" })
          .then(safeJson)
          .catch(() => null),
        fetch("/api/riley/stats", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
        fetch("/api/harper/stats", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
        fetch("/api/elliot/stats", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
        fetch("/api/artists?sortBy=playCount&sortOrder=desc&limit=10", {
          cache: "no-store",
        })
          .then((r) => r.json())
          .catch(() => ({ artists: [] })),
        fetch("/api/sponsor-ads", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ ads: [], sponsorAds: [] })),
        fetch("/api/playback?limit=500", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ plays: [] })),
      ]);

      setAnalytics(analyticsRes);
      setStats(statsRes);
      setRileyStats(rileyRes);
      setHarperStats(harperRes);
      setElliotStats(elliotRes);

      // Top artists
      const artists = (artistsRes.artists || [])
        .slice(0, 10)
        .map((a: any) => ({
          id: a.id,
          name: a.name,
          playCount: a.playCount || 0,
          airplayTier: a.airplayTier || "FREE",
        }));
      setTopArtists(artists);

      // Top songs -- aggregate from playback log
      const songMap: Record<string, { artistName: string; count: number }> = {};
      const plays = playbackRes?.plays || [];
      for (const p of plays) {
        const key = `${p.trackTitle}|||${p.artistName}`;
        if (!songMap[key]) {
          songMap[key] = { artistName: p.artistName, count: 0 };
        }
        songMap[key].count++;
      }
      const sortedSongs = Object.entries(songMap)
        .map(([key, val]) => ({
          trackTitle: key.split("|||")[0],
          artistName: val.artistName,
          count: val.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setTopSongs(sortedSongs);

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
      adPerf.sort(
        (a: SponsorAdPerf, b: SponsorAdPerf) => b.playCount - a.playCount
      );
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
      // Use riley stats for more accurate counts if available
      if (rileyRes?.byTier) {
        const rileyTierMap: Record<string, string> = {
          BRONZE: "TIER_5",
          SILVER: "TIER_20",
          GOLD: "TIER_50",
          PLATINUM: "TIER_120",
        };
        for (const [key, mappedTier] of Object.entries(rileyTierMap)) {
          if (rileyRes.byTier[key] !== undefined) {
            tierMap[mappedTier] = rileyRes.byTier[key];
          }
        }
      }
      const breakdown: TierBreakdown[] = Object.entries(tierRates).map(
        ([tier, rate]) => ({
          tier,
          count: tierMap[tier] || 0,
          rate,
          revenue: (tierMap[tier] || 0) * rate,
        })
      );
      setTierBreakdown(breakdown);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, fetchData]);

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
        <Header session={session} onRefresh={() => {}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Summary row skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-5 animate-pulse"
              >
                <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
                <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
                <div className="h-2.5 w-24 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          {/* Chart skeleton */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 animate-pulse">
            <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-48 bg-gray-100 rounded" />
          </div>
          {/* Pipeline skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 animate-pulse"
              >
                <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j}>
                      <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                      <div className="h-4 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Table skeleton */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 animate-pulse">
            <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
        <Header session={session} onRefresh={fetchData} />
        <div className="flex items-center justify-center py-32">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-8 max-w-md text-center">
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
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const totalListeners =
    elliotStats?.totalListeners || stats?.kpis.listenerCount || 0;
  const totalArtists =
    rileyStats?.totalArtists || stats?.kpis.artistCount || 0;
  const totalSponsors =
    harperStats?.totalSponsors || stats?.kpis.sponsorCount || 0;
  const artistSubRevenue =
    stats?.kpis.artistSubscriptionRevenue || rileyStats?.monthlyRevenue || 0;
  const sponsorRevenue =
    stats?.kpis.sponsorRevenue ||
    harperStats?.totalMonthlyRevenue ||
    0;
  const grossRevenue = artistSubRevenue + sponsorRevenue;
  const platformFee = Math.round(grossRevenue * (PLATFORM_FEE_PERCENT / 100));
  const netRevenue = grossRevenue - platformFee;

  const dailyGrowth = analytics?.dailyGrowth || [];
  // Last 7 days for the listener trend chart
  const last7Days = dailyGrowth.slice(-7);

  // Artist pipeline funnel (use riley stats byTier or approximate from management stats)
  const artistFunnel = buildArtistFunnel(rileyStats, stats);
  // Sponsor pipeline funnel
  const sponsorFunnel = buildSponsorFunnel(harperStats);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      <Header session={session} onRefresh={fetchData} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ----------------------------------------------------------------- */}
        {/* 1. Summary Stats Row */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Listeners"
            value={totalListeners.toLocaleString()}
            sub={
              elliotStats?.growth
                ? `+${elliotStats.growth.newThisMonth} this month`
                : "all time"
            }
            icon={Radio}
          />
          <KpiCard
            label="Total Artists"
            value={totalArtists.toLocaleString()}
            sub={
              stats?.kpis.paidArtists
                ? `${stats.kpis.paidArtists} paying`
                : "in catalog"
            }
            icon={Music}
          />
          <KpiCard
            label="Total Sponsors"
            value={totalSponsors.toLocaleString()}
            sub={
              harperStats?.activeSponsorships
                ? `${harperStats.activeSponsorships} active deals`
                : "in pipeline"
            }
            icon={Megaphone}
          />
          <KpiCard
            label="Monthly Revenue"
            value={`$${grossRevenue.toLocaleString()}`}
            sub="subscriptions + sponsors"
            icon={DollarSign}
          />
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 2. Listener Trend Chart (last 7 days) */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-700" />
            <span>Listener Sessions (Last 7 Days)</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-500 mb-5">
            New listeners per day
          </p>
          {last7Days.length > 0 ? (
            <CSSBarChart data={last7Days} />
          ) : (
            <EmptyState message="No listener data yet -- data will appear as your station grows." />
          )}
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 3 & 4. Pipeline Funnels */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Artist Pipeline */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-amber-700" />
              <span>Artist Pipeline</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mb-5">
              Funnel from discovery to active
            </p>
            {artistFunnel.length > 0 ? (
              <PipelineFunnel stages={artistFunnel} color="amber" />
            ) : (
              <EmptyState message="No artist pipeline data yet -- data will appear as your station grows." />
            )}
          </section>

          {/* Sponsor Pipeline */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center space-x-2">
              <Target className="w-5 h-5 text-amber-700" />
              <span>Sponsor Pipeline</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mb-5">
              Funnel from discovery to active
            </p>
            {sponsorFunnel.length > 0 ? (
              <PipelineFunnel stages={sponsorFunnel} color="green" />
            ) : (
              <EmptyState message="No sponsor pipeline data yet -- data will appear as your station grows." />
            )}
          </section>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 5. Top Songs */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Music className="w-5 h-5 text-amber-700" />
            <span>Top Songs This Month</span>
          </h2>
          {topSongs.length === 0 ? (
            <EmptyState message="No playback data yet -- songs will appear once tracks start playing." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 dark:text-zinc-500">
                    <th className="pb-2 font-medium w-10">#</th>
                    <th className="pb-2 font-medium">Song</th>
                    <th className="pb-2 font-medium">Artist</th>
                    <th className="pb-2 font-medium text-right">Plays</th>
                  </tr>
                </thead>
                <tbody>
                  {topSongs.map((s, i) => (
                    <tr
                      key={`${s.trackTitle}-${s.artistName}`}
                      className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      <td className="py-2.5 text-gray-400 font-medium">
                        {i + 1}
                      </td>
                      <td className="py-2.5 font-medium text-gray-900 max-w-[240px] truncate">
                        {s.trackTitle}
                      </td>
                      <td className="py-2.5 text-gray-600 dark:text-zinc-400 max-w-[180px] truncate">
                        {s.artistName}
                      </td>
                      <td className="py-2.5 text-right text-gray-700 font-medium">
                        {s.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* 6. Revenue Breakdown */}
        {/* ----------------------------------------------------------------- */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-amber-700" />
            <span>Revenue Breakdown</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Tier detail */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                Artist Subscriptions by Tier
              </h3>
              {tierBreakdown.every((t) => t.count === 0) ? (
                <EmptyState message="No paid artists yet." />
              ) : (
                <div className="space-y-3">
                  {tierBreakdown.map((t) => (
                    <div
                      key={t.tier}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <TierBadge tier={t.tier} />
                        <span className="text-sm text-gray-600 dark:text-zinc-400">
                          {t.count} artist{t.count !== 1 ? "s" : ""} x $
                          {t.rate}/mo
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${t.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                      Subtotal
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      ${artistSubRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Revenue summary cards */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                Revenue Summary
              </h3>
              <RevenueLineItem
                label="Artist Tier Subscriptions"
                amount={artistSubRevenue}
                positive
              />
              <RevenueLineItem
                label="Sponsor Revenue"
                amount={sponsorRevenue}
                positive
              />
              <div className="border-t my-2" />
              <RevenueLineItem
                label="Gross Revenue"
                amount={grossRevenue}
                positive
                bold
              />
              <RevenueLineItem
                label={`Platform Fee (${PLATFORM_FEE_PERCENT}%)`}
                amount={platformFee}
                positive={false}
              />
              <div className="border-t my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Net Operator Revenue
                </span>
                <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
                  ${netRevenue.toLocaleString()}
                </span>
              </div>
              {stats?.targets.revenue ? (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-500 mb-1">
                    <span>
                      Progress to ${stats.targets.revenue.toLocaleString()}{" "}
                      target
                    </span>
                    <span>
                      {Math.min(
                        100,
                        Math.round(
                          (grossRevenue / stats.targets.revenue) * 100
                        )
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
                          (grossRevenue / stats.targets.revenue) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------- */}
        {/* Bonus: Top Artists + Sponsor Ad Perf (from original) */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Most-Played Artists */}
          <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-amber-700" />
              <span>Top 10 Artists by Plays</span>
            </h2>
            {topArtists.length === 0 ? (
              <EmptyState message="No artist play data yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500 dark:text-zinc-500">
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
                        className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        <td className="py-2 text-gray-400">{i + 1}</td>
                        <td className="py-2 font-medium text-gray-900 dark:text-white">
                          {a.name}
                        </td>
                        <td className="py-2 text-right text-gray-700 dark:text-zinc-300">
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
          <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-amber-700" />
              <span>Sponsor Ad Performance</span>
            </h2>
            {sponsorAds.length === 0 ? (
              <EmptyState message="No sponsor ads yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500 dark:text-zinc-500">
                      <th className="pb-2 font-medium">Ad</th>
                      <th className="pb-2 font-medium">Sponsor</th>
                      <th className="pb-2 font-medium text-right">Plays</th>
                      <th className="pb-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsorAds.slice(0, 10).map((ad) => (
                      <tr
                        key={ad.id}
                        className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        <td className="py-2 font-medium text-gray-900 max-w-[160px] truncate">
                          {ad.adTitle}
                        </td>
                        <td className="py-2 text-gray-600 dark:text-zinc-400 max-w-[120px] truncate">
                          {ad.sponsorName}
                        </td>
                        <td className="py-2 text-right text-gray-700 dark:text-zinc-300">
                          {ad.playCount.toLocaleString()}
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

        {/* ----------------------------------------------------------------- */}
        {/* Retention Cohorts */}
        {/* ----------------------------------------------------------------- */}
        {analytics?.retentionCohorts &&
          analytics.retentionCohorts.length > 0 && (
            <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Weekly Retention Cohorts
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analytics.retentionCohorts.map((c) => (
                  <div
                    key={c.week}
                    className="bg-gray-50 rounded-lg p-4 text-center"
                  >
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">{c.week}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {c.rate}%
                    </p>
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
// Header
// ---------------------------------------------------------------------------

function Header({
  session,
  onRefresh,
}: {
  session: any;
  onRefresh: () => void;
}) {
  return (
    <header className="bg-white dark:bg-zinc-900 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Building2 className="w-6 h-6 text-amber-700" />
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-xs text-gray-500 dark:text-zinc-500">
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
              onClick={onRefresh}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
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
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-5">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className="w-4 h-4 text-amber-700" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier Badge
// ---------------------------------------------------------------------------

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-600",
    TIER_5: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400",
    TIER_20: "bg-indigo-100 text-indigo-700",
    TIER_50: "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400",
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

// ---------------------------------------------------------------------------
// Revenue Line Item
// ---------------------------------------------------------------------------

function RevenueLineItem({
  label,
  amount,
  positive,
  bold,
}: {
  label: string;
  amount: number;
  positive: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-600"}`}
      >
        {label}
      </span>
      <span
        className={`font-semibold ${
          bold
            ? "text-gray-900"
            : positive
              ? "text-gray-900"
              : "text-red-600"
        }`}
      >
        {positive ? "" : "-"}${amount.toLocaleString()}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-gray-400 text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSS Bar Chart (no external library)
// ---------------------------------------------------------------------------

function CSSBarChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 180;

  return (
    <div className="flex items-end justify-between gap-2" style={{ height: chartHeight }}>
      {data.map((d) => {
        const heightPct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
        const barHeight = Math.max(4, (heightPct / 100) * chartHeight);
        // Format date label as day abbreviation
        const dateObj = new Date(d.date + "T12:00:00");
        const dayLabel = dateObj.toLocaleDateString("en-US", {
          weekday: "short",
        });
        const dateLabel = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center justify-end h-full group"
          >
            {/* Tooltip on hover */}
            <div className="relative mb-1">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-gray-700 bg-white border rounded px-1.5 py-0.5 shadow-sm whitespace-nowrap absolute -top-6 left-1/2 -translate-x-1/2">
                {d.count}
              </span>
            </div>
            {/* Bar */}
            <div
              className="w-full max-w-[48px] rounded-t-md bg-amber-500 hover:bg-amber-600 transition-colors"
              style={{ height: barHeight }}
              title={`${dateLabel}: ${d.count} listener${d.count !== 1 ? "s" : ""}`}
            />
            {/* Label */}
            <div className="mt-2 text-center">
              <p className="text-[10px] font-medium text-gray-500 dark:text-zinc-500">
                {dayLabel}
              </p>
              <p className="text-[9px] text-gray-400">{dateLabel}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Funnel
// ---------------------------------------------------------------------------

interface FunnelStage {
  label: string;
  count: number;
}

function PipelineFunnel({
  stages,
  color,
}: {
  stages: FunnelStage[];
  color: "amber" | "green";
}) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const total = stages.reduce((s, st) => s + st.count, 0);

  const barColors = {
    amber: "bg-amber-500",
    green: "bg-green-500",
  };
  const bgColors = {
    amber: "bg-amber-100",
    green: "bg-green-100",
  };

  return (
    <div className="space-y-4">
      {stages.map((stage) => {
        const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        const shareOfTotal =
          total > 0 ? Math.round((stage.count / total) * 100) : 0;

        return (
          <div key={stage.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                {stage.label}
              </span>
              <span className="text-sm text-gray-500 dark:text-zinc-500">
                {stage.count.toLocaleString()}{" "}
                <span className="text-gray-400">({shareOfTotal}%)</span>
              </span>
            </div>
            <div
              className={`w-full ${bgColors[color]} rounded-full h-3 overflow-hidden`}
            >
              <div
                className={`${barColors[color]} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(pct, stage.count > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel builders
// ---------------------------------------------------------------------------

function buildArtistFunnel(
  riley: RileyStats | null,
  mgmt: StatsData | null
): FunnelStage[] {
  if (!riley && !mgmt) return [];

  // Riley stats provide byTier: FREE, BRONZE (TIER_5), SILVER (TIER_20), etc.
  // We model the pipeline as: Discovered -> Contacted -> Engaged -> Active
  // Using tier counts as a proxy: FREE = early stage, paid = active
  const totalArtists = riley?.totalArtists || mgmt?.kpis.artistCount || 0;
  const paidArtists = mgmt?.kpis.paidArtists || 0;
  const freeArtists = riley?.byTier?.FREE || totalArtists - paidArtists;
  const pendingSubs = riley?.pendingSubmissions || 0;

  // Approximate funnel stages
  return [
    {
      label: "Discovered",
      count: totalArtists,
    },
    {
      label: "Contacted",
      count: Math.max(0, totalArtists - Math.floor(freeArtists * 0.3)),
    },
    {
      label: "Engaged",
      count: totalArtists - freeArtists + pendingSubs,
    },
    {
      label: "Active (Paid)",
      count: paidArtists,
    },
  ];
}

function buildSponsorFunnel(harper: HarperStats | null): FunnelStage[] {
  if (!harper) return [];

  const byStatus = harper.byStatus || {};
  const byStage = harper.byStage || {};

  return [
    {
      label: "Discovered",
      count: (byStatus.DISCOVERED || 0) + (byStage.discovery || 0),
    },
    {
      label: "Contacted",
      count: (byStatus.CONTACTED || 0) + (byStage.contacted || 0),
    },
    {
      label: "Negotiating",
      count:
        (byStatus.NEGOTIATING || 0) +
        (byStatus.INTERESTED || 0) +
        (byStage.negotiating || 0) +
        (byStage.interested || 0),
    },
    {
      label: "Active",
      count:
        (byStatus.ACTIVE || 0) +
        (byStatus.CLOSED || 0) +
        (byStage.active || 0) +
        (byStage.closed || 0),
    },
  ];
}
