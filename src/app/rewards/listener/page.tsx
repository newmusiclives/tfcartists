"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio, Trophy, Flame, Star, ArrowLeft,
  TrendingUp, Clock, Headphones, Gift,
} from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface Profile {
  id: string;
  name: string;
  xpTotal: number;
  xpLevel: number;
  nextLevelXp: number;
  levelProgress: number;
  listeningStreak: number;
  totalSessions: number;
  totalListeningHours: number;
  tier: string;
  engagementScore: number;
  rank: number;
  badges: Badge[];
  newBadges: string[];
}

interface XPEntry {
  id: string;
  action: string;
  xpAmount: number;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  listen_session: "Listening Session (30+ min)",
  daily_streak: "Daily Streak Bonus",
  streak_7_day: "7-Day Streak Bonus",
  streak_30_day: "30-Day Streak Bonus",
  streak_90_day: "90-Day Streak Bonus",
  referral: "Referred a Listener",
  referral_listen_1hr: "Referral Listened 1hr",
  embed_play: "Embed Widget Play",
  embed_new_listener: "New Listener via Embed",
};

const BADGE_ICONS: Record<string, string> = {
  headphones: "🎧", moon: "🌙", sunrise: "🌅", timer: "⏱️", award: "🏅",
  flame: "🔥", fire: "🔥", zap: "⚡", "user-plus": "👤", users: "👥",
  megaphone: "📢", code: "💻", radio: "📻", "trending-up": "📈",
  star: "⭐", magnet: "🧲", building: "🏢", heart: "❤️",
  sparkles: "✨", trophy: "🏆", crown: "👑", gem: "💎",
};

export default function ListenerDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentXP, setRecentXP] = useState<XPEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const listenerId = localStorage.getItem("listenerId");
    if (!listenerId) {
      setError("No listener ID found. Please register first.");
      setLoading(false);
      return;
    }

    fetch(`/api/gamification/profile?userId=${listenerId}&userType=listener`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setProfile(data.profile);
        setRecentXP(data.recentXP || []);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading rewards...</div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{error || "Profile not found"}</p>
          <Link href="/listen/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Register as a listener
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/rewards" className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Radio className="w-5 h-5" />
              <span className="font-bold">Rewards</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {profile.xpLevel}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <span className="flex items-center space-x-1"><Trophy className="w-3.5 h-3.5" /><span>Rank #{profile.rank}</span></span>
              <span className="flex items-center space-x-1"><Star className="w-3.5 h-3.5" /><span>{profile.tier}</span></span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Level {profile.xpLevel}</span>
            <span className="text-sm text-gray-500">{profile.xpTotal.toLocaleString()} / {profile.nextLevelXp.toLocaleString()} XP</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${profile.levelProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{profile.levelProgress}% to Level {profile.xpLevel + 1}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{profile.listeningStreak}</div>
            <div className="text-xs text-gray-500">Day Streak</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <Headphones className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{profile.totalSessions}</div>
            <div className="text-xs text-gray-500">Sessions</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{profile.totalListeningHours}</div>
            <div className="text-xs text-gray-500">Hours</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{profile.engagementScore}</div>
            <div className="text-xs text-gray-500">Engagement</div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Gift className="w-5 h-5" />
            <span>Badges ({profile.badges.length})</span>
          </h2>
          {profile.badges.length === 0 ? (
            <p className="text-sm text-gray-500">No badges yet. Keep listening to earn your first badge!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3 rounded-xl border ${
                    profile.newBadges.includes(badge.id)
                      ? "bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="text-2xl mb-1">{BADGE_ICONS[badge.icon] || "🏅"}</div>
                  <div className="text-sm font-semibold text-gray-900">{badge.name}</div>
                  <div className="text-xs text-gray-500">{badge.description}</div>
                  {profile.newBadges.includes(badge.id) && (
                    <div className="text-xs font-bold text-yellow-600 mt-1">NEW!</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent XP */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent XP</h2>
          {recentXP.length === 0 ? (
            <p className="text-sm text-gray-500">No XP transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentXP.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm text-gray-900">{ACTION_LABELS[tx.action] || tx.action}</div>
                    <div className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className="text-sm font-bold text-green-600">+{tx.xpAmount} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
