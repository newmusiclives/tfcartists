"use client";

import Link from "next/link";
import { ArrowLeft, Users, Music, DollarSign, TrendingUp, Upload, CheckCircle, Clock, XCircle, Search, UserCircle } from "lucide-react";
import { ARTIST_CAPACITY, AIRPLAY_TIER_SHARES, AIRPLAY_TIER_PRICING, AIRPLAY_TIER_PLAYS_PER_MONTH } from "@/lib/calculations/station-capacity";

export default function RileyDashboardPage() {
  // Mock data - in production this would come from the database
  const stats = {
    totalArtists: 340,
    byTier: {
      FREE: 180,
      BRONZE: 80,
      SILVER: 40,
      GOLD: 30,
      PLATINUM: 10,
    },
    monthlyRevenue: 3900, // From Master Overview
    totalShares: 6430,
    pendingSubmissions: 12,
    approvedThisMonth: 45,
    rejectedThisMonth: 3,
  };

  const recentSubmissions = [
    { id: 1, artist: "Sarah Blake", track: "Wildfire", tier: "SILVER", status: "pending", submittedAt: "2 hours ago" },
    { id: 2, artist: "Jake Rivers", track: "Long Road Home", tier: "GOLD", status: "approved", submittedAt: "5 hours ago" },
    { id: 3, artist: "Maya Santos", track: "Desert Moon", tier: "BRONZE", status: "pending", submittedAt: "1 day ago" },
    { id: 4, artist: "Alex Turner", track: "Fading Light", tier: "PLATINUM", status: "approved", submittedAt: "1 day ago" },
    { id: 5, artist: "Emma Davis", track: "Broken Strings", tier: "FREE", status: "rejected", submittedAt: "2 days ago" },
  ];

  const tierUpgradeOpportunities = [
    { artist: "John Smith", currentTier: "FREE", suggestedTier: "BRONZE", plays: 15, engagement: "high" },
    { artist: "Lisa Wong", currentTier: "BRONZE", suggestedTier: "SILVER", plays: 28, engagement: "high" },
    { artist: "Mike Johnson", currentTier: "SILVER", suggestedTier: "GOLD", plays: 52, engagement: "medium" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
              href="/riley/team"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span>View Team</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Riley Dashboard</h1>
              <p className="text-gray-600">
                Artist Airplay Management & Track Submissions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Users className="w-6 h-6 text-purple-600" />}
            label="Total Artists"
            value={stats.totalArtists}
            subtitle="Active on station"
            color="purple"
          />
          <MetricCard
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            label="Monthly Revenue"
            value={`$${stats.monthlyRevenue.toLocaleString()}`}
            subtitle="100% retained"
            color="green"
          />
          <MetricCard
            icon={<Music className="w-6 h-6 text-blue-600" />}
            label="Pending Submissions"
            value={stats.pendingSubmissions}
            subtitle="Awaiting review"
            color="blue"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            label="Total Pool Shares"
            value={stats.totalShares.toLocaleString()}
            subtitle="Artist pool"
            color="orange"
          />
        </section>

        {/* Artist Distribution by Tier */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Artist Distribution by Tier</h2>
          <p className="text-gray-600 text-sm mb-6">
            Current capacity: {stats.totalArtists} / {ARTIST_CAPACITY.TOTAL} artists
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <TierCard
              tier="FREE"
              count={stats.byTier.FREE}
              capacity={ARTIST_CAPACITY.FREE}
              price={AIRPLAY_TIER_PRICING.FREE}
              shares={AIRPLAY_TIER_SHARES.FREE}
              playsPerMonth={AIRPLAY_TIER_PLAYS_PER_MONTH.FREE}
              color="gray"
            />
            <TierCard
              tier="BRONZE"
              count={stats.byTier.BRONZE}
              capacity={ARTIST_CAPACITY.BRONZE}
              price={AIRPLAY_TIER_PRICING.BRONZE}
              shares={AIRPLAY_TIER_SHARES.BRONZE}
              playsPerMonth={AIRPLAY_TIER_PLAYS_PER_MONTH.BRONZE}
              color="orange"
            />
            <TierCard
              tier="SILVER"
              count={stats.byTier.SILVER}
              capacity={ARTIST_CAPACITY.SILVER}
              price={AIRPLAY_TIER_PRICING.SILVER}
              shares={AIRPLAY_TIER_SHARES.SILVER}
              playsPerMonth={AIRPLAY_TIER_PLAYS_PER_MONTH.SILVER}
              color="gray"
            />
            <TierCard
              tier="GOLD"
              count={stats.byTier.GOLD}
              capacity={ARTIST_CAPACITY.GOLD}
              price={AIRPLAY_TIER_PRICING.GOLD}
              shares={AIRPLAY_TIER_SHARES.GOLD}
              playsPerMonth={AIRPLAY_TIER_PLAYS_PER_MONTH.GOLD}
              color="yellow"
            />
            <TierCard
              tier="PLATINUM"
              count={stats.byTier.PLATINUM}
              capacity={ARTIST_CAPACITY.PLATINUM}
              price={AIRPLAY_TIER_PRICING.PLATINUM}
              shares={AIRPLAY_TIER_SHARES.PLATINUM}
              playsPerMonth={AIRPLAY_TIER_PLAYS_PER_MONTH.PLATINUM}
              color="purple"
            />
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Monthly Revenue</div>
                <div className="text-2xl font-bold text-purple-600">${stats.monthlyRevenue.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Annual Revenue</div>
                <div className="text-2xl font-bold text-purple-600">${(stats.monthlyRevenue * 12).toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Revenue Status</div>
                <div className="text-sm font-semibold text-green-600">100% Retained by Station</div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Track Submissions */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Recent Track Submissions</h2>
              <p className="text-gray-600 text-sm mt-1">
                {stats.approvedThisMonth} approved, {stats.rejectedThisMonth} rejected this month
              </p>
            </div>
            <Link
              href="/riley/submissions"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>View All</span>
            </Link>
          </div>

          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <SubmissionRow key={submission.id} {...submission} />
            ))}
          </div>
        </section>

        {/* Tier Upgrade Opportunities */}
        <section className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Tier Upgrade Opportunities</h2>
          <p className="text-gray-600 text-sm mb-6">
            Artists showing high engagement who might upgrade to higher tiers
          </p>

          <div className="space-y-4">
            {tierUpgradeOpportunities.map((opp, idx) => (
              <UpgradeOpportunityCard key={idx} {...opp} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/riley/upgrade-opportunities"
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              View All Opportunities →
            </Link>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <QuickActionCard
            title="Artist Pipeline"
            description="Complete journey from discovery to activation"
            href="/riley/pipeline"
            icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
            badge={8}
          />
          <QuickActionCard
            title="Artist Outreach"
            description="Discover and contact new artists for airplay"
            href="/riley/outreach"
            icon={<Search className="w-8 h-8 text-indigo-600" />}
            badge={6}
          />
          <QuickActionCard
            title="Review Submissions"
            description="Approve or reject pending track submissions"
            href="/riley/submissions"
            icon={<CheckCircle className="w-8 h-8 text-blue-600" />}
            badge={stats.pendingSubmissions}
          />
          <QuickActionCard
            title="Manage Artists"
            description="View and manage all artists in the system"
            href="/riley/artists"
            icon={<Users className="w-8 h-8 text-orange-600" />}
          />
          <QuickActionCard
            title="Pool Share Calculator"
            description="Calculate artist earnings from sponsor pool"
            href="/riley/pool-calculator"
            icon={<DollarSign className="w-8 h-8 text-green-600" />}
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

function TierCard({
  tier,
  count,
  capacity,
  price,
  shares,
  playsPerMonth,
  color,
}: {
  tier: string;
  count: number;
  capacity: number;
  price: number;
  shares: number;
  playsPerMonth: number;
  color: string;
}) {
  const percentage = (count / capacity) * 100;
  const colorClasses = {
    gray: "text-gray-600 bg-gray-100",
    orange: "text-orange-600 bg-orange-100",
    yellow: "text-yellow-600 bg-yellow-100",
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
      <div className="text-xs text-gray-500 mb-3">of {capacity} capacity</div>

      <div className="space-y-1 text-xs text-gray-600">
        <div>• {shares} {shares === 1 ? 'share' : 'shares'}</div>
        <div>• {playsPerMonth} {playsPerMonth === 1 ? 'play' : 'plays'}/mo</div>
      </div>

      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-purple-600 h-full rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1 text-center">{percentage.toFixed(0)}% filled</div>
    </div>
  );
}

function SubmissionRow({
  artist,
  track,
  tier,
  status,
  submittedAt,
}: {
  artist: string;
  track: string;
  tier: string;
  status: string;
  submittedAt: string;
}) {
  const statusConfig = {
    pending: {
      icon: <Clock className="w-4 h-4 text-yellow-600" />,
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      label: "Pending",
    },
    approved: {
      icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      bg: "bg-green-50",
      text: "text-green-700",
      label: "Approved",
    },
    rejected: {
      icon: <XCircle className="w-4 h-4 text-red-600" />,
      bg: "bg-red-50",
      text: "text-red-700",
      label: "Rejected",
    },
  }[status];

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <Music className="w-10 h-10 text-gray-400" />
        <div>
          <div className="font-semibold text-gray-900">{track}</div>
          <div className="text-sm text-gray-600">{artist}</div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-xs text-gray-500">{tier} Tier</div>
          <div className="text-xs text-gray-400">{submittedAt}</div>
        </div>
        <div className={`px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text} flex items-center space-x-1`}>
          {statusConfig.icon}
          <span className="text-xs font-medium">{statusConfig.label}</span>
        </div>
      </div>
    </div>
  );
}

function UpgradeOpportunityCard({
  artist,
  currentTier,
  suggestedTier,
  plays,
  engagement,
}: {
  artist: string;
  currentTier: string;
  suggestedTier: string;
  plays: number;
  engagement: string;
}) {
  const currentPrice = AIRPLAY_TIER_PRICING[currentTier as keyof typeof AIRPLAY_TIER_PRICING];
  const suggestedPrice = AIRPLAY_TIER_PRICING[suggestedTier as keyof typeof AIRPLAY_TIER_PRICING];

  return (
    <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{artist}</div>
          <div className="text-sm text-gray-600 mt-1">
            {plays} plays • {engagement} engagement
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">Current</div>
            <div className="font-bold text-gray-700">{currentTier}</div>
            <div className="text-xs text-gray-500">${currentPrice}/mo</div>
          </div>
          <div className="text-gray-400">→</div>
          <div className="text-center">
            <div className="text-xs text-purple-600">Suggested</div>
            <div className="font-bold text-purple-600">{suggestedTier}</div>
            <div className="text-xs text-purple-600">${suggestedPrice}/mo</div>
          </div>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            Contact
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
      <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-300">
        <div className="flex items-center justify-between mb-3">
          {icon}
          {badge !== undefined && (
            <div className="bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
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
