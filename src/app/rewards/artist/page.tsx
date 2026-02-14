"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, Trophy, Music, ArrowLeft, Code, Users, TrendingUp } from "lucide-react";

interface ArtistProfile {
  id: string;
  name: string;
  xpTotal: number;
  xpLevel: number;
  nextLevelXp: number;
  levelProgress: number;
  embedListeners: number;
  airplayTier: string;
  rank: number;
}

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://truefans-radio.netlify.app";

export default function ArtistDashboardPage() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const artistId = localStorage.getItem("artistId");
    if (!artistId) {
      setError("No artist ID found. This page is for registered artists.");
      setLoading(false);
      return;
    }

    fetch(`/api/gamification/profile?userId=${artistId}&userType=artist`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setProfile(data.profile);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const embedCode = profile
    ? `<iframe src="${BASE_URL}/embed/player?size=card&theme=dark&ref=ARTIST_${profile.id}" width="320" height="180" frameborder="0" allow="autoplay" style="border-radius:16px;border:none;"></iframe>`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{error || "Profile not found"}</p>
          <Link href="/rewards" className="text-amber-600 hover:text-amber-700 font-medium">
            Back to Rewards
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/rewards" className="flex items-center space-x-2 text-amber-700 hover:text-amber-800 transition-colors">
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
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {profile.xpLevel}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <span className="flex items-center space-x-1"><Trophy className="w-3.5 h-3.5" /><span>Rank #{profile.rank}</span></span>
              <span className="flex items-center space-x-1"><Music className="w-3.5 h-3.5" /><span>{profile.airplayTier}</span></span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Level {profile.xpLevel}</span>
            <span className="text-sm text-gray-500">{profile.xpTotal.toLocaleString()} / {profile.nextLevelXp.toLocaleString()} XP</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
              style={{ width: `${profile.levelProgress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{profile.embedListeners}</div>
            <div className="text-xs text-gray-500">Embed Listeners</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{profile.xpTotal.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total XP</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">#{profile.rank}</div>
            <div className="text-xs text-gray-500">Rank</div>
          </div>
        </div>

        {/* Embed Code */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>Your Embed Code</span>
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Put this on your website to let fans listen and earn XP for every play.
          </p>
          <pre className="bg-gray-900 text-gray-300 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap break-all mb-3">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            {copied ? "Copied!" : "Copy Embed Code"}
          </button>
        </div>
      </div>
    </main>
  );
}
