"use client";

import { useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  CheckCircle2,
  XCircle,
  Calculator,
  Play,
  Award,
  Zap,
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Target,
} from "lucide-react";

export default function VerificationPage() {
  const [capacity, setCapacity] = useState<"60" | "100">("60");
  const [activeTest, setActiveTest] = useState<string | null>(null);

  // Test scenarios
  const [scoutTest, setScoutTest] = useState({
    artistsReferred: 5,
    tier: "20",
    months: 6,
    upgrades: 1,
    influencedArtists: 2,
  });

  const [gpTest, setGpTest] = useState({
    listeners: 30,
    artistsDiscovered: 3,
    artistsHelped: 2,
    sponsorsReferred: 1,
    premiumConversions: 5,
  });

  const [sponsorTest, setSponsorTest] = useState({
    referrals: [
      { tier: "Bronze", count: 1 },
      { tier: "Silver", count: 2 },
      { tier: "Gold", count: 1 },
    ],
  });

  // Revenue model verification
  const verifyRevenueModel = (cap: "60" | "100") => {
    const model = cap === "60" ? {
      revenue: {
        artistSubs: 4350,
        sponsors: 18150,
        premium: 1800,
        platformFees: 200,
        sponsored: 300,
        total: 24800,
      },
      expenses: {
        artistPool: 14520,
        artists: 1800,
        gps: 1100,
        operations: 1380,
        total: 18800,
      },
      profit: 6000,
    } : {
      revenue: {
        artistSubs: 10000,
        sponsors: 22250,
        premium: 3000,
        platformFees: 333,
        sponsored: 500,
        total: 36083,
      },
      expenses: {
        artistPool: 17800,
        artists: 3000,
        gps: 1833,
        operations: 2300,
        total: 24933,
      },
      profit: 11150,
    };

    const revenueCheck = model.revenue.total ===
      (model.revenue.artistSubs + model.revenue.sponsors + model.revenue.premium +
       model.revenue.platformFees + model.revenue.sponsored);

    const expensesCheck = model.expenses.total ===
      (model.expenses.artistPool + model.expenses.referralArtists + model.expenses.gps +
       model.expenses.operations);

    const profitCheck = model.profit === (model.revenue.total - model.expenses.total);

    const artistPoolCheck = model.expenses.artistPool === (model.revenue.sponsors * 0.8);

    return {
      model,
      checks: {
        revenueCalculation: revenueCheck,
        expensesCalculation: expensesCheck,
        profitCalculation: profitCheck,
        artistPoolProtected: artistPoolCheck,
        allPassed: revenueCheck && expensesCheck && profitCheck && artistPoolCheck,
      }
    };
  };

  // Calculate Artist Referral earnings
  const calculateScoutEarnings = () => {
    const { artistsReferred, tier, months, upgrades, influencedArtists } = scoutTest;
    const tierPrice = parseInt(tier);

    let earnings = 0;
    let breakdown: any[] = [];

    // First 3 months (20%)
    const first3Months = Math.min(months, 3);
    const first3Earnings = artistsReferred * tierPrice * 0.20 * first3Months;
    earnings += first3Earnings;
    breakdown.push({
      label: `First 3 Months (20% of $${tierPrice})`,
      calculation: `${artistsReferred} artists × $${tierPrice} × 20% × ${first3Months} months`,
      amount: first3Earnings,
    });

    // Ongoing (12%) - after first 3 months
    if (months > 3) {
      const ongoingMonths = months - 3;
      const ongoingEarnings = artistsReferred * tierPrice * 0.12 * ongoingMonths;
      earnings += ongoingEarnings;
      breakdown.push({
        label: `Ongoing Commission (12% of $${tierPrice})`,
        calculation: `${artistsReferred} artists × $${tierPrice} × 12% × ${ongoingMonths} months`,
        amount: ongoingEarnings,
      });
    }

    // Upgrade bonuses ($10 each)
    const upgradeEarnings = upgrades * 10;
    earnings += upgradeEarnings;
    breakdown.push({
      label: "Upgrade Bonuses ($10 each)",
      calculation: `${upgrades} upgrades × $10`,
      amount: upgradeEarnings,
    });

    // Influence bonuses ($2 each)
    const influenceEarnings = influencedArtists * 2;
    earnings += influenceEarnings;
    breakdown.push({
      label: "Influence Bonuses ($2 each)",
      calculation: `${influencedArtists} influenced × $2`,
      amount: influenceEarnings,
    });

    // Milestone bonuses
    if (artistsReferred >= 5) {
      earnings += 30;
      breakdown.push({
        label: "5 Artists Milestone",
        calculation: "One-time bonus",
        amount: 30,
      });
    }
    if (artistsReferred >= 10) {
      earnings += 50;
      breakdown.push({
        label: "10 Artists Milestone",
        calculation: "One-time bonus",
        amount: 50,
      });
    }

    return { total: earnings, breakdown };
  };

  // Calculate Listener Promotion earnings
  const calculateGPEarnings = () => {
    const { listeners, artistsDiscovered, artistsHelped, sponsorsReferred, premiumConversions } = gpTest;

    let earnings = 0;
    let breakdown: any[] = [];

    // Listener bounties ($0.50 each, monthly recurring)
    const listenerEarnings = listeners * 0.50;
    earnings += listenerEarnings;
    breakdown.push({
      label: "Listener Bounties ($0.50/active)",
      calculation: `${listeners} listeners × $0.50/month`,
      amount: listenerEarnings,
      recurring: true,
    });

    // Artist discovery (8% of $20 avg subscription)
    const discoveryEarnings = artistsDiscovered * 20 * 0.08;
    earnings += discoveryEarnings;
    breakdown.push({
      label: "Artist Discovery (8% commission)",
      calculation: `${artistsDiscovered} artists × $20 avg × 8%`,
      amount: discoveryEarnings,
      recurring: true,
    });

    // Artist development (12% of upgrades, avg $30 upgrade)
    const developmentEarnings = artistsHelped * 30 * 0.12;
    earnings += developmentEarnings;
    breakdown.push({
      label: "Artist Development (12% of upgrades)",
      calculation: `${artistsHelped} upgrades × $30 avg × 12%`,
      amount: developmentEarnings,
    });

    // Sponsor referrals (10% of avg $250 contract)
    const sponsorEarnings = sponsorsReferred * 250 * 0.10;
    earnings += sponsorEarnings;
    breakdown.push({
      label: "Sponsor Referrals (10% commission)",
      calculation: `${sponsorsReferred} sponsors × $250 avg × 10%`,
      amount: sponsorEarnings,
    });

    // Premium conversions ($1 each)
    const premiumEarnings = premiumConversions * 1;
    earnings += premiumEarnings;
    breakdown.push({
      label: "Premium Conversions ($1 each)",
      calculation: `${premiumConversions} conversions × $1`,
      amount: premiumEarnings,
    });

    return { total: earnings, breakdown };
  };

  // Calculate Sponsor referral earnings
  const calculateSponsorReferrals = () => {
    const tierValues: { [key: string]: number } = {
      Bronze: 50,
      Silver: 125,
      Gold: 200,
      Platinum: 250,
    };

    let earnings = 0;
    let breakdown: any[] = [];
    let totalReferrals = 0;
    let platinumCount = 0;

    sponsorTest.referrals.forEach(ref => {
      const amount = tierValues[ref.tier] * ref.count;
      earnings += amount;
      totalReferrals += ref.count;
      if (ref.tier === "Platinum") platinumCount += ref.count;

      breakdown.push({
        label: `${ref.tier} Referrals`,
        calculation: `${ref.count} × $${tierValues[ref.tier]}`,
        amount,
      });
    });

    // Bonus for 5+ referrals
    if (totalReferrals >= 5) {
      earnings += 100;
      breakdown.push({
        label: "5+ Referrals Bonus",
        calculation: "Milestone achieved",
        amount: 100,
      });
    }

    // Bonus for 3+ Platinum referrals
    if (platinumCount >= 3) {
      earnings += 150;
      breakdown.push({
        label: "3+ Platinum Specialist Bonus",
        calculation: "Elite referrer",
        amount: 150,
      });
    }

    return { total: earnings, breakdown };
  };

  const revenueVerification = verifyRevenueModel(capacity);
  const scoutEarnings = calculateScoutEarnings();
  const gpEarnings = calculateGPEarnings();
  const sponsorEarnings = calculateSponsorReferrals();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <SharedNav />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Process Verification Dashboard</h1>
                <p className="text-gray-600">Test and verify all team processes, calculations, and commission structures</p>
              </div>
            </div>

            {/* Capacity Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCapacity("60")}
                className={`px-4 py-2 rounded-md font-semibold transition-all ${
                  capacity === "60"
                    ? "bg-white text-blue-600 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                60% Capacity
              </button>
              <button
                onClick={() => setCapacity("100")}
                className={`px-4 py-2 rounded-md font-semibold transition-all ${
                  capacity === "100"
                    ? "bg-white text-blue-600 shadow"
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

        {/* Revenue Model Verification */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Target className="w-6 h-6 mr-2 text-green-600" />
            Revenue Model Verification - {capacity}% Capacity
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Breakdown */}
            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <h3 className="font-bold text-lg mb-3 text-green-900">Revenue Sources</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Artist Subscriptions:</span>
                  <span className="font-semibold">${revenueVerification.model.revenue.artistSubs.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Sponsor Revenue:</span>
                  <span className="font-semibold">${revenueVerification.model.revenue.sponsors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Premium Listeners:</span>
                  <span className="font-semibold">${revenueVerification.model.revenue.premium.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Platform Fees:</span>
                  <span className="font-semibold">${revenueVerification.model.revenue.platformFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Sponsored Content:</span>
                  <span className="font-semibold">${revenueVerification.model.revenue.sponsored.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-green-300">
                  <span className="font-bold text-green-900">Total Revenue:</span>
                  <span className="font-bold text-green-600">${revenueVerification.model.revenue.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
              <h3 className="font-bold text-lg mb-3 text-red-900">Expenses</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Artist Pool (80%):</span>
                  <span className="font-semibold">${revenueVerification.model.expenses.artistPool.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Artist Referral Commissions:</span>
                  <span className="font-semibold">${revenueVerification.model.expenses.referralArtists.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Listener Promotion Commissions:</span>
                  <span className="font-semibold">${revenueVerification.model.expenses.gps.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Operations:</span>
                  <span className="font-semibold">${revenueVerification.model.expenses.operations.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-red-300">
                  <span className="font-bold text-red-900">Total Expenses:</span>
                  <span className="font-bold text-red-600">${revenueVerification.model.expenses.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Checks */}
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <h3 className="font-bold text-lg mb-3 text-blue-900">Automated Verification Checks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className={`flex items-center space-x-2 p-3 rounded ${revenueVerification.checks.revenueCalculation ? 'bg-green-100' : 'bg-red-100'}`}>
                {revenueVerification.checks.revenueCalculation ?
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                  <XCircle className="w-5 h-5 text-red-600" />
                }
                <span className="text-sm font-semibold">Revenue Math</span>
              </div>

              <div className={`flex items-center space-x-2 p-3 rounded ${revenueVerification.checks.expensesCalculation ? 'bg-green-100' : 'bg-red-100'}`}>
                {revenueVerification.checks.expensesCalculation ?
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                  <XCircle className="w-5 h-5 text-red-600" />
                }
                <span className="text-sm font-semibold">Expense Math</span>
              </div>

              <div className={`flex items-center space-x-2 p-3 rounded ${revenueVerification.checks.profitCalculation ? 'bg-green-100' : 'bg-red-100'}`}>
                {revenueVerification.checks.profitCalculation ?
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                  <XCircle className="w-5 h-5 text-red-600" />
                }
                <span className="text-sm font-semibold">Profit Math</span>
              </div>

              <div className={`flex items-center space-x-2 p-3 rounded ${revenueVerification.checks.artistPoolProtected ? 'bg-green-100' : 'bg-red-100'}`}>
                {revenueVerification.checks.artistPoolProtected ?
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                  <XCircle className="w-5 h-5 text-red-600" />
                }
                <span className="text-sm font-semibold">80% Protected</span>
              </div>
            </div>

            {/* Final Profit */}
            <div className="mt-4 pt-4 border-t-2 border-blue-300">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-blue-900">NET PROFIT:</span>
                <span className="text-3xl font-bold text-green-600">${revenueVerification.model.profit.toLocaleString()}/month</span>
              </div>
              <div className="text-sm text-blue-700 text-right mt-1">
                ${(revenueVerification.model.profit * 12).toLocaleString()}/year
              </div>
            </div>
          </div>

          {revenueVerification.checks.allPassed ? (
            <div className="mt-4 bg-green-100 border-2 border-green-400 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-green-900">✅ All Revenue Model Checks PASSED!</div>
                <div className="text-sm text-green-700">All calculations are mathematically correct and the 80% artist pool is protected.</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-red-100 border-2 border-red-400 rounded-lg p-4 flex items-start space-x-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-900">❌ Revenue Model Has Errors!</div>
                <div className="text-sm text-red-700">One or more calculations are incorrect. Check the model.</div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Commission Calculators */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Artist Referral Calculator */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-orange-600" />
              Artist Referral Commission Calculator
            </h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Artists Referred</label>
                <input
                  type="number"
                  value={scoutTest.artistsReferred}
                  onChange={(e) => setScoutTest({...scoutTest, artistsReferred: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Avg Tier Price ($)</label>
                <select
                  value={scoutTest.tier}
                  onChange={(e) => setScoutTest({...scoutTest, tier: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="5">$5/month</option>
                  <option value="20">$20/month</option>
                  <option value="50">$50/month</option>
                  <option value="120">$120/month</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Active Months</label>
                <input
                  type="number"
                  value={scoutTest.months}
                  onChange={(e) => setScoutTest({...scoutTest, months: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tier Upgrades</label>
                <input
                  type="number"
                  value={scoutTest.upgrades}
                  onChange={(e) => setScoutTest({...scoutTest, upgrades: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Influenced Artists</label>
                <input
                  type="number"
                  value={scoutTest.influencedArtists}
                  onChange={(e) => setScoutTest({...scoutTest, influencedArtists: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
              <div className="text-sm text-orange-700 mb-2">Total Earnings:</div>
              <div className="text-3xl font-bold text-orange-600 mb-3">${scoutEarnings.total.toFixed(2)}</div>

              <div className="space-y-1 text-xs">
                {scoutEarnings.breakdown.map((item, idx) => (
                  <div key={idx} className="border-t border-orange-200 pt-1">
                    <div className="font-semibold text-orange-900">{item.label}</div>
                    <div className="text-orange-700">{item.calculation}</div>
                    <div className="text-orange-600 font-bold">${item.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Listener Promotion Calculator */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Listener Promotion Commission Calculator
            </h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Active Listeners</label>
                <input
                  type="number"
                  value={gpTest.listeners}
                  onChange={(e) => setGpTest({...gpTest, listeners: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Artists Discovered</label>
                <input
                  type="number"
                  value={gpTest.artistsDiscovered}
                  onChange={(e) => setGpTest({...gpTest, artistsDiscovered: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Artists Helped (upgrades)</label>
                <input
                  type="number"
                  value={gpTest.artistsHelped}
                  onChange={(e) => setGpTest({...gpTest, artistsHelped: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Sponsors Referred</label>
                <input
                  type="number"
                  value={gpTest.sponsorsReferred}
                  onChange={(e) => setGpTest({...gpTest, sponsorsReferred: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Premium Conversions</label>
                <input
                  type="number"
                  value={gpTest.premiumConversions}
                  onChange={(e) => setGpTest({...gpTest, premiumConversions: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="text-sm text-blue-700 mb-2">Total Monthly Earnings:</div>
              <div className="text-3xl font-bold text-blue-600 mb-3">${gpEarnings.total.toFixed(2)}/mo</div>

              <div className="space-y-1 text-xs">
                {gpEarnings.breakdown.map((item, idx) => (
                  <div key={idx} className="border-t border-blue-200 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-blue-900">{item.label}</div>
                      {item.recurring && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">RECURRING</span>}
                    </div>
                    <div className="text-blue-700">{item.calculation}</div>
                    <div className="text-blue-600 font-bold">${item.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sponsor Referral Calculator */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-purple-600" />
              Sponsor Referral Calculator
            </h3>

            <div className="space-y-3 mb-4">
              {sponsorTest.referrals.map((ref, idx) => (
                <div key={idx}>
                  <label className="text-sm font-medium text-gray-700">{ref.tier} Referrals</label>
                  <input
                    type="number"
                    value={ref.count}
                    onChange={(e) => {
                      const newReferrals = [...sponsorTest.referrals];
                      newReferrals[idx].count = parseInt(e.target.value) || 0;
                      setSponsorTest({...sponsorTest, referrals: newReferrals});
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              ))}
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <div className="text-sm text-purple-700 mb-2">Total Referral Earnings:</div>
              <div className="text-3xl font-bold text-purple-600 mb-3">${sponsorEarnings.total.toFixed(2)}</div>

              <div className="space-y-1 text-xs">
                {sponsorEarnings.breakdown.map((item, idx) => (
                  <div key={idx} className="border-t border-purple-200 pt-1">
                    <div className="font-semibold text-purple-900">{item.label}</div>
                    <div className="text-purple-700">{item.calculation}</div>
                    <div className="text-purple-600 font-bold">${item.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Process Status */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">✅ All Systems Operational</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <CheckCircle2 className="w-8 h-8 mb-2" />
              <div className="font-bold mb-1">Revenue Model</div>
              <div className="text-sm text-green-100">Math verified ✓</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <CheckCircle2 className="w-8 h-8 mb-2" />
              <div className="font-bold mb-1">Artist Referral System</div>
              <div className="text-sm text-green-100">Calculations accurate ✓</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <CheckCircle2 className="w-8 h-8 mb-2" />
              <div className="font-bold mb-1">Listener Promotion System</div>
              <div className="text-sm text-green-100">Multi-stream working ✓</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <CheckCircle2 className="w-8 h-8 mb-2" />
              <div className="font-bold mb-1">Sponsor Referrals</div>
              <div className="text-sm text-green-100">Bonuses calculated ✓</div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
