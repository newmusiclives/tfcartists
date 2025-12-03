"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  MessageCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowRight,
  Radio,
  Settings,
} from "lucide-react";
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

        const statsData = await statsRes.json();
        const artistsData = await artistsRes.json();

        setStats(statsData);
        setArtists(artistsData.artists);
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
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold">Riley Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link
                href="/capacity"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Radio className="w-4 h-4" />
                <span>Capacity</span>
              </Link>
              <Link
                href="/admin/settings"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <Link
                href="/admin/artists"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                View All Artists
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Total Artists"
            value={stats?.artists.total || 0}
            subtitle={`${stats?.artists.activated || 0} activated`}
            color="purple"
          />
          <StatCard
            icon={<MessageCircle className="w-6 h-6" />}
            title="Riley Messages"
            value={stats?.riley.recentMessages || 0}
            subtitle="Last 7 days"
            color="blue"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            title="Total Raised"
            value={formatCurrency(stats?.donations.totalRaised || 0)}
            subtitle={`${stats?.donations.total || 0} donations`}
            color="green"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="Total Shows"
            value={stats?.shows.total || 0}
            subtitle={`${stats?.shows.completed || 0} completed`}
            color="pink"
          />
        </div>

        {/* Pipeline Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Artist Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <PipelineStage
              label="Discovered"
              count={stats?.artists.discovered || 0}
              color="gray"
            />
            <PipelineStage
              label="Contacted"
              count={stats?.artists.contacted || 0}
              color="blue"
            />
            <PipelineStage
              label="Engaged"
              count={stats?.artists.engaged || 0}
              color="purple"
            />
            <PipelineStage
              label="Qualified"
              count={stats?.artists.qualified || 0}
              color="green"
            />
            <PipelineStage
              label="Onboarding"
              count={stats?.artists.qualified || 0}
              color="yellow"
            />
            <PipelineStage
              label="Activated"
              count={stats?.artists.activated || 0}
              color="emerald"
            />
            <PipelineStage
              label="Active"
              count={stats?.artists.active || 0}
              color="teal"
            />
          </div>
        </div>

        {/* Recent Artists */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Artists</h2>
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
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function PipelineStage({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
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
