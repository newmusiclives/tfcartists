"use client";

import { useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  Loader2,
  Radio,
  ChevronRight,
  Megaphone,
  Target,
} from "lucide-react";

interface SponsorProfile {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  businessType: string;
  status: string;
  sponsorshipTier: string;
  monthlyAmount: number;
  pipelineStage: string;
  city: string;
  state: string;
}

const TIER_INFO: Record<string, { name: string; cost: number; adSpots: number; color: string }> = {
  bronze: { name: "Bronze", cost: 100, adSpots: 30, color: "amber" },
  silver: { name: "Silver", cost: 300, adSpots: 90, color: "gray" },
  gold: { name: "Gold", cost: 500, adSpots: 180, color: "yellow" },
  platinum: { name: "Platinum", cost: 1000, adSpots: 360, color: "purple" },
};

export default function SponsorPortalPage() {
  const [sponsorId, setSponsorId] = useState("");
  const [sponsor, setSponsor] = useState<SponsorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"lookup" | "dashboard">("lookup");

  const lookupSponsor = async () => {
    if (!sponsorId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}`);
      if (res.ok) {
        const data = await res.json();
        setSponsor(data.sponsor || data);
        setView("dashboard");
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const tier = sponsor?.sponsorshipTier
    ? TIER_INFO[sponsor.sponsorshipTier] || null
    : null;

  if (view === "lookup") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <SharedNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Building2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sponsor Portal</h1>
          <p className="text-gray-600 mb-8">
            View your sponsorship details, ad performance, and ROI.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupSponsor()}
              placeholder="Enter your Sponsor ID or email"
              className="flex-1 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
            <button
              onClick={lookupSponsor}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Go
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Your Sponsor ID was provided when your sponsorship was activated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sponsor?.businessName}</h1>
            <p className="text-gray-500">
              {sponsor?.contactName} &middot; {sponsor?.city}, {sponsor?.state}
            </p>
          </div>
          <button
            onClick={() => { setView("lookup"); setSponsor(null); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Switch Account
          </button>
        </div>

        {/* Tier Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sponsorship Tier</p>
              <p className="text-2xl font-bold text-gray-900">
                {tier ? tier.name : "Not Active"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {tier ? `$${tier.cost}/month • ${tier.adSpots} ad spots/month` : "Contact us to activate"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Monthly Investment</p>
              <p className="text-3xl font-bold text-blue-600">
                ${sponsor?.monthlyAmount || tier?.cost || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <Megaphone className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-sm text-gray-500">Ad Spots/Month</p>
            <p className="text-xl font-bold">{tier?.adSpots || "—"}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <Users className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-sm text-gray-500">Audience Reach</p>
            <p className="text-xl font-bold">1,250</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <Target className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-sm text-gray-500">Business Type</p>
            <p className="text-xl font-bold capitalize">
              {sponsor?.businessType?.replace(/_/g, " ") || "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <TrendingUp className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-xl font-bold capitalize">
              {sponsor?.status?.toLowerCase() || "—"}
            </p>
          </div>
        </div>

        {/* What You Get */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            Your Sponsorship Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Ad Placements</h3>
              <p className="text-sm text-gray-500">
                Your ads run during prime listening hours (6am-6pm) reaching our engaged audience
                of Americana and country music fans.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Social Mentions</h3>
              <p className="text-sm text-gray-500">
                Our DJs mention your business during their shows, giving you authentic endorsements
                that resonate with listeners.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Event Promotion</h3>
              <p className="text-sm text-gray-500">
                {tier?.name === "Gold" || tier?.name === "Platinum"
                  ? "Your events are featured on-air and in our community channels."
                  : "Upgrade to Gold or Platinum for event promotion."}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Growth Partner Program</h3>
              <p className="text-sm text-gray-500">
                Earn commissions by referring listeners and backing artists. Active sponsors
                can earn back their sponsorship investment and more.
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        {(!tier || tier.name !== "Platinum") && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Upgrade Your Sponsorship</h3>
            <p className="text-sm text-blue-700 mb-4">
              Higher tiers mean more ad spots, more reach, and exclusive benefits.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(TIER_INFO)
                .filter(([key]) => key !== sponsor?.sponsorshipTier)
                .map(([key, info]) => (
                  <div key={key} className="bg-white rounded-lg p-3 border text-center">
                    <p className="font-semibold text-sm">{info.name}</p>
                    <p className="text-lg font-bold text-blue-600">${info.cost}/mo</p>
                    <p className="text-xs text-gray-500">{info.adSpots} ads/mo</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Questions about your sponsorship?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Our team is here to help you get the most from your investment.
          </p>
          <a
            href="/harper"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Contact Harper Team
          </a>
        </div>
      </div>
    </div>
  );
}
