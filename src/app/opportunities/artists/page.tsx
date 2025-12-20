"use client";

import { useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Award,
  TrendingUp,
  Users,
  Target,
  Zap,
  Check,
  DollarSign,
  Star,
  Trophy,
  Sparkles,
} from "lucide-react";

export default function ArtistOpportunityPage() {
  const [capacity, setCapacity] = useState<"60" | "100">("60");

  // Scout earning models based on capacity
  const scoutModel = capacity === "60" ? {
    totalScouts: 60,
    commissions: {
      first3Months: "20%",
      ongoing: "12%",
      prepurchase: "25%",
      upgradeBonuses: "$10 per tier upgrade",
      influenceBonuses: "$2 per influenced artist",
    },
    milestones: {
      artists5: "$30 one-time bonus",
      artists10: "$50 one-time bonus",
    },
    tiers: {
      elite: { name: "Elite (Top 20%)", count: 12, range: "$60-$100/mo", description: "No cap - unlimited earning!" },
      strong: { name: "Strong (Next 20%)", count: 12, range: "$30-$50/mo", description: "High performers" },
      active: { name: "Active (Next 30%)", count: 18, range: "$15-$25/mo", description: "Regular activity" },
      developing: { name: "Developing (30%)", count: 18, range: "$5-$12/mo", description: "Getting started" },
    },
    average: 30,
    dualRole: 110,
  } : {
    totalScouts: 100,
    commissions: {
      first3Months: "20%",
      ongoing: "12%",
      prepurchase: "25%",
      upgradeBonuses: "$10 per tier upgrade",
      influenceBonuses: "$2 per influenced artist",
    },
    milestones: {
      artists5: "$30 one-time bonus",
      artists10: "$50 one-time bonus",
    },
    tiers: {
      elite: { name: "Elite (Top 20%)", count: 20, range: "$70-$120/mo", description: "No cap - unlimited earning!" },
      strong: { name: "Strong (Next 20%)", count: 20, range: "$35-$60/mo", description: "High performers" },
      active: { name: "Active (Next 30%)", count: 30, range: "$18-$30/mo", description: "Regular activity" },
      developing: { name: "Developing (30%)", count: 30, range: "$6-$15/mo", description: "Getting started" },
    },
    average: 30,
    dualRole: 135,
  };

  const examples = capacity === "60" ? [
    { name: "Sarah (Elite Artist Promoter)", artists: 15, tier: "Elite", monthly: "$85", annual: "$1,020", description: "Refers 1-2 artists per month, active in community" },
    { name: "Marcus (Strong Artist Promoter)", artists: 8, tier: "Strong", monthly: "$42", annual: "$504", description: "Refers artist every 2 months, helps with onboarding" },
    { name: "Jamie (Active Artist Promoter)", artists: 5, tier: "Active", monthly: "$20", annual: "$240", description: "Occasional referrals, word-of-mouth promotion" },
  ] : [
    { name: "Sarah (Elite Artist Promoter)", artists: 20, tier: "Elite", monthly: "$95", annual: "$1,140", description: "Refers 1-2 artists per month, active in community" },
    { name: "Marcus (Strong Artist Promoter)", artists: 12, tier: "Strong", monthly: "$48", annual: "$576", description: "Refers artist every 2 months, helps with onboarding" },
    { name: "Jamie (Active Artist Promoter)", artists: 7, tier: "Active", monthly: "$24", annual: "$288", description: "Occasional referrals, word-of-mouth promotion" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <SharedNav />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Artist Earning Opportunity</h1>
                <p className="text-xl text-gray-600 mt-2">
                  Become an Artist Promoter - Earn up to ${scoutModel.tiers.elite.range.split('-')[1]}/month by referring artists
                </p>
              </div>
            </div>

            {/* Capacity Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCapacity("60")}
                className={`px-4 py-2 rounded-md font-semibold transition-all ${
                  capacity === "60"
                    ? "bg-white text-orange-600 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                60% Capacity
              </button>
              <button
                onClick={() => setCapacity("100")}
                className={`px-4 py-2 rounded-md font-semibold transition-all ${
                  capacity === "100"
                    ? "bg-white text-orange-600 shadow"
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
        <div className="bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">🎵 Why Become a TrueFans Artist Promoter?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Earn Passive Income</h3>
                <p className="text-orange-100">Get paid for helping fellow artists discover TrueFans RADIO. Elite artist promoters earn $60-$120/month!</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Support Your Community</h3>
                <p className="text-orange-100">Help independent artists get discovered while building a stronger music community.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">No Limits for Top Performers</h3>
                <p className="text-orange-100">Top 20% of artist promoters have NO EARNING CAP. The more artists you refer, the more you earn!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Structure */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-orange-600" />
            How You Earn Money
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-2">First 3 Months</h3>
              <div className="text-3xl font-bold text-orange-600 mb-1">{scoutModel.commissions.first3Months}</div>
              <p className="text-sm text-orange-700">Of artist's subscription for their first 3 months</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">Ongoing Commission</h3>
              <div className="text-3xl font-bold text-purple-600 mb-1">{scoutModel.commissions.ongoing}</div>
              <p className="text-sm text-purple-700">Of artist's subscription every month after that</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Prepurchase Bonus</h3>
              <div className="text-3xl font-bold text-blue-600 mb-1">{scoutModel.commissions.prepurchase}</div>
              <p className="text-sm text-blue-700">When artist prepurchases annual subscription</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg p-4 border-2 border-yellow-400">
              <h3 className="font-semibold text-yellow-900 mb-2">🎁 Upgrade Bonuses</h3>
              <div className="text-2xl font-bold text-yellow-600 mb-1">{scoutModel.commissions.upgradeBonuses}</div>
              <p className="text-sm text-yellow-700">Every time your referred artist upgrades their tier</p>
            </div>

            <div className="bg-gradient-to-r from-pink-100 to-pink-200 rounded-lg p-4 border-2 border-pink-400">
              <h3 className="font-semibold text-pink-900 mb-2">✨ Influence Bonuses</h3>
              <div className="text-2xl font-bold text-pink-600 mb-1">{scoutModel.commissions.influenceBonuses}</div>
              <p className="text-sm text-pink-700">For each artist influenced by your referrals (viral growth!)</p>
            </div>
          </div>
        </div>

        {/* Milestone Bonuses */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-yellow-300">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-600" />
            Milestone Bonuses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-6 border-2 border-yellow-400">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">5 Artists Milestone</h3>
              <div className="text-3xl font-bold text-yellow-600 mb-2">{scoutModel.milestones.artists5}</div>
              <p className="text-gray-600">One-time bonus when you successfully refer 5 active artists</p>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-orange-400">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">10 Artists Milestone</h3>
              <div className="text-3xl font-bold text-orange-600 mb-2">{scoutModel.milestones.artists10}</div>
              <p className="text-gray-600">One-time bonus when you successfully refer 10 active artists</p>
            </div>
          </div>
        </div>

        {/* Performance Tiers */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Star className="w-6 h-6 mr-2 text-orange-600" />
            Performance Tiers - Quality Over Quantity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg p-6 border-4 border-yellow-400 relative">
              <div className="absolute -top-3 -right-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                NO CAP!
              </div>
              <div className="text-3xl mb-2">👑</div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{scoutModel.tiers.elite.name}</h3>
              <div className="text-2xl font-bold text-orange-600 mb-2">{scoutModel.tiers.elite.range}</div>
              <p className="text-sm text-gray-600 mb-2">{scoutModel.tiers.elite.count} artist promoters</p>
              <p className="text-xs text-gray-500">{scoutModel.tiers.elite.description}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-300">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{scoutModel.tiers.strong.name}</h3>
              <div className="text-2xl font-bold text-orange-600 mb-2">{scoutModel.tiers.strong.range}</div>
              <p className="text-sm text-gray-600 mb-2">{scoutModel.tiers.strong.count} artist promoters</p>
              <p className="text-xs text-gray-500">{scoutModel.tiers.strong.description}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
              <div className="text-3xl mb-2">✨</div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{scoutModel.tiers.active.name}</h3>
              <div className="text-2xl font-bold text-purple-600 mb-2">{scoutModel.tiers.active.range}</div>
              <p className="text-sm text-gray-600 mb-2">{scoutModel.tiers.active.count} artist promoters</p>
              <p className="text-xs text-gray-500">{scoutModel.tiers.active.description}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200">
              <div className="text-3xl mb-2">🌱</div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{scoutModel.tiers.developing.name}</h3>
              <div className="text-2xl font-bold text-gray-600 mb-2">{scoutModel.tiers.developing.range}</div>
              <p className="text-sm text-gray-600 mb-2">{scoutModel.tiers.developing.count} artist promoters</p>
              <p className="text-xs text-gray-500">{scoutModel.tiers.developing.description}</p>
            </div>
          </div>
        </div>

        {/* Real Examples */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-purple-600" />
            Real Artist Promoter Examples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {examples.map((example, idx) => (
              <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                <h3 className="font-bold text-xl text-gray-900 mb-2">{example.name}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Artists Referred:</span>
                    <span className="font-semibold">{example.artists}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Performance Tier:</span>
                    <span className="font-semibold text-orange-600">{example.tier}</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 mb-3">
                  <div className="text-sm text-gray-600 mb-1">Monthly Earnings</div>
                  <div className="text-3xl font-bold text-green-600">{example.monthly}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 mb-3">
                  <div className="text-xs text-green-700 mb-1">Annual Projection</div>
                  <div className="text-xl font-bold text-green-600">{example.annual}</div>
                </div>
                <p className="text-xs text-gray-600">{example.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dual-Role Opportunity */}
        <div className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 rounded-xl shadow-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <Sparkles className="w-8 h-8 mr-3" />
            💎 Maximize Your Earnings: Dual-Role Opportunity
          </h2>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
            <p className="text-lg mb-4">
              <strong>Pro Tip:</strong> Become both an Artist Promoter AND a Listener Promoter to earn from multiple streams!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-xl mb-2">As an Artist Promoter (Artist Referrals)</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Refer fellow artists</li>
                  <li>• Earn commissions on subscriptions</li>
                  <li>• Get milestone bonuses</li>
                  <li>• Average: ${scoutModel.average}/month</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">+ As Listener Promoter (Listeners/Sponsors)</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Bring in listeners ($0.50 each)</li>
                  <li>• Refer sponsors (10% commission)</li>
                  <li>• Premium conversions ($1 bonus)</li>
                  <li>• Average: $44/month additional</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center bg-yellow-400 text-gray-900 rounded-lg p-6">
            <div className="text-sm font-semibold mb-2">Total Dual-Role Earning Potential</div>
            <div className="text-5xl font-bold mb-2">${scoutModel.dualRole}/month</div>
            <div className="text-xl font-semibold">${scoutModel.dualRole * 12}/year</div>
            <p className="text-sm mt-3">That's a sustainable side income while supporting independent artists!</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Earning?</h2>
          <p className="text-xl text-gray-600 mb-6">
            Join {scoutModel.totalScouts} artist promoters at {capacity}% capacity and start building passive income today!
          </p>
          <button className="bg-gradient-to-r from-orange-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:from-orange-600 hover:to-purple-700 transition-all shadow-lg">
            Become a TrueFans Artist Promoter →
          </button>
        </div>

      </div>
    </main>
  );
}
