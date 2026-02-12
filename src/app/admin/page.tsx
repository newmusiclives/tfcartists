"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  TrendingUp,
  Building2,
  Award,
  Target,
  Radio,
  ArrowRight,
  Settings,
  CheckCircle2,
  BarChart3,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";
import { formatCurrency, getStatusColor } from "@/lib/utils";

interface Stats {
  artists: {
    total: number;
    discovered: number;
    contacted: number;
    engaged: number;
    qualified: number;
    activated: number;
    active: number;
  };
  donations: {
    total: number;
    totalRaised: number;
  };
  shows: {
    total: number;
    completed: number;
  };
  riley: {
    recentActivity: number;
    recentMessages: number;
  };
}

interface Artist {
  id: string;
  name: string;
  genre?: string;
  status: string;
  pipelineStage: string;
  createdAt: string;
  lastContactedAt?: string;
  conversationCount: number;
  _count: {
    conversations: number;
    shows: number;
    donations: number;
  };
}

// Aggregated mock data matching individual team dashboards
const systemFinancials = {
  sponsorRevenue: 22250,
  artistSubscriptions: 3900,
  get totalRevenue() { return this.sponsorRevenue + this.artistSubscriptions; },
  artistPoolPayout: 17800,  // 80% of sponsor revenue
  stationRetained: 8350,    // 20% sponsor + 100% artist subs
  liveShowDonations: 45000,
  annualProjection: (22250 + 3900) * 12,
};

const teamSummaries = {
  riley: {
    name: "Riley's Team",
    role: "Artist Acquisition",
    color: "purple",
    href: "/riley",
    icon: Users,
    stats: [
      { label: "Total Artists", value: "340" },
      { label: "Monthly Revenue", value: "$3,900" },
      { label: "Pending Submissions", value: "12" },
      { label: "Pool Shares", value: "6,430" },
    ],
  },
  cassidy: {
    name: "Cassidy's Team",
    role: "Submission Review",
    color: "teal",
    href: "/cassidy",
    icon: Award,
    stats: [
      { label: "In Rotation", value: "200" },
      { label: "Placement Rate", value: "95%" },
      { label: "Avg Review Time", value: "5 days" },
      { label: "80/20 Progress", value: "45%" },
    ],
  },
  harper: {
    name: "Harper's Team",
    role: "Sponsor Acquisition",
    color: "green",
    href: "/harper",
    icon: Building2,
    stats: [
      { label: "Active Sponsors", value: "125" },
      { label: "Monthly Revenue", value: "$22,250" },
      { label: "Scheduled Calls", value: "22" },
      { label: "In Negotiation", value: "15" },
    ],
  },
  elliot: {
    name: "Elliot's Team",
    role: "Listener Growth",
    color: "blue",
    href: "/elliot",
    icon: Target,
    stats: [
      { label: "Daily Active", value: "1,250" },
      { label: "Avg Session", value: "28 min" },
      { label: "Returning", value: "52%" },
      { label: "Viral Views", value: "485k" },
    ],
  },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, artistsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/artists?limit=10"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.artists) setStats(statsData);
        }

        if (artistsRes.ok) {
          const artistsData = await artistsRes.json();
          if (Array.isArray(artistsData.artists)) setArtists(artistsData.artists);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />

      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Radio className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Command Center</h1>
                <p className="text-gray-600">All teams, financials, and analytics in one place</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/revenue/projections"
                className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg text-green-700 hover:from-green-100 hover:to-blue-100 font-semibold transition-all text-sm"
              >
                <Target className="w-4 h-4" />
                <span>Revenue Model</span>
              </Link>
              <Link
                href="/admin/verification"
                className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg text-blue-700 hover:from-blue-100 hover:to-purple-100 font-semibold transition-all text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Processes</span>
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top-Level Financial KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100 text-sm font-medium">Total Monthly Revenue</span>
              <TrendingUp className="w-5 h-5 text-purple-200" />
            </div>
            <div className="text-3xl font-bold">${systemFinancials.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-purple-200 mt-1">
              Annual: ${systemFinancials.annualProjection.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100 text-sm font-medium">Artist Pool Payout</span>
              <Users className="w-5 h-5 text-green-200" />
            </div>
            <div className="text-3xl font-bold">${systemFinancials.artistPoolPayout.toLocaleString()}</div>
            <div className="text-sm text-green-200 mt-1">
              80% of sponsor revenue distributed monthly
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm font-medium">Station Retained</span>
              <DollarSign className="w-5 h-5 text-blue-200" />
            </div>
            <div className="text-3xl font-bold">${systemFinancials.stationRetained.toLocaleString()}</div>
            <div className="text-sm text-blue-200 mt-1">
              20% sponsors + artist subscriptions
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-100 text-sm font-medium">Live Show Donations</span>
              <Calendar className="w-5 h-5 text-orange-200" />
            </div>
            <div className="text-3xl font-bold">${systemFinancials.liveShowDonations.toLocaleString()}</div>
            <div className="text-sm text-orange-200 mt-1">
              Direct to artists via TrueFans CONNECT
            </div>
          </div>
        </section>

        {/* Team Dashboard Cards */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Team Dashboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(teamSummaries).map(([key, team]) => {
              const colorMap: Record<string, { border: string; iconBg: string; iconText: string; badge: string; hover: string }> = {
                purple: { border: "border-purple-200", iconBg: "bg-purple-100", iconText: "text-purple-600", badge: "bg-purple-600", hover: "hover:border-purple-400" },
                teal: { border: "border-teal-200", iconBg: "bg-teal-100", iconText: "text-teal-600", badge: "bg-teal-600", hover: "hover:border-teal-400" },
                green: { border: "border-green-200", iconBg: "bg-green-100", iconText: "text-green-600", badge: "bg-green-600", hover: "hover:border-green-400" },
                blue: { border: "border-blue-200", iconBg: "bg-blue-100", iconText: "text-blue-600", badge: "bg-blue-600", hover: "hover:border-blue-400" },
              };
              const c = colorMap[team.color];
              const Icon = team.icon;

              return (
                <Link key={key} href={team.href} className="block group">
                  <div className={`bg-white rounded-xl shadow-sm border-2 ${c.border} ${c.hover} p-6 transition-all group-hover:shadow-md`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-lg ${c.iconBg}`}>
                          <Icon className={`w-6 h-6 ${c.iconText}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                          <p className="text-sm text-gray-500">{team.role}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {team.stats.map((stat) => (
                        <div key={stat.label} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                          <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Revenue Flow Summary */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Revenue Flow</h2>
            <Link
              href="/revenue"
              className="text-purple-600 hover:text-purple-700 text-sm font-medium inline-flex items-center space-x-1"
            >
              <span>Full Breakdown</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sponsor Revenue */}
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Sponsor Revenue</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-2">
                ${systemFinancials.sponsorRevenue.toLocaleString()}/mo
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">80% to Artist Pool</span>
                  <span className="font-semibold text-blue-900">${systemFinancials.artistPoolPayout.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">20% to Station</span>
                  <span className="font-semibold text-blue-900">${(systemFinancials.sponsorRevenue * 0.2).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Artist Subscriptions */}
            <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">Artist Subscriptions</span>
              </div>
              <div className="text-2xl font-bold text-purple-900 mb-2">
                ${systemFinancials.artistSubscriptions.toLocaleString()}/mo
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-600">100% to Station</span>
                  <span className="font-semibold text-purple-900">${systemFinancials.artistSubscriptions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Airplay tier fees</span>
                  <span className="font-semibold text-purple-900">340 artists</span>
                </div>
              </div>
            </div>

            {/* Net Station Revenue */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-300">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Net Station Revenue</span>
              </div>
              <div className="text-2xl font-bold text-green-900 mb-2">
                ${systemFinancials.stationRetained.toLocaleString()}/mo
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-600">Annual Projection</span>
                  <span className="font-semibold text-green-900">${(systemFinancials.stationRetained * 12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Est. Profit (after $5k expenses)</span>
                  <span className="font-semibold text-green-900">${(systemFinancials.stationRetained - 5000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cross-Team Analytics */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Artist Pipeline (from live data) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Artist Pipeline (Live)</h2>
              <Link
                href="/riley/pipeline"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium inline-flex items-center space-x-1"
              >
                <span>View Pipeline</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <PipelineStage label="Discovered" count={stats?.artists.discovered || 0} color="gray" />
              <PipelineStage label="Contacted" count={stats?.artists.contacted || 0} color="blue" />
              <PipelineStage label="Engaged" count={stats?.artists.engaged || 0} color="purple" />
              <PipelineStage label="Qualified" count={stats?.artists.qualified || 0} color="green" />
              <PipelineStage label="Onboarding" count={stats?.artists.qualified || 0} color="yellow" />
              <PipelineStage label="Activated" count={stats?.artists.activated || 0} color="emerald" />
              <PipelineStage label="Active" count={stats?.artists.active || 0} color="teal" />
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
              <span className="text-gray-600">Total in database</span>
              <span className="font-bold text-gray-900">{stats?.artists.total || 0} artists</span>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">System Health</h2>
            <div className="space-y-4">
              <HealthMetric
                label="Riley: Artist Acquisition"
                value={stats?.riley.recentMessages || 0}
                unit="messages (7d)"
                status="active"
                color="purple"
              />
              <HealthMetric
                label="Cassidy: Review Pipeline"
                value={12}
                unit="pending reviews"
                status="active"
                color="teal"
              />
              <HealthMetric
                label="Harper: Sponsor Revenue"
                value={125}
                unit="active sponsors"
                status="active"
                color="green"
              />
              <HealthMetric
                label="Elliot: Listener Growth"
                value={24}
                unit="% growth rate"
                status="active"
                color="blue"
              />
              <HealthMetric
                label="Live Shows"
                value={stats?.shows.completed || 0}
                unit={`of ${stats?.shows.total || 0} completed`}
                status="active"
                color="orange"
              />
              <HealthMetric
                label="Total Raised (Donations)"
                value={formatCurrency(stats?.donations.totalRaised || 0)}
                unit={`from ${stats?.donations.total || 0} donations`}
                status="active"
                color="pink"
              />
            </div>
          </div>
        </section>

        {/* Recent Artists Table */}
        <section className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Artists</h2>
            <Link
              href="/admin/artists"
              className="text-purple-600 hover:text-purple-700 text-sm font-medium inline-flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Artist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shows
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {artists.map((artist) => (
                  <tr key={artist.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {artist.name}
                      </div>
                      <div className="text-sm text-gray-500">{artist.genre || "—"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          artist.status
                        )}`}
                      >
                        {artist.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {artist._count.conversations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {artist._count.shows}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {artist._count.donations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/artists/${artist.id}`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <QuickLink href="/admin/artists" label="All Artists" icon={<Users className="w-5 h-5" />} color="purple" />
          <QuickLink href="/revenue" label="Revenue" icon={<DollarSign className="w-5 h-5" />} color="green" />
          <QuickLink href="/airplay" label="Airplay Tiers" icon={<Radio className="w-5 h-5" />} color="blue" />
          <QuickLink href="/capacity" label="Capacity" icon={<BarChart3 className="w-5 h-5" />} color="orange" />
          <QuickLink href="/schedule" label="DJ Schedule" icon={<Calendar className="w-5 h-5" />} color="pink" />
          <QuickLink href="/network" label="Network" icon={<MessageCircle className="w-5 h-5" />} color="teal" />
        </section>
      </main>
    </div>
  );
}

function PipelineStage({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    emerald: "bg-emerald-100 text-emerald-800",
    teal: "bg-teal-100 text-teal-800",
  };

  return (
    <div className="text-center">
      <div
        className={`text-2xl font-bold mb-1 ${colorClasses[color]} inline-flex items-center justify-center w-12 h-12 rounded-full`}
      >
        {count}
      </div>
      <div className="text-xs text-gray-600 font-medium">{label}</div>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  unit,
  status,
  color,
}: {
  label: string;
  value: string | number;
  unit: string;
  status: string;
  color: string;
}) {
  const dotColors: Record<string, string> = {
    purple: "bg-purple-500",
    teal: "bg-teal-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    pink: "bg-pink-500",
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColors[color]} animate-pulse`} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-bold text-gray-900">{value}</span>
        <span className="text-xs text-gray-500 ml-1">{unit}</span>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
  color,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
    pink: "bg-pink-50 text-pink-600 hover:bg-pink-100",
    teal: "bg-teal-50 text-teal-600 hover:bg-teal-100",
  };

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors ${colorClasses[color]}`}
    >
      {icon}
      <span className="text-xs font-semibold mt-2">{label}</span>
    </Link>
  );
}
