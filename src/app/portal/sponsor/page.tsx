"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SharedNav } from "@/components/shared-nav";
import { SponsorPortalNav } from "@/components/sponsor-portal-nav";
import {
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Loader2,
  ChevronRight,
  Megaphone,
  Target,
  Radio,
  RefreshCw,
  Plus,
  Mail,
  Eye,
  Clock,
} from "lucide-react";

interface DashboardData {
  sponsor: {
    id: string;
    businessName: string;
    contactName: string;
    email: string;
    businessType: string;
    status: string;
    sponsorshipTier: string;
    monthlyAmount: number;
    city: string;
    state: string;
  };
  overview: {
    activeSponsorships: number;
    totalImpressions: number;
    totalSpend: number;
    costPerImpression: number;
    listenerReach: number;
    engagementRate: number;
  };
  ads: Array<{
    id: string;
    title: string;
    playCount: number;
    lastPlayedAt: string | null;
    tier: string;
    isActive: boolean;
    createdAt: string;
    durationSeconds: number | null;
  }>;
}

const TIER_INFO: Record<string, { name: string; cost: number; adSpots: number }> = {
  LOCAL_HERO: { name: "Local Hero", cost: 50, adSpots: 30 },
  BRONZE: { name: "Bronze", cost: 100, adSpots: 60 },
  bronze: { name: "Bronze", cost: 100, adSpots: 60 },
  SILVER: { name: "Silver", cost: 300, adSpots: 90 },
  silver: { name: "Silver", cost: 300, adSpots: 90 },
  GOLD: { name: "Gold", cost: 500, adSpots: 180 },
  gold: { name: "Gold", cost: 500, adSpots: 180 },
  PLATINUM: { name: "Platinum", cost: 1000, adSpots: 360 },
  platinum: { name: "Platinum", cost: 1000, adSpots: 360 },
};

export default function SponsorPortalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sponsorIdParam = searchParams.get("sponsorId") || "";

  const [sponsorId, setSponsorId] = useState(sponsorIdParam);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/sponsor/dashboard?sponsorId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Update URL with sponsorId
        if (!searchParams.get("sponsorId")) {
          router.replace(`/portal/sponsor?sponsorId=${encodeURIComponent(id)}`);
        }
      } else if (res.status === 404) {
        setError("Sponsor not found. Check your ID and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (sponsorIdParam) {
      setSponsorId(sponsorIdParam);
      fetchDashboard(sponsorIdParam);
    }
  }, [sponsorIdParam, fetchDashboard]);

  // Lookup view
  if (!data && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <SharedNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Building2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sponsor Portal</h1>
          <p className="text-gray-600 dark:text-zinc-400 mb-8">
            View your sponsorship details, ad performance, campaigns, and billing.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchDashboard(sponsorId)}
              placeholder="Enter your Sponsor ID or email"
              className="flex-1 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
            <button
              onClick={() => fetchDashboard(sponsorId)}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Go
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-3">{error}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Your Sponsor ID was provided when your sponsorship was activated. Check your welcome email or contact the team.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
        <SharedNav />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { sponsor, overview, ads } = data;
  const tier = sponsor.sponsorshipTier ? TIER_INFO[sponsor.sponsorshipTier] || null : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      <SharedNav />
      <SponsorPortalNav sponsorId={sponsor.id} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sponsor.businessName}</h1>
            <p className="text-gray-500 dark:text-zinc-500">
              {sponsor.contactName} &middot; {sponsor.city}, {sponsor.state}
            </p>
          </div>
          <button
            onClick={() => { setData(null); setSponsorId(""); router.replace("/portal/sponsor"); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Switch Account
          </button>
        </div>

        {/* Tier Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border-2 border-blue-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Sponsorship Tier</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tier ? tier.name : "Not Active"}
              </p>
              <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                {tier ? `$${tier.cost}/month \u2022 ${tier.adSpots} ad spots/month` : "Contact us to activate"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-zinc-500">Monthly Investment</p>
              <p className="text-3xl font-bold text-blue-600">
                ${sponsor.monthlyAmount || tier?.cost || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Overview Stats */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Campaign Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={<Megaphone className="w-5 h-5 text-blue-500" />}
            label="Active Campaigns"
            value={String(overview.activeSponsorships)}
          />
          <StatCard
            icon={<Eye className="w-5 h-5 text-green-500" />}
            label="Total Impressions"
            value={overview.totalImpressions.toLocaleString()}
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
            label="Total Spend"
            value={`$${overview.totalSpend.toLocaleString()}`}
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-amber-500" />}
            label="Cost / Impression"
            value={`$${overview.costPerImpression.toFixed(3)}`}
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-purple-500" />}
            label="Listener Reach"
            value={overview.listenerReach.toLocaleString()}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
            label="Engagement Rate"
            value={`${overview.engagementRate.toFixed(1)}%`}
          />
        </div>

        {/* Active Ad Spots */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border mb-8">
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-gray-400" />
              Active Ad Spots
            </h2>
            <span className="text-sm text-gray-500 dark:text-zinc-500">
              {ads.filter((a) => a.isActive).length} active / {ads.length} total
            </span>
          </div>
          {ads.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-gray-500 dark:text-zinc-500">
              No ad spots found. Contact the station team to set up your first ad.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {ads.map((ad) => (
                <div key={ad.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${ad.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{ad.title}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">
                        {ad.tier.charAt(0).toUpperCase() + ad.tier.slice(1)} tier
                        {ad.durationSeconds ? ` \u2022 ${Math.round(ad.durationSeconds)}s` : ""}
                        {ad.lastPlayedAt
                          ? ` \u2022 Last played ${new Date(ad.lastPlayedAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{ad.playCount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">plays</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickAction
            icon={<RefreshCw className="w-5 h-5 text-blue-500" />}
            title="Renew Campaign"
            description="Extend or renew your current sponsorship"
            href={`mailto:sponsors@truefansradio.com?subject=Campaign Renewal - ${encodeURIComponent(sponsor.businessName)}`}
          />
          <QuickAction
            icon={<Plus className="w-5 h-5 text-green-500" />}
            title="Request New Ad Slot"
            description="Add more ad placements to your rotation"
            href={`mailto:sponsors@truefansradio.com?subject=New Ad Slot Request - ${encodeURIComponent(sponsor.businessName)}`}
          />
          <QuickAction
            icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
            title="View ROI Report"
            description="See your detailed monthly performance"
            href={`/portal/sponsor/roi?sponsorId=${sponsor.id}`}
            isInternal
          />
          <QuickAction
            icon={<Mail className="w-5 h-5 text-amber-500" />}
            title="Contact Station"
            description="Reach out to our sponsorship team"
            href={`mailto:sponsors@truefansradio.com?subject=Sponsor Inquiry - ${encodeURIComponent(sponsor.businessName)}`}
          />
        </div>

        {/* Upgrade CTA */}
        {(!tier || (tier.name !== "Platinum")) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Upgrade Your Sponsorship</h3>
            <p className="text-sm text-blue-700 mb-4">
              Higher tiers mean more ad spots, more reach, and exclusive benefits.
            </p>
            <a
              href={`mailto:sponsors@truefansradio.com?subject=Sponsorship Upgrade Inquiry - ${encodeURIComponent(sponsor.businessName)}`}
              className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Discuss Upgrading
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border">
      <div className="mb-2">{icon}</div>
      <p className="text-xs text-gray-500 dark:text-zinc-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  href,
  isInternal,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  isInternal?: boolean;
}) {
  const Tag = isInternal ? "a" : "a";
  return (
    <a
      href={href}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border hover:border-blue-300 hover:shadow transition-all block"
    >
      <div className="mb-2">{icon}</div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">{description}</p>
    </a>
  );
}
