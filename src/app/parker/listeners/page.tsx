"use client";

import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Heart,
  Music,
  Trophy,
  Users,
  Star,
  TrendingUp,
  ThumbsUp,
} from "lucide-react";

const RECENT_REQUESTS = [
  { song: "Whiskey Myers - Stone", listener: "Jake M.", time: "10 min ago", status: "queued" },
  { song: "Tyler Childers - Feathered Indians", listener: "Sarah T.", time: "25 min ago", status: "played" },
  { song: "Sturgill Simpson - Turtles All the Way Down", listener: "Mike R.", time: "45 min ago", status: "played" },
  { song: "Colter Wall - Sleeping on the Blacktop", listener: "Dani P.", time: "1 hour ago", status: "played" },
  { song: "Jason Isbell - Cover Me Up", listener: "Chris K.", time: "1 hour ago", status: "queued" },
  { song: "Charley Crockett - Welcome to Hard Times", listener: "Amy W.", time: "2 hours ago", status: "played" },
];

const ACTIVE_CONTESTS = [
  { name: "Americana Music Trivia", entries: 124, endDate: "Feb 20", prize: "Concert Tickets", status: "active" },
  { name: "Listener of the Month", entries: 89, endDate: "Feb 28", prize: "Merch Package", status: "active" },
  { name: "Song Request Marathon", entries: 256, endDate: "Feb 15", prize: "Vinyl Collection", status: "ended" },
];

const SOCIAL_METRICS = [
  { platform: "Instagram", followers: "2,340", engagement: "4.2%", trend: "up" },
  { platform: "Facebook", followers: "5,120", engagement: "3.8%", trend: "up" },
  { platform: "Twitter/X", followers: "1,890", engagement: "2.1%", trend: "stable" },
  { platform: "TikTok", followers: "980", engagement: "6.5%", trend: "up" },
];

export default function ListenersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-rose-50">
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
              href="/elliot"
              className="inline-flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Elliot Analytics</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-8 h-8 text-teal-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Listener Services Dashboard</h1>
              <p className="text-gray-600">Managed by Ivy Brennan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Engagement Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Music className="w-6 h-6 text-teal-600" />
              <div className="text-sm font-medium text-gray-600">Requests This Week</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">48</div>
            <div className="text-xs text-teal-600">+12% from last week</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Star className="w-6 h-6 text-amber-600" />
              <div className="text-sm font-medium text-gray-600">Satisfaction Score</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">4.7/5</div>
            <div className="text-xs text-amber-600">Based on surveys</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Trophy className="w-6 h-6 text-violet-600" />
              <div className="text-sm font-medium text-gray-600">Contest Participation</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">320</div>
            <div className="text-xs text-violet-600">Active entries</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Heart className="w-6 h-6 text-rose-600" />
              <div className="text-sm font-medium text-gray-600">Community Health</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">92%</div>
            <div className="text-xs text-rose-600">Engagement score</div>
          </div>
        </section>

        {/* Request Board */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Song Requests</h2>
          <div className="space-y-3">
            {RECENT_REQUESTS.map((req, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <Music className="w-10 h-10 text-gray-400" />
                  <div>
                    <div className="font-semibold text-gray-900">{req.song}</div>
                    <div className="text-sm text-gray-600">Requested by {req.listener}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">{req.time}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    req.status === "played"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {req.status === "played" ? "Played" : "Queued"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contest Status */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Contests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACTIVE_CONTESTS.map((contest, idx) => (
              <div key={idx} className={`rounded-lg p-5 border-2 ${
                contest.status === "active"
                  ? "border-teal-200 bg-teal-50"
                  : "border-gray-200 bg-gray-50"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <Trophy className={`w-5 h-5 ${contest.status === "active" ? "text-teal-600" : "text-gray-400"}`} />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    contest.status === "active"
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {contest.status === "active" ? "Active" : "Ended"}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{contest.name}</h3>
                <div className="text-sm text-gray-600 mb-3">Prize: {contest.prize}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{contest.entries} entries</span>
                  <span className="text-gray-500">Ends {contest.endDate}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social Media Monitoring */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {SOCIAL_METRICS.map((social, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="font-semibold text-gray-900 mb-2">{social.platform}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{social.followers}</div>
                <div className="text-sm text-gray-600 mb-2">followers</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Engagement: {social.engagement}</span>
                  <span className={`flex items-center space-x-1 text-xs font-medium ${
                    social.trend === "up" ? "text-green-600" : "text-gray-500"
                  }`}>
                    {social.trend === "up" && <TrendingUp className="w-3 h-3" />}
                    <span>{social.trend === "up" ? "Growing" : "Stable"}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Community Health */}
        <section className="bg-gradient-to-br from-teal-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Community Health Score</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-1">92%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-1">96%</div>
              <div className="text-sm text-gray-600">Request Fulfillment</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-violet-600 mb-1">88%</div>
              <div className="text-sm text-gray-600">Social Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-600 mb-1">94%</div>
              <div className="text-sm text-gray-600">Feedback Response</div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="flex flex-wrap gap-4">
          <Link href="/elliot" className="inline-flex items-center space-x-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
            <Users className="w-4 h-4" />
            <span>Elliot&apos;s Analytics</span>
          </Link>
          <Link href="/elliot/community" className="inline-flex items-center space-x-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors">
            <Heart className="w-4 h-4" />
            <span>Community Hub</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
