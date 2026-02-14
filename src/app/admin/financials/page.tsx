"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import {
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Radio,
  BarChart3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  Music,
  Headphones,
  Award,
  PieChart,
} from "lucide-react";

interface FinancialData {
  currentPeriod: string;
  station: {
    name: string;
    genre: string;
    maxArtistCapacity: number;
    maxSponsorCapacity: number;
    targetDAU: number;
  } | null;
  artists: {
    total: number;
    byTier: { FREE: number; TIER_5: number; TIER_20: number; TIER_50: number; TIER_120: number };
    subscriptionRevenue: number;
    totalShares: number;
  };
  sponsors: {
    total: number;
    activeSponsorships: number;
    byTier: { bronze: number; silver: number; gold: number; platinum: number };
    revenue: number;
  };
  listeners: { total: number; active: number; powerUsers: number };
  scouts: { total: number; active: number };
  programming: { djs: number; totalDJs: number; songs: number };
  financials: {
    totalGrossRevenue: number;
    artistSubscriptionRevenue: number;
    sponsorRevenue: number;
    artistPool: number;
    stationRetained: number;
    perShareValue: number;
    tierEarnings: Record<string, { cost: number; shares: number; poolEarnings: number; net: number }>;
  };
  capacity: {
    artists: { current: number; max: number; pct: number };
    sponsors: { current: number; max: number; pct: number };
    listeners: { current: number; target: number; pct: number };
  };
  latestPool: { period: string; totalAdRevenue: number; artistPoolAmount: number; perShareValue: number } | null;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CapacityBar({ label, current, max, pct, color }: { label: string; current: number; max: number; pct: number; color: string }) {
  const clampedPct = Math.min(pct, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{current} / {max} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${clampedPct}%` }} />
      </div>
    </div>
  );
}

export default function FinancialsPage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/financials")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Failed to load financial data.</p>
        </div>
      </div>
    );
  }

  const f = data.financials;
  const artistPoolPct = f.totalGrossRevenue > 0 ? (f.artistPool / f.totalGrossRevenue) * 100 : 0;
  const stationPct = f.totalGrossRevenue > 0 ? (f.stationRetained / f.totalGrossRevenue) * 100 : 0;
  const subscriptionPct = f.totalGrossRevenue > 0 ? (f.artistSubscriptionRevenue / f.totalGrossRevenue) * 100 : 0;

  // Model viability checks
  const checks = {
    hasArtists: data.artists.total > 0,
    hasSponsors: data.sponsors.activeSponsorships > 0,
    hasListeners: data.listeners.total > 0,
    hasDJs: data.programming.djs > 0,
    hasSongs: data.programming.songs > 0,
    artistPoolProtected: f.sponsorRevenue === 0 || Math.abs(f.artistPool - f.sponsorRevenue * 0.8) < 0.01,
    positiveROI_tier5: (f.tierEarnings.TIER_5?.net ?? 0) > 0,
    positiveROI_tier20: (f.tierEarnings.TIER_20?.net ?? 0) > 0,
    revenuePositive: f.totalGrossRevenue > 0,
  };
  const allChecks = Object.values(checks).every(Boolean);

  // Projected revenue at various capacity levels
  const projected60 = {
    artists: Math.round((data.station?.maxArtistCapacity || 340) * 0.6),
    sponsors: Math.round((data.station?.maxSponsorCapacity || 125) * 0.6),
    sponsorRevenue: Math.round((data.station?.maxSponsorCapacity || 125) * 0.6) * 150,
    artistSubs: 80 * 5 + 40 * 20 + 20 * 50 + 6 * 120,
  };
  projected60.artistSubs = projected60.artistSubs || 2520;
  const proj60Total = projected60.sponsorRevenue + projected60.artistSubs;
  const proj60Pool = projected60.sponsorRevenue * 0.8;
  const proj60Profit = proj60Total - proj60Pool - 1800 - 1100 - 1380;

  const projected100 = {
    artists: data.station?.maxArtistCapacity || 340,
    sponsors: data.station?.maxSponsorCapacity || 125,
    sponsorRevenue: (data.station?.maxSponsorCapacity || 125) * 178,
    artistSubs: 80 * 5 + 40 * 20 + 30 * 50 + 10 * 120,
  };
  const proj100Total = projected100.sponsorRevenue + projected100.artistSubs;
  const proj100Pool = projected100.sponsorRevenue * 0.8;
  const proj100Profit = proj100Total - proj100Pool - 2400 - 1500 - 1800;

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin" className="hover:text-gray-700">Admin</Link>
            <ArrowRight className="w-3 h-3" />
            <span>Financial Summary</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-600" />
            Station Financial Summary
          </h1>
          <p className="text-gray-600 mt-1">
            {data.station?.name || "Station"} — Live data from database · Period: {data.currentPeriod}
          </p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </div>
            <div className="text-2xl font-bold text-gray-900">${fmt(f.totalGrossRevenue)}</div>
            <div className="text-xs text-gray-400 mt-1">monthly</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Award className="w-4 h-4" />
              Artist Pool (80%)
            </div>
            <div className="text-2xl font-bold text-green-600">${fmt(f.artistPool)}</div>
            <div className="text-xs text-gray-400 mt-1">distributed to artists</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              Station Retained
            </div>
            <div className="text-2xl font-bold text-amber-600">${fmt(f.stationRetained + f.artistSubscriptionRevenue)}</div>
            <div className="text-xs text-gray-400 mt-1">operations + subs</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <PieChart className="w-4 h-4" />
              Per Share Value
            </div>
            <div className="text-2xl font-bold text-purple-600">${fmt(f.perShareValue)}</div>
            <div className="text-xs text-gray-400 mt-1">{data.artists.totalShares.toLocaleString()} total shares</div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Sources */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Revenue Sources (Monthly)
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-semibold text-green-900">Sponsor Revenue</div>
                  <div className="text-sm text-green-700">{data.sponsors.activeSponsorships} active sponsorships</div>
                </div>
                <div className="text-xl font-bold text-green-600">${fmt(f.sponsorRevenue)}</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-semibold text-purple-900">Artist Subscriptions</div>
                  <div className="text-sm text-purple-700">{data.artists.total - data.artists.byTier.FREE} paid artists</div>
                </div>
                <div className="text-xl font-bold text-purple-600">${fmt(f.artistSubscriptionRevenue)}</div>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Gross Revenue</span>
                <span className="text-xl font-bold text-gray-900">${fmt(f.totalGrossRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Revenue Distribution
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-semibold text-blue-900">Artist Pool</div>
                  <div className="text-sm text-blue-700">80% of sponsor revenue to artists</div>
                </div>
                <div className="text-xl font-bold text-blue-600">${fmt(f.artistPool)}</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <div>
                  <div className="font-semibold text-amber-900">Station Operations</div>
                  <div className="text-sm text-amber-700">20% of sponsor revenue retained</div>
                </div>
                <div className="text-xl font-bold text-amber-600">${fmt(f.stationRetained)}</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-semibold text-purple-900">Subscription Revenue</div>
                  <div className="text-sm text-purple-700">Artist tier payments (station keeps)</div>
                </div>
                <div className="text-xl font-bold text-purple-600">${fmt(f.artistSubscriptionRevenue)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Artist Tier Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-600" />
            Artist Tier Breakdown & ROI
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Tier</th>
                  <th className="py-2 pr-4 text-right">Artists</th>
                  <th className="py-2 pr-4 text-right">Cost/mo</th>
                  <th className="py-2 pr-4 text-right">Shares</th>
                  <th className="py-2 pr-4 text-right">Pool Earnings</th>
                  <th className="py-2 pr-4 text-right">Net/mo</th>
                  <th className="py-2 pr-4 text-right">ROI</th>
                  <th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(f.tierEarnings).map(([tier, info]) => {
                  const count = data.artists.byTier[tier as keyof typeof data.artists.byTier] || 0;
                  const roi = info.cost > 0 ? ((info.net / info.cost) * 100) : 0;
                  return (
                    <tr key={tier} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{tier.replace("_", " $")}</td>
                      <td className="py-3 pr-4 text-right">{count}</td>
                      <td className="py-3 pr-4 text-right">${info.cost}</td>
                      <td className="py-3 pr-4 text-right">{info.shares}</td>
                      <td className="py-3 pr-4 text-right text-green-600">${fmt(info.poolEarnings)}</td>
                      <td className={`py-3 pr-4 text-right font-semibold ${info.net >= 0 ? "text-green-600" : "text-red-500"}`}>
                        ${fmt(info.net)}
                      </td>
                      <td className={`py-3 pr-4 text-right ${roi > 0 ? "text-green-600" : roi < 0 ? "text-red-500" : "text-gray-400"}`}>
                        {info.cost > 0 ? `${roi.toFixed(0)}%` : "—"}
                      </td>
                      <td className="py-3 text-right">${fmt(count * info.cost)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 font-bold">
                  <td className="py-3 pr-4">TOTAL</td>
                  <td className="py-3 pr-4 text-right">{data.artists.total}</td>
                  <td className="py-3 pr-4 text-right" colSpan={2}>{data.artists.totalShares.toLocaleString()} shares</td>
                  <td className="py-3 pr-4 text-right text-green-600">${fmt(f.artistPool)}</td>
                  <td className="py-3 pr-4 text-right" colSpan={2}></td>
                  <td className="py-3 text-right">${fmt(f.artistSubscriptionRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Capacity Gauges */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-600" />
            Station Capacity
          </h2>
          <div className="space-y-4">
            <CapacityBar
              label="Artists"
              current={data.capacity.artists.current}
              max={data.capacity.artists.max}
              pct={data.capacity.artists.pct}
              color="bg-purple-500"
            />
            <CapacityBar
              label="Sponsors"
              current={data.capacity.sponsors.current}
              max={data.capacity.sponsors.max}
              pct={data.capacity.sponsors.pct}
              color="bg-green-500"
            />
            <CapacityBar
              label="Active Listeners (DAU)"
              current={data.capacity.listeners.current}
              max={data.capacity.listeners.target}
              pct={data.capacity.listeners.pct}
              color="bg-blue-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{data.programming.djs}</div>
              <div className="text-xs text-gray-500">Active DJs</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{data.programming.songs.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Songs in Library</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{data.scouts.active}</div>
              <div className="text-xs text-gray-500">Active Scouts</div>
            </div>
          </div>
        </div>

        {/* Projections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-bold text-lg mb-1">Current State</h3>
            <p className="text-sm text-gray-500 mb-4">{data.capacity.artists.pct.toFixed(0)}% capacity</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Gross Revenue</span><span className="font-semibold">${fmt(f.totalGrossRevenue)}</span></div>
              <div className="flex justify-between"><span>Artist Pool</span><span className="text-green-600">-${fmt(f.artistPool)}</span></div>
              <div className="flex justify-between"><span>Subscriptions</span><span className="font-semibold">${fmt(f.artistSubscriptionRevenue)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-bold">Station Net</span><span className="font-bold text-amber-600">${fmt(f.stationRetained + f.artistSubscriptionRevenue)}</span></div>
            </div>
          </div>
          {/* 60% Projected */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border border-green-200">
            <h3 className="font-bold text-lg mb-1 text-green-900">60% Capacity</h3>
            <p className="text-sm text-green-700 mb-4">{projected60.artists} artists, {projected60.sponsors} sponsors</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Sponsor Revenue</span><span className="font-semibold">${projected60.sponsorRevenue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Artist Subs</span><span className="font-semibold">${projected60.artistSubs.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Artist Pool (80%)</span><span className="text-green-600">-${proj60Pool.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Commissions</span><span className="text-red-500">-$2,900</span></div>
              <div className="flex justify-between"><span>Operations</span><span className="text-red-500">-$1,380</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-bold">Net Profit</span><span className="font-bold text-green-600">${proj60Profit.toLocaleString()}/mo</span></div>
              <div className="text-right text-xs text-green-700">${(proj60Profit * 12).toLocaleString()}/year</div>
            </div>
          </div>
          {/* 100% Projected */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 shadow-sm border border-amber-200">
            <h3 className="font-bold text-lg mb-1 text-amber-900">100% Capacity</h3>
            <p className="text-sm text-amber-700 mb-4">{projected100.artists} artists, {projected100.sponsors} sponsors</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Sponsor Revenue</span><span className="font-semibold">${projected100.sponsorRevenue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Artist Subs</span><span className="font-semibold">${projected100.artistSubs.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Artist Pool (80%)</span><span className="text-green-600">-${proj100Pool.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Commissions</span><span className="text-red-500">-$3,900</span></div>
              <div className="flex justify-between"><span>Operations</span><span className="text-red-500">-$1,800</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-bold">Net Profit</span><span className="font-bold text-amber-600">${proj100Profit.toLocaleString()}/mo</span></div>
              <div className="text-right text-xs text-amber-700">${(proj100Profit * 12).toLocaleString()}/year</div>
            </div>
          </div>
        </div>

        {/* Model Viability Checks */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            {allChecks ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
            Station Model Viability Checks
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Artists Seeded", ok: checks.hasArtists },
              { label: "Sponsors Active", ok: checks.hasSponsors },
              { label: "Listeners Present", ok: checks.hasListeners },
              { label: "DJs Configured", ok: checks.hasDJs },
              { label: "Music Library", ok: checks.hasSongs },
              { label: "80% Pool Protected", ok: checks.artistPoolProtected },
              { label: "TIER_5 Positive ROI", ok: checks.positiveROI_tier5 },
              { label: "TIER_20 Positive ROI", ok: checks.positiveROI_tier20 },
              { label: "Revenue Flowing", ok: checks.revenuePositive },
            ].map((c) => (
              <div
                key={c.label}
                className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                  c.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
                }`}
              >
                {c.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                {c.label}
              </div>
            ))}
          </div>
          {allChecks && (
            <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3 text-sm text-green-800 font-medium">
              All viability checks passed. The station model is mathematically sound and operational.
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/verification" className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition text-center">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Revenue Verification</span>
          </Link>
          <Link href="/revenue/projections" className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Revenue Projections</span>
          </Link>
          <Link href="/capacity" className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition text-center">
            <Radio className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            <span className="text-sm font-medium text-gray-700">Capacity Planner</span>
          </Link>
          <Link href="/riley/pool-calculator" className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Pool Calculator</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
