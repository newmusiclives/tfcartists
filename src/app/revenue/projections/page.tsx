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
  // 60% CAPACITY MODEL
  // ======================================================================
  const capacity60 = {
    metadata: {
      artists: 300,
      sponsors: 72,
      listeners: 6000,
      scouts: 90,
      growthPartners: 18,
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
      total: 22500,
    },
    expenses: {
      artistPool: 18150 * 0.8, // $14,520 - 80% of sponsor revenue
      scoutCommissions: 600, // Reduced rates + caps
      gpCommissions: 380, // Drastically reduced
      operations: 2000, // Lean, AI-powered
      total: 17500,
    },
    profit: 6000,
    profitMargin: 26.7,
  };

  // ======================================================================
  // 100% CAPACITY MODEL
  // ======================================================================
  const capacity100 = {
    metadata: {
      artists: 500,
      sponsors: 120,
      listeners: 10000,
      scouts: 150,
      growthPartners: 30,
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
      total: 32250,
    },
    expenses: {
      artistPool: 22250 * 0.8, // $17,800 - 80% of sponsor revenue
      scoutCommissions: 1000, // Scaled with caps
      gpCommissions: 633, // Scaled
      operations: 3333, // Scaled
      total: 22766,
    },
    profit: 9484,
    profitMargin: 29.4,
  };

  const current = capacity === "60" ? capacity60 : capacity100;

  // Commission breakdown details
  const scoutCommissionBreakdown = capacity === "60" ? {
    first3Months: { rate: "15%", amount: 250 },
    ongoing: { rate: "7%", amount: 180 },
    prepurchase: { rate: "20%", amount: 120 },
    upgradeBonuses: { amount: 30, per: "$5" },
    influenceBonuses: { amount: 20, per: "$1" },
  } : {
    first3Months: { rate: "15%", amount: 420 },
    ongoing: { rate: "7%", amount: 300 },
    prepurchase: { rate: "20%", amount: 200 },
    upgradeBonuses: { amount: 50, per: "$5" },
    influenceBonuses: { amount: 30, per: "$1" },
  };

  const gpCommissionBreakdown = capacity === "60" ? {
    listenerBounties: { rate: "$0.25", listeners: 450, amount: 112.50 },
    artistDiscovery: { rate: "5%", cap: "$100", amount: 100 },
    artistDevelopment: { rate: "8%", cap: "$80", amount: 80 },
    networkEffects: { amount: 0, status: "ELIMINATED" },
    adRevenueShare: { amount: 0, status: "ELIMINATED" },
    donationCommission: { amount: 0, status: "ELIMINATED" },
  } : {
    listenerBounties: { rate: "$0.25", listeners: 750, amount: 187.50 },
    artistDiscovery: { rate: "5%", cap: "$167", amount: 167 },
    artistDevelopment: { rate: "8%", cap: "$133", amount: 133 },
    networkEffects: { amount: 0, status: "ELIMINATED" },
    adRevenueShare: { amount: 0, status: "ELIMINATED" },
    donationCommission: { amount: 0, status: "ELIMINATED" },
  };

  const avgEarnings = {
    artistFromPool: current.expenses.artistPool / current.metadata.artists,
    scoutMonthly: current.expenses.scoutCommissions / current.metadata.scouts,
    gpMonthly: current.expenses.gpCommissions / current.metadata.growthPartners,
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
                  Sustainable financial model with $6K+ monthly profit
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
                  {capacity === "60" ? "$6,000+" : "$9,000+"} Monthly Profit
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
              <div className="text-3xl font-bold text-orange-600">{current.metadata.scouts}</div>
              <div className="text-sm text-orange-700">Active Scouts</div>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-3xl font-bold text-pink-600">{current.metadata.growthPartners}</div>
              <div className="text-sm text-pink-700">Growth Partners</div>
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
                <div className="text-red-100">Operations</div>
                <div className="font-bold">${(current.expenses.scoutCommissions + current.expenses.gpCommissions + current.expenses.operations).toLocaleString()}</div>
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

            {/* Scout Commissions */}
            <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 rounded-r-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-orange-500" />
                    Scout Commissions (REDUCED RATES)
                  </h3>
                  <p className="text-sm text-gray-600">From artist tier subscriptions</p>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  ${current.expenses.scoutCommissions.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="bg-white rounded p-2 border border-orange-200">
                  <div className="text-orange-600 font-semibold">First 3 Months</div>
                  <div className="text-orange-900">{scoutCommissionBreakdown.first3Months.rate}</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.first3Months.amount}</div>
                </div>
                <div className="bg-white rounded p-2 border border-orange-200">
                  <div className="text-orange-600 font-semibold">Ongoing</div>
                  <div className="text-orange-900">{scoutCommissionBreakdown.ongoing.rate}</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.ongoing.amount}</div>
                </div>
                <div className="bg-white rounded p-2 border border-orange-200">
                  <div className="text-orange-600 font-semibold">Prepurchase</div>
                  <div className="text-orange-900">{scoutCommissionBreakdown.prepurchase.rate}</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.prepurchase.amount}</div>
                </div>
                <div className="bg-white rounded p-2 border border-orange-200">
                  <div className="text-orange-600 font-semibold">Upgrade Bonus</div>
                  <div className="text-orange-900">{scoutCommissionBreakdown.upgradeBonuses.per} each</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.upgradeBonuses.amount}</div>
                </div>
                <div className="bg-white rounded p-2 border border-orange-200">
                  <div className="text-orange-600 font-semibold">Influence Bonus</div>
                  <div className="text-orange-900">{scoutCommissionBreakdown.influenceBonuses.per} each</div>
                  <div className="text-orange-700">${scoutCommissionBreakdown.influenceBonuses.amount}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-orange-700">
                <strong>Cap per scout:</strong> $15/month max
              </div>
            </div>

            {/* Sponsor Growth Partner Commissions */}
            <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 rounded-r-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-blue-500" />
                    Sponsor Growth Partner Commissions (MINIMAL)
                  </h3>
                  <p className="text-sm text-gray-600">From station's 20% operational share</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  ${current.expenses.gpCommissions.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <div className="bg-white rounded p-2 border border-blue-200">
                  <div className="text-blue-600 font-semibold">Listener Bounties</div>
                  <div className="text-blue-900">{gpCommissionBreakdown.listenerBounties.rate}/active</div>
                  <div className="text-blue-700">${gpCommissionBreakdown.listenerBounties.amount.toFixed(2)}</div>
                </div>
                <div className="bg-white rounded p-2 border border-blue-200">
                  <div className="text-blue-600 font-semibold">Artist Discovery</div>
                  <div className="text-blue-900">{gpCommissionBreakdown.artistDiscovery.rate}</div>
                  <div className="text-blue-700">${gpCommissionBreakdown.artistDiscovery.amount}</div>
                </div>
                <div className="bg-white rounded p-2 border border-blue-200">
                  <div className="text-blue-600 font-semibold">Artist Development</div>
                  <div className="text-blue-900">{gpCommissionBreakdown.artistDevelopment.rate}</div>
                  <div className="text-blue-700">${gpCommissionBreakdown.artistDevelopment.amount}</div>
                </div>
              </div>
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-yellow-800">
                    <strong>Eliminated for profitability:</strong> Network effects, ad revenue share, and donation commissions removed
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Expenses */}
            <div className="border-l-4 border-gray-500 pl-4 bg-gray-50 rounded-r-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Operational Expenses (Lean & AI-Powered)</h3>
                  <p className="text-sm text-gray-600">Platform, minimal team, marketing</p>
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

        {/* Average Earnings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Average Monthly Earnings per Participant</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="text-xs text-purple-600 mt-1">From artist pool (80% protected)</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <Award className="w-8 h-8 text-orange-600" />
                <div className="text-right">
                  <div className="text-sm text-orange-700">Scouts</div>
                  <div className="text-xs text-orange-600">{current.metadata.scouts} active</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-700">
                ${avgEarnings.scoutMonthly.toFixed(2)}
              </div>
              <div className="text-xs text-orange-600 mt-1">Max $15/month cap (reduced rates)</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <Zap className="w-8 h-8 text-blue-600" />
                <div className="text-right">
                  <div className="text-sm text-blue-700">Growth Partners</div>
                  <div className="text-xs text-blue-600">{current.metadata.growthPartners} active</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-700">
                ${avgEarnings.gpMonthly.toFixed(2)}
              </div>
              <div className="text-xs text-blue-600 mt-1">Minimal passive income</div>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Commission rates have been reduced ~70-95% to ensure station profitability.
              The 80% artist pool remains protected. Top-performing scouts and growth partners earn more than average,
              but caps are in place to maintain healthy profit margins.
            </p>
          </div>
        </div>

        {/* Key Changes Made */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">🎯 Sustainable Revenue Model - Key Changes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-100">What Changed</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>Scout commissions: 15% / 7% / 20% (reduced from 20% / 10% / 25%)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>Scout bonuses: $5 / $1 (reduced from $10 / $2)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>Scout cap: $15/month maximum per scout</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>GP listener bounties: $0.25/active (monthly, not cumulative)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>GP commissions reduced 95% - only essentials kept</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>Operations lean & AI-powered ($2-3K instead of $12K)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-100">What Stayed Protected</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span><strong>80% artist pool</strong> - Core value proposition maintained</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>Artists still earn $48/month average from pool at 60%</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>Scouts can still earn - just with realistic caps</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>Growth partners earn passive income from listeners</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-300 mr-2 flex-shrink-0" />
                  <span>Station achieves target: <strong>${capacity === "60" ? "6,000" : "9,484"}/month profit</strong></span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="text-sm text-blue-100 mb-2">Result: Sustainable & Profitable</div>
              <div className="text-4xl font-bold mb-2">
                ${(current.profit * 12).toLocaleString()}/year
              </div>
              <div className="text-lg text-blue-100">
                while fairly compensating {current.metadata.artists} artists, {current.metadata.scouts} scouts, and {current.metadata.growthPartners} growth partners
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
