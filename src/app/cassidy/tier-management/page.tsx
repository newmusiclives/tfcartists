"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  Music,
  TrendingUp,
  Users,
} from "lucide-react";
import type { CassidyStats, SubmissionListItem } from "@/types/cassidy";

const TIER_CONFIG = [
  { tier: "BRONZE", emoji: "\u{1F949}", targetPct: 60, spins: "4-6", color: "amber" as const },
  { tier: "SILVER", emoji: "\u{1F948}", targetPct: 25, spins: "10-14", color: "gray" as const },
  { tier: "GOLD", emoji: "\u{1F947}", targetPct: 12, spins: "20-25", color: "yellow" as const },
  { tier: "PLATINUM", emoji: "\u{1F48E}", targetPct: 3, spins: "30+", color: "purple" as const },
] as const;

const tierColorClasses: Record<string, { bg: string; border: string; text: string }> = {
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900" },
  gray: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-900" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-900" },
  purple: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-900" },
};

const tierBadgeClasses: Record<string, string> = {
  BRONZE: "bg-amber-100 text-amber-800",
  SILVER: "bg-gray-100 text-gray-800",
  GOLD: "bg-yellow-100 text-yellow-800",
  PLATINUM: "bg-purple-100 text-purple-800",
};

export default function CassidyTierManagementPage() {
  const [stats, setStats] = useState<CassidyStats | null>(null);
  const [placedArtists, setPlacedArtists] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, placedRes] = await Promise.all([
          fetch("/api/cassidy/stats"),
          fetch("/api/cassidy/submissions?status=PLACED&limit=50"),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (placedRes.ok) {
          const data = await placedRes.json();
          setPlacedArtists(data.submissions || []);
        }
      } catch (error) {
        console.error("Error fetching tier data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-gray-600">Loading tier management...</div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-red-600">Error loading tier data</div>
      </main>
    );
  }

  const indieProgress = Math.round(
    ((stats.rotationTransformation.indie - 20) /
      (stats.rotationTransformation.target - 20)) *
      100
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
            <BarChart3 className="w-8 h-8 text-teal-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tier Management
              </h1>
              <p className="text-gray-600">
                Artist tier distribution and rotation curation
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Bar */}
        <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-teal-200 shadow-sm">
            <div className="text-sm text-gray-600">Total in Rotation</div>
            <div className="text-2xl font-bold text-teal-600">
              {stats.totalArtistsInRotation}
            </div>
          </div>
          {TIER_CONFIG.map((t) => (
            <div
              key={t.tier}
              className={`${tierColorClasses[t.color].bg} rounded-xl p-4 border ${tierColorClasses[t.color].border} shadow-sm`}
            >
              <div className="text-sm text-gray-600">
                {t.emoji} {t.tier}
              </div>
              <div className={`text-2xl font-bold ${tierColorClasses[t.color].text}`}>
                {stats.byTier[t.tier as keyof typeof stats.byTier]}
              </div>
            </div>
          ))}
        </section>

        {/* Tier Distribution Cards */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">
            Tier Distribution
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Target distribution: 60% Bronze / 25% Silver / 12% Gold / 3%
            Platinum
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {TIER_CONFIG.map((t) => {
              const count =
                stats.byTier[t.tier as keyof typeof stats.byTier];
              const actualPct =
                stats.totalArtistsInRotation > 0
                  ? Math.round(
                      (count / stats.totalArtistsInRotation) * 100
                    )
                  : 0;
              const classes = tierColorClasses[t.color];

              return (
                <div
                  key={t.tier}
                  className={`${classes.bg} border ${classes.border} rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{t.emoji}</span>
                    <span
                      className={`text-sm font-semibold ${classes.text}`}
                    >
                      {t.targetPct}% target
                    </span>
                  </div>
                  <div className={`text-lg font-bold ${classes.text} mb-1`}>
                    {t.tier}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {count}
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    {t.spins} spins/week
                  </div>
                  {/* Actual vs target bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        actualPct > t.targetPct
                          ? "bg-red-400"
                          : "bg-teal-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (actualPct / t.targetPct) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {actualPct}% actual
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 80/20 Progress */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                80/20 Transformation Progress
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Indie vs mainstream rotation balance
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-teal-600" />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Indie Artists</span>
                <span className="font-semibold text-teal-600">
                  {stats.rotationTransformation.indie}%
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  style={{
                    width: `${stats.rotationTransformation.indie}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Mainstream</span>
                <span className="font-semibold text-gray-500">
                  {stats.rotationTransformation.mainstream}%
                </span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400"
                  style={{
                    width: `${stats.rotationTransformation.mainstream}%`,
                  }}
                />
              </div>
            </div>
            <div className="pt-4 border-t text-center">
              <div className="text-sm text-gray-600">
                Progress toward {stats.rotationTransformation.target}% indie
                target
              </div>
              <div className="text-3xl font-bold text-teal-600">
                {Math.max(0, Math.min(100, indieProgress))}% complete
              </div>
            </div>
          </div>
        </section>

        {/* Placed Artists List */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Placed Artists</h2>
              <p className="text-gray-600 text-sm mt-1">
                {placedArtists.length} artists currently placed in rotation
              </p>
            </div>
            <Users className="w-8 h-8 text-teal-600" />
          </div>

          {placedArtists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No placed artists yet.
            </div>
          ) : (
            <div className="space-y-3">
              {placedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Music className="w-5 h-5 text-gray-400" />
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
                        <Award className="w-3 h-3 inline mr-1" />
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
