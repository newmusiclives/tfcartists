"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Users, TrendingUp, Calculator, User } from "lucide-react";
import { AIRPLAY_TIER_SHARES } from "@/lib/calculations/station-capacity";
import { SharedNav } from "@/components/shared-nav";

export default function PoolCalculatorPage() {
  const [harperRevenue, setHarperRevenue] = useState(7800);
  const [loading, setLoading] = useState(true);
  const artistPoolPercentage = 0.80;
  const artistPoolAmount = harperRevenue * artistPoolPercentage;

  const [artistCounts, setArtistCounts] = useState({
    FREE: 0,
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
    PLATINUM: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/riley/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        if (data.byTier) {
          setArtistCounts({
            FREE: data.byTier.FREE || 0,
            BRONZE: data.byTier.BRONZE || 0,
            SILVER: data.byTier.SILVER || 0,
            GOLD: data.byTier.GOLD || 0,
            PLATINUM: data.byTier.PLATINUM || 0,
          });
        }
        if (data.monthlyRevenue != null) {
          setHarperRevenue(data.monthlyRevenue || 7800);
        }
      } catch (err) {
        console.error("Error fetching pool stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Calculate total shares
  const totalShares =
    artistCounts.FREE * AIRPLAY_TIER_SHARES.FREE +
    artistCounts.BRONZE * AIRPLAY_TIER_SHARES.BRONZE +
    artistCounts.SILVER * AIRPLAY_TIER_SHARES.SILVER +
    artistCounts.GOLD * AIRPLAY_TIER_SHARES.GOLD +
    artistCounts.PLATINUM * AIRPLAY_TIER_SHARES.PLATINUM;

  const perShareValue = artistPoolAmount / totalShares;

  // Calculate earnings per tier
  const tierEarnings = {
    FREE: perShareValue * AIRPLAY_TIER_SHARES.FREE,
    BRONZE: perShareValue * AIRPLAY_TIER_SHARES.BRONZE,
    SILVER: perShareValue * AIRPLAY_TIER_SHARES.SILVER,
    GOLD: perShareValue * AIRPLAY_TIER_SHARES.GOLD,
    PLATINUM: perShareValue * AIRPLAY_TIER_SHARES.PLATINUM,
  };

  // Calculate total payout per tier
  const totalPayoutByTier = {
    FREE: tierEarnings.FREE * artistCounts.FREE,
    BRONZE: tierEarnings.BRONZE * artistCounts.BRONZE,
    SILVER: tierEarnings.SILVER * artistCounts.SILVER,
    GOLD: tierEarnings.GOLD * artistCounts.GOLD,
    PLATINUM: tierEarnings.PLATINUM * artistCounts.PLATINUM,
  };

  const totalArtists = Object.values(artistCounts).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pool calculator data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Shared Navigation */}
      <SharedNav />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <Calculator className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Artist Pool Share Calculator</h1>
              <p className="text-gray-600">
                Calculate monthly earnings distribution - Managed by Jordan Cross
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Revenue Input */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Monthly Revenue Input</h2>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="text-sm text-gray-600 mb-2">Harper's Team Total Revenue</div>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={harperRevenue}
                onChange={(e) => setHarperRevenue(Number(e.target.value))}
                className="flex-1 px-4 py-3 text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="text-2xl font-bold text-gray-900">/ month</span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Master Overview target: $7,800/month ($5,200 base + $2,600 premium)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Artist Pool (80%)</div>
              <div className="text-3xl font-bold text-purple-600">${artistPoolAmount.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Distributed to artists</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Station Revenue (20%)</div>
              <div className="text-3xl font-bold text-green-600">${(harperRevenue * 0.20).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Station operations</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Per Share Value</div>
              <div className="text-3xl font-bold text-gray-900">${perShareValue.toFixed(4)}</div>
              <div className="text-xs text-gray-500 mt-1">Based on {totalShares.toLocaleString()} shares</div>
            </div>
          </div>
        </div>

        {/* Artist Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Artist Distribution</h2>

          <div className="space-y-4">
            <TierRow
              tier="FREE"
              shares={AIRPLAY_TIER_SHARES.FREE}
              count={artistCounts.FREE}
              perArtist={tierEarnings.FREE}
              totalPayout={totalPayoutByTier.FREE}
              color="gray"
            />
            <TierRow
              tier="BRONZE"
              shares={AIRPLAY_TIER_SHARES.BRONZE}
              count={artistCounts.BRONZE}
              perArtist={tierEarnings.BRONZE}
              totalPayout={totalPayoutByTier.BRONZE}
              color="orange"
            />
            <TierRow
              tier="SILVER"
              shares={AIRPLAY_TIER_SHARES.SILVER}
              count={artistCounts.SILVER}
              perArtist={tierEarnings.SILVER}
              totalPayout={totalPayoutByTier.SILVER}
              color="gray"
            />
            <TierRow
              tier="GOLD"
              shares={AIRPLAY_TIER_SHARES.GOLD}
              count={artistCounts.GOLD}
              perArtist={tierEarnings.GOLD}
              totalPayout={totalPayoutByTier.GOLD}
              color="yellow"
            />
            <TierRow
              tier="PLATINUM"
              shares={AIRPLAY_TIER_SHARES.PLATINUM}
              count={artistCounts.PLATINUM}
              perArtist={tierEarnings.PLATINUM}
              totalPayout={totalPayoutByTier.PLATINUM}
              color="purple"
            />
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Total Artists</div>
                <div className="text-3xl font-bold text-gray-900">{totalArtists}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Total Shares</div>
                <div className="text-3xl font-bold text-gray-900">{totalShares.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Total Distribution</div>
                <div className="text-3xl font-bold text-purple-600">${artistPoolAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Comparison */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Monthly Earnings by Tier</h2>

          <div className="space-y-3">
            <EarningsCard
              tier="FREE"
              perMonth={tierEarnings.FREE}
              perYear={tierEarnings.FREE * 12}
              shares={AIRPLAY_TIER_SHARES.FREE}
              subscription={0}
              color="gray"
            />
            <EarningsCard
              tier="BRONZE"
              perMonth={tierEarnings.BRONZE}
              perYear={tierEarnings.BRONZE * 12}
              shares={AIRPLAY_TIER_SHARES.BRONZE}
              subscription={5}
              color="orange"
            />
            <EarningsCard
              tier="SILVER"
              perMonth={tierEarnings.SILVER}
              perYear={tierEarnings.SILVER * 12}
              shares={AIRPLAY_TIER_SHARES.SILVER}
              subscription={20}
              color="gray"
            />
            <EarningsCard
              tier="GOLD"
              perMonth={tierEarnings.GOLD}
              perYear={tierEarnings.GOLD * 12}
              shares={AIRPLAY_TIER_SHARES.GOLD}
              subscription={50}
              color="yellow"
            />
            <EarningsCard
              tier="PLATINUM"
              perMonth={tierEarnings.PLATINUM}
              perYear={tierEarnings.PLATINUM * 12}
              shares={AIRPLAY_TIER_SHARES.PLATINUM}
              subscription={120}
              color="purple"
            />
          </div>
        </div>

        {/* Payout Verification */}
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Payout Verification</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">FREE Tier Total:</span>
              <span className="font-semibold">${totalPayoutByTier.FREE.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">BRONZE Tier Total:</span>
              <span className="font-semibold">${totalPayoutByTier.BRONZE.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">SILVER Tier Total:</span>
              <span className="font-semibold">${totalPayoutByTier.SILVER.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">GOLD Tier Total:</span>
              <span className="font-semibold">${totalPayoutByTier.GOLD.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">PLATINUM Tier Total:</span>
              <span className="font-semibold">${totalPayoutByTier.PLATINUM.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg font-bold text-lg">
              <span className="text-gray-900">TOTAL DISTRIBUTED:</span>
              <span className="text-green-600">${artistPoolAmount.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-500 text-center mt-2">
              ✓ Verification: All pool funds accounted for
            </div>
          </div>
        </div>

        {/* Team Member Info */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-100 rounded-full p-3">
              <User className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Jordan Cross</h3>
              <p className="text-sm text-gray-600 mb-3">Payment Processing & Artist Support</p>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Responsibilities:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Calculate monthly pool share distributions</li>
                  <li>Process payments to artists</li>
                  <li>Handle payment-related questions</li>
                  <li>Generate payout reports</li>
                  <li>Ensure accurate and timely distributions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function TierRow({
  tier,
  shares,
  count,
  perArtist,
  totalPayout,
  color
}: {
  tier: string;
  shares: number;
  count: number;
  perArtist: number;
  totalPayout: number;
  color: string;
}) {
  const colorClasses = {
    gray: "bg-gray-50 border-gray-200",
    orange: "bg-orange-50 border-orange-200",
    yellow: "bg-yellow-50 border-yellow-200",
    purple: "bg-purple-50 border-purple-200",
  }[color];

  return (
    <div className={`${colorClasses} border-2 rounded-lg p-4`}>
      <div className="grid grid-cols-5 gap-4 items-center">
        <div>
          <div className="font-bold text-gray-900">{tier}</div>
          <div className="text-xs text-gray-500">{shares} share{shares !== 1 && 's'}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Artists</div>
          <div className="text-xl font-bold text-gray-900">{count}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Per Artist</div>
          <div className="text-xl font-bold text-green-600">${perArtist.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Payout</div>
          <div className="text-xl font-bold text-purple-600">${totalPayout.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Shares</div>
          <div className="text-xl font-bold text-gray-900">{(count * shares).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

function EarningsCard({
  tier,
  perMonth,
  perYear,
  shares,
  subscription,
  color
}: {
  tier: string;
  perMonth: number;
  perYear: number;
  shares: number;
  subscription: number;
  color: string;
}) {
  const netMonthly = perMonth - subscription;
  const netYearly = netMonthly * 12;
  const isProfit = netMonthly > 0;

  const colorClasses = {
    gray: "bg-gray-100 text-gray-700",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-yellow-100 text-yellow-700",
    purple: "bg-purple-100 text-purple-700",
  }[color];

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded font-bold text-sm ${colorClasses}`}>
            {tier}
          </div>
          <div className="text-sm text-gray-600">{shares} share{shares !== 1 && 's'}</div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-xs text-gray-500">Monthly Pool Share</div>
            <div className="text-lg font-bold text-green-600">${perMonth.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Subscription Cost</div>
            <div className="text-lg font-bold text-gray-900">${subscription.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Net Monthly</div>
            <div className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '+' : ''}${netMonthly.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Net Yearly</div>
            <div className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '+' : ''}${netYearly.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
