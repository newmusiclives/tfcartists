"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio, ArrowLeft, Check, TrendingUp, DollarSign } from "lucide-react";
import { AIRPLAY_TIERS, estimateMonthlyEarnings } from "@/lib/radio/airplay-system";

export default function AirplayPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const tiers = [
    { key: "FREE", ...AIRPLAY_TIERS.FREE },
    { key: "TIER_5", ...AIRPLAY_TIERS.TIER_5 },
    { key: "TIER_20", ...AIRPLAY_TIERS.TIER_20 },
    { key: "TIER_50", ...AIRPLAY_TIERS.TIER_50 },
    { key: "TIER_120", ...AIRPLAY_TIERS.TIER_120 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">TrueFans RADIO Airplay</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Your Music on{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              TrueFans RADIO
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            All artists get FREE airplay! Plus earn from our Artist Pool — we share 80% of ad
            revenue with artists every month.
          </p>

          {/* Revenue Pool Explainer */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-start space-x-4">
              <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h3 className="font-semibold text-green-900 mb-2">How the Artist Pool Works</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ 80% of all ad revenue goes directly to artists</li>
                  <li>✓ You earn based on your share count</li>
                  <li>✓ Paid monthly — automatically</li>
                  <li>
                    ✓ Higher tiers = more shares = more earnings (+ better rotation)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          {tiers.map((tier) => {
            const estimated = estimateMonthlyEarnings(tier.key as any);
            const isPopular = tier.key === "TIER_20";

            return (
              <div
                key={tier.key}
                className={`relative bg-white rounded-xl shadow-lg p-6 pt-8 border-2 transition-all hover:shadow-xl flex flex-col ${
                  isPopular
                    ? "border-purple-600"
                    : selectedTier === tier.key
                    ? "border-purple-400"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10 whitespace-nowrap">
                    <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {tier.price === 0 ? "FREE" : `$${tier.price}`}
                  </div>
                  {tier.price > 0 && (
                    <div className="text-sm text-gray-500">/month</div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {tier.shares} shares
                    </span>
                  </div>
                  <div className="text-xs text-green-600 text-center">
                    ~${estimated.toFixed(2)}/mo estimated*
                  </div>
                </div>

                <div className="space-y-2 mb-6 flex-grow">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-left">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedTier(tier.key)}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    tier.key === "FREE"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : isPopular
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  }`}
                >
                  {tier.key === "FREE" ? "Auto-Included" : "Upgrade Now"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Earnings Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Artist Pool Earnings Example
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price/Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Est. Monthly Earnings*
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tiers.map((tier) => {
                  const estimated = estimateMonthlyEarnings(tier.key as any);
                  const roi = tier.price > 0 ? ((estimated - tier.price) / tier.price) * 100 : 0;

                  return (
                    <tr key={tier.key}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {tier.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {tier.price === 0 ? "FREE" : `$${tier.price}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-purple-600 font-semibold">
                        {tier.shares}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                        ${estimated.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tier.price > 0 ? (
                          <span className={roi > 0 ? "text-green-600" : "text-red-600"}>
                            {roi > 0 ? "+" : ""}
                            {roi.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            * Based on $10,000 monthly ad revenue with 100 active artists. Actual earnings vary
            based on station performance and total artists.
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/onboard"
            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors shadow-xl"
          >
            <Radio className="w-5 h-5" />
            <span>Join & Get FREE Airplay</span>
          </Link>
          <p className="mt-4 text-sm text-gray-600">
            Already a member?{" "}
            <Link href="/admin" className="text-purple-600 hover:text-purple-700 font-medium">
              View your dashboard
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
