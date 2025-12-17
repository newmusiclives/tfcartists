"use client";

import Link from "next/link";
import { ArrowLeft, Megaphone, TrendingUp, Users, DollarSign, Calendar, Target, Zap } from "lucide-react";

export default function GrowthCampaignsPage() {
  const activeCampaigns = [
    {
      id: 1,
      name: "Americana Playlist Challenge",
      type: "Social Media",
      platform: "TikTok + Instagram",
      startDate: "Dec 1, 2024",
      endDate: "Dec 31, 2024",
      status: "active" as const,
      budget: 2500,
      spent: 1840,
      impressions: 125000,
      engagement: 8400,
      conversions: 245,
      goal: "500 new listeners",
      progress: 49,
      description: "Users share their favorite Americana tracks for a chance to be featured on-air",
    },
    {
      id: 2,
      name: "Winter Concert Series Promo",
      type: "Cross-Promotion",
      platform: "All Channels",
      startDate: "Dec 5, 2024",
      endDate: "Dec 20, 2024",
      status: "active" as const,
      budget: 3000,
      spent: 890,
      impressions: 45000,
      engagement: 3200,
      conversions: 78,
      goal: "200 event signups",
      progress: 39,
      description: "Promote upcoming live concerts featuring our artists",
    },
    {
      id: 3,
      name: "Free Trial Extension",
      type: "Email Campaign",
      platform: "Email + Web",
      startDate: "Dec 8, 2024",
      endDate: "Dec 15, 2024",
      status: "active" as const,
      budget: 500,
      spent: 125,
      impressions: 8500,
      engagement: 1200,
      conversions: 156,
      goal: "300 trial extensions",
      progress: 52,
      description: "Offer 30-day premium trial to inactive users",
    },
  ];

  const upcomingCampaigns = [
    {
      name: "New Year New Music",
      launchDate: "Jan 1, 2025",
      type: "Content Series",
      estimatedBudget: 4000,
    },
    {
      name: "Valentines Duets",
      launchDate: "Feb 1, 2025",
      type: "Artist Collaboration",
      estimatedBudget: 2000,
    },
  ];

  const stats = {
    totalActive: 3,
    totalBudget: 6000,
    totalSpent: 2855,
    totalConversions: 479,
    avgConversionRate: 4.2,
    roi: 285,
  };

  const channelPerformance = [
    { channel: "TikTok", campaigns: 5, conversions: 342, cpa: "$7.30", roi: "320%" },
    { channel: "Instagram", campaigns: 4, conversions: 198, cpa: "$12.60", roi: "240%" },
    { channel: "Email", campaigns: 3, conversions: 287, cpa: "$4.20", roi: "410%" },
    { channel: "YouTube", campaigns: 2, conversions: 123, cpa: "$18.90", roi: "180%" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/elliot"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Elliot Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Megaphone className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Growth Campaigns</h1>
              <p className="text-gray-600">
                Plan, launch, and optimize listener acquisition campaigns
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Zap className="w-6 h-6 text-purple-600" />}
            label="Active Campaigns"
            value={stats.totalActive}
            subtitle="running now"
          />
          <MetricCard
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            label="Budget Utilization"
            value={`$${stats.totalSpent.toLocaleString()}`}
            subtitle={`of $${stats.totalBudget.toLocaleString()} (${((stats.totalSpent / stats.totalBudget) * 100).toFixed(0)}%)`}
          />
          <MetricCard
            icon={<Users className="w-6 h-6 text-blue-600" />}
            label="Total Conversions"
            value={stats.totalConversions}
            subtitle="new listeners this month"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            label="Average ROI"
            value={`${stats.roi}%`}
            subtitle={`${stats.avgConversionRate}% conversion rate`}
          />
        </section>

        {/* Active Campaigns */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Active Campaigns</h2>
              <p className="text-gray-600 text-sm mt-1">
                Currently running growth initiatives
              </p>
            </div>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Create New Campaign
            </button>
          </div>

          <div className="space-y-4">
            {activeCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} {...campaign} />
            ))}
          </div>
        </section>

        {/* Channel Performance */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Channel Performance</h2>
          <p className="text-gray-600 text-sm mb-6">
            Compare effectiveness across marketing channels
          </p>

          <div className="space-y-3">
            {channelPerformance.map((channel) => (
              <ChannelRow key={channel.channel} {...channel} />
            ))}
          </div>
        </section>

        {/* Upcoming Campaigns */}
        <section className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Upcoming Campaigns</h2>
          <p className="text-gray-600 text-sm mb-6">
            Campaigns in planning or scheduled to launch
          </p>

          <div className="space-y-3">
            {upcomingCampaigns.map((campaign, idx) => (
              <UpcomingCampaignRow key={idx} {...campaign} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <button className="text-purple-600 hover:text-purple-700 font-semibold">
              View Campaign Calendar →
            </button>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            icon={<Target className="w-8 h-8 text-purple-600" />}
            title="A/B Test Creator"
            description="Test different campaign variants"
            buttonText="Create Test"
          />
          <ActionCard
            icon={<TrendingUp className="w-8 h-8 text-green-600" />}
            title="Campaign Analytics"
            description="Deep dive into performance data"
            buttonText="View Analytics"
          />
          <ActionCard
            icon={<Calendar className="w-8 h-8 text-blue-600" />}
            title="Budget Planner"
            description="Plan quarterly marketing budget"
            buttonText="Plan Budget"
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
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

function CampaignCard({
  name,
  type,
  platform,
  startDate,
  endDate,
  budget,
  spent,
  impressions,
  engagement,
  conversions,
  goal,
  progress,
  description,
  status,
}: {
  name: string;
  type: string;
  platform: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  engagement: number;
  conversions: number;
  goal: string;
  progress: number;
  description: string;
  status: "active" | "paused" | "completed";
}) {
  const statusConfig: Record<string, { bg: string; text: string; label: string; border: string }> = {
    active: { bg: "bg-green-100", text: "text-green-700", label: "🟢 Active", border: "border-green-300" },
    paused: { bg: "bg-yellow-100", text: "text-yellow-700", label: "⏸️ Paused", border: "border-yellow-300" },
    completed: { bg: "bg-gray-100", text: "text-gray-700", label: "✅ Completed", border: "border-gray-300" },
  };
  const config = statusConfig[status];

  return (
    <div className={`border-2 ${config.border} rounded-lg p-5 bg-white`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text} font-medium`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{type}</span>
            <span>•</span>
            <span>{platform}</span>
            <span>•</span>
            <span>{startDate} - {endDate}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Impressions</div>
          <div className="text-lg font-bold text-gray-900">{(impressions / 1000).toFixed(0)}k</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Engagement</div>
          <div className="text-lg font-bold text-gray-900">{(engagement / 1000).toFixed(1)}k</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Conversions</div>
          <div className="text-lg font-bold text-green-600">{conversions}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Budget</div>
          <div className="text-lg font-bold text-gray-900">${spent}/{budget}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">CPA</div>
          <div className="text-lg font-bold text-purple-600">${(spent / conversions).toFixed(2)}</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Goal Progress: {goal}</span>
          <span className="font-semibold text-gray-900">{progress}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-600 h-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ChannelRow({ channel, campaigns, conversions, cpa, roi }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{channel}</div>
        <div className="text-sm text-gray-600">{campaigns} active campaigns</div>
      </div>
      <div className="flex items-center space-x-8 text-sm">
        <div className="text-center">
          <div className="text-green-600 font-bold">{conversions}</div>
          <div className="text-xs text-gray-500">conversions</div>
        </div>
        <div className="text-center">
          <div className="text-purple-600 font-bold">{cpa}</div>
          <div className="text-xs text-gray-500">CPA</div>
        </div>
        <div className="text-center">
          <div className="text-blue-600 font-bold">{roi}</div>
          <div className="text-xs text-gray-500">ROI</div>
        </div>
      </div>
    </div>
  );
}

function UpcomingCampaignRow({ name, launchDate, type, estimatedBudget }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-purple-200">
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{name}</div>
        <div className="text-sm text-gray-600">{type} • Budget: ${estimatedBudget.toLocaleString()}</div>
      </div>
      <div className="text-sm text-purple-600 font-medium">
        Launches {launchDate}
      </div>
    </div>
  );
}

function ActionCard({ icon, title, description, buttonText }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full font-medium">
        {buttonText}
      </button>
    </div>
  );
}
