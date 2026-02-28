"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Radio, ArrowLeft, Gift, ShoppingBag, Mic, Star, Sparkles,
  Lock, CheckCircle, Clock,
} from "lucide-react";

interface RewardOption {
  id: string;
  name: string;
  description: string;
  category: string;
  xpCost: number;
  icon: string | null;
  remaining: number | null;
  totalSupply: number | null;
  minLevel: number;
}

interface RedemptionRecord {
  rewardId: string;
  status: string;
  redeemedAt: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  merch: { label: "Merch", icon: <ShoppingBag className="w-4 h-4" />, color: "bg-blue-100 text-blue-700" },
  shoutout: { label: "Shoutouts", icon: <Mic className="w-4 h-4" />, color: "bg-purple-100 text-purple-700" },
  exclusive: { label: "Exclusives", icon: <Star className="w-4 h-4" />, color: "bg-amber-100 text-amber-700" },
  experience: { label: "Experiences", icon: <Sparkles className="w-4 h-4" />, color: "bg-green-100 text-green-700" },
};

const REWARD_ICONS: Record<string, string> = {
  tshirt: "👕", hat: "🧢", sticker: "🏷️", mug: "☕",
  shoutout: "📢", dedication: "💌", interview: "🎙️",
  playlist: "🎵", early_access: "🚀", backstage: "🎪",
  vinyl: "💿", poster: "🖼️", gift_card: "🎁",
};

export default function RedeemRewardsPage() {
  const [rewards, setRewards] = useState<RewardOption[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [userXp, setUserXp] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchData = useCallback(async () => {
    const listenerId = localStorage.getItem("listenerId");
    if (!listenerId) {
      setError("No listener ID found. Please register first.");
      setLoading(false);
      return;
    }

    try {
      const [rewardsRes, profileRes] = await Promise.all([
        fetch(`/api/rewards?listenerId=${listenerId}`),
        fetch(`/api/gamification/profile?userId=${listenerId}&userType=listener`),
      ]);

      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.rewards || []);
        setRedemptions(data.redemptions || []);
      }

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.profile) {
          setUserXp(data.profile.xpTotal);
          setUserLevel(data.profile.xpLevel);
        }
      }
    } catch {
      setError("Failed to load rewards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRedeem(rewardId: string) {
    const listenerId = localStorage.getItem("listenerId");
    if (!listenerId) return;

    setRedeeming(rewardId);
    setSuccessMessage("");

    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listenerId, rewardId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to redeem");
        setTimeout(() => setError(""), 4000);
        return;
      }

      setSuccessMessage(`Redeemed "${data.redemption.rewardName}" for ${data.redemption.xpSpent} XP!`);
      setUserXp(data.newXpTotal);
      setTimeout(() => setSuccessMessage(""), 5000);

      // Refresh data
      fetchData();
    } catch {
      setError("Network error");
      setTimeout(() => setError(""), 4000);
    } finally {
      setRedeeming(null);
    }
  }

  const filteredRewards = filter === "all"
    ? rewards
    : rewards.filter((r) => r.category === filter);

  const categories = [...new Set(rewards.map((r) => r.category))];

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading rewards...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/rewards" className="flex items-center space-x-2 text-amber-700 hover:text-amber-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Radio className="w-5 h-5" />
              <span className="font-bold">Rewards</span>
            </Link>
            <div className="flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-bold">
              <Star className="w-4 h-4" />
              <span>{userXp.toLocaleString()} XP</span>
              <span className="text-amber-600">Lv.{userLevel}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <Gift className="w-8 h-8 text-amber-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Redeem Rewards</h1>
          <p className="mt-2 text-gray-600">Spend your XP on merch, shoutouts, and exclusive experiences</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
            {error.includes("register") && (
              <Link href="/listen/register" className="ml-2 underline font-medium">Register here</Link>
            )}
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "all" ? "bg-amber-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  filter === cat ? "bg-amber-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
              >
                {config?.icon}
                <span>{config?.label || cat}</span>
              </button>
            );
          })}
        </div>

        {/* Rewards Grid */}
        {filteredRewards.length === 0 ? (
          <div className="text-center py-16">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No rewards available yet</p>
            <p className="text-gray-400 text-sm mt-1">Check back soon — new rewards are being added!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRewards.map((reward) => {
              const canAfford = userXp >= reward.xpCost;
              const meetsLevel = userLevel >= reward.minLevel;
              const soldOut = reward.remaining !== null && reward.remaining <= 0;
              const canRedeem = canAfford && meetsLevel && !soldOut;
              const isRedeeming = redeeming === reward.id;
              const config = CATEGORY_CONFIG[reward.category];
              const pendingRedemption = redemptions.find(
                (r) => r.rewardId === reward.id && r.status === "pending"
              );

              return (
                <div
                  key={reward.id}
                  className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${
                    canRedeem ? "hover:shadow-md hover:border-amber-300" : "opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">
                      {reward.icon ? (REWARD_ICONS[reward.icon] || reward.icon) : "🎁"}
                    </div>
                    {config && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{reward.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{reward.description}</p>

                  {/* Supply indicator */}
                  {reward.totalSupply !== null && (
                    <div className="text-xs text-gray-400 mb-3">
                      {soldOut ? "Sold out" : `${reward.remaining} of ${reward.totalSupply} remaining`}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-bold ${canAfford ? "text-amber-600" : "text-gray-400"}`}>
                        {reward.xpCost.toLocaleString()} XP
                      </span>
                      {reward.minLevel > 1 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          meetsLevel ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          Lv.{reward.minLevel}+
                        </span>
                      )}
                    </div>

                    {pendingRedemption ? (
                      <span className="flex items-center space-x-1.5 text-sm text-blue-600 font-medium">
                        <Clock className="w-4 h-4" />
                        <span>Pending</span>
                      </span>
                    ) : soldOut ? (
                      <span className="text-sm text-gray-400 font-medium">Sold Out</span>
                    ) : !meetsLevel ? (
                      <span className="flex items-center space-x-1 text-sm text-gray-400">
                        <Lock className="w-4 h-4" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRedeem(reward.id)}
                        disabled={!canRedeem || isRedeeming}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          canRedeem
                            ? "bg-amber-600 text-white hover:bg-amber-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {isRedeeming ? "Redeeming..." : canAfford ? "Redeem" : "Not Enough XP"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Redemption History */}
        {redemptions.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Redemptions</h2>
            <div className="space-y-3">
              {redemptions.map((r, idx) => {
                const reward = rewards.find((rw) => rw.id === r.rewardId);
                return (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{reward?.name || "Unknown Reward"}</div>
                      <div className="text-xs text-gray-400">{new Date(r.redeemedAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      r.status === "fulfilled" ? "bg-green-100 text-green-700"
                        : r.status === "cancelled" ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {r.status === "fulfilled" ? "Fulfilled" : r.status === "cancelled" ? "Cancelled" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
