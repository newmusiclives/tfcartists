"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ListMusic,
  Music,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Clock,
} from "lucide-react";

interface StationData {
  _count?: {
    songs?: number;
  };
}

const ROTATION_CATEGORIES = [
  { name: "Heavy", description: "Current hits, high frequency", count: 35, color: "rose", pct: 15 },
  { name: "Medium", description: "Recent releases, moderate play", count: 60, color: "indigo", pct: 25 },
  { name: "Light", description: "Catalog favorites, lower frequency", count: 120, color: "violet", pct: 30 },
  { name: "Recurrent", description: "Recent former hits cycling back", count: 85, color: "orange", pct: 20 },
  { name: "Gold/Library", description: "Classic catalog, fill spots", count: 200, color: "amber", pct: 10 },
];

const RECENT_ADDS = [
  { title: "Dust & Diamonds", artist: "Colter Wall", category: "Heavy", addedDate: "2 days ago" },
  { title: "Broken Halos", artist: "Chris Stapleton", category: "Medium", addedDate: "3 days ago" },
  { title: "Lightning Bugs", artist: "Sierra Ferrell", category: "Heavy", addedDate: "5 days ago" },
  { title: "Pancho and Lefty", artist: "Townes Van Zandt", category: "Gold/Library", addedDate: "1 week ago" },
  { title: "The Painter", artist: "Cody Jinks", category: "Medium", addedDate: "1 week ago" },
];

const CATEGORY_BREAKDOWN = [
  { name: "Americana", count: 450, pct: 30 },
  { name: "Country", count: 380, pct: 25 },
  { name: "Folk", count: 230, pct: 15 },
  { name: "Bluegrass", count: 180, pct: 12 },
  { name: "Red Dirt", count: 150, pct: 10 },
  { name: "Singer-Songwriter", count: 120, pct: 8 },
];

export default function MusicPage() {
  const [songCount, setSongCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stations");
        if (res.ok) {
          const data = await res.json();
          const station = data.stations?.[0] || data;
          setSongCount(station._count?.songs ?? 0);
        }
      } catch (error) {
        console.error("Error fetching station data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/parker"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Parker Dashboard</span>
            </Link>
            <Link
              href="/station-admin/music"
              className="inline-flex items-center space-x-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
            >
              <ListMusic className="w-4 h-4" />
              <span>Music Library</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <ListMusic className="w-8 h-8 text-violet-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Music Director Dashboard</h1>
              <p className="text-gray-600">Managed by Wren Nakamura</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Library Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Music className="w-6 h-6 text-violet-600" />
              <div className="text-sm font-medium text-gray-600">Total Songs</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{loading ? "..." : songCount || "1,510"}</div>
            <div className="text-xs text-violet-600">In music library</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <RefreshCw className="w-6 h-6 text-rose-600" />
              <div className="text-sm font-medium text-gray-600">In Active Rotation</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">500</div>
            <div className="text-xs text-rose-600">Currently rotating</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <div className="text-sm font-medium text-gray-600">New This Month</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">12</div>
            <div className="text-xs text-green-600">Recently added</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <div className="text-sm font-medium text-gray-600">Category Balance</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">94%</div>
            <div className="text-xs text-indigo-600">Score</div>
          </div>
        </section>

        {/* Rotation Health */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rotation Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {ROTATION_CATEGORIES.map((cat, idx) => {
              const colorClasses: Record<string, string> = {
                rose: "bg-rose-50 border-rose-200 text-rose-700",
                indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
                violet: "bg-violet-50 border-violet-200 text-violet-700",
                orange: "bg-orange-50 border-orange-200 text-orange-700",
                amber: "bg-amber-50 border-amber-200 text-amber-700",
              };
              const barColors: Record<string, string> = {
                rose: "bg-rose-500",
                indigo: "bg-indigo-500",
                violet: "bg-violet-500",
                orange: "bg-orange-500",
                amber: "bg-amber-500",
              };
              return (
                <div key={idx} className={`rounded-lg p-4 border-2 ${colorClasses[cat.color]}`}>
                  <div className="font-bold text-lg mb-1">{cat.name}</div>
                  <div className="text-3xl font-bold mb-1">{cat.count}</div>
                  <div className="text-xs mb-3 opacity-80">{cat.description}</div>
                  <div className="bg-white/60 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${barColors[cat.color]}`} style={{ width: `${cat.pct * 3}%` }} />
                  </div>
                  <div className="text-xs mt-1 text-center">{cat.pct}% of airtime</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recently Added Tracks */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently Added Tracks</h2>
          <div className="space-y-3">
            {RECENT_ADDS.map((track, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <Music className="w-10 h-10 text-gray-400" />
                  <div>
                    <div className="font-semibold text-gray-900">{track.title}</div>
                    <div className="text-sm text-gray-600">{track.artist}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    track.category === "Heavy" ? "bg-rose-100 text-rose-700" :
                    track.category === "Medium" ? "bg-indigo-100 text-indigo-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {track.category}
                  </span>
                  <div className="text-sm text-gray-500">{track.addedDate}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Category Balance */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Balance</h2>
          <div className="space-y-4">
            {CATEGORY_BREAKDOWN.map((cat, idx) => {
              const barColors = ["bg-violet-500", "bg-rose-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500", "bg-amber-500"];
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    <span className="text-sm text-gray-500">{cat.count} songs ({cat.pct}%)</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className={`h-full rounded-full ${barColors[idx]} transition-all`} style={{ width: `${cat.pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Links */}
        <section className="flex flex-wrap gap-4">
          <Link href="/station-admin/music" className="inline-flex items-center space-x-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors">
            <ListMusic className="w-4 h-4" />
            <span>Full Music Library</span>
          </Link>
          <Link href="/cassidy/rotation" className="inline-flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Rotation Planner</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
