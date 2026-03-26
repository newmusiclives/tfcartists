"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Building2, TrendingUp, Phone, Calendar, Target, UserCircle, Send, Radio, CreditCard, GitBranch, Loader2 } from "lucide-react";
import { SPONSOR_AD_SPOTS, SPONSOR_PRICING } from "@/lib/calculations/station-capacity";
import { ExportButtons } from "@/components/export-buttons";

interface HarperStats {
  totalSponsors: number;
  byStatus: Record<string, number>;
  totalMonthlyRevenue: number;
  activeSponsorships: number;
  callsThisMonth: number;
  dealsClosedThisMonth: number;
  byStage: Record<string, number>;
  revenueByTier: Record<string, { count: number; revenue: number }>;
  activity: { recentActions: number; callsThisMonth: number; messagesSent: number };
}

interface Deal {
  id: string;
  tier: string;
  monthlyAmount: number;
  status: string;
  startDate: string;
  sponsor: {
    id: string;
    businessName: string;
    contactName: string;
    businessType: string;
    city: string;
    state: string;
    status: string;
    pipelineStage: string;
  };
}

const TIER_NAMES: Record<string, string> = {
  localHero: "Local Hero",
  LOCAL_HERO: "Local Hero",
  bronze: "Bronze",
  BRONZE: "Bronze",
  silver: "Silver",
  SILVER: "Silver",
  gold: "Gold",
  GOLD: "Gold",
  platinum: "Platinum",
  PLATINUM: "Platinum",
};

export default function HarperDashboardPage() {
  const [stats, setStats] = useState<HarperStats | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, dealsRes] = await Promise.all([
          fetch("/api/harper/stats"),
          fetch("/api/harper/deals?limit=5"),
        ]);

        if (statsRes.status === 401) { setUnauthorized(true); return; }

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (dealsRes.ok) {
          const data = await dealsRes.json();
          setDeals(data.deals || []);
        }
      } catch (error) {
        // Fetch error handled by loading state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Sign in as Harper to access this dashboard.</p>
          <Link href="/login?callbackUrl=/harper" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Sign In</Link>
        </div>
      </main>
    );
  }

  const totalSponsors = stats?.totalSponsors ?? 0;
  const totalRevenue = stats?.totalMonthlyRevenue ?? 0;
  const activeDeals = stats?.activeSponsorships ?? 0;
  const callsThisMonth = stats?.callsThisMonth ?? 0;
  const revenueByTier = stats?.revenueByTier ?? {};

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/admin"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin</span>
            </Link>
            <Link
              href="/harper/team"
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span>View Team</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Harper Dashboard</h1>
              <p className="text-gray-600">
                Sponsor Acquisition & Revenue Management
              </p>
            </div>
          </div>
          <ExportButtons type="sponsors" color="green" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Building2 className="w-6 h-6 text-green-600" />}
            label="Total Sponsors"
            value={totalSponsors}
            subtitle={`${activeDeals} active deals`}
            color="green"
          />
          <MetricCard
            icon={<DollarSign className="w-6 h-6 text-blue-600" />}
            label="Monthly Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            subtitle="From active sponsorships"
            color="blue"
          />
          <MetricCard
            icon={<Phone className="w-6 h-6 text-orange-600" />}
            label="Calls This Month"
            value={callsThisMonth}
            subtitle={`${stats?.dealsClosedThisMonth ?? 0} deals closed`}
            color="orange"
          />
          <MetricCard
            icon={<Target className="w-6 h-6 text-purple-600" />}
            label="In Pipeline"
            value={(stats?.byStage?.negotiating ?? 0) + (stats?.byStage?.interested ?? 0)}
            subtitle="Negotiating + interested"
            color="purple"
          />
        </section>

        {/* Revenue by Tier */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Revenue by Tier</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Active Sponsors</div>
              <div className="text-3xl font-bold text-green-600 mb-1">{totalSponsors}</div>
              <div className="text-xs text-gray-500">Across all tiers</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Monthly Revenue</div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                ${totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">From sponsorships</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Artist Pool (80%)</div>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                ${Math.round(totalRevenue * 0.8).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Distributed to artists</div>
            </div>
          </div>

          {Object.keys(revenueByTier).length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(revenueByTier).map(([tier, data]) => (
                  <div key={tier} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs font-bold text-gray-500 mb-1">
                      {TIER_NAMES[tier] || tier}
                    </div>
                    <div className="text-lg font-bold text-gray-900">{data.count}</div>
                    <div className="text-xs text-gray-500">${data.revenue.toLocaleString()}/mo</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Pipeline Overview */}
        {stats?.byStage && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Pipeline Overview</h2>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              {Object.entries(stats.byStage).map(([stage, count]) => (
                <div key={stage} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500 capitalize">{stage}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Deals */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Recent Deals</h2>
              <p className="text-gray-600 text-sm mt-1">
                Latest sponsorship activity
              </p>
            </div>
            <Link
              href="/harper/sponsors"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              View All Sponsors
            </Link>
          </div>

          {deals.length > 0 ? (
            <div className="space-y-3">
              {deals.map((deal) => (
                <DealRow key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No deals yet. Start reaching out to potential sponsors.</p>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        {stats?.activity && (
          <section className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-2xl font-bold text-gray-900">{stats.activity.recentActions}</div>
                <div className="text-sm text-gray-600">Actions this month</div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-2xl font-bold text-gray-900">{stats.activity.callsThisMonth}</div>
                <div className="text-sm text-gray-600">Calls completed</div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-2xl font-bold text-gray-900">{stats.activity.messagesSent}</div>
                <div className="text-sm text-gray-600">Messages sent</div>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <QuickActionCard
            title="Sponsor Pipeline"
            description="Complete sponsor journey from discovery to activation"
            href="/harper/pipeline"
            icon={<GitBranch className="w-8 h-8 text-green-600" />}
          />
          <QuickActionCard
            title="Sponsor Outreach"
            description="Lead discovery and business development"
            href="/harper/outreach"
            icon={<Send className="w-8 h-8 text-blue-600" />}
          />
          <QuickActionCard
            title="Manage Sponsors"
            description="View and manage all sponsor relationships"
            href="/harper/sponsors"
            icon={<Building2 className="w-8 h-8 text-green-600" />}
            badge={totalSponsors}
          />
          <QuickActionCard
            title="Ad Operations"
            description="Schedule and manage ad spots"
            href="/harper/operations"
            icon={<Radio className="w-8 h-8 text-orange-600" />}
          />
          <QuickActionCard
            title="Billing & Revenue"
            description="Invoicing and revenue distribution"
            href="/harper/billing"
            icon={<CreditCard className="w-8 h-8 text-blue-600" />}
          />
          <QuickActionCard
            title="Ad Inventory"
            description="Manage ad spots and scheduling"
            href="/harper/inventory"
            icon={<Calendar className="w-8 h-8 text-purple-600" />}
          />
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function DealRow({ deal }: { deal: Deal }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-green-50", text: "text-green-700", label: "Active" },
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending" },
    cancelled: { bg: "bg-red-50", text: "text-red-700", label: "Cancelled" },
    expired: { bg: "bg-gray-50", text: "text-gray-700", label: "Expired" },
  };

  const config = statusConfig[deal.status] || { bg: "bg-gray-50", text: "text-gray-700", label: deal.status };
  const tierName = TIER_NAMES[deal.tier] || deal.tier;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <Building2 className="w-10 h-10 text-gray-400" />
        <div>
          <div className="font-semibold text-gray-900">{deal.sponsor.businessName}</div>
          <div className="text-sm text-gray-600">{deal.sponsor.businessType?.replace(/_/g, " ")}</div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-xs text-gray-500">{tierName} - ${deal.monthlyAmount}/mo</div>
          <div className="text-xs text-gray-400">
            {deal.startDate ? new Date(deal.startDate).toLocaleDateString() : "—"}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full ${config.bg} ${config.text}`}>
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-300">
        <div className="flex items-center justify-between mb-3">
          {icon}
          {badge !== undefined && (
            <div className="bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {badge}
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
