"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Radio,
  Users,
  Music,
  DollarSign,
  Loader2,
  RefreshCw,
  Plus,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface StationStat {
  id: string;
  name: string;
  callSign: string | null;
  genre: string;
  tagline: string | null;
  stationCode: string | null;
  isActive: boolean;
  logoUrl: string | null;
  createdAt: string;
  songCount: number;
  djCount: number;
  sponsorAdCount: number;
  showCount: number;
  sponsorRevenue: number;
}

interface NetworkData {
  stations: StationStat[];
  summary: {
    totalStations: number;
    activeStations: number;
    totalRevenue: number;
    totalDJs: number;
    totalSongs: number;
  };
}

export default function NetworkDashboard() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/operator/network");
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxRevenue = data
    ? Math.max(...data.stations.map((s) => s.sponsorRevenue), 1)
    : 1;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Radio className="w-6 h-6 text-blue-400" />
              Station Network
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Multi-station overview and performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/operator/templates"
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500"
            >
              <Plus className="w-4 h-4" />
              Add Station
            </Link>
          </div>
        </div>

        {loading && !data ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <Radio className="w-4 h-4" />
                  Total Stations
                </div>
                <div className="text-3xl font-bold">{data.summary.totalStations}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {data.summary.activeStations} active
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <DollarSign className="w-4 h-4" />
                  Monthly Revenue
                </div>
                <div className="text-3xl font-bold text-green-400">
                  ${data.summary.totalRevenue.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500 mt-1">from active sponsorships</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  Total DJs
                </div>
                <div className="text-3xl font-bold">{data.summary.totalDJs}</div>
                <div className="text-xs text-zinc-500 mt-1">across all stations</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                  <Music className="w-4 h-4" />
                  Total Songs
                </div>
                <div className="text-3xl font-bold">
                  {data.summary.totalSongs.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500 mt-1">in all libraries</div>
              </div>
            </div>

            {/* Revenue Comparison Bars */}
            {data.stations.length > 1 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Revenue by Station
                </h2>
                <div className="space-y-3">
                  {data.stations
                    .sort((a, b) => b.sponsorRevenue - a.sponsorRevenue)
                    .map((station) => (
                      <div key={station.id} className="flex items-center gap-3">
                        <span className="text-sm text-zinc-300 w-40 truncate">
                          {station.name}
                        </span>
                        <div className="flex-1 h-6 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all"
                            style={{
                              width: `${Math.max(
                                (station.sponsorRevenue / maxRevenue) * 100,
                                2
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-zinc-300 w-24 text-right">
                          ${station.sponsorRevenue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Station Card Grid */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">All Stations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.stations.map((station) => (
                  <div
                    key={station.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-zinc-100">{station.name}</h3>
                        {station.callSign && (
                          <span className="text-xs text-zinc-500 font-mono">
                            {station.callSign}
                          </span>
                        )}
                      </div>
                      {station.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Offline
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">
                      {station.genre}
                      {station.tagline && ` — ${station.tagline}`}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-zinc-800 rounded-lg py-2">
                        <div className="text-lg font-bold text-zinc-200">
                          {station.djCount}
                        </div>
                        <div className="text-xs text-zinc-500">DJs</div>
                      </div>
                      <div className="bg-zinc-800 rounded-lg py-2">
                        <div className="text-lg font-bold text-zinc-200">
                          {station.songCount}
                        </div>
                        <div className="text-xs text-zinc-500">Songs</div>
                      </div>
                      <div className="bg-zinc-800 rounded-lg py-2">
                        <div className="text-lg font-bold text-green-400">
                          ${station.sponsorRevenue}
                        </div>
                        <div className="text-xs text-zinc-500">Rev</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
            <Activity className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Could not load network data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
