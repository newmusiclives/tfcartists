"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Radio,
  Users,
  Music,
  Clock,
  Megaphone,
  UserCircle,
  CalendarDays,
  ListMusic,
  BarChart3,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";

interface StationData {
  _count?: {
    songs?: number;
    stationDJs?: number;
    clockTemplates?: number;
  };
}

interface SponsorAd {
  id: string;
  isActive: boolean;
}

export default function ParkerDashboardPage() {
  const [stationData, setStationData] = useState<StationData | null>(null);
  const [activeAds, setActiveAds] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [stationRes, adsRes] = await Promise.all([
          fetch("/api/stations"),
          fetch("/api/sponsor-ads"),
        ]);

        if (stationRes.ok) {
          const data = await stationRes.json();
          const station = data.stations?.[0] || data;
          setStationData(station);
        }

        if (adsRes.ok) {
          const data = await adsRes.json();
          const ads: SponsorAd[] = data.ads || data || [];
          setActiveAds(Array.isArray(ads) ? ads.filter((a) => a.isActive).length : 0);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const songCount = stationData?._count?.songs ?? 0;
  const djCount = stationData?._count?.stationDJs ?? 0;
  const clockCount = stationData?._count?.clockTemplates ?? 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/admin"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin</span>
            </Link>
            <Link
              href="/parker/team"
              className="inline-flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span>View Team</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Radio className="w-8 h-8 text-rose-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Parker Dashboard</h1>
              <p className="text-gray-600">Station Management & Operations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Music className="w-6 h-6 text-rose-600" />}
            label="Songs in Library"
            value={songCount}
            subtitle="Music library"
            color="rose"
          />
          <MetricCard
            icon={<Users className="w-6 h-6 text-indigo-600" />}
            label="Active DJs"
            value={djCount}
            subtitle="Station roster"
            color="indigo"
          />
          <MetricCard
            icon={<Clock className="w-6 h-6 text-violet-600" />}
            label="Clock Templates"
            value={clockCount}
            subtitle="Format clocks"
            color="violet"
          />
          <MetricCard
            icon={<Megaphone className="w-6 h-6 text-orange-600" />}
            label="Active Ads"
            value={activeAds}
            subtitle="Sponsor spots"
            color="orange"
          />
        </section>

        {/* Team Members */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Users className="w-6 h-6 text-rose-600" />
            <span>Team Members</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: "Parker Hayes", role: "Station Director", avatar: "PH", color: "bg-rose-100 text-rose-600", status: "Cross-team coordination", kpi: "Station lead" },
              { name: "Sage Calloway", role: "Program Director", avatar: "SC", color: "bg-indigo-100 text-indigo-600", status: "Show scheduling & format", kpi: "Programming" },
              { name: "Wren Nakamura", role: "Music Director", avatar: "WN", color: "bg-violet-100 text-violet-600", status: "Music rotation mgmt", kpi: `${songCount} songs` },
              { name: "Nolan Torres", role: "Traffic Manager", avatar: "NT", color: "bg-orange-100 text-orange-600", status: "Ad inventory & spots", kpi: `${activeAds} ads` },
              { name: "Ivy Brennan", role: "Listener Services", avatar: "IB", color: "bg-teal-100 text-teal-600", status: "Community engagement", kpi: "Listener care" },
            ].map((member, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border-2 border-gray-200 hover:border-rose-300 transition-colors">
                <div className={`w-10 h-10 ${member.color} rounded-lg flex items-center justify-center text-sm font-bold mb-2`}>{member.avatar}</div>
                <div className="font-semibold text-gray-900 text-sm">{member.name}</div>
                <div className="text-xs text-gray-600 mb-2">{member.role}</div>
                <div className="text-xs text-rose-600 mb-2 truncate">{member.status}</div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700">{member.kpi}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Station Health */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-rose-600" />
            <span>Station Health</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-5 border border-green-200">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Format Compliance</span>
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">98%</div>
              <div className="text-sm text-green-600">Within format guidelines</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Schedule Coverage</span>
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">100%</div>
              <div className="text-sm text-blue-600">All dayparts staffed</div>
            </div>
            <div className="bg-violet-50 rounded-lg p-5 border border-violet-200">
              <div className="flex items-center space-x-2 mb-3">
                <BarChart3 className="w-5 h-5 text-violet-600" />
                <span className="text-sm font-semibold text-violet-700">Music Rotation</span>
              </div>
              <div className="text-3xl font-bold text-violet-900 mb-1">Healthy</div>
              <div className="text-sm text-violet-600">Categories balanced</div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <QuickActionCard
            title="Programming"
            description="Show scheduling, format compliance, and daypart strategy"
            href="/parker/programming"
            icon={<CalendarDays className="w-8 h-8 text-indigo-600" />}
            managedBy="Sage Calloway"
          />
          <QuickActionCard
            title="Music Library"
            description="Rotation management, category balance, and new music"
            href="/parker/music"
            icon={<ListMusic className="w-8 h-8 text-violet-600" />}
            managedBy="Wren Nakamura"
          />
          <QuickActionCard
            title="Traffic & Ads"
            description="Commercial scheduling, ad inventory, and sponsor fulfillment"
            href="/parker/traffic"
            icon={<Megaphone className="w-8 h-8 text-orange-600" />}
            managedBy="Nolan Torres"
          />
          <QuickActionCard
            title="Listener Services"
            description="Feedback, requests, contests, and community engagement"
            href="/parker/listeners"
            icon={<MessageCircle className="w-8 h-8 text-teal-600" />}
            managedBy="Ivy Brennan"
          />
          <QuickActionCard
            title="Station Admin"
            description="Full station administration and configuration tools"
            href="/station-admin"
            icon={<Radio className="w-8 h-8 text-rose-600" />}
            managedBy="Parker Hayes"
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
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
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

function QuickActionCard({
  title,
  description,
  href,
  icon,
  managedBy,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  managedBy?: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-rose-300">
        <div className="flex items-center justify-between mb-3">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        {managedBy && (
          <p className="text-xs text-rose-600 font-medium mb-1">Managed by {managedBy}</p>
        )}
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
