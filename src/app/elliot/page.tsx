"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, Heart, BarChart3, Video, Share2, Clock, Target, UserCircle } from "lucide-react";

interface ElliotStats {
  totalListeners: number;
  byStatus: Record<string, number>;
  byTier: { CASUAL: number; REGULAR: number; SUPER_FAN: number; EVANGELIST: number };
  behavior: { totalSessions: number; totalListeningHours: number; avgSessionLength: number; avgStreak: number };
  growth: { newThisWeek: number; newThisMonth: number; churnedThisWeek: number; returningListenerPercent: number };
  content: { totalContent: number; totalViews: number; totalShares: number; totalConversions: number };
  campaigns: { activeCampaigns: number; totalGoalReached: number; totalGoalTarget: number };
  community: { communityMembers: number; scoutCount: number };
}

interface ContentItem {
  id: string;
  title: string;
  platform: string;
  views: number;
  shares: number;
  newListeners: number;
}

interface CampaignItem {
  id: string;
  name: string;
  managedBy: string;
  goalTarget: number;
  goalReached: number;
  metrics: { progress: number };
}

export default function ElliotDashboardPage() {
  const [stats, setStats] = useState<ElliotStats | null>(null);
  const [viralContent, setViralContent] = useState<ContentItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, contentRes, campaignsRes] = await Promise.all([
          fetch("/api/elliot/stats"),
          fetch("/api/elliot/content?status=all&limit=4"),
          fetch("/api/elliot/campaigns?status=active"),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (contentRes.ok) {
          const data = await contentRes.json();
          setViralContent(data.content || []);
        }
        if (campaignsRes.ok) {
          const data = await campaignsRes.json();
          setCampaigns((data.campaigns || []).slice(0, 4));
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
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-red-600">Error loading dashboard data</div>
      </main>
    );
  }

  const totalByTier = stats.byTier.CASUAL + stats.byTier.REGULAR + stats.byTier.SUPER_FAN + stats.byTier.EVANGELIST;
  const tierPercent = (count: number) => totalByTier > 0 ? Math.round((count / totalByTier) * 100) : 0;

  const teamMembers = [
    {
      name: "Elliot Brooks",
      role: "AI Director",
      avatar: "🟦",
      status: "Managing growth engine",
      lastActivity: "Active",
      kpi: `${stats.totalListeners} listeners`,
    },
    {
      name: "Nova Lane",
      role: "Social Amplification",
      avatar: "🟪",
      status: "Creating viral content",
      lastActivity: "Active",
      kpi: `${stats.content.totalViews.toLocaleString()} views`,
    },
    {
      name: "River Maxwell",
      role: "Artist Activation",
      avatar: "🟩",
      status: "Activating artist referrals",
      lastActivity: "Active",
      kpi: `${stats.content.totalConversions} conversions`,
    },
    {
      name: "Sage Hart",
      role: "Community & Loyalty",
      avatar: "🟧",
      status: "Building community",
      lastActivity: "Active",
      kpi: `${stats.community.communityMembers} members`,
    },
    {
      name: "Orion Pike",
      role: "Data & Habits",
      avatar: "🟥",
      status: "Analyzing retention",
      lastActivity: "Active",
      kpi: `${stats.growth.returningListenerPercent}% retention`,
    },
  ];

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
            label="Total Listeners"
            value={stats.totalListeners.toLocaleString()}
            subtitle={`+${stats.growth.newThisWeek} this week`}
            color="indigo"
          />
          <MetricCard
            icon={<Clock className="w-6 h-6 text-purple-600" />}
            label="Avg Session Length"
            value={`${stats.behavior.avgSessionLength} min`}
            subtitle="Target: 25-40 min"
            color="purple"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="Returning Listeners"
            value={`${stats.growth.returningListenerPercent}%`}
            subtitle="Target: 50-60%"
            color="green"
          />
          <MetricCard
            icon={<Share2 className="w-6 h-6 text-pink-600" />}
            label="Content Conversions"
            value={stats.content.totalConversions.toString()}
            subtitle={`From ${stats.content.totalContent} pieces`}
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
            Total: {totalByTier.toLocaleString()} listeners across 4 engagement tiers
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ListenerTierCard
              tier="Casual"
              count={stats.byTier.CASUAL}
              description="1-2 sessions/week"
              color="blue"
              percentage={tierPercent(stats.byTier.CASUAL)}
            />
            <ListenerTierCard
              tier="Regular"
              count={stats.byTier.REGULAR}
              description="3-4 sessions/week"
              color="green"
              percentage={tierPercent(stats.byTier.REGULAR)}
            />
            <ListenerTierCard
              tier="Super Fan"
              count={stats.byTier.SUPER_FAN}
              description="5+ sessions/week"
              color="purple"
              percentage={tierPercent(stats.byTier.SUPER_FAN)}
            />
            <ListenerTierCard
              tier="Evangelist"
              count={stats.byTier.EVANGELIST}
              description="Shares & refers"
              color="pink"
              percentage={tierPercent(stats.byTier.EVANGELIST)}
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
                {stats.content.totalViews.toLocaleString()} total views, {stats.content.totalShares.toLocaleString()} shares
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
            {viralContent.length > 0 ? (
              viralContent.map((content) => (
                <ViralContentRow
                  key={content.id}
                  title={content.title}
                  platform={content.platform}
                  views={content.views}
                  shares={content.shares}
                  conversions={content.newListeners}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No content yet. Create your first viral content piece.
              </div>
            )}
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
                {stats.campaigns.activeCampaigns} campaigns in progress
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
            {campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  name={campaign.name}
                  owner={campaign.managedBy}
                  progress={campaign.metrics?.progress || 0}
                  target={`${campaign.goalTarget}`}
                  reached={campaign.goalReached}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No active campaigns. Launch your first growth campaign.
              </div>
            )}
          </div>
        </section>

        {/* Listening Behavior */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Listening Behavior</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BehaviorStat
              label="Total Sessions"
              value={stats.behavior.totalSessions.toLocaleString()}
              subtitle="All time"
              icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
            />
            <BehaviorStat
              label="Total Listening Hours"
              value={Math.round(stats.behavior.totalListeningHours).toLocaleString()}
              subtitle="All time"
              icon={<Clock className="w-5 h-5 text-purple-600" />}
            />
            <BehaviorStat
              label="Avg Listening Streak"
              value={`${stats.behavior.avgStreak} days`}
              subtitle="Consecutive days"
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <QuickActionCard
            title="Growth Strategy"
            description="Overall listener growth engine coordination"
            href="/elliot"
            icon={<Users className="w-8 h-8 text-blue-600" />}
            managedBy="Elliot Brooks"
          />
          <QuickActionCard
            title="Viral Content"
            description="Create and track social content performance"
            href="/elliot/content"
            icon={<Video className="w-8 h-8 text-purple-600" />}
            managedBy="Nova Lane"
          />
          <QuickActionCard
            title="Artist Activation"
            description="Convert artist fans into station listeners"
            href="/elliot/campaigns"
            icon={<Target className="w-8 h-8 text-green-600" />}
            managedBy="River Maxwell"
          />
          <QuickActionCard
            title="Community"
            description="Manage Discord/Facebook communities"
            href="/elliot/community"
            icon={<Heart className="w-8 h-8 text-pink-600" />}
            managedBy="Sage Hart"
          />
          <QuickActionCard
            title="Listener Analytics"
            description="Behavior patterns and habit formation"
            href="/elliot/analytics"
            icon={<BarChart3 className="w-8 h-8 text-indigo-600" />}
            managedBy="Orion Pike"
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
          <div className="font-semibold text-gray-900">{views >= 1000 ? `${(views / 1000).toFixed(0)}k` : views}</div>
          <div className="text-xs text-gray-500">views</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-purple-600">{shares >= 1000 ? `${(shares / 1000).toFixed(1)}k` : shares}</div>
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
          <div className="text-sm font-semibold text-gray-900">{Math.round(progress)}%</div>
          <div className="text-xs text-gray-500">complete</div>
        </div>
      </div>
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
        <div
          className="bg-green-600 h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, progress)}%` }}
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
  managedBy,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  managedBy?: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-300">
        <div className="mb-3">{icon}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        {managedBy && (
          <p className="text-xs text-indigo-600 font-medium mb-1">Managed by {managedBy}</p>
        )}
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
