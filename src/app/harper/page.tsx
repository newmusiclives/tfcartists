"use client";

import Link from "next/link";
import { ArrowLeft, DollarSign, Building2, TrendingUp, Phone, Mail, Calendar, Target, UserCircle, Send, Radio, CreditCard, GitBranch } from "lucide-react";
import { SPONSOR_AD_SPOTS, SPONSOR_PRICING } from "@/lib/calculations/station-capacity";

export default function HarperDashboardPage() {
  // Mock data - in production this would come from the database
  // OPTIMAL 77% CAPACITY MODEL WITH LOCAL HERO ENTRY TIER
  const stats = {
    totalSponsors: 125,
    byTier: {
      LOCAL_HERO: 45,  // $50/mo (ENTRY LEVEL)
      TIER_1: 28,      // $100/mo
      TIER_2: 35,      // $200/mo
      TIER_3: 17,      // $400/mo
    },
    monthlyRevenue: 18850, // Base packages (45×$50 + 28×$100 + 35×$200 + 17×$400)
    premiumRevenue: 3400, // Premium add-ons (News, Sponsored Hours, Takeovers)
    totalRevenue: 22250, // Total Harper revenue (base + premium)
    artistPoolPayout: 17800, // 80% of total Harper revenue
    stationRevenue: 4450, // 20% of total Harper revenue
    activeCalls: 10,
    scheduledCallbacks: 22,
    dealsInNegotiation: 15,
  };

  const recentDeals = [
    { id: 1, business: "Mountain View Coffee", type: "Coffee Shop", tier: "TIER_2", status: "active", startDate: "Jan 2024" },
    { id: 2, business: "Craftworks Brewery", type: "Brewery", tier: "TIER_3", status: "active", startDate: "Jan 2024" },
    { id: 3, business: "Red Rock Music Store", type: "Music Store", tier: "TIER_2", status: "negotiating", startDate: "Pending" },
    { id: 4, business: "Desert Distilling Co.", type: "Distillery", tier: "TIER_3", status: "active", startDate: "Dec 2023" },
    { id: 5, business: "The Vinyl Cafe", type: "Cafe", tier: "TIER_1", status: "active", startDate: "Jan 2024" },
  ];

  const callSchedule = [
    { id: 1, business: "Sunrise Bakery", contact: "Sarah Miller", time: "2:00 PM Today", type: "discovery" },
    { id: 2, business: "North Woods Outfitters", contact: "Mike Chen", time: "4:30 PM Today", type: "pitch" },
    { id: 3, business: "The Book Nook", contact: "Lisa Garcia", time: "10:00 AM Tomorrow", type: "close" },
  ];

  const premiumOpportunities = [
    { business: "Mountain View Coffee", currentTier: "TIER_2", addon: "Sponsored Hour", monthlyAdd: 300 },
    { business: "Craftworks Brewery", currentTier: "TIER_3", addon: "Week Takeover", monthlyAdd: 800 },
  ];

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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Building2 className="w-6 h-6 text-green-600" />}
            label="Active Sponsors"
            value={stats.totalSponsors}
            subtitle="77% optimal capacity"
            color="green"
          />
          <MetricCard
            icon={<DollarSign className="w-6 h-6 text-blue-600" />}
            label="Monthly Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            subtitle="Base + Premium"
            color="blue"
          />
          <MetricCard
            icon={<Phone className="w-6 h-6 text-orange-600" />}
            label="Scheduled Calls"
            value={stats.scheduledCallbacks}
            subtitle={`${stats.activeCalls} active now`}
            color="orange"
          />
          <MetricCard
            icon={<Target className="w-6 h-6 text-purple-600" />}
            label="In Negotiation"
            value={stats.dealsInNegotiation}
            subtitle="Closing soon"
            color="purple"
          />
        </section>

        {/* Revenue Breakdown */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Revenue Distribution</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Base Packages</div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                ${stats.monthlyRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                {stats.byTier.LOCAL_HERO} Local Hero + {stats.byTier.TIER_1} Tier 1 + {stats.byTier.TIER_2} Tier 2 + {stats.byTier.TIER_3} Tier 3
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Premium Add-ons</div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                ${stats.premiumRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                News, Sponsored Hours, Takeovers
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Total Monthly</div>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                Annual: ${(stats.totalRevenue * 12).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4">Revenue Allocation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Artist Pool (80%)</span>
                  <span className="text-lg font-bold text-purple-600">
                    ${stats.artistPoolPayout.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Distributed monthly to artists based on shares
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Station Revenue (20%)</span>
                  <span className="text-lg font-bold text-green-600">
                    ${stats.stationRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Station operations and growth
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsor Distribution by Tier */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Sponsor Distribution by Tier</h2>
          <p className="text-gray-600 text-sm mb-6">
            Current sponsors: {stats.totalSponsors} at 77% optimal capacity with Local Hero entry tier
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SponsorTierCard
              tier="Local Hero"
              count={stats.byTier.LOCAL_HERO}
              target={45}
              price={SPONSOR_PRICING.LOCAL_HERO}
              spots={SPONSOR_AD_SPOTS.LOCAL_HERO}
              spotsPerDay={1}
              color="teal"
            />
            <SponsorTierCard
              tier="Tier 1"
              count={stats.byTier.TIER_1}
              target={28}
              price={SPONSOR_PRICING.TIER_1}
              spots={SPONSOR_AD_SPOTS.TIER_1}
              spotsPerDay={2}
              color="blue"
            />
            <SponsorTierCard
              tier="Tier 2"
              count={stats.byTier.TIER_2}
              target={35}
              price={SPONSOR_PRICING.TIER_2}
              spots={SPONSOR_AD_SPOTS.TIER_2}
              spotsPerDay={5}
              color="green"
            />
            <SponsorTierCard
              tier="Tier 3"
              count={stats.byTier.TIER_3}
              target={17}
              price={SPONSOR_PRICING.TIER_3}
              spots={SPONSOR_AD_SPOTS.TIER_3}
              spotsPerDay={10}
              color="purple"
            />
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-sm text-gray-600">Available Ad Inventory</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {17280 - (stats.byTier.TIER_1 * SPONSOR_AD_SPOTS.TIER_1 + stats.byTier.TIER_2 * SPONSOR_AD_SPOTS.TIER_2 + stats.byTier.TIER_3 * SPONSOR_AD_SPOTS.TIER_3)} spots
              </div>
              <div className="text-xs text-gray-500 mt-1">
                of 17,280 monthly spots remaining
              </div>
            </div>
          </div>
        </section>

        {/* Active & Recent Deals */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Active & Recent Deals</h2>
              <p className="text-gray-600 text-sm mt-1">
                Closed deals and ongoing negotiations
              </p>
            </div>
            <Link
              href="/harper/sponsors"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              View All Sponsors
            </Link>
          </div>

          <div className="space-y-3">
            {recentDeals.map((deal) => (
              <DealRow key={deal.id} {...deal} />
            ))}
          </div>
        </section>

        {/* Upcoming Calls */}
        <section className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Upcoming Calls</h2>
          <p className="text-gray-600 text-sm mb-6">
            Scheduled discovery calls, pitches, and closings
          </p>

          <div className="space-y-3">
            {callSchedule.map((call) => (
              <CallRow key={call.id} {...call} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/harper/calls"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View Full Call Schedule →
            </Link>
          </div>
        </section>

        {/* Premium Upsell Opportunities */}
        <section className="bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Premium Upsell Opportunities</h2>
          <p className="text-gray-600 text-sm mb-6">
            Existing sponsors who might benefit from premium add-ons
          </p>

          <div className="space-y-4">
            {premiumOpportunities.map((opp, idx) => (
              <UpsellOpportunityCard key={idx} {...opp} />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <QuickActionCard
            title="Sponsor Pipeline"
            description="Complete sponsor journey from discovery to activation"
            href="/harper/pipeline"
            icon={<GitBranch className="w-8 h-8 text-green-600" />}
            badge={8}
          />
          <QuickActionCard
            title="Sponsor Outreach"
            description="Lead discovery and business development"
            href="/harper/outreach"
            icon={<Send className="w-8 h-8 text-blue-600" />}
            badge={12}
          />
          <QuickActionCard
            title="Automated Workflows"
            description="Sponsor acquisition automation"
            href="/harper/workflows"
            icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
          />
          <QuickActionCard
            title="Manage Sponsors"
            description="View and manage all sponsor relationships"
            href="/harper/sponsors"
            icon={<Building2 className="w-8 h-8 text-green-600" />}
            badge={stats.totalSponsors}
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
            title="Call Schedule"
            description="View and manage upcoming sales calls"
            href="/harper/calls"
            icon={<Phone className="w-8 h-8 text-blue-600" />}
            badge={stats.scheduledCallbacks}
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

function SponsorTierCard({
  tier,
  count,
  target,
  price,
  spots,
  spotsPerDay,
  color,
}: {
  tier: string;
  count: number;
  target: number;
  price: number;
  spots: number;
  spotsPerDay: number;
  color: string;
}) {
  const percentage = (count / target) * 100;
  const colorClasses = {
    teal: "text-teal-600 bg-teal-100",
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    purple: "text-purple-600 bg-purple-100",
  }[color];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className={`text-xs font-bold px-2 py-1 rounded ${colorClasses}`}>
          {tier}
        </div>
        <div className="text-xs text-gray-500">${price}/mo</div>
      </div>
      <div className="text-3xl font-bold mb-1">{count}</div>
      <div className="text-xs text-gray-500 mb-3">of {target} target</div>

      <div className="space-y-1 text-xs text-gray-600">
        <div>• {spotsPerDay} spots/day</div>
        <div>• {spots} spots/month</div>
      </div>

      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-green-600 h-full rounded-full transition-all"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1 text-center">
        {percentage >= 100 ? "Target met!" : `${percentage.toFixed(0)}% of target`}
      </div>
    </div>
  );
}

function DealRow({
  business,
  type,
  tier,
  status,
  startDate,
}: {
  business: string;
  type: string;
  tier: string;
  status: string;
  startDate: string;
}) {
  const statusConfig = {
    active: {
      bg: "bg-green-50",
      text: "text-green-700",
      label: "Active",
    },
    negotiating: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      label: "Negotiating",
    },
    pending: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      label: "Pending",
    },
  }[status] || {
    bg: "bg-gray-50",
    text: "text-gray-700",
    label: status,
  };

  const tierPrice = {
    TIER_1: "$100",
    TIER_2: "$200",
    TIER_3: "$400",
  }[tier];

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <Building2 className="w-10 h-10 text-gray-400" />
        <div>
          <div className="font-semibold text-gray-900">{business}</div>
          <div className="text-sm text-gray-600">{type}</div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-xs text-gray-500">{tier.replace('_', ' ')} - {tierPrice}/mo</div>
          <div className="text-xs text-gray-400">{startDate}</div>
        </div>
        <div className={`px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
          <span className="text-xs font-medium">{statusConfig.label}</span>
        </div>
      </div>
    </div>
  );
}

function CallRow({
  business,
  contact,
  time,
  type,
}: {
  business: string;
  contact: string;
  time: string;
  type: string;
}) {
  const typeConfig = {
    discovery: { color: "blue", label: "Discovery" },
    pitch: { color: "purple", label: "Pitch" },
    close: { color: "green", label: "Closing" },
  }[type] || { color: "gray", label: type };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
      <div className="flex items-center space-x-4 flex-1">
        <Phone className="w-8 h-8 text-blue-600" />
        <div>
          <div className="font-semibold text-gray-900">{business}</div>
          <div className="text-sm text-gray-600">{contact}</div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{time}</div>
          <div className={`text-xs text-${typeConfig.color}-600 font-medium`}>{typeConfig.label} Call</div>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
          Join Call
        </button>
      </div>
    </div>
  );
}

function UpsellOpportunityCard({
  business,
  currentTier,
  addon,
  monthlyAdd,
}: {
  business: string;
  currentTier: string;
  addon: string;
  monthlyAdd: number;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border-2 border-yellow-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{business}</div>
          <div className="text-sm text-gray-600 mt-1">
            Currently on {currentTier.replace('_', ' ')} package
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">Upsell</div>
            <div className="font-bold text-yellow-600">{addon}</div>
            <div className="text-xs text-yellow-600">+${monthlyAdd}/mo</div>
          </div>
          <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
            Pitch Add-on
          </button>
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
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
