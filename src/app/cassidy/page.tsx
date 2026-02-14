"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Music,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Radio,
  Target,
  UserCircle,
  Calendar,
} from "lucide-react";
import type { CassidyStats, SubmissionListItem, ProgressionRequestListItem } from "@/types/cassidy";

export default function CassidyDashboardPage() {
  const [stats, setStats] = useState<CassidyStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionListItem[]>([]);
  const [progressionRequests, setProgressionRequests] = useState<ProgressionRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats
        const statsRes = await fetch("/api/cassidy/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch recent submissions
        const submissionsRes = await fetch("/api/cassidy/submissions?limit=5");
        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          setRecentSubmissions(submissionsData.submissions || []);
        }

        // Mock progression requests for now (would need separate API route)
        setProgressionRequests([]);
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
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-red-600">Error loading dashboard data</div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
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
              href="/cassidy/team"
              className="inline-flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span>View Panel</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-teal-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Cassidy Dashboard</h1>
              <p className="text-gray-600">
                Submission Review Panel & Rotation Curation
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Users className="w-6 h-6 text-teal-600" />}
            label="Artists in Rotation"
            value={stats.totalArtistsInRotation}
            subtitle="Across all tiers"
            color="teal"
          />
          <MetricCard
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            label="Placement Rate"
            value={`${stats.placementRate}%`}
            subtitle="Of invited submissions"
            color="green"
          />
          <MetricCard
            icon={<Clock className="w-6 h-6 text-blue-600" />}
            label="Avg Review Time"
            value={`${stats.avgReviewTime} days`}
            subtitle="Submission to decision"
            color="blue"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            label="80/20 Progress"
            value={`${stats.rotationTransformation.indie}%`}
            subtitle={`Target: ${stats.rotationTransformation.target}% indie`}
            color="purple"
          />
        </section>

        {/* Panel Members */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Users className="w-6 h-6 text-teal-600" />
            <span>Expert Panel Members</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { name: "Cassidy Monroe", role: "Music Director", avatar: "CM", color: "bg-teal-100 text-teal-600", status: "Final tier decisions", kpi: `${stats.submissionsThisMonth} reviewed` },
              { name: "Dakota Wells", role: "Production Engineer", avatar: "DW", color: "bg-cyan-100 text-cyan-600", status: "Technical assessment", kpi: "Audio quality" },
              { name: "Maya Reeves", role: "Program Director", avatar: "MR", color: "bg-blue-100 text-blue-600", status: "Rotation planning", kpi: "Playlist strategy" },
              { name: "Jesse Coleman", role: "Artist Relations", avatar: "JC", color: "bg-indigo-100 text-indigo-600", status: "Performance evaluation", kpi: "Artist development" },
              { name: "Dr. Sam Chen", role: "Musicologist", avatar: "SC", color: "bg-purple-100 text-purple-600", status: "Cultural analysis", kpi: "Genre context" },
              { name: "Whitley Cross", role: "Audience Development", avatar: "WC", color: "bg-emerald-100 text-emerald-600", status: "Growth analysis", kpi: "Market positioning" },
            ].map((member, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border-2 border-gray-200 hover:border-teal-300 transition-colors">
                <div className={`w-10 h-10 ${member.color} rounded-lg flex items-center justify-center text-sm font-bold mb-2`}>{member.avatar}</div>
                <div className="font-semibold text-gray-900 text-sm">{member.name}</div>
                <div className="text-xs text-gray-600 mb-2">{member.role}</div>
                <div className="text-xs text-teal-600 mb-2 truncate">{member.status}</div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700">{member.kpi}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tier Distribution */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Artist Distribution by Tier</h2>
          <p className="text-gray-600 text-sm mb-6">
            Total in rotation: {stats.totalArtistsInRotation} artists (Target: 60/25/12/3 distribution)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TierCard
              tier="BRONZE"
              emoji="🥉"
              count={stats.byTier.BRONZE}
              percentage={60}
              spinsPerWeek="4-6"
              color="amber"
            />
            <TierCard
              tier="SILVER"
              emoji="🥈"
              count={stats.byTier.SILVER}
              percentage={25}
              spinsPerWeek="10-14"
              color="gray"
            />
            <TierCard
              tier="GOLD"
              emoji="🥇"
              count={stats.byTier.GOLD}
              percentage={12}
              spinsPerWeek="20-25"
              color="yellow"
            />
            <TierCard
              tier="PLATINUM"
              emoji="💎"
              count={stats.byTier.PLATINUM}
              percentage={3}
              spinsPerWeek="30+"
              color="purple"
            />
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Submissions This Month</div>
                <div className="text-2xl font-bold text-teal-600">{stats.submissionsThisMonth}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Placement Success</div>
                <div className="text-2xl font-bold text-green-600">{stats.placementRate}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Avg Review Cycle</div>
                <div className="text-2xl font-bold text-blue-600">{stats.avgReviewTime} days</div>
              </div>
            </div>
          </div>
        </section>

        {/* 80/20 Transformation Progress */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">80/20 Rotation Transformation</h2>
              <p className="text-gray-600 text-sm mt-1">
                Replacing mainstream tracks with curated indie artists
              </p>
            </div>
            <Radio className="w-8 h-8 text-teal-600" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Indie Artists</span>
                <span className="font-semibold text-teal-600">{stats.rotationTransformation.indie}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  style={{ width: `${stats.rotationTransformation.indie}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Mainstream</span>
                <span className="font-semibold text-gray-500">{stats.rotationTransformation.mainstream}%</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400"
                  style={{ width: `${stats.rotationTransformation.mainstream}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Progress toward goal</div>
                  <div className="text-xl font-bold text-teal-600">
                    {Math.round(
                      ((stats.rotationTransformation.indie - 20) / (stats.rotationTransformation.target - 20)) * 100
                    )}
                    % complete
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Slots remaining</div>
                  <div className="text-xl font-bold text-gray-900">280</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Submissions */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Recent Submissions</h2>
              <p className="text-gray-600 text-sm mt-1">
                {stats.pendingSubmissions} pending, {stats.inReview} in review, {stats.judgedThisWeek} judged this week
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href="/cassidy/submissions"
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center space-x-2"
              >
                <Music className="w-4 h-4" />
                <span>View All</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <SubmissionRow key={submission.id} {...submission} />
            ))}
          </div>
        </section>

        {/* Progression Requests */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Progression Requests</h2>
              <p className="text-gray-600 text-sm mt-1">
                Artists requesting tier upgrades
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>

          <div className="space-y-3">
            {progressionRequests.map((request) => (
              <ProgressionRequestRow key={request.id} {...request} />
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickLink
            href="/cassidy/submissions"
            title="Review Queue"
            description="Pending submissions"
            icon={<Music className="w-6 h-6" />}
            color="teal"
            badge={stats.pendingSubmissions.toString()}
            managedBy="Cassidy Monroe"
          />
          <QuickLink
            href="/cassidy/tier-management"
            title="Tier Management"
            description="Artist distribution"
            icon={<BarChart3 className="w-6 h-6" />}
            color="blue"
            managedBy="Maya Reeves"
          />
          <QuickLink
            href="/cassidy/rotation"
            title="Rotation Planner"
            description="80/20 progress"
            icon={<Radio className="w-6 h-6" />}
            color="purple"
            managedBy="Whitley Cross"
          />
          <QuickLink
            href="/cassidy/team"
            title="Panel Members"
            description="6-person expert panel"
            icon={<Users className="w-6 h-6" />}
            color="cyan"
          />
        </div>
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
  const colorClasses: Record<string, string> = {
    teal: "bg-teal-50",
    green: "bg-green-50",
    blue: "bg-blue-50",
    purple: "bg-purple-50",
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-6 border border-${color}-200`}>
      <div className="flex items-center justify-between mb-4">
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-semibold text-gray-700 mb-1">{label}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function TierCard({
  tier,
  emoji,
  count,
  percentage,
  spinsPerWeek,
  color,
}: {
  tier: string;
  emoji: string;
  count: number;
  percentage: number;
  spinsPerWeek: string;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900" },
    gray: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-900" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-900" },
    purple: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-900" },
  };

  const classes = colorClasses[color];

  return (
    <div className={`${classes.bg} border ${classes.border} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{emoji}</span>
        <span className={`text-sm font-semibold ${classes.text}`}>{percentage}%</span>
      </div>
      <div className={`text-lg font-bold ${classes.text} mb-1`}>{tier}</div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
      <div className="text-xs text-gray-600">{spinsPerWeek} spins/week</div>
    </div>
  );
}

function SubmissionRow({
  artistName,
  trackTitle,
  status,
  tierAwarded,
  submittedAt,
  judgesCompleted,
  totalJudges,
}: {
  artistName: string;
  trackTitle: string;
  status: string;
  tierAwarded?: string;
  submittedAt: string;
  judgesCompleted: number;
  totalJudges: number;
}) {
  const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    pending: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      icon: <Clock className="w-4 h-4" />,
      label: "Pending",
    },
    in_review: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: <BarChart3 className="w-4 h-4" />,
      label: "In Review",
    },
    judged: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <CheckCircle className="w-4 h-4" />,
      label: "Judged",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-300 transition-colors">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <Music className="w-5 h-5 text-gray-400" />
          <div>
            <div className="font-semibold text-gray-900">{artistName}</div>
            <div className="text-sm text-gray-600">{trackTitle}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-right">
          <div className="text-sm text-gray-600">Judges</div>
          <div className="text-sm font-semibold text-gray-900">
            {judgesCompleted}/{totalJudges}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Submitted</div>
          <div className="text-sm font-semibold text-gray-900">{submittedAt}</div>
        </div>

        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${config.bg} ${config.text}`}>
          {config.icon}
          <span className="text-sm font-medium">{tierAwarded || config.label}</span>
        </div>
      </div>
    </div>
  );
}

function ProgressionRequestRow({
  artistName,
  currentTier,
  requestedTier,
  submittedDaysAgo,
  status,
}: {
  artistName: string;
  currentTier: string;
  requestedTier: string;
  submittedDaysAgo: number;
  status: string;
}) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
    under_review: { bg: "bg-blue-100", text: "text-blue-700", label: "Under Review" },
    approved: { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
      <div className="flex items-center space-x-4">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        <div>
          <div className="font-semibold text-gray-900">{artistName}</div>
          <div className="text-sm text-gray-600">
            {currentTier} → {requestedTier}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-sm text-gray-600">{submittedDaysAgo} days ago</div>
        <div className={`px-3 py-1.5 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
          {config.label}
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
  color,
  badge,
  managedBy,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  managedBy?: string;
}) {
  const colorClasses: Record<string, string> = {
    teal: "bg-teal-100 text-teal-600 hover:bg-teal-200",
    cyan: "bg-cyan-100 text-cyan-600 hover:bg-cyan-200",
    blue: "bg-blue-100 text-blue-600 hover:bg-blue-200",
    purple: "bg-purple-100 text-purple-600 hover:bg-purple-200",
  };

  return (
    <Link href={href} className={`relative block p-6 rounded-lg ${colorClasses[color]} transition-colors`}>
      {badge && (
        <div className="absolute top-3 right-3 bg-white text-gray-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {badge}
        </div>
      )}
      <div className="flex flex-col items-start space-y-3">
        {icon}
        <div>
          <div className="font-bold text-lg mb-1">{title}</div>
          {managedBy && (
            <div className="text-xs font-semibold opacity-90 mb-1">Managed by {managedBy}</div>
          )}
          <div className="text-sm opacity-80">{description}</div>
        </div>
      </div>
    </Link>
  );
}
