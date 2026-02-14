"use client";

import Link from "next/link";
import { Radio, Trophy, Users, Music, TrendingUp, Gift, Code, ArrowRight } from "lucide-react";

export default function RewardsHubPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 text-amber-700 hover:text-amber-800 transition-colors">
              <Radio className="w-5 h-5" />
              <span className="font-bold">TrueFans RADIO</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-amber-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Rewards & Gamification</h1>
          <p className="mt-2 text-gray-600 max-w-lg mx-auto">
            Earn XP, unlock badges, climb the leaderboard, and earn real commissions by listening,
            referring friends, and embedding the player on your website.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Listener Rewards */}
          <Link
            href="/rewards/listener"
            className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-amber-300 transition-all"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Listener Dashboard</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Track your XP, listening streaks, badges earned, and see where you rank on the leaderboard.
              Earn XP by listening, referring friends, and maintaining streaks.
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center space-x-1"><Gift className="w-3 h-3" /><span>10 XP per 30-min session</span></span>
              <span className="flex items-center space-x-1"><TrendingUp className="w-3 h-3" /><span>Streak bonuses</span></span>
            </div>
            <div className="mt-4 text-amber-600 text-sm font-semibold flex items-center space-x-1 group-hover:text-amber-700">
              <span>View Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Artist Rewards */}
          <Link
            href="/rewards/artist"
            className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-amber-300 transition-all"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Music className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Artist Dashboard</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              See how your embeddable player is performing. Track listeners gained through your embed,
              XP earned, and your level progression.
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center space-x-1"><Code className="w-3 h-3" /><span>Embed code + ref link</span></span>
              <span className="flex items-center space-x-1"><Gift className="w-3 h-3" /><span>50 XP per new listener</span></span>
            </div>
            <div className="mt-4 text-amber-600 text-sm font-semibold flex items-center space-x-1 group-hover:text-amber-700">
              <span>View Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Leaderboard */}
          <Link
            href="/rewards/leaderboard"
            className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-amber-300 transition-all"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Leaderboard</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              See the top listeners, artists, and sponsors ranked by XP. Compete for the top spots and show
              off your badges and achievements.
            </p>
            <div className="mt-4 text-amber-600 text-sm font-semibold flex items-center space-x-1 group-hover:text-amber-700">
              <span>View Leaderboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Embed Code Generator */}
          <Link
            href="/embed"
            className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-amber-300 transition-all"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Get Embed Code</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Get a player widget to embed on your website. Customize the size, theme, and include your
              referral code to earn rewards when people listen.
            </p>
            <div className="mt-4 text-amber-600 text-sm font-semibold flex items-center space-x-1 group-hover:text-amber-700">
              <span>Generate Code</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
