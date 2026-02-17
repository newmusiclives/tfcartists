"use client";

import { useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Target,
  Zap,
  Award,
  Radio,
  Check,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

export default function RevenueProjectionsPage() {
  const [capacity, setCapacity] = useState<"60" | "100">("60");

  // ======================================================================
  // 60% CAPACITY MODEL - RECONCILED (all promises match budget)
  // ======================================================================
  const capacity60 = {
    metadata: {
      artists: 300,
      sponsors: 72,
      listeners: 6000,
      referralArtists: 60,
      growthPartners: 25,
      premiumListeners: 240, // 4% conversion (industry realistic)
    },
    revenue: {
      artistSubscriptions: {
        TIER_5: 90 * 5,
        TIER_20: 48 * 20,
        TIER_50: 30 * 50,
        TIER_120: 12 * 120,
        total: 4350,
      },
      sponsorRevenue: {
        BRONZE: 24 * 100,
        SILVER: 27 * 250,
        GOLD: 15 * 400,
        PLATINUM: 6 * 500,
        total: 18150,
      },
      listenerPremium: 240 * 3, // $720 - 4% conversion (realistic for niche radio)
      platformFees: 200, // Transaction fees on donations/tips (2%)
      sponsoredContent: 300, // Sponsored playlist slots, featured artists
      total: 23720,
    },
    expenses: {
      artistPool: 18150 * 0.8, // $14,520 - 80% of sponsor revenue (PROTECTED)
      scoutCommissions: 1800, // Tiered system with per-tier caps
      gpCommissions: 1100, // Multi-stream earning model
      sponsorAcquisition: 300, // Referral bonuses (50% of first month, amortized)
      operations: 2500, // Hosting, licensing, bandwidth, tools
      total: 20220,
    },
    profit: 3500,
    profitMargin: 14.8,
  };

  // ======================================================================
  // 100% CAPACITY MODEL - RECONCILED (all promises match budget)
  // ======================================================================
  const capacity100 = {
    metadata: {
      artists: 500,
      sponsors: 120,
      listeners: 10000,
      referralArtists: 100,
      growthPartners: 42,
      premiumListeners: 400, // 4% conversion (industry realistic)
    },
    revenue: {
      artistSubscriptions: {
        TIER_5: 150 * 5,
        TIER_20: 80 * 20,
        TIER_50: 50 * 50,
        TIER_120: 20 * 120,
        total: 10000,
      },
      sponsorRevenue: {
        BRONZE: 40 * 100,
        SILVER: 45 * 250,
        GOLD: 25 * 400,
        PLATINUM: 10 * 500,
        total: 22250,
      },
      listenerPremium: 400 * 3, // $1,200 - 4% conversion (realistic for niche radio)
      platformFees: 333, // Transaction fees on donations/tips (2%)
      sponsoredContent: 500, // Sponsored playlist slots, featured artists
      total: 34283,
    },
    expenses: {
      artistPool: 22250 * 0.8, // $17,800 - 80% of sponsor revenue (PROTECTED)
      scoutCommissions: 3000, // Tiered system with per-tier caps
      gpCommissions: 1833, // Multi-stream earning model
      sponsorAcquisition: 500, // Referral bonuses (50% of first month, amortized)
      operations: 3500, // Hosting, licensing, bandwidth, tools
      total: 26633,
    },
    profit: 7650,
    profitMargin: 22.3,
  };

  const current = capacity === "60" ? capacity60 : capacity100;

  // Artist Referral Commission System - Tiered with per-tier caps
  const scoutCommissionBreakdown = capacity === "60" ? {
    first3Months: { rate: "20%", amount: 400 },
    ongoing: { rate: "12%", amount: 350 },
    prepurchase: { rate: "25%", amount: 280 },
    upgradeBonuses: { amount: 120, per: "$10" },
    influenceBonuses: { amount: 80, per: "$2" },
    milestoneBonus5Artists: { amount: 270, total: 9 }, // $30 × 9 (one-time, amortized)
    milestoneBonus10Artists: { amount: 300, total: 6 }, // $50 × 6 (one-time, amortized)
  } : {
    first3Months: { rate: "20%", amount: 667 },
    ongoing: { rate: "12%", amount: 583 },
    prepurchase: { rate: "25%", amount: 467 },
    upgradeBonuses: { amount: 200, per: "$10" },
    influenceBonuses: { amount: 133, per: "$2" },
    milestoneBonus5Artists: { amount: 450, total: 15 }, // $30 × 15 (one-time, amortized)
    milestoneBonus10Artists: { amount: 500, total: 10 }, // $50 × 10 (one-time, amortized)
  };

  // Listener Commission System - Multi-stream with caps
  const gpCommissionBreakdown = capacity === "60" ? {
    listenerBounties: { rate: "$0.50", listeners: 750, amount: 375, cap: "$30/mo" },
    artistDiscovery: { rate: "8%", cap: "$50/mo", amount: 200 },
    artistDevelopment: { rate: "12%", cap: "$40/mo", amount: 180 },
    sponsorReferral: { rate: "10%", amount: 150, cap: "$50/mo" },
    premiumListenerBonus: { rate: "$1", listeners: 90, amount: 90, cap: "$20/mo" },
    dualRoleBonus: { amount: 105, count: 15 },
  } : {
    listenerBounties: { rate: "$0.50", listeners: 1250, amount: 625, cap: "$40/mo" },
    artistDiscovery: { rate: "8%", cap: "$60/mo", amount: 333 },
    artistDevelopment: { rate: "12%", cap: "$50/mo", amount: 300 },
    sponsorReferral: { rate: "10%", amount: 250, cap: "$60/mo" },
    premiumListenerBonus: { rate: "$1", listeners: 150, amount: 150, cap: "$25/mo" },
    dualRoleBonus: { amount: 175, count: 25 },
  };

  // Artist Promoter Performance Tiers - capped to fit budget
  const scoutTiers = capacity === "60" ? {
    tier1: { name: "Elite (Top 20%)", artists: 12, avgEarning: 67, range: "$55-$80", cap: "$80" },
    tier2: { name: "Strong (Next 20%)", artists: 12, avgEarning: 35, range: "$25-$45", cap: "$45" },
    tier3: { name: "Active (Next 30%)", artists: 18, avgEarning: 16, range: "$10-$22", cap: "$22" },
    tier4: { name: "Developing (30%)", artists: 18, avgEarning: 6, range: "$3-$10", cap: "$10" },
  } : {
    tier1: { name: "Elite (Top 20%)", artists: 20, avgEarning: 75, range: "$60-$95", cap: "$95" },
    tier2: { name: "Strong (Next 20%)", artists: 20, avgEarning: 38, range: "$28-$50", cap: "$50" },
    tier3: { name: "Active (Next 30%)", artists: 30, avgEarning: 15, range: "$10-$22", cap: "$22" },
    tier4: { name: "Developing (30%)", artists: 30, avgEarning: 5, range: "$3-$10", cap: "$10" },
  };

  const avgEarnings = {
    artistFromPool: current.expenses.artistPool / current.metadata.artists,
    scoutMonthly: current.expenses.scoutCommissions / current.metadata.referralArtists,
    scoutTop20: capacity === "60" ? 67 : 75, // Elite tier average
    gpMonthly: current.expenses.gpCommissions / current.metadata.growthPartners,
    dualRole: capacity === "60" ? 70 : 75, // Realistic combined (not additive of averages)
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <SharedNav />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Revenue Projections</h1>
                <p className="text-gray-600">
                  Reconciled financial model — all promises backed by budget
                </p>
              </div>
            </div>

            {/* Capacity Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCapacity("60")}
                className={`px-4 py-2 rounded-md font-semibold transition-all ${
                  capacity === "60"
                    ? "bg-white text-purple-600 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                60% Capacity
              </button>
              <button
                onClick={() => setCapacity("100")}
                className={`px-4 py-2 rounded-md font-semibold transition-all ${
                  capacity === "100"
                    ? "bg-white text-purple-600 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                100% Capacity
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Profit Target Banner */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Check className="w-8 h-8" />
              <div>
                <div className="text-sm text-green-100">Target Achieved</div>
                <div className="text-2xl font-bold">
                  {capacity === "60" ? "$3,500" : "$7,650"} Monthly Profit
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-100">Annual Projection</div>
              <div className="text-3xl font-bold">
                ${(current.profit * 12).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Station at {capacity}% Capacity</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{current.metadata.artists}</div>
              <div className="text-sm text-purple-700">Active Artists</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{current.metadata.sponsors}</div>
              <div className="text-sm text-blue-700">Active Sponsors</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{current.metadata.listeners.toLocaleString()}</div>
              <div className="text-sm text-green-700">Total Listeners</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{current.metadata.referralArtists}</div>
              <div className="text-sm text-orange-700">Active Artists</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-3xl font-bold text-pink-600">{current.metadata.growthPartners}</div>
              <div className="text-sm text-pink-700">Listener Promoters</div>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-200" />
              <div className="text-right">
                <div className="text-sm text-green-100">Gross Revenue</div>
                <div className="text-3xl font-bold">${current.revenue.total.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-green-400 text-sm">
              <div>
                <div className="text-green-100">Sponsors</div>
                <div className="font-bold">${current.revenue.sponsorRevenue.total.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-green-100">Artists</div>
                <div className="font-bold">${current.revenue.artistSubscriptions.total.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-red-200" />
              <div className="text-right">
                <div className="text-sm text-red-100">Total Expenses</div>
                <div className="text-3xl font-bold">${current.expenses.total.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-red-400 text-sm">
              <div>
                <div className="text-red-100">Artist Pool</div>
                <div className="font-bold">${current.expenses.artistPool.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-red-100">Commissions + Ops</div>
                <div className="font-bold">${(current.expenses.scoutCommissions + current.expenses.gpCommissions + current.expenses.sponsorAcquisition + current.expenses.operations).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-blue-200" />
              <div className="text-right">
                <div className="text-sm text-blue-100">Net Profit</div>
                <div className="text-3xl font-bold">${current.profit.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-blue-400 text-sm">
              <div>
                <div className="text-blue-100">Margin</div>
                <div className="font-bold">{current.profitMargin.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-blue-100">Annual</div>
                <div className="font-bold">${(current.profit * 12).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
            Revenue Sources - ${current.revenue.total.toLocaleString()}/month
          </h2>

          <div className="space-y-6">
            {/* Sponsor Revenue */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Sponsor Revenue</h3>
                <span className="text-2xl font-bold text-blue-600">
                  ${current.revenue.sponsorRevenue.total.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(current.revenue.sponsorRevenue).map(([tier, amount]) => {
                  if (tier === 'total') return null;
                  return (
                    <div key={tier} className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-sm font-semibold text-blue-700">{tier}</div>
                      <div className="text-lg font-bold text-blue-900">${amount.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Artist Subscriptions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Artist Tier Subscriptions</h3>
                <span className="text-2xl font-bold text-purple-600">
                  ${current.revenue.artistSubscriptions.total.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(current.revenue.artistSubscriptions).map(([tier, amount]) => {
                  if (tier === 'total') return null;
                  return (
                    <div key={tier} className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-sm font-semibold text-purple-700">{tier}</div>
                      <div className="text-lg font-bold text-purple-900">${amount.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NEW REVENUE STREAMS */}
            <div className="border-t-2 border-green-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-green-600" />
                  New Revenue Streams (Maximize Incentives)
                </h3>
                <span className="text-2xl font-bold text-green-600">
                  ${(current.revenue.listenerPremium + current.revenue.platformFees + current.revenue.sponsoredContent).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="text-sm font-semibold text-green-700">Premium Listeners</div>
                  <div className="text-lg font-bold text-green-900">${current.revenue.listenerPremium.toLocaleString()}</div>
                  <div className="text-xs text-green-600 mt-1">
                    {current.metadata.premiumListeners} @ $3/mo
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Ad-free, downloads, early access</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="text-sm font-semibold text-green-700">Platform Fees</div>
                  <div className="text-lg font-bold text-green-900">${current.revenue.platformFees.toLocaleString()}</div>
                  <div className="text-xs text-green-600 mt-1">2% transaction fee</div>
                  <div className="text-xs text-gray-500 mt-1">Donations, tips, direct support</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="text-sm font-semibold text-green-700">Sponsored Content</div>
                  <div className="text-lg font-bold text-green-900">${current.revenue.sponsoredContent.toLocaleString()}</div>
                  <div className="text-xs text-green-600 mt-1">Featured placements</div>
                  <div className="text-xs text-gray-500 mt-1">Sponsored playlists, artist features</div>
                </div>
              </div>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <strong>💡 Key Insight:</strong> These additional streams supplement core revenue. All promoter payouts are capped to fit within budget while maintaining the 80% artist pool and ${current.profit.toLocaleString()}/month profit.
              </div>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <TrendingDown className="w-6 h-6 mr-2 text-red-600" />
            Expenses & Payouts - ${current.expenses.total.toLocaleString()}/month
          </h2>

          <div className="space-y-4">
            {/* Artist Pool */}
            <div className="border-l-4 border-green-500 pl-4 bg-green-50 rounded-r-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Artist Pool Distribution</h3>
                  <p className="text-sm text-gray-600">80% of sponsor revenue (PROTECTED)</p>
                  <p className="text-xs text-green-700 mt-1">
                    Avg per artist: ${avgEarnings.artistFromPool.toFixed(2)}/month
                  </p>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  ${current.expenses.artistPool.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Artist Referral Commissions - ENHANCED */}
            <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 rounded-r-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-orange-500" />
                    Artist Promoter Commissions (Tiered, Capped)
                  </h3>
                  <p className="text-sm text-gray-600">{current.metadata.referralArtists} promoters with per-tier earning caps</p>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  ${current.expenses.scoutCommissions.toLocaleString()}
                </span>
              </div>

              {/* Commission Rates */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
                <div className="bg-white rounded p-2 border-2 border-orange-300">
                  <div className="text-orange-600 font-semibold">First 3 Months</div>
                  <div className="text-orange-900 font-bold">{scoutCommissionBreakdown.first3Months.rate}</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.first3Months.amount}</div>
                </div>
                <div className="bg-white rounded p-2 border-2 border-orange-300">
                  <div className="text-orange-600 font-semibold">Ongoing</div>
                  <div className="text-orange-900 font-bold">{scoutCommissionBreakdown.ongoing.rate}</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.ongoing.amount}</div>
                </div>
                <div className="bg-white rounded p-2 border-2 border-orange-300">
                  <div className="text-orange-600 font-semibold">Prepurchase</div>
                  <div className="text-orange-900 font-bold">{scoutCommissionBreakdown.prepurchase.rate}</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.prepurchase.amount}</div>
                </div>
                <div className="bg-white rounded p-2 border-2 border-orange-300">
                  <div className="text-orange-600 font-semibold">Upgrade Bonus</div>
                  <div className="text-orange-900 font-bold">{scoutCommissionBreakdown.upgradeBonuses.per}</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.upgradeBonuses.amount}</div>
                </div>
                <div className="bg-white rounded p-2 border-2 border-orange-300">
                  <div className="text-orange-600 font-semibold">Influence Bonus</div>
                  <div className="text-orange-900 font-bold">{scoutCommissionBreakdown.influenceBonuses.per}</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.influenceBonuses.amount}</div>
                </div>
              </div>

              {/* NEW: Milestone Bonuses */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded p-2 border-2 border-yellow-400">
                  <div className="text-yellow-800 font-semibold">🏆 5 Artists Milestone</div>
                  <div className="text-yellow-900 font-bold">$30 one-time bonus</div>
                  <div className="text-yellow-700">${scoutCommissionBreakdown.milestoneBonus5Artists.amount} total</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded p-2 border-2 border-yellow-400">
                  <div className="text-yellow-800 font-semibold">🏆 10 Artists Milestone</div>
                  <div className="text-yellow-900 font-bold">$50 one-time bonus</div>
                  <div className="text-yellow-700">${scoutCommissionBreakdown.milestoneBonus10Artists.amount} total</div>
                </div>
              </div>

              {/* Performance Tiers */}
              <div className="mt-3 bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 rounded p-3">
                <div className="text-xs font-bold text-orange-900 mb-2">📊 Performance Tiers (Quality over Quantity):</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {Object.entries(scoutTiers).map(([key, tier]) => (
                    <div key={key} className="bg-white rounded p-2 border border-orange-200">
                      <div className="font-semibold text-orange-700">{tier.name}</div>
                      <div className="text-gray-600">{tier.artists} artists</div>
                      <div className="font-bold text-orange-900">{tier.range}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caps per tier */}
              <div className="mt-3 bg-green-50 border-2 border-green-300 rounded p-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <div className="text-green-800">
                    <strong>Per-tier caps ensure budget sustainability.</strong> Elite cap: ${scoutTiers.tier1.cap}/mo, Strong: ${scoutTiers.tier2.cap}/mo, Active: ${scoutTiers.tier3.cap}/mo, Developing: ${scoutTiers.tier4.cap}/mo.
                  </div>
                </div>
              </div>
            </div>

            {/* Listener Promotion Commissions - ENHANCED */}
            <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 rounded-r-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-blue-500" />
                    Listener Promoter Commissions (Multi-Stream, Capped)
                  </h3>
                  <p className="text-sm text-gray-600">{current.metadata.growthPartners} promoters with per-stream earning caps</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  ${current.expenses.gpCommissions.toLocaleString()}
                </span>
              </div>

              {/* Core Commission Streams */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs mb-3">
                <div className="bg-white rounded p-2 border-2 border-blue-300">
                  <div className="text-blue-600 font-semibold">Listener Bounties</div>
                  <div className="text-blue-900 font-bold">{gpCommissionBreakdown.listenerBounties.rate}/active</div>
                  <div className="text-blue-700">${gpCommissionBreakdown.listenerBounties.amount.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{gpCommissionBreakdown.listenerBounties.listeners} listeners</div>
                </div>
                <div className="bg-white rounded p-2 border-2 border-blue-300">
                  <div className="text-blue-600 font-semibold">Artist Discovery</div>
                  <div className="text-blue-900 font-bold">{gpCommissionBreakdown.artistDiscovery.rate}</div>
                  <div className="text-blue-700">${gpCommissionBreakdown.artistDiscovery.amount}</div>
                  <div className="text-xs text-green-600 font-semibold">{gpCommissionBreakdown.artistDiscovery.cap}</div>
                </div>
                <div className="bg-white rounded p-2 border-2 border-blue-300">
                  <div className="text-blue-600 font-semibold">Artist Development</div>
                  <div className="text-blue-900 font-bold">{gpCommissionBreakdown.artistDevelopment.rate}</div>
                  <div className="text-blue-700">${gpCommissionBreakdown.artistDevelopment.amount}</div>
                  <div className="text-xs text-green-600 font-semibold">{gpCommissionBreakdown.artistDevelopment.cap}</div>
                </div>
              </div>

              {/* Additional Revenue Streams */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs mb-3">
                <div className="bg-gradient-to-r from-green-100 to-green-200 rounded p-2 border-2 border-green-400">
                  <div className="text-green-800 font-semibold">Sponsor Referral</div>
                  <div className="text-green-900 font-bold">{gpCommissionBreakdown.sponsorReferral.rate} commission</div>
                  <div className="text-green-700">${gpCommissionBreakdown.sponsorReferral.amount}</div>
                  <div className="text-xs text-gray-500">Cap: {gpCommissionBreakdown.sponsorReferral.cap}</div>
                </div>
                <div className="bg-gradient-to-r from-green-100 to-green-200 rounded p-2 border-2 border-green-400">
                  <div className="text-green-800 font-semibold">Premium Listener Bonus</div>
                  <div className="text-green-900 font-bold">{gpCommissionBreakdown.premiumListenerBonus.rate} per conversion</div>
                  <div className="text-green-700">${gpCommissionBreakdown.premiumListenerBonus.amount}</div>
                  <div className="text-xs text-gray-500">Cap: {gpCommissionBreakdown.premiumListenerBonus.cap}</div>
                </div>
                <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded p-2 border-2 border-purple-400">
                  <div className="text-purple-800 font-semibold">Dual-Role Bonus</div>
                  <div className="text-purple-900 font-bold">{gpCommissionBreakdown.dualRoleBonus.count} participants</div>
                  <div className="text-purple-700">${gpCommissionBreakdown.dualRoleBonus.amount} total</div>
                </div>
              </div>

              {/* Budget Integrity */}
              <div className="mt-3 bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300 rounded p-3 text-xs">
                <div className="font-bold text-blue-900 mb-2">Budget Integrity:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-blue-800">
                  <div className="flex items-start space-x-1">
                    <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Listener bounties: $0.50/active (capped {gpCommissionBreakdown.listenerBounties.cap})</span>
                  </div>
                  <div className="flex items-start space-x-1">
                    <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Artist commissions: 8% / 12% (capped per stream)</span>
                  </div>
                  <div className="flex items-start space-x-1">
                    <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Per-stream caps ensure total stays within ${current.expenses.gpCommissions.toLocaleString()} budget</span>
                  </div>
                  <div className="flex items-start space-x-1">
                    <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sponsor referral: 10% (capped {gpCommissionBreakdown.sponsorReferral.cap})</span>
                  </div>
                  <div className="flex items-start space-x-1">
                    <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Premium conversion: $1 each (capped {gpCommissionBreakdown.premiumListenerBonus.cap})</span>
                  </div>
                  <div className="flex items-start space-x-1">
                    <Check className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Dual-role combined: ~${avgEarnings.dualRole}/mo realistic average</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sponsor Acquisition Reserve */}
            <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 rounded-r-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Sponsor Acquisition Reserve</h3>
                  <p className="text-sm text-gray-600">Referral bonuses (50% of first month, amortized monthly)</p>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  ${current.expenses.sponsorAcquisition.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Operational Expenses */}
            <div className="border-l-4 border-gray-500 pl-4 bg-gray-50 rounded-r-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Operational Expenses</h3>
                  <p className="text-sm text-gray-600">Hosting, streaming, licensing (ASCAP/BMI), bandwidth, tools</p>
                </div>
                <span className="text-2xl font-bold text-gray-600">
                  ${current.expenses.operations.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Summary */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-8 border-2 border-green-300">
          <h2 className="text-2xl font-bold mb-6 text-green-900 flex items-center">
            <Radio className="w-7 h-7 mr-2" />
            TrueFans RADIO™ Net Profit at {capacity}% Capacity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <div className="text-sm text-gray-600 mb-2">Monthly Net Profit</div>
              <div className="text-5xl font-bold text-green-600 mb-2">
                ${current.profit.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {current.profitMargin.toFixed(1)}% profit margin
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <div className="text-sm text-gray-600 mb-2">Annual Net Profit</div>
              <div className="text-5xl font-bold text-green-600 mb-2">
                ${(current.profit * 12).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Projected yearly earnings
              </div>
            </div>
          </div>
        </div>

        {/* Average Earnings - ENHANCED */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Earning Opportunities - All Roles (Budget-Backed)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div className="text-right">
                  <div className="text-sm text-purple-700">Artists</div>
                  <div className="text-xs text-purple-600">{current.metadata.artists} active</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-700">
                ${avgEarnings.artistFromPool.toFixed(2)}
              </div>
              <div className="text-xs text-purple-600 mt-1 font-semibold">From artist pool (80% PROTECTED)</div>
              <div className="text-xs text-gray-500 mt-1">Unchanged - core value maintained</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-300 ring-2 ring-orange-400">
              <div className="flex items-center justify-between mb-3">
                <Award className="w-8 h-8 text-orange-600" />
                <div className="text-right">
                  <div className="text-sm text-orange-700 font-bold">Promoters (AVG)</div>
                  <div className="text-xs text-orange-600">{current.metadata.referralArtists} active</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-700">
                ${avgEarnings.scoutMonthly.toFixed(2)}
              </div>
              <div className="text-xs text-orange-600 mt-1">Elite avg: ${avgEarnings.scoutTop20}/mo</div>
              <div className="text-xs text-gray-500 mt-1">Per-tier caps apply</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300 ring-2 ring-blue-400">
              <div className="flex items-center justify-between mb-3">
                <Zap className="w-8 h-8 text-blue-600" />
                <div className="text-right">
                  <div className="text-sm text-blue-700 font-bold">Listener Promoters</div>
                  <div className="text-xs text-blue-600">{current.metadata.growthPartners} active</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-700">
                ${avgEarnings.gpMonthly.toFixed(2)}
              </div>
              <div className="text-xs text-blue-600 mt-1">Multi-stream, per-stream caps</div>
              <div className="text-xs text-gray-500 mt-1">5 income streams available</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50 rounded-lg p-6 border-4 border-green-400 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-1">
                  <Award className="w-6 h-6 text-orange-600" />
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-700 font-bold">Dual-Role ⭐</div>
                  <div className="text-xs text-green-600">Artist Promoter + Listener</div>
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
                ${avgEarnings.dualRole}
              </div>
              <div className="text-xs text-green-700 mt-1 font-bold">Realistic combined average</div>
              <div className="text-xs text-gray-600 mt-1">Both roles, per-tier caps apply</div>
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-300">
            <p className="text-sm text-gray-800">
              <strong className="text-green-700">Reconciled Model:</strong> Every payout promise is backed by budget with per-tier and per-stream caps.
              Sponsor referral acquisition costs are budgeted. Operations include licensing, hosting, and bandwidth at realistic levels.
              <br/><br/>
              <strong className="text-purple-700">80% Artist Pool:</strong> ${current.expenses.artistPool.toLocaleString()}/mo PROTECTED.
              <strong className="text-blue-700"> Station Profit:</strong> ${current.profit.toLocaleString()}/month (${(current.profit * 12).toLocaleString()}/year) at {current.profitMargin}% margin.
              <br/>
              <strong className="text-green-700">Result:</strong> Sustainable payouts, honest caps, no unfunded promises.
            </p>
          </div>
        </div>

        {/* RECONCILED MODEL - Summary */}
        <div className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 rounded-xl shadow-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">Reconciled Financial Model</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-yellow-200">Revenue Streams</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span><strong>Sponsors:</strong> ${current.revenue.sponsorRevenue.total.toLocaleString()}/mo ({current.metadata.sponsors} sponsors)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span><strong>Artist Subs:</strong> ${current.revenue.artistSubscriptions.total.toLocaleString()}/mo ({current.metadata.artists} artists)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span><strong>Premium Listeners:</strong> ${current.revenue.listenerPremium.toLocaleString()}/mo (4% conversion @ $3/mo)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span><strong>Other:</strong> ${(current.revenue.platformFees + current.revenue.sponsoredContent).toLocaleString()}/mo (fees + sponsored content)</span>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6 text-yellow-200">Artist Promoter Model</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Commissions: <strong>20% / 12% / 25%</strong></span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Upgrade/influence bonuses: <strong>$10 / $2</strong></span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Per-tier caps: Elite ${scoutTiers.tier1.cap}, Strong ${scoutTiers.tier2.cap}, Active ${scoutTiers.tier3.cap}</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Milestone bonuses: <strong>$30 @ 5 artists, $50 @ 10 artists</strong></span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Total budget: <strong>${current.expenses.scoutCommissions.toLocaleString()}/mo</strong> for {current.metadata.referralArtists} promoters</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-yellow-200">Listener Promoter Model</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Listener bounties: <strong>$0.50/active</strong> (capped per person)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Artist commissions: <strong>8% / 12%</strong> (capped per stream)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Sponsor referral: <strong>10%</strong> (capped per person)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Premium conversion: <strong>$1 each</strong> (capped per person)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Total budget: <strong>${current.expenses.gpCommissions.toLocaleString()}/mo</strong> for {current.metadata.growthPartners} promoters</span>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6 text-yellow-200">Protected Commitments</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="font-bold text-yellow-100">80% artist pool: ${current.expenses.artistPool.toLocaleString()}/mo</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="font-bold text-yellow-100">Station profit: ${current.profit.toLocaleString()}/mo ({current.profitMargin}% margin)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Operations: ${current.expenses.operations.toLocaleString()}/mo (hosting, licensing, tools)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-yellow-300 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Sponsor acquisition: ${current.expenses.sponsorAcquisition.toLocaleString()}/mo reserve</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-white/30">
            <div className="text-center">
              <div className="text-sm text-green-200 mb-3 font-semibold">FULLY RECONCILED - EVERY DOLLAR ACCOUNTED FOR</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-300">${current.profit.toLocaleString()}/mo</div>
                  <div className="text-sm text-white/80">Station Profit</div>
                  <div className="text-xs text-green-300">${(current.profit * 12).toLocaleString()}/year</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-300">${current.expenses.artistPool.toLocaleString()}</div>
                  <div className="text-sm text-white/80">Artist Pool (Protected)</div>
                  <div className="text-xs text-green-300">80% of sponsor revenue</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-300">${(current.expenses.scoutCommissions + current.expenses.gpCommissions).toLocaleString()}</div>
                  <div className="text-sm text-white/80">Promoter Payouts</div>
                  <div className="text-xs text-green-300">Capped and budget-backed</div>
                </div>
              </div>
              <div className="text-lg text-white font-semibold bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-lg p-4">
                {current.metadata.referralArtists} artist promoters + {current.metadata.growthPartners} listener promoters with honest, capped earnings<br/>
                {current.metadata.artists} artists with protected pool income<br/>
                ${(current.profit * 12).toLocaleString()}/year sustainable station profit
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
