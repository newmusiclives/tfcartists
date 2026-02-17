"use client";

import { useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Zap,
  TrendingUp,
  Users,
  Target,
  Award,
  Check,
  DollarSign,
  Star,
  Sparkles,
  Radio,
  Building2,
  Music,
} from "lucide-react";

export default function ListenerOpportunityPage() {
  const [capacity, setCapacity] = useState<"60" | "100">("60");

  // Listener earning models based on capacity - reconciled with budget caps
  const gpModel = capacity === "60" ? {
    totallisteners: 25,
    budget: 1100,
    commissions: {
      listenerBounties: "$0.50 per active listener/month (cap $30/mo)",
      artistDiscovery: "8% of artist subscriptions (cap $50/mo)",
      artistDevelopment: "12% of artist upgrades (cap $40/mo)",
      sponsorReferral: "10% of sponsor contracts (cap $50/mo)",
      premiumBonus: "$1 per premium conversion (cap $20/mo)",
    },
    earnings: {
      listenerFocused: { listeners: 30, monthly: "$15", description: "Build listener community" },
      artistHelper: { artists: 5, monthly: "$22", description: "Help artists grow" },
      sponsorConnector: { sponsors: 1, monthly: "$40", description: "Connect local businesses" },
      allRounder: { combined: "all", monthly: "$44", description: "Do a bit of everything" },
    },
    average: 44,
    dualRole: 70,
    examples: {
      light: { name: "Casual Promoter", listeners: 15, monthly: "$10-15", annual: "$120-180" },
      medium: { name: "Active Advocate", listeners: 50, artists: 3, monthly: "$30-42", annual: "$360-504" },
      heavy: { name: "Power Listener Promoter", listeners: 100, artists: 8, sponsors: 1, monthly: "$60-80", annual: "$720-960" },
    }
  } : {
    totallisteners: 42,
    budget: 1833,
    commissions: {
      listenerBounties: "$0.50 per active listener/month (cap $40/mo)",
      artistDiscovery: "8% of artist subscriptions (cap $60/mo)",
      artistDevelopment: "12% of artist upgrades (cap $50/mo)",
      sponsorReferral: "10% of sponsor contracts (cap $60/mo)",
      premiumBonus: "$1 per premium conversion (cap $25/mo)",
    },
    earnings: {
      listenerFocused: { listeners: 50, monthly: "$25", description: "Build listener community" },
      artistHelper: { artists: 8, monthly: "$30", description: "Help artists grow" },
      sponsorConnector: { sponsors: 2, monthly: "$55", description: "Connect local businesses" },
      allRounder: { combined: "all", monthly: "$44", description: "Do a bit of everything" },
    },
    average: 44,
    dualRole: 75,
    examples: {
      light: { name: "Casual Promoter", listeners: 25, monthly: "$12-18", annual: "$144-216" },
      medium: { name: "Active Advocate", listeners: 75, artists: 5, monthly: "$35-50", annual: "$420-600" },
      heavy: { name: "Power Listener Promoter", listeners: 150, artists: 12, sponsors: 2, monthly: "$70-95", annual: "$840-1,140" },
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <SharedNav />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-green-600 rounded-xl">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Listener Earning Opportunity</h1>
                <p className="text-xl text-gray-600 mt-2">
                  Become a Listener Promoter - Earn passive income by growing the TrueFans community
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
        <div className="bg-gradient-to-r from-blue-500 to-green-600 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">🎧 Why Become a Listener Promoter?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Multiple Income Streams</h3>
                <p className="text-blue-100">Earn from listeners, artists, sponsors, and premium conversions - all at once!</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">5 Income Streams</h3>
                <p className="text-blue-100">Earn from listeners, artists, sponsors, and premium conversions — per-stream caps apply.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">Flexible Commitment</h3>
                <p className="text-blue-100">Earn at your own pace - casual or power listener promoter, you choose your involvement level.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Streams */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <DollarSign className="w-6 h-6 mr-2 text-blue-600" />
            5 Ways to Earn Money as a Listener Promoter
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-300">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">RECURRING</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Listener Bounties</h3>
              <div className="text-2xl font-bold text-blue-600 mb-2">{gpModel.commissions.listenerBounties}</div>
              <p className="text-sm text-gray-600">Bring in listeners who tune in regularly. Paid monthly!</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-5 border-2 border-purple-300">
              <div className="flex items-center justify-between mb-3">
                <Music className="w-8 h-8 text-purple-600" />
                <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">CAPPED</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Artist Discovery</h3>
              <div className="text-2xl font-bold text-purple-600 mb-2">{gpModel.commissions.artistDiscovery}</div>
              <p className="text-sm text-gray-600">Find and refer talented artists to the station</p>
            </div>

            <div className="bg-green-50 rounded-lg p-5 border-2 border-green-300">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">CAPPED</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Artist Development</h3>
              <div className="text-2xl font-bold text-green-600 mb-2">{gpModel.commissions.artistDevelopment}</div>
              <p className="text-sm text-gray-600">Help artists grow and upgrade their tiers</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-5 border-2 border-orange-300">
              <div className="flex items-center justify-between mb-3">
                <Building2 className="w-8 h-8 text-orange-600" />
                <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded">HIGH VALUE</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Sponsor Referrals</h3>
              <div className="text-2xl font-bold text-orange-600 mb-2">{gpModel.commissions.sponsorReferral}</div>
              <p className="text-sm text-gray-600">Connect local businesses with advertising opportunities</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-5 border-2 border-yellow-300">
              <div className="flex items-center justify-between mb-3">
                <Star className="w-8 h-8 text-yellow-600" />
                <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">BONUS</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Premium Conversions</h3>
              <div className="text-2xl font-bold text-yellow-600 mb-2">{gpModel.commissions.premiumBonus}</div>
              <p className="text-sm text-gray-600">For each listener you convert to premium subscription</p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-5 border-4 border-pink-300 relative">
              <div className="absolute -top-3 -right-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                NEW!
              </div>
              <div className="flex items-center justify-between mb-3">
                <Sparkles className="w-8 h-8 text-pink-600" />
                <span className="text-xs font-semibold text-pink-600 bg-pink-100 px-2 py-1 rounded">COMBINED</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Stack All Streams</h3>
              <div className="text-2xl font-bold text-pink-600 mb-2">~$44/mo avg</div>
              <p className="text-sm text-gray-600">Combine income sources (per-stream caps apply)</p>
            </div>
          </div>
        </div>

        {/* Earning Pathways */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Target className="w-6 h-6 mr-2 text-green-600" />
            Choose Your Path (Or Mix Them!)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Listener-Focused</h3>
              <div className="text-2xl font-bold text-blue-600 mb-2">{gpModel.earnings.listenerFocused.monthly}</div>
              <p className="text-xs text-gray-600 mb-3">{gpModel.earnings.listenerFocused.listeners} listeners</p>
              <p className="text-sm text-gray-700">{gpModel.earnings.listenerFocused.description}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
              <div className="text-3xl mb-3">🎵</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Artist Helper</h3>
              <div className="text-2xl font-bold text-purple-600 mb-2">{gpModel.earnings.artistHelper.monthly}</div>
              <p className="text-xs text-gray-600 mb-3">{gpModel.earnings.artistHelper.artists} artists</p>
              <p className="text-sm text-gray-700">{gpModel.earnings.artistHelper.description}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Sponsor Connector</h3>
              <div className="text-2xl font-bold text-orange-600 mb-2">{gpModel.earnings.sponsorConnector.monthly}</div>
              <p className="text-xs text-gray-600 mb-3">{gpModel.earnings.sponsorConnector.sponsors} sponsor(s)</p>
              <p className="text-sm text-gray-700">{gpModel.earnings.sponsorConnector.description}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-4 border-green-400">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">All-Rounder</h3>
              <div className="text-2xl font-bold text-green-600 mb-2">{gpModel.earnings.allRounder.monthly}</div>
              <p className="text-xs text-gray-600 mb-3">Mix of everything</p>
              <p className="text-sm text-gray-700">{gpModel.earnings.allRounder.description}</p>
            </div>
          </div>
        </div>

        {/* Real Examples */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Award className="w-6 h-6 mr-2 text-purple-600" />
            Real Listener Promoter Examples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(gpModel.examples).map((example, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 border-2 border-blue-200">
                <h3 className="font-bold text-xl text-gray-900 mb-4">{example.name}</h3>
                <div className="space-y-2 mb-4">
                  {example.listeners && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Listeners:</span>
                      <span className="font-semibold">{example.listeners}</span>
                    </div>
                  )}
                  {'artists' in example && example.artists && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Artists Helped:</span>
                      <span className="font-semibold">{example.artists}</span>
                    </div>
                  )}
                  {'sponsors' in example && example.sponsors && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sponsors:</span>
                      <span className="font-semibold">{example.sponsors}</span>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg p-4 mb-3">
                  <div className="text-sm text-gray-600 mb-1">Monthly Earnings</div>
                  <div className="text-3xl font-bold text-green-600">{example.monthly}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-700 mb-1">Annual Projection</div>
                  <div className="text-xl font-bold text-green-600">{example.annual}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dual-Role Opportunity */}
        <div className="bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 rounded-xl shadow-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <Sparkles className="w-8 h-8 mr-3" />
            💎 Maximum Earnings: Be Both an Artist Promoter AND Listener Promoter!
          </h2>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
            <p className="text-lg mb-4">
              <strong>Pro Strategy:</strong> If you're already an artist on TrueFans, combine both roles for maximum income!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-xl mb-2">As an Artist Promoter</h3>
                <ul className="space-y-1 text-sm">
                  <li>✓ Refer fellow artists</li>
                  <li>✓ Earn subscription commissions</li>
                  <li>✓ Get milestone bonuses</li>
                  <li>✓ Average: $30/month</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">+ As Listener Promoter</h3>
                <ul className="space-y-1 text-sm">
                  <li>✓ Bring in listeners</li>
                  <li>✓ Refer sponsors</li>
                  <li>✓ Convert premium members</li>
                  <li>✓ Average: $44/month</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center bg-yellow-400 text-gray-900 rounded-lg p-6">
            <div className="text-sm font-semibold mb-2">Realistic Dual-Role Combined Average</div>
            <div className="text-5xl font-bold mb-2">~${gpModel.dualRole}/month</div>
            <div className="text-xl font-semibold">~${gpModel.dualRole * 12}/year</div>
            <p className="text-sm mt-3">Per-tier and per-stream caps apply to both roles. Total budget: ${gpModel.budget.toLocaleString()}/mo (listener) + promoter pool.</p>
          </div>
        </div>

        {/* Key Advantages */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-8 border-2 border-blue-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">🚀 Why Listener Promoters Win</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="bg-green-500 rounded-full p-1 flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Per-Stream Caps</h3>
                <p className="text-sm text-gray-600">Each income stream has a monthly cap to ensure sustainable payouts for all promoters.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-green-500 rounded-full p-1 flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">5 Income Streams</h3>
                <p className="text-sm text-gray-600">More ways to earn than any other role!</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-green-500 rounded-full p-1 flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Recurring Revenue</h3>
                <p className="text-sm text-gray-600">Listener bounties paid every single month!</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-green-500 rounded-full p-1 flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Flexible Commitment</h3>
                <p className="text-sm text-gray-600">Work at your own pace, no quotas required!</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Grow TrueFans?</h2>
          <p className="text-xl text-gray-600 mb-6">
            Join {gpModel.totallisteners} Listener Promoters at {capacity}% capacity and start earning today!
          </p>
          <button className="bg-gradient-to-r from-blue-500 to-green-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:from-blue-600 hover:to-green-700 transition-all shadow-lg">
            Become a Listener Promoter →
          </button>
        </div>

      </div>
    </main>
  );
}
