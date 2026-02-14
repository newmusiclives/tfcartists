"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Music, DollarSign, TrendingUp, Upload, CheckCircle, Clock, XCircle, Search, UserCircle, Play, Zap } from "lucide-react";
import { ARTIST_CAPACITY, AIRPLAY_TIER_SHARES, AIRPLAY_TIER_PRICING, AIRPLAY_TIER_PLAYS_PER_MONTH } from "@/lib/calculations/station-capacity";

interface RileyStats {
  totalArtists: number;
  byTier: { FREE: number; BRONZE: number; SILVER: number; GOLD: number; PLATINUM: number };
  monthlyRevenue: number;
  totalShares: number;
  pendingSubmissions: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
}

interface SubmissionItem {
  id: string;
  artistName: string;
  trackTitle: string;
  tierAwarded: string | null;
  status: string;
  createdAt: string;
}

interface AutomationResult {
  success: boolean;
  message?: string;
  results?: {
    followUps: number;
    showReminders: number;
    wins: number;
    errors: number;
  };
  dryRun?: boolean;
  error?: string;
}

export default function RileyDashboardPage() {
  const [stats, setStats] = useState<RileyStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionItem[]>([]);
  const [upgradeArtists, setUpgradeArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [automationResult, setAutomationResult] = useState<AutomationResult | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, submissionsRes, artistsRes] = await Promise.all([
          fetch("/api/riley/stats"),
          fetch("/api/cassidy/submissions?limit=5"),
          fetch("/api/artists?tier=FREE&sortBy=engagementRate&sortOrder=desc&limit=3"),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (submissionsRes.ok) {
          const data = await submissionsRes.json();
          setRecentSubmissions(data.submissions || []);
        }
        if (artistsRes.ok) {
          const data = await artistsRes.json();
          setUpgradeArtists(
            (data.artists || [])
              .filter((a: any) => a.engagementRate && a.engagementRate >= 4.0)
              .map((a: any) => ({
                artist: a.name,
                currentTier: "FREE",
                suggestedTier: "BRONZE",
                plays: a.followerCount || 0,
                engagement: a.engagementRate >= 5.0 ? "high" : "medium",
              }))
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function runDailyAutomation(dryRun: boolean) {
    setAutomationRunning(true);
    setAutomationResult(null);
    try {
      const res = await fetch(`/api/cron/riley-daily?dry_run=${dryRun}`);
      const data = await res.json();
      setAutomationResult({ ...data, dryRun });
    } catch (error) {
      setAutomationResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to run automation",
      });
    } finally {
      setAutomationRunning(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-red-600">Error loading dashboard data</div>
      </main>
    );
  }

  const tierUpgradeOpportunities = upgradeArtists.length > 0
    ? upgradeArtists
    : [{ artist: "No upgrade candidates", currentTier: "FREE", suggestedTier: "BRONZE", plays: 0, engagement: "low" }];

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  const mappedSubmissions = recentSubmissions.map((s) => ({
    id: s.id,
    artist: s.artistName,
    track: s.trackTitle,
    tier: s.tierAwarded || "PENDING",
    status: s.status === "PLACED" ? "approved" : s.status === "NOT_PLACED" ? "rejected" : "pending",
    submittedAt: formatTimeAgo(s.createdAt),
  }));

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

        {/* Team Members */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Team Members</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: "Riley Carpenter", role: "Team Lead & Strategy", avatar: "RC", color: "bg-purple-100 text-purple-600", status: "Managing upgrade opportunities", kpi: `${tierUpgradeOpportunities.length} opportunities` },
              { name: "Grace Holland", role: "Outreach & Artist Relations", avatar: "GH", color: "bg-indigo-100 text-indigo-600", status: "Artist outreach & discovery", kpi: "Active leads" },
              { name: "Marcus Tate", role: "Tier Management & Analytics", avatar: "MT", color: "bg-blue-100 text-blue-600", status: "Managing artist roster", kpi: `${stats.totalArtists} artists` },
              { name: "Sienna Park", role: "Content Vetting & QC", avatar: "SP", color: "bg-green-100 text-green-600", status: "Reviewing submissions", kpi: `${stats.pendingSubmissions} pending` },
              { name: "Jordan Cross", role: "Payment Processing", avatar: "JC", color: "bg-emerald-100 text-emerald-600", status: "Processing pool payments", kpi: `$${stats.monthlyRevenue.toLocaleString()}` },
            ].map((member, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-300 transition-colors">
                <div className={`w-10 h-10 ${member.color} rounded-lg flex items-center justify-center text-sm font-bold mb-2`}>{member.avatar}</div>
                <div className="font-semibold text-gray-900 text-sm">{member.name}</div>
                <div className="text-xs text-gray-600 mb-2">{member.role}</div>
                <div className="text-xs text-purple-600 mb-2 truncate">{member.status}</div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700">{member.kpi}</div>
                </div>
              </div>
            ))}
          </div>
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
            {mappedSubmissions.map((submission) => (
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

        {/* Riley Automation Controls */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Riley Automation</h2>
              <p className="text-gray-600 text-sm mt-1">
                Run Riley&apos;s daily automation: follow-ups, show reminders, and win celebrations
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => runDailyAutomation(true)}
                disabled={automationRunning}
                className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>{automationRunning ? "Running..." : "Dry Run"}</span>
              </button>
              <button
                onClick={() => runDailyAutomation(false)}
                disabled={automationRunning}
                className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                <span>{automationRunning ? "Running..." : "Run Daily Automation"}</span>
              </button>
            </div>
          </div>

          {automationResult && (
            <div className={`mt-4 p-4 rounded-lg ${automationResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex items-center space-x-2 mb-2">
                {automationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-semibold ${automationResult.success ? "text-green-700" : "text-red-700"}`}>
                  {automationResult.success
                    ? automationResult.dryRun ? "Dry Run Complete" : "Automation Complete"
                    : "Automation Failed"}
                </span>
              </div>
              {automationResult.results && (
                <div className="grid grid-cols-4 gap-4 mt-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{automationResult.results.followUps}</div>
                    <div className="text-xs text-gray-600">Follow-ups{automationResult.dryRun ? " (planned)" : " sent"}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{automationResult.results.showReminders}</div>
                    <div className="text-xs text-gray-600">Show reminders{automationResult.dryRun ? " (planned)" : " sent"}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{automationResult.results.wins}</div>
                    <div className="text-xs text-gray-600">Wins{automationResult.dryRun ? " (planned)" : " celebrated"}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{automationResult.results.errors}</div>
                    <div className="text-xs text-gray-600">Errors</div>
                  </div>
                </div>
              )}
              {automationResult.error && (
                <p className="text-sm text-red-600 mt-2">{automationResult.error}</p>
              )}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <QuickActionCard
            title="Artist Pipeline"
            description="Complete journey from discovery to activation"
            href="/riley/pipeline"
            icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
            badge={8}
            managedBy="Riley Carpenter"
          />
          <QuickActionCard
            title="Artist Outreach"
            description="Discover and contact new artists for airplay"
            href="/riley/outreach"
            icon={<Search className="w-8 h-8 text-indigo-600" />}
            badge={6}
            managedBy="Grace Holland"
          />
          <QuickActionCard
            title="Review Submissions"
            description="Approve or reject pending track submissions"
            href="/riley/submissions"
            icon={<CheckCircle className="w-8 h-8 text-blue-600" />}
            badge={stats.pendingSubmissions}
            managedBy="Sienna Park"
          />
          <QuickActionCard
            title="Manage Artists"
            description="View and manage all artists in the system"
            href="/riley/artists"
            icon={<Users className="w-8 h-8 text-orange-600" />}
            managedBy="Marcus Tate"
          />
          <QuickActionCard
            title="Pool Share Calculator"
            description="Calculate artist earnings from sponsor pool"
            href="/riley/pool-calculator"
            icon={<DollarSign className="w-8 h-8 text-green-600" />}
            managedBy="Jordan Cross"
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
  }[status] || {
    icon: <Clock className="w-4 h-4 text-gray-600" />,
    bg: "bg-gray-50",
    text: "text-gray-700",
    label: status,
  };

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
  managedBy,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  managedBy?: string;
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
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        {managedBy && (
          <p className="text-xs text-purple-600 font-medium mb-1">Managed by {managedBy}</p>
        )}
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
