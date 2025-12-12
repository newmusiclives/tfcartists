"use client";

import Link from "next/link";
import { ArrowLeft, Phone, Calendar, User, Clock, CheckCircle } from "lucide-react";

export default function CallSchedulePage() {
  const upcomingCalls = [
    {
      id: 1,
      business: "Sunrise Bakery",
      contact: "Sarah Miller",
      phone: "+1 (555) 123-4567",
      date: "Today",
      time: "2:00 PM",
      duration: "30 min",
      type: "discovery",
      notes: "Local bakery interested in morning show sponsorship",
      status: "scheduled",
    },
    {
      id: 2,
      business: "North Woods Outfitters",
      contact: "Mike Chen",
      phone: "+1 (555) 234-5678",
      date: "Today",
      time: "4:30 PM",
      duration: "45 min",
      type: "pitch",
      notes: "Second call - present Tier 2 package",
      status: "scheduled",
    },
    {
      id: 3,
      business: "The Book Nook",
      contact: "Lisa Garcia",
      phone: "+1 (555) 345-6789",
      date: "Tomorrow",
      time: "10:00 AM",
      duration: "30 min",
      type: "close",
      notes: "Ready to sign - close on Tier 1",
      status: "scheduled",
    },
    {
      id: 4,
      business: "Mountain Peak Coffee",
      contact: "James Wilson",
      phone: "+1 (555) 456-7890",
      date: "Tomorrow",
      time: "2:00 PM",
      duration: "30 min",
      type: "discovery",
      notes: "Coffee roaster with 3 locations",
      status: "scheduled",
    },
    {
      id: 5,
      business: "Red Rock Brewery",
      contact: "Emma Davis",
      phone: "+1 (555) 567-8901",
      date: "Dec 13",
      time: "11:00 AM",
      duration: "45 min",
      type: "pitch",
      notes: "Interested in weekend show sponsorship",
      status: "scheduled",
    },
  ];

  const completedCalls = [
    {
      id: 6,
      business: "Craftworks Brewery",
      contact: "Tom Anderson",
      date: "Yesterday",
      time: "3:00 PM",
      type: "close",
      outcome: "Closed - Tier 3",
      status: "completed",
    },
    {
      id: 7,
      business: "The Vinyl Cafe",
      contact: "Rachel Kim",
      date: "Dec 9",
      time: "1:00 PM",
      type: "pitch",
      outcome: "Follow-up scheduled",
      status: "completed",
    },
  ];

  const stats = {
    today: 2,
    thisWeek: 8,
    closeRate: 67,
    avgCallDuration: 35,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/harper"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Harper Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Phone className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Call Schedule</h1>
              <p className="text-gray-600">
                Manage discovery calls, pitches, and closings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={<Calendar className="w-6 h-6 text-blue-600" />}
            label="Today"
            value={stats.today}
            subtitle="calls scheduled"
          />
          <StatCard
            icon={<Clock className="w-6 h-6 text-purple-600" />}
            label="This Week"
            value={stats.thisWeek}
            subtitle="total calls"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            label="Close Rate"
            value={`${stats.closeRate}%`}
            subtitle="last 30 days"
          />
          <StatCard
            icon={<Phone className="w-6 h-6 text-orange-600" />}
            label="Avg Duration"
            value={`${stats.avgCallDuration} min`}
            subtitle="per call"
          />
        </section>

        {/* Upcoming Calls */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Upcoming Calls</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Schedule New Call
            </button>
          </div>

          <div className="space-y-4">
            {upcomingCalls.map((call) => (
              <CallCard key={call.id} call={call} />
            ))}
          </div>
        </section>

        {/* Recent Completed Calls */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Recent Completed Calls</h2>

          <div className="space-y-3">
            {completedCalls.map((call) => (
              <CompletedCallRow key={call.id} call={call} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function CallCard({ call }: { call: any }) {
  const typeConfig = {
    discovery: { color: "blue", label: "Discovery", icon: "🔍" },
    pitch: { color: "purple", label: "Pitch", icon: "📊" },
    close: { color: "green", label: "Closing", icon: "✅" },
  }[call.type] || { color: "gray", label: call.type, icon: "📞" };

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{call.business}</h3>
            <span className={`text-xs px-2 py-1 rounded-full bg-${typeConfig.color}-100 text-${typeConfig.color}-700 font-medium`}>
              {typeConfig.icon} {typeConfig.label}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{call.contact}</span>
              <span className="text-gray-400">•</span>
              <span>{call.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{call.date} at {call.time}</span>
              <span className="text-gray-400">•</span>
              <Clock className="w-4 h-4" />
              <span>{call.duration}</span>
            </div>
          </div>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Join Call
        </button>
      </div>

      {call.notes && (
        <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
          <strong>Notes:</strong> {call.notes}
        </div>
      )}
    </div>
  );
}

function CompletedCallRow({ call }: { call: any }) {
  const typeConfig = {
    discovery: { color: "blue", label: "Discovery" },
    pitch: { color: "purple", label: "Pitch" },
    close: { color: "green", label: "Closing" },
  }[call.type] || { color: "gray", label: call.type };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4 flex-1">
        <CheckCircle className="w-8 h-8 text-green-600" />
        <div>
          <div className="font-semibold text-gray-900">{call.business}</div>
          <div className="text-sm text-gray-600">{call.contact}</div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm text-gray-900">{call.date} at {call.time}</div>
          <div className={`text-xs text-${typeConfig.color}-600 font-medium`}>{typeConfig.label}</div>
        </div>
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
          {call.outcome}
        </div>
      </div>
    </div>
  );
}
