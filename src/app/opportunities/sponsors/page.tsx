"use client";

import { useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Target,
  Check,
  Star,
  Award,
  Sparkles,
  Radio,
  Users,
} from "lucide-react";

export default function SponsorOpportunityPage() {
  const [capacity, setCapacity] = useState<"60" | "100">("60");

  // Sponsor referral model based on capacity
  const referralModel = capacity === "60" ? {
    totalSponsors: 72,
    tiers: {
      bronze: { price: 100, count: 24, referralBonus: 50 },
      silver: { price: 250, count: 27, referralBonus: 125 },
      gold: { price: 400, count: 15, referralBonus: 200 },
      platinum: { price: 500, count: 6, referralBonus: 250 },
    },
    examples: [
      { name: "Local Business Owner", referrals: 2, tiers: "1 Silver, 1 Bronze", earnings: "$175", description: "Referred coffee shop and gym" },
      { name: "Marketing Agency", referrals: 5, tiers: "2 Gold, 3 Silver", earnings: "$775", description: "Referred multiple clients" },
      { name: "Chamber of Commerce Member", referrals: 3, tiers: "1 Platinum, 2 Bronze", earnings: "$350", description: "Networking connections" },
    ]
  } : {
    totalSponsors: 120,
    tiers: {
      bronze: { price: 100, count: 40, referralBonus: 50 },
      silver: { price: 250, count: 45, referralBonus: 125 },
      gold: { price: 400, count: 25, referralBonus: 200 },
      platinum: { price: 500, count: 10, referralBonus: 250 },
    },
    examples: [
      { name: "Local Business Owner", referrals: 3, tiers: "2 Silver, 1 Bronze", earnings: "$300", description: "Referred coffee shop, gym, and salon" },
      { name: "Marketing Agency", referrals: 8, tiers: "3 Gold, 5 Silver", earnings: "$1,225", description: "Referred multiple clients" },
      { name: "Chamber of Commerce Member", referrals: 5, tiers: "2 Platinum, 3 Bronze", earnings: "$650", description: "Networking connections" },
    ]
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SharedNav />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Sponsor Referral Program</h1>
                <p className="text-xl text-gray-600 mt-2">
                  Earn up to $250 per referral by connecting other businesses with TrueFans RADIO
                </p>
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

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">📻 Turn Your Network Into Income</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Earn Generous Referral Bonuses</h3>
                <p className="text-blue-100">Get 50% of the first month's sponsorship fee for each business you refer!</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Help Local Businesses Grow</h3>
                <p className="text-blue-100">Connect your network with an authentic advertising opportunity that actually works.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Simple One-Time Payment</h3>
                <p className="text-blue-100">No ongoing tracking required - get paid once when they sign up!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Bonuses */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-green-600" />
            Referral Bonus Structure
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-gray-600">🥉</span>
                <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded">BRONZE</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Bronze Tier</h3>
              <div className="text-sm text-gray-600 mb-2">${referralModel.tiers.bronze.price}/month sponsorship</div>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-600">You Earn</div>
                <div className="text-2xl font-bold text-green-600">${referralModel.tiers.bronze.referralBonus}</div>
              </div>
              <p className="text-xs text-gray-500">Per Bronze sponsor referred</p>
            </div>

            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-6 border-2 border-gray-400">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-gray-700">🥈</span>
                <span className="text-xs font-semibold bg-gray-300 text-gray-800 px-2 py-1 rounded">SILVER</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Silver Tier</h3>
              <div className="text-sm text-gray-600 mb-2">${referralModel.tiers.silver.price}/month sponsorship</div>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-600">You Earn</div>
                <div className="text-2xl font-bold text-green-600">${referralModel.tiers.silver.referralBonus}</div>
              </div>
              <p className="text-xs text-gray-500">Per Silver sponsor referred</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-6 border-2 border-yellow-400">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-yellow-600">🥇</span>
                <span className="text-xs font-semibold bg-yellow-300 text-yellow-800 px-2 py-1 rounded">GOLD</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Gold Tier</h3>
              <div className="text-sm text-gray-600 mb-2">${referralModel.tiers.gold.price}/month sponsorship</div>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-600">You Earn</div>
                <div className="text-2xl font-bold text-green-600">${referralModel.tiers.gold.referralBonus}</div>
              </div>
              <p className="text-xs text-gray-500">Per Gold sponsor referred</p>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-6 border-4 border-purple-400 relative">
              <div className="absolute -top-3 -right-3 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MAX
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-purple-600">💎</span>
                <span className="text-xs font-semibold bg-purple-300 text-purple-800 px-2 py-1 rounded">PLATINUM</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Platinum Tier</h3>
              <div className="text-sm text-gray-600 mb-2">${referralModel.tiers.platinum.price}/month sponsorship</div>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-600">You Earn</div>
                <div className="text-2xl font-bold text-green-600">${referralModel.tiers.platinum.referralBonus}</div>
              </div>
              <p className="text-xs text-gray-500">Per Platinum sponsor referred</p>
            </div>
          </div>

          <div className="mt-6 bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>💡 Pro Tip:</strong> You receive 50% of the sponsor's first month payment, paid immediately upon their signup!
              The higher the tier you refer, the more you earn.
            </p>
          </div>
        </div>

        {/* Real Examples */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Real Referrer Examples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {referralModel.examples.map((example, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
                <h3 className="font-bold text-xl text-gray-900 mb-4">{example.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Referrals:</span>
                    <span className="font-semibold">{example.referrals}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Breakdown:</span>
                    <span className="font-semibold text-blue-600">{example.tiers}</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 mb-3">
                  <div className="text-sm text-gray-600 mb-1">Total Earned</div>
                  <div className="text-3xl font-bold text-green-600">{example.earnings}</div>
                </div>
                <p className="text-xs text-gray-600">{example.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-8 border-2 border-purple-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
            <Target className="w-6 h-6 mr-2 text-purple-600" />
            How the Referral Program Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Share Your Link</h3>
              <p className="text-sm text-gray-600">Get your unique referral link from your sponsor dashboard</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Connect Businesses</h3>
              <p className="text-sm text-gray-600">Share TrueFans RADIO sponsorship opportunity with your network</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">They Sign Up</h3>
              <p className="text-sm text-gray-600">Business signs up using your referral link and chooses their tier</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-yellow-600">4</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">You Get Paid!</h3>
              <p className="text-sm text-gray-600">Receive 50% of their first month's payment immediately</p>
            </div>
          </div>
        </div>

        {/* Ideal Businesses */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-orange-600" />
            Perfect Businesses to Refer
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Restaurants & Cafes",
              "Fitness Centers",
              "Retail Shops",
              "Professional Services",
              "Entertainment Venues",
              "Automotive Services",
              "Real Estate",
              "Health & Wellness"
            ].map((business, idx) => (
              <div key={idx} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <Check className="w-5 h-5 text-orange-600 mb-2" />
                <p className="text-sm font-semibold text-gray-900">{business}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus Opportunities */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <Star className="w-8 h-8 mr-3" />
            Bonus Opportunities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <Award className="w-10 h-10 mb-3" />
              <h3 className="font-bold text-xl mb-2">5+ Referrals Bonus</h3>
              <p className="text-green-100 mb-2">Refer 5 or more sponsors and receive an additional <strong>$100 bonus!</strong></p>
              <p className="text-xs text-green-200">Paid once you hit the milestone</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <Sparkles className="w-10 h-10 mb-3" />
              <h3 className="font-bold text-xl mb-2">Platinum Specialist</h3>
              <p className="text-green-100 mb-2">Refer 3+ Platinum sponsors and get <strong>$150 extra bonus!</strong></p>
              <p className="text-xs text-green-200">For bringing premium partnerships</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Earning Referral Bonuses Today</h2>
          <p className="text-xl text-gray-600 mb-6">
            With {referralModel.totalSponsors} active sponsors at {capacity}% capacity, there's room for more!
          </p>
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg">
            Get Your Referral Link →
          </button>
          <p className="text-sm text-gray-500 mt-4">Already a sponsor? Access your referral dashboard to get started</p>
        </div>

      </div>
    </main>
  );
}
