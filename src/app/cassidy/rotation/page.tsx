"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Music,
  Radio,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { CassidyStats, SubmissionListItem } from "@/types/cassidy";

const tierBadgeClasses: Record<string, string> = {
  BRONZE: "bg-amber-100 text-amber-800",
  SILVER: "bg-gray-100 text-gray-800",
  GOLD: "bg-yellow-100 text-yellow-800",
  PLATINUM: "bg-purple-100 text-purple-800",
};

export default function CassidyRotationPage() {
  const [stats, setStats] = useState<CassidyStats | null>(null);
  const [recentlyPlaced, setRecentlyPlaced] = useState<SubmissionListItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, placedRes] = await Promise.all([
          fetch("/api/cassidy/stats"),
          fetch("/api/cassidy/submissions?status=PLACED&limit=10"),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (placedRes.ok) {
          const data = await placedRes.json();
          setRecentlyPlaced(data.submissions || []);
        }
      } catch (error) {
        console.error("Error fetching rotation data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-gray-600">Loading rotation planner...</div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-red-600">Error loading rotation data</div>
      </main>
    );
  }

  const { indie, mainstream, target } = stats.rotationTransformation;
  const progressPct = Math.max(
    0,
    Math.min(100, Math.round(((indie - 20) / (target - 20)) * 100))
  );
  const slotsRemaining = Math.max(
    0,
    Math.ceil(((target - indie) / 100) * 500)
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/cassidy"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Radio className="w-8 h-8 text-teal-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Rotation Planner
              </h1>
              <p className="text-gray-600">
                80/20 indie transformation tracker
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Progress Hero */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              80/20 Rotation Transformation
            </h2>
            <p className="text-gray-600">
              Replacing mainstream tracks with curated indie artists
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* Indie Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-teal-700">
                  Indie Artists
                </span>
                <span className="font-bold text-teal-600 text-lg">
                  {indie}%
                </span>
              </div>
              <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${indie}%` }}
                />
              </div>
            </div>

            {/* Mainstream Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-600">
                  Mainstream
                </span>
                <span className="font-bold text-gray-500 text-lg">
                  {mainstream}%
                </span>
              </div>
              <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 rounded-full transition-all duration-500"
                  style={{ width: `${mainstream}%` }}
                />
              </div>
            </div>

            {/* Goal Line */}
            <div className="pt-6 border-t">
              <div className="flex items-center justify-center space-x-3">
                <Target className="w-6 h-6 text-teal-600" />
                <span className="text-lg font-semibold text-gray-900">
                  Target: {target}% indie
                </span>
              </div>
              <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-center mt-2">
                <span className="text-3xl font-bold text-teal-600">
                  {progressPct}%
                </span>
                <span className="text-gray-600 ml-2">toward goal</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border border-teal-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {slotsRemaining}
            </div>
            <div className="text-sm font-semibold text-gray-700">
              Slots Remaining
            </div>
            <div className="text-xs text-gray-500">
              To reach {target}% indie
            </div>
          </div>

          <div className="bg-teal-50 rounded-xl p-6 border border-teal-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-3xl font-bold text-teal-700 mb-1">
              {indie}%
            </div>
            <div className="text-sm font-semibold text-gray-700">
              Current Indie %
            </div>
            <div className="text-xs text-gray-500">
              Up from 20% baseline
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Radio className="w-6 h-6 text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-gray-700 mb-1">
              {mainstream}%
            </div>
            <div className="text-sm font-semibold text-gray-700">
              Mainstream %
            </div>
            <div className="text-xs text-gray-500">
              Target: {100 - target}%
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-700 mb-1">
              {target}%
            </div>
            <div className="text-sm font-semibold text-gray-700">
              Indie Target
            </div>
            <div className="text-xs text-gray-500">
              {progressPct}% complete
            </div>
          </div>
        </section>

        {/* Recently Placed */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Recently Placed</h2>
              <p className="text-gray-600 text-sm mt-1">
                Latest indie artists replacing mainstream rotation slots
              </p>
            </div>
            <Award className="w-8 h-8 text-teal-600" />
          </div>

          {recentlyPlaced.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recently placed artists.
            </div>
          ) : (
            <div className="space-y-3">
              {recentlyPlaced.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Music className="w-5 h-5 text-teal-500" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {artist.artistName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {artist.trackTitle}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Placed</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {artist.submittedAt}
                      </div>
                    </div>
                    {artist.tierAwarded && (
                      <span
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          tierBadgeClasses[artist.tierAwarded] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {artist.tierAwarded}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
