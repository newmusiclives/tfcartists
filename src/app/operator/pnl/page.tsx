"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Cpu,
  Server,
  Radio,
  Building2,
  Users,
} from "lucide-react";

interface PnlData {
  period: string;
  monthCount: number;
  summary: {
    monthlyRevenue: number;
    monthlyCosts: number;
    netProfit: number;
    grossMarginPct: number;
    netMarginPct: number;
  };
  revenue: {
    sponsorTotal: number;
    artistSubscriptionTotal: number;
    total: number;
    sponsorByTier: Record<string, { count: number; total: number }>;
    artistTierBreakdown: {
      tier: string;
      count: number;
      pricePerMonth: number;
      totalMonthly: number;
    }[];
    sponsorDetails: {
      name: string;
      tier: string;
      monthlyAmount: number;
    }[];
  };
  costs: {
    ai: number;
    hosting: number;
    streaming: number;
    total: number;
  };
  monthlyBreakdown: {
    month: string;
    sponsorRevenue: number;
    artistRevenue: number;
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
  }[];
}

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatCurrencyExact(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function tierLabel(tier: string): string {
  if (tier === "FREE") return "Free";
  return tier.replace("TIER_", "$") + "/mo";
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${y}`;
}

export default function OperatorPnlPage() {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [data, setData] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/operator/pnl?period=${period}`);
      if (!res.ok) throw new Error("Failed to load P&L data");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    if (!data) return;
    const s = data.summary;
    const lines = [
      "=== OPERATOR P&L REPORT ===",
      `Period: ${period === "month" ? "This Month" : period === "quarter" ? "Last 3 Months" : "This Year"}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      "--- REVENUE ---",
      `  Sponsor Income:        ${formatCurrencyExact(data.revenue.sponsorTotal)}/mo`,
      `  Artist Subscriptions:  ${formatCurrencyExact(data.revenue.artistSubscriptionTotal)}/mo`,
      `  TOTAL REVENUE:         ${formatCurrencyExact(data.revenue.total)}/mo`,
      "",
      "--- COSTS ---",
      `  AI Generation:         ${formatCurrencyExact(data.costs.ai)}/mo`,
      `  Hosting:               ${formatCurrencyExact(data.costs.hosting)}/mo`,
      `  Streaming:             ${formatCurrencyExact(data.costs.streaming)}/mo`,
      `  TOTAL COSTS:           ${formatCurrencyExact(data.costs.total)}/mo`,
      "",
      "--- PROFIT ---",
      `  Net Profit:            ${formatCurrencyExact(s.netProfit)}/mo`,
      `  Profit Margin:         ${s.netMarginPct.toFixed(1)}%`,
      "",
      "--- SPONSOR BREAKDOWN ---",
      ...data.revenue.sponsorDetails.map(
        (sp) => `  ${sp.name} (${sp.tier}): ${formatCurrencyExact(sp.monthlyAmount)}/mo`
      ),
      "",
      "--- ARTIST TIER BREAKDOWN ---",
      ...data.revenue.artistTierBreakdown.map(
        (t) => `  ${tierLabel(t.tier)}: ${t.count} artists x ${formatCurrencyExact(t.pricePerMonth)} = ${formatCurrencyExact(t.totalMonthly)}/mo`
      ),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-zinc-300">{error || "No data available"}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const { summary, revenue, costs, monthlyBreakdown } = data;
  const isProfit = summary.netProfit >= 0;

  // For the bar chart, find the max value for scaling
  const maxBarValue = Math.max(
    ...monthlyBreakdown.map((m) => Math.max(m.totalRevenue, m.totalCosts)),
    1
  );

  // Revenue pie percentages
  const revTotal = revenue.total || 1;
  const sponsorPct = (revenue.sponsorTotal / revTotal) * 100;
  const artistPct = (revenue.artistSubscriptionTotal / revTotal) * 100;

  // Cost pie percentages
  const costTotal = costs.total || 1;
  const aiPct = (costs.ai / costTotal) * 100;
  const hostingPct = (costs.hosting / costTotal) * 100;
  const streamingPct = (costs.streaming / costTotal) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-emerald-400" />
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">
                  Operator P&L
                </h1>
                <p className="text-sm text-zinc-400">
                  Profit & Loss Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <div className="flex bg-zinc-800 rounded-lg p-1">
                {(["month", "quarter", "year"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                      period === p
                        ? "bg-emerald-600 text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {p === "month"
                      ? "This Month"
                      : p === "quarter"
                      ? "Last 3 Months"
                      : "This Year"}
                  </button>
                ))}
              </div>
              {/* Export */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 border border-zinc-700 transition text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Export P&L
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Revenue */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">Monthly Revenue</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(summary.monthlyRevenue)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {formatCurrency(summary.monthlyRevenue * 12)}/year projected
            </div>
          </div>

          {/* Monthly Costs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">Monthly Costs</span>
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">
              {formatCurrency(summary.monthlyCosts)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {formatCurrency(summary.monthlyCosts * 12)}/year projected
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">Net Profit</span>
              {isProfit ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div
              className={`text-2xl font-bold ${
                isProfit ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatCurrency(summary.netProfit)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {formatCurrency(summary.netProfit * 12)}/year projected
            </div>
          </div>

          {/* Profit Margin */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">Profit Margin</span>
              <PieChart className="w-5 h-5 text-blue-400" />
            </div>
            <div
              className={`text-2xl font-bold ${
                isProfit ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {summary.netMarginPct.toFixed(1)}%
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Gross: {summary.grossMarginPct.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Revenue & Cost Breakdown (side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Revenue Breakdown
            </h2>
            <div className="space-y-4">
              {/* Sponsor slice */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-zinc-300">
                      Sponsor Income
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">
                    {formatCurrency(revenue.sponsorTotal)}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${sponsorPct}%` }}
                  />
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {sponsorPct.toFixed(1)}% of revenue
                </div>
              </div>

              {/* Artist slice */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm text-zinc-300">
                      Artist Subscriptions
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">
                    {formatCurrency(revenue.artistSubscriptionTotal)}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${artistPct}%` }}
                  />
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {artistPct.toFixed(1)}% of revenue
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-300">
                    Total Monthly Revenue
                  </span>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatCurrency(revenue.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Cost Breakdown
            </h2>
            <div className="space-y-4">
              {/* AI */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-amber-400" />
                    <span className="text-sm text-zinc-300">
                      AI Generation
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">
                    {formatCurrency(costs.ai)}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                  <div
                    className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${aiPct}%` }}
                  />
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {aiPct.toFixed(1)}% of costs
                </div>
              </div>

              {/* Hosting */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Server className="w-3 h-3 text-cyan-400" />
                    <span className="text-sm text-zinc-300">Hosting</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">
                    {formatCurrency(costs.hosting)}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                  <div
                    className="bg-cyan-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${hostingPct}%` }}
                  />
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {hostingPct.toFixed(1)}% of costs
                </div>
              </div>

              {/* Streaming */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3 h-3 text-rose-400" />
                    <span className="text-sm text-zinc-300">Streaming</span>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">
                    {formatCurrency(costs.streaming)}
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-3">
                  <div
                    className="bg-rose-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${streamingPct}%` }}
                  />
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {streamingPct.toFixed(1)}% of costs
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-300">
                    Total Monthly Costs
                  </span>
                  <span className="text-lg font-bold text-red-400">
                    {formatCurrency(costs.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend Bar Chart */}
        {monthlyBreakdown.length > 1 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Monthly Trend
            </h2>
            <div className="flex items-end gap-3 h-48">
              {monthlyBreakdown.map((m) => {
                const revHeight = (m.totalRevenue / maxBarValue) * 100;
                const costHeight = (m.totalCosts / maxBarValue) * 100;
                return (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="flex items-end gap-1 h-40 w-full justify-center">
                      {/* Revenue bar */}
                      <div className="flex flex-col items-center flex-1 max-w-8">
                        <div
                          className="w-full bg-emerald-500/80 rounded-t transition-all duration-500"
                          style={{ height: `${revHeight}%` }}
                          title={`Revenue: ${formatCurrency(m.totalRevenue)}`}
                        />
                      </div>
                      {/* Cost bar */}
                      <div className="flex flex-col items-center flex-1 max-w-8">
                        <div
                          className="w-full bg-red-500/60 rounded-t transition-all duration-500"
                          style={{ height: `${costHeight}%` }}
                          title={`Costs: ${formatCurrency(m.totalCosts)}`}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 mt-1">
                      {monthLabel(m.month)}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500/80" />
                Revenue
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500/60" />
                Costs
              </div>
            </div>
          </div>
        )}

        {/* Revenue by Source Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Revenue by Source
          </h2>

          {/* Sponsors */}
          {revenue.sponsorDetails.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Sponsors
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-2 px-3 text-zinc-400 font-medium">
                        Business
                      </th>
                      <th className="text-left py-2 px-3 text-zinc-400 font-medium">
                        Tier
                      </th>
                      <th className="text-right py-2 px-3 text-zinc-400 font-medium">
                        Monthly
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.sponsorDetails.map((sp, i) => (
                      <tr
                        key={i}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                      >
                        <td className="py-2 px-3 text-zinc-200">
                          {sp.name}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-300 capitalize">
                            {sp.tier}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-medium">
                          {formatCurrencyExact(sp.monthlyAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Artist Tiers */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Artist Subscription Tiers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-3 text-zinc-400 font-medium">
                      Tier
                    </th>
                    <th className="text-right py-2 px-3 text-zinc-400 font-medium">
                      Artists
                    </th>
                    <th className="text-right py-2 px-3 text-zinc-400 font-medium">
                      Price
                    </th>
                    <th className="text-right py-2 px-3 text-zinc-400 font-medium">
                      Monthly Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.artistTierBreakdown.map((t) => (
                    <tr
                      key={t.tier}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                    >
                      <td className="py-2 px-3 text-zinc-200">
                        {tierLabel(t.tier)}
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-300">
                        {t.count}
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-300">
                        {formatCurrencyExact(t.pricePerMonth)}
                      </td>
                      <td className="py-2 px-3 text-right text-purple-400 font-medium">
                        {formatCurrencyExact(t.totalMonthly)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-700">
                    <td
                      colSpan={3}
                      className="py-2 px-3 text-right text-zinc-300 font-semibold"
                    >
                      Total
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                      {formatCurrencyExact(revenue.artistSubscriptionTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Cost Details Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-400" />
            Cost Details
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 px-3 text-zinc-400 font-medium">
                    Category
                  </th>
                  <th className="text-left py-2 px-3 text-zinc-400 font-medium">
                    Description
                  </th>
                  <th className="text-right py-2 px-3 text-zinc-400 font-medium">
                    Monthly
                  </th>
                  <th className="text-right py-2 px-3 text-zinc-400 font-medium">
                    Annual
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      AI Generation
                    </div>
                  </td>
                  <td className="py-2 px-3 text-zinc-400">
                    Voice tracks, imaging, DJ content
                  </td>
                  <td className="py-2 px-3 text-right text-red-400 font-medium">
                    {formatCurrencyExact(costs.ai)}
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-300">
                    {formatCurrencyExact(costs.ai * 12)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Server className="w-4 h-4 text-cyan-400" />
                      Hosting
                    </div>
                  </td>
                  <td className="py-2 px-3 text-zinc-400">
                    Hetzner server, Netlify, database
                  </td>
                  <td className="py-2 px-3 text-right text-red-400 font-medium">
                    {formatCurrencyExact(costs.hosting)}
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-300">
                    {formatCurrencyExact(costs.hosting * 12)}
                  </td>
                </tr>
                <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Radio className="w-4 h-4 text-rose-400" />
                      Streaming
                    </div>
                  </td>
                  <td className="py-2 px-3 text-zinc-400">
                    Icecast/Liquidsoap bandwidth
                  </td>
                  <td className="py-2 px-3 text-right text-red-400 font-medium">
                    {formatCurrencyExact(costs.streaming)}
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-300">
                    {formatCurrencyExact(costs.streaming * 12)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-zinc-700">
                  <td
                    colSpan={2}
                    className="py-2 px-3 text-right text-zinc-300 font-semibold"
                  >
                    Total
                  </td>
                  <td className="py-2 px-3 text-right text-red-400 font-bold">
                    {formatCurrencyExact(costs.total)}
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-200 font-bold">
                    {formatCurrencyExact(costs.total * 12)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bottom summary bar */}
        <div
          className={`rounded-xl p-6 border ${
            isProfit
              ? "bg-emerald-950/30 border-emerald-800"
              : "bg-red-950/30 border-red-800"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm text-zinc-400">Bottom Line</div>
              <div
                className={`text-3xl font-bold ${
                  isProfit ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatCurrency(summary.netProfit)}/mo
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                {formatCurrency(summary.netProfit * 12)}/year at current rate
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400">Profit Margin</div>
              <div
                className={`text-3xl font-bold ${
                  isProfit ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {summary.netMarginPct.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
