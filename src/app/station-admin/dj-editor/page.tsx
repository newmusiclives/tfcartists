"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SharedNav } from "@/components/shared-nav";
import { Users, Plus, Loader2 } from "lucide-react";

interface DJData {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  vibe: string | null;
  photoUrl: string | null;
  colorPrimary: string | null;
  isActive: boolean;
  isWeekend: boolean;
  shows: { id: string; name: string; dayOfWeek: number; startTime: string; endTime: string }[];
  _count: { clockAssignments: number };
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getShowTime(dj: DJData): string {
  if (dj.shows.length === 0) return "No shows assigned";
  const show = dj.shows[0];
  const day = dj.isWeekend ? (show.dayOfWeek === 6 ? "Sat" : "Sun") : "Weekdays";
  return `${day} ${show.startTime}–${show.endTime}`;
}

export default function DJEditorPage() {
  const [djs, setDjs] = useState<DJData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationId, setStationId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          setStationId(stations[0].id);
          return fetch(`/api/station-djs?stationId=${stations[0].id}`);
        }
        // Fallback: get all DJs
        return fetch("/api/station-djs");
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) setDjs(data.djs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              DJ Editor
            </h1>
            <p className="text-gray-600 mt-1">Create and configure AI DJ personalities</p>
          </div>
          <Link
            href="/station-admin/wizard"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New DJ
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : djs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No DJs configured yet.</p>
            <p className="text-sm text-gray-400 mt-1">Run the seed script or create DJs via the wizard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {djs.map((dj) => (
              <Link
                key={dj.id}
                href={`/station-admin/dj-editor/${dj.id}`}
                className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  {dj.photoUrl ? (
                    <Image
                      src={dj.photoUrl}
                      alt={dj.name}
                      width={72}
                      height={72}
                      className="w-[72px] h-[72px] rounded-full object-cover flex-shrink-0 ring-2 ring-purple-100"
                    />
                  ) : (
                    <div
                      className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                      style={{ backgroundColor: dj.colorPrimary || "#6b7280" }}
                    >
                      {dj.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                        {dj.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          dj.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {dj.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {dj.tagline && (
                      <p className="text-sm text-gray-500 italic mt-0.5 truncate">{dj.tagline}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{getShowTime(dj)}</span>
                      {dj.isWeekend && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Weekend</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
