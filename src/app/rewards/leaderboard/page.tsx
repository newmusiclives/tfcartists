"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, Trophy, ArrowLeft, Users, Music } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string | null;
  xpTotal: number;
  xpLevel: number;
  badges: string[];
}

type Tab = "listener" | "artist";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("listener");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gamification/leaderboard?type=${tab}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.leaderboard || []);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const rankBadge = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/rewards" className="flex items-center space-x-2 text-purple-700 hover:text-purple-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Radio className="w-5 h-5" />
              <span className="font-bold">Rewards</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-3">
            <Trophy className="w-7 h-7 text-purple-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-1">Top listeners and artists by XP</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("listener")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === "listener" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Listeners</span>
          </button>
          <button
            onClick={() => setTab("artist")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === "artist" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Artists</span>
          </button>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 animate-pulse">Loading leaderboard...</div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No entries yet. Start earning XP to appear on the leaderboard!
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center px-6 py-4 ${
                    index < 3 ? "bg-gradient-to-r from-yellow-50/50 to-transparent" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 text-center font-bold text-lg">
                    {index < 3 ? (
                      <span className="text-2xl">{rankBadge(index)}</span>
                    ) : (
                      <span className="text-gray-400">{rankBadge(index)}</span>
                    )}
                  </div>

                  {/* Level badge */}
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold mr-3">
                    {entry.xpLevel}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{entry.name || "Anonymous"}</div>
                    <div className="text-xs text-gray-500">
                      Level {entry.xpLevel}
                      {entry.badges.length > 0 && ` · ${entry.badges.length} badges`}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="font-bold text-purple-600">{entry.xpTotal.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
