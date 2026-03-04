"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import {
  Music,
  DollarSign,
  TrendingUp,
  Upload,
  Clock,
  Star,
  Loader2,
  Radio,
  ChevronRight,
} from "lucide-react";

interface ArtistProfile {
  id: string;
  name: string;
  genre: string;
  email: string;
  airplayTier: string;
  airplayShares: number;
  xpTotal: number;
  xpLevel: number;
  status: string;
  conversationCount: number;
  createdAt: string;
}

const TIER_INFO: Record<string, { name: string; shares: number; cost: number; color: string }> = {
  FREE: { name: "Free", shares: 1, cost: 0, color: "gray" },
  TIER_5: { name: "Starter", shares: 5, cost: 5, color: "blue" },
  TIER_20: { name: "Growth", shares: 25, cost: 20, color: "purple" },
  TIER_50: { name: "Pro", shares: 75, cost: 50, color: "amber" },
  TIER_120: { name: "Premium", shares: 200, cost: 120, color: "green" },
};

export default function ArtistPortalPage() {
  const [artistId, setArtistId] = useState("");
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"lookup" | "dashboard">("lookup");

  const lookupArtist = async () => {
    if (!artistId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let res: Response;
      if (artistId.includes("@")) {
        res = await fetch(`/api/artists?search=${encodeURIComponent(artistId)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          const artists = data.artists || [];
          if (artists.length > 0) {
            setArtist(artists[0]);
            setView("dashboard");
          } else {
            setError("No artist found with that email.");
          }
          return;
        }
      } else {
        res = await fetch(`/api/artists/${artistId}`);
        if (res.ok) {
          const data = await res.json();
          setArtist(data.artist || data);
          setView("dashboard");
          return;
        }
      }
      if (res.status === 404) {
        setError("Artist not found. Check your ID or email and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const tier = artist ? TIER_INFO[artist.airplayTier] || TIER_INFO.FREE : TIER_INFO.FREE;

  if (view === "lookup") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <SharedNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Radio className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artist Portal</h1>
          <p className="text-gray-600 mb-8">
            View your airplay stats, earnings, and tier information.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupArtist()}
              placeholder="Enter your Artist ID or email"
              className="flex-1 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            <button
              onClick={lookupArtist}
              disabled={loading}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Go
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-3">{error}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Enter your Artist ID (from your welcome email) or the email you signed up with.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{artist?.name}</h1>
            <p className="text-gray-500">{artist?.genre} &middot; {artist?.email}</p>
          </div>
          <button
            onClick={() => { setView("lookup"); setArtist(null); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Switch Artist
          </button>
        </div>

        {/* Tier Card */}
        <div className={`bg-white rounded-xl p-6 shadow-sm border-2 border-${tier.color}-200 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Tier</p>
              <p className="text-2xl font-bold text-gray-900">{tier.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {tier.shares} shares &middot; ${tier.cost}/month
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Level</p>
              <p className="text-3xl font-bold text-amber-600">{artist?.xpLevel || 1}</p>
              <p className="text-xs text-gray-400">{artist?.xpTotal || 0} XP</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <TrendingUp className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-sm text-gray-500">Shares</p>
            <p className="text-xl font-bold">{artist?.airplayShares || tier.shares}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <Star className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-xl font-bold capitalize">{artist?.status?.toLowerCase()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <Music className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-sm text-gray-500">Conversations</p>
            <p className="text-xl font-bold">{artist?.conversationCount || 0}</p>
          </div>
        </div>

        {/* Tier Upgrade CTA */}
        {artist?.airplayTier !== "TIER_120" && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 mb-8">
            <h3 className="font-semibold text-amber-900 mb-2">Upgrade Your Tier</h3>
            <p className="text-sm text-amber-700 mb-4">
              Higher tiers mean more shares in the revenue pool and more airplay for your music.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(TIER_INFO)
                .filter(([key]) => key !== "FREE" && key !== artist?.airplayTier)
                .map(([key, info]) => (
                  <Link
                    key={key}
                    href="/airplay"
                    className="bg-white rounded-lg p-3 border text-center hover:border-amber-400 hover:shadow-md transition-all"
                  >
                    <p className="font-semibold text-sm">{info.name}</p>
                    <p className="text-lg font-bold text-amber-600">${info.cost}/mo</p>
                    <p className="text-xs text-gray-500">{info.shares} shares</p>
                    <p className="text-xs text-amber-600 font-medium mt-1">Upgrade &rarr;</p>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Earnings Info */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold">Earnings</h2>
          </div>
          <div className="px-6 py-8 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-medium text-gray-700">Earnings are distributed monthly via Manifest Financial.</p>
            <p className="text-sm mt-1">
              Check your registered email for payout notifications and statements.
            </p>
          </div>
        </div>

        {/* Submit Track CTA */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-3">
            <Upload className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">Submit a Track</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Submit your music for review by our panel. Approved tracks get added to the rotation.
          </p>
          <a
            href="/riley/submissions"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            Go to Submissions
          </a>
        </div>
      </div>
    </div>
  );
}
