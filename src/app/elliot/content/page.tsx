"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Video, TrendingUp, Share2, Heart, Eye, MessageCircle } from "lucide-react";

interface ContentData {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  type: string;
  createdBy: string;
  category: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  newListeners: number;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

export default function ViralContentPage() {
  const [content, setContent] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "tiktok",
    category: "artist_spotlight",
    artistName: "",
    theme: "",
  });

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    try {
      const res = await fetch("/api/elliot/content?status=all&limit=50");
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || []);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateContent(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/elliot/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ type: "tiktok", category: "artist_spotlight", artistName: "", theme: "" });
        await fetchContent();
      }
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading content...</div>
      </main>
    );
  }

  const totalViews = content.reduce((sum, c) => sum + c.views, 0);
  const totalShares = content.reduce((sum, c) => sum + c.shares, 0);
  const totalConversions = content.reduce((sum, c) => sum + c.newListeners, 0);
  const totalLikes = content.reduce((sum, c) => sum + c.likes, 0);
  const avgEngagementRate = totalViews > 0 ? Math.round(((totalLikes + totalShares + content.reduce((sum, c) => sum + c.comments, 0)) / totalViews) * 100 * 10) / 10 : 0;
  const viralThreshold = 100000;

  function getContentStatus(c: ContentData): "viral" | "performing" | "growing" | "new" {
    if (c.views >= viralThreshold) return "viral";
    if (c.views >= 50000) return "performing";
    if (c.views >= 10000) return "growing";
    return "new";
  }

  function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // Group by platform for breakdown
  const platforms = content.reduce((acc, c) => {
    if (!acc[c.platform]) acc[c.platform] = { posts: 0, totalViews: 0, totalEngagement: 0 };
    acc[c.platform].posts++;
    acc[c.platform].totalViews += c.views;
    acc[c.platform].totalEngagement += c.likes + c.shares + c.comments;
    return acc;
  }, {} as Record<string, { posts: number; totalViews: number; totalEngagement: number }>);

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
            value={totalViews.toLocaleString()}
            subtitle="All content"
          />
          <MetricCard
            icon={<Share2 className="w-6 h-6 text-blue-600" />}
            label="Total Shares"
            value={totalShares.toLocaleString()}
            subtitle="Across all platforms"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="Conversions"
            value={totalConversions}
            subtitle="New listeners"
          />
          <MetricCard
            icon={<Heart className="w-6 h-6 text-pink-600" />}
            label="Engagement Rate"
            value={`${avgEngagementRate}%`}
            subtitle="Average across content"
          />
        </section>

        {/* Content Generation Form */}
        {showForm && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Generate New Content</h2>
            <form onSubmit={handleGenerateContent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="reel">Instagram Reel</option>
                    <option value="short">YouTube Short</option>
                    <option value="story">Story</option>
                    <option value="post">Post</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="artist_spotlight">Artist Spotlight</option>
                    <option value="dj_moment">DJ Moment</option>
                    <option value="behind_scenes">Behind the Scenes</option>
                    <option value="listener_story">Listener Story</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Artist Name (optional)</label>
                  <input
                    type="text"
                    value={formData.artistName}
                    onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Sarah Blake"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme (optional)</label>
                  <input
                    type="text"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Road trip vibes"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={generating}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Content"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-600 hover:text-gray-900 px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Content Library */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Content Library</h2>
              <p className="text-gray-600 text-sm mt-1">
                {content.length} pieces of content
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create New Content
              </button>
            )}
          </div>

          <div className="space-y-4">
            {content.length > 0 ? (
              content.map((c) => (
                <ContentCard
                  key={c.id}
                  title={c.title}
                  platform={c.platform}
                  creator={c.createdBy}
                  publishedDate={c.publishedAt ? formatTimeAgo(c.publishedAt) : formatTimeAgo(c.createdAt)}
                  views={c.views}
                  likes={c.likes}
                  shares={c.shares}
                  comments={c.comments}
                  conversions={c.newListeners}
                  status={getContentStatus(c)}
                  description={c.description || c.category}
                  viralThreshold={viralThreshold}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No content yet. Generate your first piece of viral content.
              </div>
            )}
          </div>
        </section>

        {/* Platform Breakdown */}
        {Object.keys(platforms).length > 0 && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Performance by Platform</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(platforms).map(([platform, data]) => {
                const avgViews = data.posts > 0 ? Math.round(data.totalViews / data.posts) : 0;
                const engRate = data.totalViews > 0 ? Math.round((data.totalEngagement / data.totalViews) * 100 * 10) / 10 : 0;
                const colorMap: Record<string, string> = {
                  tiktok: "bg-gradient-to-br from-pink-500 to-purple-600",
                  instagram: "bg-gradient-to-br from-purple-500 to-pink-600",
                  youtube: "bg-gradient-to-br from-red-500 to-red-600",
                  facebook: "bg-gradient-to-br from-blue-500 to-blue-600",
                };
                return (
                  <PlatformCard
                    key={platform}
                    platform={platform}
                    posts={data.posts}
                    avgViews={avgViews >= 1000 ? `${(avgViews / 1000).toFixed(0)}k` : `${avgViews}`}
                    avgEngagement={`${engRate}%`}
                    color={colorMap[platform] || "bg-gradient-to-br from-gray-500 to-gray-600"}
                  />
                );
              })}
            </div>
          </section>
        )}
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

function ContentCard({ title, platform, creator, publishedDate, views, likes, shares, comments, conversions, status, description, viralThreshold }: {
  title: string;
  platform: string;
  creator: string;
  publishedDate: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  conversions: number;
  status: "viral" | "performing" | "growing" | "new";
  description: string;
  viralThreshold: number;
}) {
  const statusConfig: Record<string, { bg: string; text: string; label: string; border: string }> = {
    viral: { bg: "bg-purple-100", text: "text-purple-700", label: "Viral", border: "border-purple-300" },
    performing: { bg: "bg-green-100", text: "text-green-700", label: "Performing", border: "border-green-300" },
    growing: { bg: "bg-blue-100", text: "text-blue-700", label: "Growing", border: "border-blue-300" },
    new: { bg: "bg-gray-100", text: "text-gray-700", label: "New", border: "border-gray-300" },
  };
  const config = statusConfig[status];
  const isViral = views >= viralThreshold;

  return (
    <div className={`border-2 ${config.border} rounded-lg p-4 ${isViral ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <Video className="w-10 h-10 text-purple-400 flex-shrink-0" />
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
          <div className="text-lg font-bold text-gray-900">{views >= 1000 ? `${(views / 1000).toFixed(0)}k` : views}</div>
          <div className="text-xs text-gray-500">Views</div>
        </div>
        <div>
          <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
            <Heart className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-gray-900">{likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}</div>
          <div className="text-xs text-gray-500">Likes</div>
        </div>
        <div>
          <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
            <Share2 className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-gray-900">{shares >= 1000 ? `${(shares / 1000).toFixed(1)}k` : shares}</div>
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

function PlatformCard({ platform, posts, avgViews, avgEngagement, color }: any) {
  return (
    <div className={`${color} text-white rounded-lg p-6 text-center`}>
      <div className="text-xl font-bold mb-2">{platform}</div>
      <div className="text-3xl font-bold mb-1">{posts}</div>
      <div className="text-sm opacity-90 mb-4">posts</div>
      <div className="border-t border-white/30 pt-4 space-y-1">
        <div className="text-sm">Avg Views: {avgViews}</div>
        <div className="text-sm">Engagement: {avgEngagement}</div>
      </div>
    </div>
  );
}
