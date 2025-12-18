"use client";

import Link from "next/link";
import { ArrowLeft, Video, TrendingUp, Share2, Heart, Eye, MessageCircle } from "lucide-react";

export default function ViralContentPage() {
  const contentPieces = [
    {
      id: 1,
      title: "Hank's Sunrise Philosophy",
      platform: "TikTok",
      creator: "Nova Lane",
      publishedDate: "2 days ago",
      views: 125000,
      likes: 8400,
      shares: 3200,
      comments: 450,
      conversions: 45,
      thumbnail: "🌅",
      status: "viral" as const,
      description: "Hank Westwood shares his morning routine and philosophy of gratitude",
    },
    {
      id: 2,
      title: "Who Is Sarah Blake?",
      platform: "Instagram",
      creator: "Nova Lane",
      publishedDate: "5 days ago",
      views: 98000,
      likes: 6500,
      shares: 2800,
      comments: 320,
      conversions: 32,
      thumbnail: "🎸",
      status: "performing" as const,
      description: "Mysterious singer-songwriter taking Americana by storm",
    },
    {
      id: 3,
      title: "Americana Roadtrip Vibes",
      platform: "YouTube",
      creator: "River Maxwell",
      publishedDate: "1 week ago",
      views: 156000,
      likes: 11200,
      shares: 4100,
      comments: 680,
      conversions: 58,
      thumbnail: "🚗",
      status: "viral" as const,
      description: "Perfect playlist for your next road trip",
    },
    {
      id: 4,
      title: "This Song Stopped Me",
      platform: "TikTok",
      creator: "Nova Lane",
      publishedDate: "3 days ago",
      views: 106000,
      likes: 7800,
      shares: 2300,
      comments: 410,
      conversions: 38,
      thumbnail: "⏸️",
      status: "viral" as const,
      description: "Willow Creek's 'Mountain Rain' moment",
    },
    {
      id: 5,
      title: "Behind the Mic: AJ Rivers",
      platform: "YouTube",
      creator: "Sage Hart",
      publishedDate: "4 days ago",
      views: 45000,
      likes: 3200,
      shares: 890,
      comments: 180,
      conversions: 18,
      thumbnail: "🎙️",
      status: "growing" as const,
      description: "Meet our late-night DJ and his story",
    },
    {
      id: 6,
      title: "Listener Story: Found My Song",
      platform: "Instagram",
      creator: "Sage Hart",
      publishedDate: "1 day ago",
      views: 32000,
      likes: 2400,
      shares: 650,
      comments: 95,
      conversions: 12,
      thumbnail: "💙",
      status: "new" as const,
      description: "Emotional listener testimonial",
    },
  ];

  const stats = {
    totalViews: 562000,
    totalShares: 14040,
    totalConversions: 203,
    avgEngagementRate: 8.2,
    viralThreshold: 100000,
  };

  const upcomingContent = [
    { title: "Artist Interview: The Mountain Brothers", platform: "YouTube", scheduledFor: "Tomorrow", creator: "River" },
    { title: "What Makes Country... Country?", platform: "TikTok", scheduledFor: "Dec 13", creator: "Nova" },
    { title: "Listener Playlist Takeover", platform: "Instagram", scheduledFor: "Dec 14", creator: "Sage" },
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
            <Video className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Viral Content Studio</h1>
              <p className="text-gray-600">
                Create, track, and optimize content across all platforms
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Eye className="w-6 h-6 text-purple-600" />}
            label="Total Views"
            value={stats.totalViews.toLocaleString()}
            subtitle="This month"
          />
          <MetricCard
            icon={<Share2 className="w-6 h-6 text-blue-600" />}
            label="Total Shares"
            value={stats.totalShares.toLocaleString()}
            subtitle="Across all platforms"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="Conversions"
            value={stats.totalConversions}
            subtitle="New listeners"
          />
          <MetricCard
            icon={<Heart className="w-6 h-6 text-pink-600" />}
            label="Engagement Rate"
            value={`${stats.avgEngagementRate}%`}
            subtitle="Average across content"
          />
        </section>

        {/* Content Library */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Content Library</h2>
              <p className="text-gray-600 text-sm mt-1">
                Published content and performance metrics
              </p>
            </div>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Create New Content
            </button>
          </div>

          <div className="space-y-4">
            {contentPieces.map((content) => (
              <ContentCard key={content.id} {...content} viralThreshold={stats.viralThreshold} />
            ))}
          </div>
        </section>

        {/* Upcoming Content */}
        <section className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Upcoming Content</h2>
          <p className="text-gray-600 text-sm mb-6">
            Scheduled posts and content in production
          </p>

          <div className="space-y-3">
            {upcomingContent.map((content, idx) => (
              <UpcomingContentRow key={idx} {...content} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <button className="text-purple-600 hover:text-purple-700 font-semibold">
              View Content Calendar →
            </button>
          </div>
        </section>

        {/* Platform Breakdown */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Performance by Platform</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PlatformCard
              platform="TikTok"
              posts={3}
              avgViews="110k"
              avgEngagement="8.4%"
              color="bg-gradient-to-br from-pink-500 to-purple-600"
            />
            <PlatformCard
              platform="Instagram"
              posts={2}
              avgViews="65k"
              avgEngagement="7.8%"
              color="bg-gradient-to-br from-purple-500 to-pink-600"
            />
            <PlatformCard
              platform="YouTube"
              posts={2}
              avgViews="100k"
              avgEngagement="9.1%"
              color="bg-gradient-to-br from-red-500 to-red-600"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ icon, label, value, subtitle }: any) {
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

function ContentCard({ title, platform, creator, publishedDate, views, likes, shares, comments, conversions, thumbnail, status, description, viralThreshold }: {
  title: string;
  platform: string;
  creator: string;
  publishedDate: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  conversions: number;
  thumbnail: string;
  status: "viral" | "performing" | "growing" | "new";
  description: string;
  viralThreshold: number;
}) {
  const statusConfig: Record<string, { bg: string; text: string; label: string; border: string }> = {
    viral: { bg: "bg-purple-100", text: "text-purple-700", label: "🔥 Viral", border: "border-purple-300" },
    performing: { bg: "bg-green-100", text: "text-green-700", label: "✅ Performing", border: "border-green-300" },
    growing: { bg: "bg-blue-100", text: "text-blue-700", label: "📈 Growing", border: "border-blue-300" },
    new: { bg: "bg-gray-100", text: "text-gray-700", label: "🆕 New", border: "border-gray-300" },
  };
  const config = statusConfig[status];

  const isViral = views >= viralThreshold;

  return (
    <div className={`border-2 ${config.border} rounded-lg p-4 ${isViral ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="text-4xl">{thumbnail}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text} font-medium`}>
                {config.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{platform}</span>
              <span>•</span>
              <span>By {creator}</span>
              <span>•</span>
              <span>{publishedDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 text-center">
        <div>
          <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-gray-900">{(views / 1000).toFixed(0)}k</div>
          <div className="text-xs text-gray-500">Views</div>
        </div>
        <div>
          <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
            <Heart className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-gray-900">{(likes / 1000).toFixed(1)}k</div>
          <div className="text-xs text-gray-500">Likes</div>
        </div>
        <div>
          <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
            <Share2 className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-gray-900">{(shares / 1000).toFixed(1)}k</div>
          <div className="text-xs text-gray-500">Shares</div>
        </div>
        <div>
          <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-gray-900">{comments}</div>
          <div className="text-xs text-gray-500">Comments</div>
        </div>
        <div>
          <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-green-600">+{conversions}</div>
          <div className="text-xs text-gray-500">Listeners</div>
        </div>
      </div>
    </div>
  );
}

function UpcomingContentRow({ title, platform, scheduledFor, creator }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-purple-200">
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{platform} • by {creator}</div>
      </div>
      <div className="text-sm text-purple-600 font-medium">
        {scheduledFor}
      </div>
    </div>
  );
}

function PlatformCard({ platform, posts, avgViews, avgEngagement, color }: any) {
  return (
    <div className={`${color} text-white rounded-lg p-6 text-center`}>
      <div className="text-xl font-bold mb-2">{platform}</div>
      <div className="text-3xl font-bold mb-1">{posts}</div>
      <div className="text-sm opacity-90 mb-4">posts this month</div>
      <div className="border-t border-white/30 pt-4 space-y-1">
        <div className="text-sm">Avg Views: {avgViews}</div>
        <div className="text-sm">Engagement: {avgEngagement}</div>
      </div>
    </div>
  );
}
