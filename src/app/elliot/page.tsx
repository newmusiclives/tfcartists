"use client";

import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, Heart, BarChart3, Video, Share2, Clock, Target, UserCircle } from "lucide-react";

export default function ElliotDashboardPage() {
  // Mock data - in production this would come from the database
  const stats = {
    // Core Metrics
    dailyActiveUsers: 1250,
    weeklyActiveUsers: 3400,
    monthlyActiveUsers: 5600,
    avgSessionLength: 28, // minutes
    returningListenerPercent: 52,

    // Growth
    newListenersThisWeek: 180,
    newListenersLastWeek: 145,
    growthRate: 24, // percent

    // Engagement
    totalSessions: 8500,
    totalListeningHours: 3967,
    listeningStreakAvg: 8, // days

    // Team Performance
    viralViews: 485000,
    viralShares: 12400,
    artistReferrals: 340,
    communityMembers: 680,
    activeCampaigns: 4,
  };

  const teamMembers = [
    {
      name: "Elliot Brooks",
      role: "AI Director",
      avatar: "🟦",
      status: "Designing retention campaign",
      lastActivity: "2 min ago",
      kpi: "DAU: 1,250",
    },
    {
      name: "Nova Lane",
      role: "Social Amplification",
      avatar: "🟪",
      status: "Posted viral TikTok",
      lastActivity: "15 min ago",
      kpi: "485k views",
    },
    {
      name: "River Maxwell",
      role: "Artist Activation",
      avatar: "🟩",
      status: "Sent 28 share packs",
      lastActivity: "1 hour ago",
      kpi: "340 referrals",
    },
    {
      name: "Sage Hart",
      role: "Community & Loyalty",
      avatar: "🟧",
      status: "Running listening party",
      lastActivity: "30 min ago",
      kpi: "680 members",
    },
    {
      name: "Orion Pike",
      role: "Data & Habits",
      avatar: "🟥",
      status: "Analyzing peak times",
      lastActivity: "5 min ago",
      kpi: "52% retention",
    },
  ];

  const viralContent = [
    { title: "Hank's Sunrise Philosophy", platform: "TikTok", views: 125000, shares: 3200, conversions: 45 },
    { title: "Who Is Sarah Blake?", platform: "Instagram", views: 98000, shares: 2800, conversions: 32 },
    { title: "Americana Roadtrip Vibes", platform: "YouTube", views: 156000, shares: 4100, conversions: 58 },
    { title: "This Song Stopped Me", platform: "TikTok", views: 106000, shares: 2300, conversions: 38 },
  ];

  const activeCampaigns = [
    { name: "Artist Referral Blast", owner: "River", progress: 68, target: "500 shares", reached: 340 },
    { name: "Viral Moment Push", owner: "Nova", progress: 85, target: "1M views", reached: 850000 },
    { name: "Habit Builder Sprint", owner: "Orion", progress: 42, target: "100 regulars", reached: 42 },
    { name: "Community Event", owner: "Sage", progress: 90, target: "200 members", reached: 180 },
  ];

  const listenerTiers = {
    casual: 680,      // 1-2 sessions/week
    regular: 420,     // 3-4 sessions/week
    superFan: 125,    // 5+ sessions/week
    evangelist: 25,   // Shares content, refers others
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
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
              href="/elliot/team"
              className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span>View Team</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Elliot Dashboard</h1>
              <p className="text-gray-600">
                Listener Growth Engine - Acquisition, Retention & Activation
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Core Metrics - The Big Four */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Users className="w-6 h-6 text-indigo-600" />}
            label="Daily Active Users"
            value={stats.dailyActiveUsers.toLocaleString()}
            subtitle={`+${stats.newListenersThisWeek} this week`}
            change={"+24%"}
            color="indigo"
          />
          <MetricCard
            icon={<Clock className="w-6 h-6 text-purple-600" />}
            label="Avg Session Length"
            value={`${stats.avgSessionLength} min`}
            subtitle="Target: 25-40 min"
            color="purple"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="Returning Listeners"
            value={`${stats.returningListenerPercent}%`}
            subtitle="Target: 50-60%"
            change="+8%"
            color="green"
          />
          <MetricCard
            icon={<Share2 className="w-6 h-6 text-pink-600" />}
            label="Artist Referrals"
            value={stats.artistReferrals.toString()}
            subtitle="From 340 artists"
            color="pink"
          />
        </section>

        {/* Team Status */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Team Status - Live Activity</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {teamMembers.map((member, idx) => (
              <TeamMemberCard key={idx} {...member} />
            ))}
          </div>
        </section>

        {/* Listener Distribution by Tier */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Listener Distribution by Tier</h2>
          <p className="text-gray-600 text-sm mb-6">
            Total: {Object.values(listenerTiers).reduce((a, b) => a + b, 0).toLocaleString()} listeners across 4 engagement tiers
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ListenerTierCard
              tier="Casual"
              count={listenerTiers.casual}
              description="1-2 sessions/week"
              color="blue"
              percentage={54}
            />
            <ListenerTierCard
              tier="Regular"
              count={listenerTiers.regular}
              description="3-4 sessions/week"
              color="green"
              percentage={34}
            />
            <ListenerTierCard
              tier="Super Fan"
              count={listenerTiers.superFan}
              description="5+ sessions/week"
              color="purple"
              percentage={10}
            />
            <ListenerTierCard
              tier="Evangelist"
              count={listenerTiers.evangelist}
              description="Shares & refers"
              color="pink"
              percentage={2}
            />
          </div>
        </section>

        {/* Viral Content Performance */}
        <section className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <Video className="w-6 h-6 text-purple-600" />
                <span>Viral Content Performance</span>
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {stats.viralViews.toLocaleString()} total views, {stats.viralShares.toLocaleString()} shares this month
              </p>
            </div>
            <Link
              href="/elliot/content"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View All Content
            </Link>
          </div>
          <div className="space-y-3">
            {viralContent.map((content, idx) => (
              <ViralContentRow key={idx} {...content} />
            ))}
          </div>
        </section>

        {/* Active Growth Campaigns */}
        <section className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <Target className="w-6 h-6 text-green-600" />
                <span>Active Growth Campaigns</span>
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {stats.activeCampaigns} campaigns in progress
              </p>
            </div>
            <Link
              href="/elliot/campaigns"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Manage Campaigns
            </Link>
          </div>
          <div className="space-y-4">
            {activeCampaigns.map((campaign, idx) => (
              <CampaignCard key={idx} {...campaign} />
            ))}
          </div>
        </section>

        {/* Listening Behavior */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Listening Behavior</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BehaviorStat
              label="Total Sessions"
              value={stats.totalSessions.toLocaleString()}
              subtitle="This month"
              icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
            />
            <BehaviorStat
              label="Total Listening Hours"
              value={stats.totalListeningHours.toLocaleString()}
              subtitle="This month"
              icon={<Clock className="w-5 h-5 text-purple-600" />}
            />
            <BehaviorStat
              label="Avg Listening Streak"
              value={`${stats.listeningStreakAvg} days`}
              subtitle="Consecutive days"
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            title="Listener Analytics"
            description="Deep dive into listener behavior and trends"
            href="/elliot/analytics"
            icon={<BarChart3 className="w-8 h-8 text-indigo-600" />}
          />
          <QuickActionCard
            title="Viral Content"
            description="Create and track social content performance"
            href="/elliot/content"
            icon={<Video className="w-8 h-8 text-purple-600" />}
          />
          <QuickActionCard
            title="Growth Campaigns"
            description="Launch and manage acquisition campaigns"
            href="/elliot/campaigns"
            icon={<Target className="w-8 h-8 text-green-600" />}
          />
          <QuickActionCard
            title="Community"
            description="Manage Discord/Facebook communities"
            href="/elliot/community"
            icon={<Heart className="w-8 h-8 text-pink-600" />}
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
  change,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  change?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">{subtitle}</div>
        {change && (
          <div className="text-xs font-semibold text-green-600">{change}</div>
        )}
      </div>
    </div>
  );
}

function TeamMemberCard({
  name,
  role,
  avatar,
  status,
  lastActivity,
  kpi,
}: {
  name: string;
  role: string;
  avatar: string;
  status: string;
  lastActivity: string;
  kpi: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border-2 border-gray-200 hover:border-indigo-300 transition-colors">
      <div className="text-4xl mb-2">{avatar}</div>
      <div className="font-semibold text-gray-900 mb-1">{name}</div>
      <div className="text-xs text-gray-600 mb-2">{role}</div>
      <div className="text-xs text-indigo-600 mb-2 truncate">{status}</div>
      <div className="text-xs text-gray-400">{lastActivity}</div>
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-700">{kpi}</div>
      </div>
    </div>
  );
}

function ListenerTierCard({
  tier,
  count,
  description,
  color,
  percentage,
}: {
  tier: string;
  count: number;
  description: string;
  color: string;
  percentage: number;
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    purple: "text-purple-600 bg-purple-100",
    pink: "text-pink-600 bg-pink-100",
  }[color];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border-2 border-gray-200">
      <div className={`text-xs font-bold px-2 py-1 rounded inline-block mb-2 ${colorClasses}`}>
        {tier}
      </div>
      <div className="text-3xl font-bold mb-1">{count}</div>
      <div className="text-xs text-gray-500 mb-3">{description}</div>
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : color === 'purple' ? 'bg-purple-600' : 'bg-pink-600'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">{percentage}% of total</div>
    </div>
  );
}

function ViralContentRow({
  title,
  platform,
  views,
  shares,
  conversions,
}: {
  title: string;
  platform: string;
  views: number;
  shares: number;
  conversions: number;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
      <div className="flex items-center space-x-4 flex-1">
        <Video className="w-10 h-10 text-purple-400" />
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">{platform}</div>
        </div>
      </div>
      <div className="flex items-center space-x-6 text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900">{(views / 1000).toFixed(0)}k</div>
          <div className="text-xs text-gray-500">views</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-purple-600">{(shares / 1000).toFixed(1)}k</div>
          <div className="text-xs text-gray-500">shares</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-green-600">{conversions}</div>
          <div className="text-xs text-gray-500">listeners</div>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({
  name,
  owner,
  progress,
  target,
  reached,
}: {
  name: string;
  owner: string;
  progress: number;
  target: string;
  reached: number | string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-gray-900">{name}</div>
          <div className="text-sm text-gray-600">Managed by {owner}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">{progress}%</div>
          <div className="text-xs text-gray-500">complete</div>
        </div>
      </div>
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
        <div
          className="bg-green-600 h-full rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{typeof reached === 'number' ? reached.toLocaleString() : reached} / {target}</span>
        <span className="text-green-600 font-semibold">{progress >= 80 ? "Almost there!" : "In progress"}</span>
      </div>
    </div>
  );
}

function BehaviorStat({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-300">
        <div className="mb-3">{icon}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
