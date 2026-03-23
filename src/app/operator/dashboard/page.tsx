"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Radio, Music, Users, Mic, Clock, Settings, Building2,
  BarChart3, Megaphone, ArrowRight, Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OnboardingChecklist } from "@/components/onboarding-checklist";

interface StationData {
  id: string;
  name: string;
  callSign: string | null;
  genre: string;
  isActive: boolean;
  stationCode: string | null;
  streamUrl: string | null;
  _count: {
    songs: number;
    clockTemplates: number;
    stationDJs: number;
    imagingVoices: number;
    clockAssignments: number;
  };
}

interface DashboardData {
  stations: StationData[];
  artistCount: number;
  sponsorCount: number;
  listenerCount: number;
}

export default function OperatorDashboard() {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const status = sessionResult?.status ?? "loading";
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      Promise.all([
        fetch("/api/stations").then((r) => r.json()),
        fetch("/api/artists?limit=1").then((r) => r.json()).catch(() => ({ pagination: { total: 0 } })),
        fetch("/api/harper/sponsors?limit=1").then((r) => r.json()).catch(() => ({ pagination: { total: 0 } })),
        fetch("/api/listeners?limit=1").then((r) => r.json()).catch(() => ({ total: 0 })),
      ]).then(([stationsData, artistsData, sponsorsData, listenersData]) => {
        const stations = stationsData.stations || [];
        if (stations.length === 0) {
          router.push("/station-admin/wizard");
          return;
        }
        setData({
          stations,
          artistCount: artistsData.pagination?.total || 0,
          sponsorCount: sponsorsData.pagination?.total || 0,
          listenerCount: listenersData.total || 0,
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
      </div>
    );
  }

  const station = data?.stations?.[0];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-amber-700" />
              <div>
                <h1 className="font-bold text-gray-900">Operator Dashboard</h1>
                <p className="text-xs text-gray-500">{session?.user?.name || "Operator"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                Admin Panel
              </Link>
              <Link href="/station-admin" className="text-sm text-amber-700 hover:text-amber-800 font-medium">
                Station Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onboarding Checklist */}
        <OnboardingChecklist
          stationData={
            station
              ? {
                  id: station.id,
                  _count: station._count,
                  streamUrl: station.streamUrl,
                  clockAssignmentCount: station._count.clockAssignments,
                }
              : null
          }
          artistCount={data?.artistCount || 0}
          sponsorCount={data?.sponsorCount || 0}
        />

        {/* Station Overview */}
        {station ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Radio className="w-8 h-8 text-amber-700" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{station.name}</h2>
                  <p className="text-gray-500">{station.callSign ? `${station.callSign} — ` : ""}{station.genre}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                station.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {station.isActive ? "On Air" : "Offline"}
              </span>
            </div>

            {/* Station Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Music} label="Songs" value={station._count.songs} href="/station-admin/music" />
              <StatCard icon={Mic} label="DJs" value={station._count.stationDJs} href="/station-admin/dj-editor" />
              <StatCard icon={Clock} label="Clock Templates" value={station._count.clockTemplates} href="/station-admin/clocks" />
              <StatCard icon={Radio} label="Imaging Voices" value={station._count.imagingVoices} href="/station-admin/imaging" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-8 mb-8 text-center">
            <Radio className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Station Yet</h2>
            <p className="text-gray-500 mb-4">Create your first station to get started.</p>
            <Link
              href="/station-admin/wizard"
              className="inline-flex items-center space-x-2 bg-amber-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-800"
            >
              <span>Launch Station Wizard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard icon={Users} label="Artists" value={data?.artistCount || 0} color="purple" href="/riley" />
          <MetricCard icon={Megaphone} label="Sponsors" value={data?.sponsorCount || 0} color="green" href="/harper" />
          <MetricCard icon={BarChart3} label="Listeners" value={data?.listenerCount || 0} color="blue" href="/elliot" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction href="/station-admin/music/import" label="Import Music" icon={Music} />
            <QuickAction href="/station-admin/schedule-editor" label="Edit Schedule" icon={Clock} />
            <QuickAction href="/station-admin/sponsor-ads" label="Manage Ads" icon={Megaphone} />
            <QuickAction href="/station-admin/branding" label="Station Branding" icon={Settings} />
            <QuickAction href="/operator/analytics" label="View Analytics" icon={BarChart3} />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, href }: {
  icon: LucideIcon; label: string; value: number; href: string;
}) {
  return (
    <Link href={href} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-2 mb-1">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </Link>
  );
}

function MetricCard({ icon: Icon, label, value, color, href }: {
  icon: LucideIcon; label: string; value: number; color: string; href: string;
}) {
  const colors: Record<string, string> = {
    purple: "bg-purple-50 text-purple-700",
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <Link href={href} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${colors[color] || "bg-gray-50 text-gray-700"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </Link>
  );
}

function QuickAction({ href, label, icon: Icon }: {
  href: string; label: string; icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
    >
      <Icon className="w-5 h-5 text-amber-700" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
    </Link>
  );
}
