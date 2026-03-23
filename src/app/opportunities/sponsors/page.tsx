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
      localHero: { name: "Local Hero", price: 30, count: 24, referralBonus: 15, valueProp: "Less than $1/day — support local music, get 1 ad/day" },
      tier1: { name: "Tier 1", price: 80, count: 27, referralBonus: 40, valueProp: "2 ads/day, reach engaged music fans" },
      tier2: { name: "Tier 2", price: 150, count: 15, referralBonus: 75, valueProp: "5 ads/day, prominent rotation" },
      tier3: { name: "Tier 3", price: 300, count: 6, referralBonus: 150, valueProp: "10 ads/day, premium placement" },
    },
    premiums: [
      { name: "News & Weather Sponsor", price: 300 },
      { name: "Sponsored Hour", price: 200 },
      { name: "Week Takeover", price: 600 },
    ],
    examples: [
      { name: "Local Business Owner", referrals: 2, tiers: "1 Tier 1, 1 Local Hero", earnings: "$55", description: "Referred coffee shop and gym" },
      { name: "Marketing Agency", referrals: 5, tiers: "2 Tier 2, 3 Tier 1", earnings: "$270", description: "Referred multiple clients" },
      { name: "Chamber of Commerce Member", referrals: 3, tiers: "1 Tier 3, 2 Local Hero", earnings: "$180", description: "Networking connections" },
    ]
  } : {
    totalSponsors: 120,
    tiers: {
      localHero: { name: "Local Hero", price: 30, count: 40, referralBonus: 15, valueProp: "Less than $1/day — support local music, get 1 ad/day" },
      tier1: { name: "Tier 1", price: 80, count: 45, referralBonus: 40, valueProp: "2 ads/day, reach engaged music fans" },
      tier2: { name: "Tier 2", price: 150, count: 25, referralBonus: 75, valueProp: "5 ads/day, prominent rotation" },
      tier3: { name: "Tier 3", price: 300, count: 10, referralBonus: 150, valueProp: "10 ads/day, premium placement" },
    },
    premiums: [
      { name: "News & Weather Sponsor", price: 300 },
      { name: "Sponsored Hour", price: 200 },
      { name: "Week Takeover", price: 600 },
    ],
    examples: [
      { name: "Local Business Owner", referrals: 3, tiers: "2 Tier 1, 1 Local Hero", earnings: "$95", description: "Referred coffee shop, gym, and salon" },
      { name: "Marketing Agency", referrals: 8, tiers: "3 Tier 2, 5 Tier 1", earnings: "$425", description: "Referred multiple clients" },
      { name: "Chamber of Commerce Member", referrals: 5, tiers: "2 Tier 3, 3 Local Hero", earnings: "$345", description: "Networking connections" },
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
                  Earn up to $150 per referral by connecting other businesses with TrueFans RADIO
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Starting at Less Than $1/Day</h3>
                <p className="text-blue-100">Local Hero tier is just $30/mo — the most accessible sponsorship in radio.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Support Independent Artists</h3>
                <p className="text-blue-100">80% of every sponsorship goes directly to artists. Grow your business while funding real music.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Reach 1,250+ Daily Listeners</h3>
                <p className="text-blue-100">Engaged music fans who actively support the station and its sponsors.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Pro Audio Ads Included</h3>
                <p className="text-blue-100">Every sponsor gets AI-generated professional audio ads — no production fees.</p>
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
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-green-600">🌱</span>
                <span className="text-xs font-semibold bg-green-200 text-green-700 px-2 py-1 rounded">LOCAL HERO</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Local Hero</h3>
              <div className="text-sm text-gray-600 mb-1">${referralModel.tiers.localHero.price}/month sponsorship</div>
              <div className="text-xs text-green-700 mb-2">{referralModel.tiers.localHero.valueProp}</div>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-600">You Earn</div>
                <div className="text-2xl font-bold text-green-600">${referralModel.tiers.localHero.referralBonus}</div>
              </div>
              <p className="text-xs text-gray-500">Per Local Hero sponsor referred</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-blue-600">📻</span>
                <span className="text-xs font-semibold bg-blue-200 text-blue-700 px-2 py-1 rounded">TIER 1</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Tier 1</h3>
              <div className="text-sm text-gray-600 mb-1">${referralModel.tiers.tier1.price}/month sponsorship</div>
              <div className="text-xs text-blue-700 mb-2">{referralModel.tiers.tier1.valueProp}</div>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-600">You Earn</div>
                <div className="text-2xl font-bold text-green-600">${referralModel.tiers.tier1.referralBonus}</div>
              </div>
              <p className="text-xs text-gray-500">Per Tier 1 sponsor referred</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-6 border-2 border-yellow-400">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-yellow-600">🎯</span>
                <span className="text-xs font-semibold bg-yellow-300 text-yellow-800 px-2 py-1 rounded">TIER 2</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Tier 2</h3>
              <div className="text-sm text-gray-600 mb-1">${referralModel.tiers.tier2.price}/month sponsorship</div>
              <div className="text-xs text-yellow-700 mb-2">{referralModel.tiers.tier2.valueProp}</div>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-600">You Earn</div>
                <div className="text-2xl font-bold text-green-600">${referralModel.tiers.tier2.referralBonus}</div>
              </div>
              <p className="text-xs text-gray-500">Per Tier 2 sponsor referred</p>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-6 border-4 border-purple-400 relative">
              <div className="absolute -top-3 -right-3 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MAX
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-purple-600">🚀</span>
                <span className="text-xs font-semibold bg-purple-300 text-purple-800 px-2 py-1 rounded">TIER 3</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Tier 3</h3>
              <div className="text-sm text-gray-600 mb-1">${referralModel.tiers.tier3.price}/month sponsorship</div>
              <div className="text-xs text-purple-700 mb-2">{referralModel.tiers.tier3.valueProp}</div>
              <div className="bg-white rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-600">You Earn</div>
                <div className="text-2xl font-bold text-green-600">${referralModel.tiers.tier3.referralBonus}</div>
              </div>
              <p className="text-xs text-gray-500">Per Tier 3 sponsor referred</p>
            </div>
          </div>

          <div className="mt-6 bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>How it works:</strong> You receive 50% of the sponsor's first month payment as a one-time bonus upon their signup.
              The higher the tier you refer, the more you earn. These bonuses are budgeted from the station's sponsor acquisition reserve.
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
              <p className="text-sm text-gray-600">Receive 50% of their first month's payment as a one-time bonus</p>
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

        {/* Premium Opportunities */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Radio className="w-6 h-6 mr-2 text-purple-600" />
            Premium Opportunities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {referralModel.premiums.map((premium, idx) => (
              <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{premium.name}</h3>
                <div className="text-3xl font-bold text-purple-600 mb-2">${premium.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <p className="text-xs text-gray-500">AI-generated professional audio ads included</p>
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
              <h3 className="font-bold text-xl mb-2">Tier 3 Specialist</h3>
              <p className="text-green-100 mb-2">Refer 3+ Tier 3 sponsors and get <strong>$150 extra bonus!</strong></p>
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
