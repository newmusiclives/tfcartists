"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import {
  Radio,
  Clock,
  Music,
  Users,
  CalendarDays,
  Mic,
  Wand2,
  Loader2,
  SlidersHorizontal,
  ArrowRightLeft,
  Sparkles,
} from "lucide-react";

interface Station {
  id: string;
  name: string;
  callSign: string | null;
  genre: string;
  tagline: string | null;
  stationCode: string | null;
  formatType: string | null;
  streamUrl: string | null;
  isActive: boolean;
  setupComplete: boolean;
  _count: {
    songs: number;
    clockTemplates: number;
    stationDJs: number;
    clockAssignments: number;
    imagingVoices: number;
  };
}

const actionCards = [
  {
    title: "Create Station",
    description: "Launch a new station with the 5-step wizard",
    href: "/station-admin/wizard",
    icon: Wand2,
    color: "bg-amber-500",
  },
  {
    title: "Radio Clocks",
    description: "Manage clock templates and rotation patterns",
    href: "/station-admin/clocks",
    icon: Clock,
    color: "bg-blue-500",
  },
  {
    title: "Music Library",
    description: "Browse, import, and manage your song catalog",
    href: "/station-admin/music",
    icon: Music,
    color: "bg-green-500",
  },
  {
    title: "DJ Editor",
    description: "Create and configure AI DJ personalities",
    href: "/station-admin/dj-editor",
    icon: Users,
    color: "bg-purple-500",
  },
  {
    title: "Schedule Editor",
    description: "Assign DJs to time slots across the week",
    href: "/station-admin/schedule-editor",
    icon: CalendarDays,
    color: "bg-indigo-500",
  },
  {
    title: "Station Imaging",
    description: "Configure imaging voices for promos and IDs",
    href: "/station-admin/imaging",
    icon: Mic,
    color: "bg-rose-500",
  },
  {
    title: "Show Features",
    description: "34 AI-generated radio segments: trivia, weather, polls, and more",
    href: "/station-admin/features",
    icon: Sparkles,
    color: "bg-yellow-500",
  },
  {
    title: "Stream Engineering",
    description: "Crossfade, normalization, compression, EQ, and ducking",
    href: "/station-admin/stream",
    icon: SlidersHorizontal,
    color: "bg-orange-500",
  },
  {
    title: "Show Transitions",
    description: "DJ handoffs, show intros, outros, and transition scripts",
    href: "/station-admin/transitions",
    icon: ArrowRightLeft,
    color: "bg-cyan-500",
  },
];

export default function StationAdminHub() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => setStations(data.stations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const primary = stations[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Radio className="w-8 h-8 text-amber-600" />
              Station Admin
            </h1>
            <p className="text-gray-600 mt-1">
              Manage station operations, clocks, music, DJs, and scheduling
            </p>
          </div>
          <Link
            href="/station-admin/wizard"
            className="bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            New Station
          </Link>
        </div>

        {/* Station Info Card */}
        {loading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : primary ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{primary.name}</h2>
                  {primary.callSign && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {primary.callSign}
                    </span>
                  )}
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      primary.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {primary.isActive ? "On Air" : "Off Air"}
                  </span>
                </div>
                {primary.tagline && (
                  <p className="text-gray-500 mt-1 italic">{primary.tagline}</p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  {primary.genre}
                  {primary.formatType && ` / ${primary.formatType}`}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{primary._count.songs}</div>
                  <div className="text-xs text-gray-500">Songs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{primary._count.stationDJs}</div>
                  <div className="text-xs text-gray-500">DJs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{primary._count.clockTemplates}</div>
                  <div className="text-xs text-gray-500">Clocks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{primary._count.imagingVoices}</div>
                  <div className="text-xs text-gray-500">Voices</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 text-center">
            <p className="text-amber-800 font-medium">No stations yet.</p>
            <p className="text-amber-600 text-sm mt-1">
              Use the wizard to create your first station, or run the seed script.
            </p>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actionCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`${card.color} text-white p-3 rounded-lg group-hover:scale-105 transition-transform`}
                >
                  <card.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{card.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
