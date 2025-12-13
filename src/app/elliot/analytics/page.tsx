"use client";

import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, Clock, Target, BarChart3, Activity } from "lucide-react";

export default function ListenerAnalyticsPage() {
  const stats = {
    dailyActiveUsers: 1250,
    weeklyActiveUsers: 3400,
    monthlyActiveUsers: 5600,
    avgSessionLength: 28, // minutes
    totalSessions: 8500,
    totalListeningHours: 3967,
    returningListeners: 52, // percent
    newListeners: 180,
    churnedListeners: 45,
    listeningStreak: 8, // days average
  };

  const listenerTiers = [
    { tier: "Casual", count: 680, percentage: 54, sessions: "1-2/week", color: "blue" },
    { tier: "Regular", count: 420, percentage: 34, sessions: "3-4/week", color: "green" },
    { tier: "Super Fan", count: 125, percentage: 10, sessions: "5+/week", color: "purple" },
    { tier: "Evangelist", count: 25, percentage: 2, sessions: "Daily + Shares", color: "orange" },
  ];

  const timeSlotData = [
    { slot: "Morning (6am-10am)", listeners: 450, avgSession: 32, topDJ: "Hank Westwood" },
    { slot: "Midday (10am-2pm)", listeners: 280, avgSession: 22, topDJ: "Loretta Merrick" },
    { slot: "Afternoon (2pm-6pm)", listeners: 380, avgSession: 28, topDJ: "Marcus Holloway" },
    { slot: "Evening (6pm-10pm)", listeners: 320, avgSession: 35, topDJ: "Carmen Vasquez" },
    { slot: "Late Night (10pm-6am)", listeners: 140, avgSession: 45, topDJ: "Cody Rampart" },
  ];

  const topArtists = [
    { name: "Sarah Blake", plays: 1240, newListeners: 45, avgCompletion: 87 },
    { name: "The Mountain Brothers", plays: 980, newListeners: 32, avgCompletion: 82 },
    { name: "Willow Creek", plays: 856, newListeners: 28, avgCompletion: 91 },
    { name: "Dakota Sky", plays: 742, newListeners: 25, avgCompletion: 85 },
    { name: "River Run Band", plays: 698, newListeners: 22, avgCompletion: 88 },
  ];

  const deviceBreakdown = [
    { device: "Mobile", count: 720, percentage: 58 },
    { device: "Desktop", count: 380, percentage: 30 },
    { device: "Smart Speaker", count: 150, percentage: 12 },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/elliot"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Elliot Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Listener Analytics</h1>
              <p className="text-gray-600">
                Deep insights into listener behavior and engagement
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Users className="w-6 h-6 text-indigo-600" />}
            label="Daily Active Users"
            value={stats.dailyActiveUsers.toLocaleString()}
            change="+12%"
            positive={true}
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="Weekly Active"
            value={stats.weeklyActiveUsers.toLocaleString()}
            change="+18%"
            positive={true}
          />
          <MetricCard
            icon={<Clock className="w-6 h-6 text-purple-600" />}
            label="Avg Session"
            value={`${stats.avgSessionLength} min`}
            change="+3 min"
            positive={true}
          />
          <MetricCard
            icon={<Target className="w-6 h-6 text-orange-600" />}
            label="Retention Rate"
            value={`${stats.returningListeners}%`}
            change="+5%"
            positive={true}
          />
        </section>

        {/* Listener Tier Distribution */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Listener Tier Distribution</h2>
          <p className="text-gray-600 text-sm mb-6">
            Current listener base: {stats.monthlyActiveUsers.toLocaleString()} monthly active users
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {listenerTiers.map((tier) => (
              <TierCard key={tier.tier} {...tier} />
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 mb-2">Tier Progression Goal</h3>
              <p className="text-sm text-indigo-700">
                Focus: Convert Casual listeners to Regular (+15% target). Currently at {listenerTiers[0].count} casual listeners.
              </p>
            </div>
          </div>
        </section>

        {/* Listening Patterns */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Listening Patterns by Time Slot</h2>

          <div className="space-y-4">
            {timeSlotData.map((slot) => (
              <TimeSlotRow key={slot.slot} {...slot} />
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <Activity className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Peak Time:</strong> Morning (6am-10am) with 450 average listeners. Late night shows highest engagement (45 min avg session).
              </div>
            </div>
          </div>
        </section>

        {/* Top Performing Artists */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Top Performing Artists</h2>
          <p className="text-gray-600 text-sm mb-6">
            Artists driving the most engagement and new listener acquisition
          </p>

          <div className="space-y-3">
            {topArtists.map((artist, idx) => (
              <ArtistRow key={artist.name} rank={idx + 1} {...artist} />
            ))}
          </div>
        </section>

        {/* Device & Platform */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Device & Platform Breakdown</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deviceBreakdown.map((device) => (
              <DeviceCard key={device.device} {...device} />
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4">Recommendations</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-indigo-600">•</span>
                <span>Mobile is dominant (58%) - prioritize mobile app experience</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-600">•</span>
                <span>Smart speaker adoption growing - optimize for voice commands</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-indigo-600">•</span>
                <span>Desktop users have longer sessions - great for work/background listening</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Stats Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatBox
            label="Total Sessions This Month"
            value={stats.totalSessions.toLocaleString()}
            icon={<Activity className="w-8 h-8 text-blue-600" />}
          />
          <StatBox
            label="Total Listening Hours"
            value={stats.totalListeningHours.toLocaleString()}
            icon={<Clock className="w-8 h-8 text-green-600" />}
          />
          <StatBox
            label="Avg Listening Streak"
            value={`${stats.listeningStreak} days`}
            icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
          />
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  change,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className={`text-xs font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {change} from last week
      </div>
    </div>
  );
}

function TierCard({ tier, count, percentage, sessions, color }: any) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-green-100 text-green-700 border-green-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
  }[color];

  return (
    <div className={`rounded-lg p-4 border-2 ${colorClasses}`}>
      <div className="text-xs font-bold mb-2">{tier}</div>
      <div className="text-3xl font-bold mb-1">{count}</div>
      <div className="text-xs mb-3">{percentage}% of listeners</div>
      <div className="text-xs opacity-75">{sessions}</div>
    </div>
  );
}

function TimeSlotRow({ slot, listeners, avgSession, topDJ }: any) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-900">{slot}</div>
        <div className="text-sm text-gray-600">{listeners} avg listeners</div>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>Avg session: {avgSession} min</div>
        <div>Top DJ: {topDJ}</div>
      </div>
    </div>
  );
}

function ArtistRow({ rank, name, plays, newListeners, avgCompletion }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
          {rank}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{name}</div>
          <div className="text-sm text-gray-600">{plays.toLocaleString()} plays</div>
        </div>
      </div>
      <div className="flex items-center space-x-6 text-sm">
        <div className="text-center">
          <div className="text-green-600 font-semibold">+{newListeners}</div>
          <div className="text-xs text-gray-500">new listeners</div>
        </div>
        <div className="text-center">
          <div className="text-indigo-600 font-semibold">{avgCompletion}%</div>
          <div className="text-xs text-gray-500">completion</div>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ device, count, percentage }: any) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border-2 border-gray-200 text-center">
      <div className="text-sm text-gray-600 mb-2">{device}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{count}</div>
      <div className="text-lg font-semibold text-indigo-600">{percentage}%</div>
    </div>
  );
}

function StatBox({ label, value, icon }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
      <div className="flex justify-center mb-3">{icon}</div>
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
