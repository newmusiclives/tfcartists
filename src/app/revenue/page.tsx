"use client";

import { useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { DollarSign, TrendingUp, Users, Building2, PieChart, ArrowRight, Radio } from "lucide-react";

export default function RevenueBreakdownPage() {
  // Sample data - in production, this would come from the database
  const [period, setPeriod] = useState("2025-12");

  // Artist data (top performers + summary)
  const topArtists = [
    { name: "Sarah Martinez", tier: "TIER_50", subscription: 50, shares: 75, poolEarnings: 187.50, liveShowDonations: 450, total: 637.50 },
    { name: "Jake Rivers", tier: "TIER_20", subscription: 20, shares: 25, poolEarnings: 62.50, liveShowDonations: 380, total: 422.50 },
    { name: "The Wanderers", tier: "TIER_20", subscription: 20, shares: 25, poolEarnings: 62.50, liveShowDonations: 320, total: 362.50 },
    { name: "Maya Santos", tier: "TIER_5", subscription: 5, shares: 5, poolEarnings: 12.50, liveShowDonations: 290, total: 297.50 },
    { name: "Alex Turner", tier: "TIER_50", subscription: 50, shares: 75, poolEarnings: 187.50, liveShowDonations: 280, total: 417.50 },
  ];

  // Artist tier summary
  const artistTiers = {
    FREE: { count: 180, subscription: 0, shares: 1, totalSubscriptions: 0, totalShares: 180, poolEarnings: 450 },
    TIER_5: { count: 80, subscription: 5, shares: 5, totalSubscriptions: 400, totalShares: 400, poolEarnings: 1000 },
    TIER_20: { count: 40, subscription: 20, shares: 25, totalSubscriptions: 800, totalShares: 1000, poolEarnings: 2500 },
    TIER_50: { count: 30, subscription: 50, shares: 75, totalSubscriptions: 1500, totalShares: 2250, poolEarnings: 5625 },
    TIER_120: { count: 10, subscription: 120, shares: 200, totalSubscriptions: 1200, totalShares: 2000, poolEarnings: 5000 },
  };

  const totalArtists = 340;
  const totalArtistSubscriptions = 3900;
  const totalShares = 5830;
  const totalPoolAmount = 17800; // 80% of sponsor revenue
  const perShareValue = totalPoolAmount / totalShares;
  const totalLiveShowDonations = 45000; // Estimated from all shows

  // Sponsor data (top sponsors)
  const topSponsors = [
    { name: "Brew & Beats Coffee", tier: "GOLD", monthly: 400, adSpots: 40, status: "Active" },
    { name: "FitLife Studio", tier: "SILVER", monthly: 250, adSpots: 20, status: "Active" },
    { name: "The Vinyl Shop", tier: "GOLD", monthly: 400, adSpots: 40, status: "Active" },
    { name: "Green Leaf Cafe", tier: "BRONZE", monthly: 100, adSpots: 10, status: "Active" },
    { name: "Urban Threads Boutique", tier: "PLATINUM", monthly: 500, adSpots: 60, status: "Active" },
  ];

  // Sponsor tier summary
  const sponsorTiers = {
    BRONZE: { count: 28, monthly: 100, adSpots: 10, total: 2800 },
    SILVER: { count: 35, monthly: 250, adSpots: 20, total: 8750 },
    GOLD: { count: 17, monthly: 400, adSpots: 40, total: 6800 },
    PLATINUM: { count: 8, monthly: 500, adSpots: 60, total: 4000 },
  };

  const totalSponsors = 88;
  const totalSponsorRevenue = 22250;
  const artistPoolContribution = totalSponsorRevenue * 0.8; // 80%
  const stationRevenue = totalSponsorRevenue * 0.2; // 20%

  // Station financials
  const totalMonthlyRevenue = totalSponsorRevenue + totalArtistSubscriptions;
  const totalMonthlyExpenses = artistPoolContribution; // Main expense
  const netStationRevenue = stationRevenue + totalArtistSubscriptions;

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <SharedNav />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Breakdown</h1>
              <p className="text-gray-600">
                Complete financial overview - Artist earnings, sponsor payments, and station revenue
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Period</h2>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="2025-12">December 2025</option>
              <option value="2025-11">November 2025</option>
              <option value="2025-10">October 2025</option>
            </select>
          </div>
        </div>

        {/* Top-Level Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">Total Revenue</span>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-1">${totalMonthlyRevenue.toLocaleString()}</div>
            <div className="text-sm text-purple-100">
              ${totalSponsorRevenue.toLocaleString()} sponsors + ${totalArtistSubscriptions.toLocaleString()} artists
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100">Artist Pool Payout</span>
              <Users className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-1">${artistPoolContribution.toLocaleString()}</div>
            <div className="text-sm text-green-100">
              80% of sponsor revenue
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100">Live Show Donations</span>
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-1">${totalLiveShowDonations.toLocaleString()}</div>
            <div className="text-sm text-blue-100">
              Direct to artists (via TrueFans CONNECT)
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-100">Net Station Revenue</span>
              <Radio className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-1">${netStationRevenue.toLocaleString()}</div>
            <div className="text-sm text-orange-100">
              20% sponsors + artist subscriptions
            </div>
          </div>
        </div>

        {/* Revenue Flow Diagram */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Revenue Flow</h2>
          <div className="space-y-6">
            {/* Sponsor Revenue */}
            <div className="flex items-center">
              <div className="flex-1">
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-600 font-semibold">SPONSORS PAY</div>
                      <div className="text-2xl font-bold text-blue-900">${totalSponsorRevenue.toLocaleString()}/mo</div>
                      <div className="text-sm text-blue-700">{totalSponsors} active sponsors</div>
                    </div>
                    <Building2 className="w-12 h-12 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="px-6">
                <ArrowRight className="w-8 h-8 text-gray-400" />
              </div>

              <div className="flex-1 space-y-3">
                {/* 80% to Artist Pool */}
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-green-600 font-semibold">80% → ARTIST POOL</div>
                      <div className="text-2xl font-bold text-green-900">${artistPoolContribution.toLocaleString()}</div>
                      <div className="text-sm text-green-700">{totalArtists} artists share</div>
                    </div>
                    <div className="text-3xl font-bold text-green-500">80%</div>
                  </div>
                </div>

                {/* 20% to Station */}
                <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-orange-600 font-semibold">20% → STATION</div>
                      <div className="text-2xl font-bold text-orange-900">${stationRevenue.toLocaleString()}</div>
                      <div className="text-sm text-orange-700">Operations & growth</div>
                    </div>
                    <div className="text-3xl font-bold text-orange-500">20%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Artist Subscriptions */}
            <div className="flex items-center">
              <div className="flex-1">
                <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-600 font-semibold">ARTIST SUBSCRIPTIONS</div>
                      <div className="text-2xl font-bold text-purple-900">${totalArtistSubscriptions.toLocaleString()}/mo</div>
                      <div className="text-sm text-purple-700">Airplay tier fees</div>
                    </div>
                    <Users className="w-12 h-12 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="px-6">
                <ArrowRight className="w-8 h-8 text-gray-400" />
              </div>

              <div className="flex-1">
                <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-orange-600 font-semibold">100% → STATION</div>
                      <div className="text-2xl font-bold text-orange-900">${totalArtistSubscriptions.toLocaleString()}</div>
                      <div className="text-sm text-orange-700">Retained for operations</div>
                    </div>
                    <div className="text-3xl font-bold text-orange-500">100%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Artist Earnings Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Artist Earnings Breakdown</h2>
            <div className="text-sm text-gray-600">
              Per-share value: <span className="font-bold text-green-600">${perShareValue.toFixed(2)}</span>
            </div>
          </div>

          {/* Artist Tier Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">By Tier</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(artistTiers).map(([tier, data]) => (
                <div key={tier} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="text-sm font-semibold text-gray-600 mb-2">{tier.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-500 mb-3">{data.count} artists</div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subscription:</span>
                      <span className="font-semibold">${data.subscription}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shares:</span>
                      <span className="font-semibold">{data.shares}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Pool payout:</span>
                      <span className="font-semibold text-green-600">
                        ${(data.shares * perShareValue).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net:</span>
                      <span className="font-bold text-green-700">
                        ${(data.shares * perShareValue - data.subscription).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-600">Group total:</span>
                      <span className="text-green-600">
                        ${((data.shares * perShareValue - data.subscription) * data.count).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Earning Artists */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Earning Artists This Month</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Artist</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tier</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Subscription</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Shares</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Pool Earnings</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Live Shows</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topArtists.map((artist, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{artist.name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                          {artist.tier.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-red-600">-${artist.subscription}</td>
                      <td className="py-3 px-4 text-right">{artist.shares}</td>
                      <td className="py-3 px-4 text-right text-green-600">+${artist.poolEarnings.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-blue-600">+${artist.liveShowDonations}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-700">
                        ${artist.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-800">
              <strong>Note:</strong> Artists earn from two sources: (1) Monthly pool distribution based on airplay shares,
              and (2) Live show donations through TrueFans CONNECT. The more shows they play and use the 9-word line
              ("Go To True Fans CONNECT dot com Right Now!"), the more they earn.
            </div>
          </div>
        </div>

        {/* Sponsor Payments Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Sponsor Payments Breakdown</h2>

          {/* Sponsor Tier Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">By Tier</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(sponsorTiers).map(([tier, data]) => (
                <div key={tier} className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <div className="text-lg font-bold text-blue-900 mb-2">{tier}</div>
                  <div className="text-sm text-blue-700 mb-4">{data.count} sponsors</div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Per sponsor:</span>
                      <span className="font-semibold">${data.monthly}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Ad spots:</span>
                      <span className="font-semibold">{data.adSpots}/mo</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="text-blue-600">Group total:</span>
                      <span className="font-bold text-blue-900">${data.total.toLocaleString()}/mo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sponsors */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Active Sponsors</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Business Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tier</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Monthly Payment</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Ad Spots</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topSponsors.map((sponsor, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{sponsor.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          sponsor.tier === 'PLATINUM' ? 'bg-purple-100 text-purple-700' :
                          sponsor.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                          sponsor.tier === 'SILVER' ? 'bg-gray-200 text-gray-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {sponsor.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-600">
                        ${sponsor.monthly}
                      </td>
                      <td className="py-3 px-4 text-right">{sponsor.adSpots}/mo</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                          {sponsor.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Station Net Revenue */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border-2 border-orange-200">
          <h2 className="text-2xl font-bold mb-6 text-orange-900">TrueFans RADIO™ Net Revenue</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-orange-800 mb-4">Revenue Sources</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Sponsor Revenue (20%)</span>
                  <span className="font-bold text-green-600">${stationRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Artist Subscriptions (100%)</span>
                  <span className="font-bold text-green-600">${totalArtistSubscriptions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-100 rounded-lg border-2 border-orange-300">
                  <span className="font-semibold text-orange-900">Total Station Revenue</span>
                  <span className="font-bold text-xl text-orange-900">${netStationRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-orange-800 mb-4">Operating Expenses (Estimated)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Platform & Tools</span>
                  <span className="font-semibold text-gray-900">$1,500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Team Salaries</span>
                  <span className="font-semibold text-gray-900">$3,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Marketing</span>
                  <span className="font-semibold text-gray-900">$500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-100 rounded-lg border-2 border-orange-300">
                  <span className="font-semibold text-orange-900">Total Expenses</span>
                  <span className="font-bold text-xl text-orange-900">$5,000</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-green-100 mb-1">Net Profit</div>
                <div className="text-4xl font-bold">${(netStationRevenue - 5000).toLocaleString()}</div>
                <div className="text-sm text-green-100 mt-2">
                  {((netStationRevenue - 5000) / netStationRevenue * 100).toFixed(1)}% profit margin
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-100">Annual Projection</div>
                <div className="text-3xl font-bold">${((netStationRevenue - 5000) * 12).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg p-4 border border-orange-200">
            <div className="text-sm text-gray-700">
              <strong className="text-orange-900">Revenue Model:</strong> Station keeps 20% of sponsor revenue
              (${stationRevenue.toLocaleString()}) plus 100% of artist subscription fees (${totalArtistSubscriptions.toLocaleString()}).
              The remaining 80% of sponsor revenue (${artistPoolContribution.toLocaleString()}) is distributed to artists
              monthly based on their airplay shares. Artists also earn from live show donations via TrueFans CONNECT.
            </div>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Key Metrics Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{totalArtists}</div>
              <div className="text-sm text-purple-700">Active Artists</div>
              <div className="text-xs text-purple-600 mt-2">Avg: ${(artistPoolContribution / totalArtists).toFixed(2)}/artist from pool</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{totalSponsors}</div>
              <div className="text-sm text-blue-700">Active Sponsors</div>
              <div className="text-xs text-blue-600 mt-2">Avg: ${(totalSponsorRevenue / totalSponsors).toFixed(2)}/sponsor</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">${totalMonthlyRevenue.toLocaleString()}</div>
              <div className="text-sm text-green-700">Total Monthly Revenue</div>
              <div className="text-xs text-green-600 mt-2">Annual: ${(totalMonthlyRevenue * 12).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
