"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import { ArrowLeft, Loader2, Music, Clock, Quote, Mic } from "lucide-react";

interface DJProfile {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  background: string | null;
  vibe: string | null;
  tagline: string | null;
  photoUrl: string | null;
  colorPrimary: string | null;
  catchPhrases: string[];
  musicalFocus: string | null;
  onAirStyle: string | null;
  quirksAndHabits: string | null;
  atmosphere: string | null;
  philosophy: string | null;
  hometown: string | null;
  showFormat: string | null;
  age: number | null;
  isActive: boolean;
  isWeekend: boolean;
  shows: { id: string; name: string; dayOfWeek: number; startTime: string; endTime: string }[];
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DJProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [dj, setDj] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchDJ() {
      try {
        const res = await fetch("/api/station-djs");
        if (res.ok) {
          const data = await res.json();
          const djs: DJProfile[] = data.djs || [];
          const found = djs.find((d) => d.slug === slug);
          if (found) {
            // Fetch full profile with details
            const detailRes = await fetch(`/api/station-djs/${found.id}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              setDj(detailData.dj || found);
            } else {
              setDj(found);
            }
          } else {
            setNotFound(true);
          }
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchDJ();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (notFound || !dj) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Mic className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">DJ Not Found</h1>
          <p className="text-gray-500 mb-6">We couldn&apos;t find a DJ with that profile.</p>
          <Link href="/" className="text-amber-600 hover:text-amber-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const showSchedule = dj.shows.map((show) => ({
    day: DAYS[show.dayOfWeek] || "Weekdays",
    time: `${show.startTime} - ${show.endTime}`,
    name: show.name,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-8">
          <div
            className="h-32 w-full"
            style={{ background: `linear-gradient(135deg, ${dj.colorPrimary || "#6b7280"}, ${dj.colorPrimary || "#6b7280"}88)` }}
          />
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex items-end gap-6">
              {dj.photoUrl ? (
                <img
                  src={dj.photoUrl}
                  alt={dj.name}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-3xl ring-4 ring-white shadow-lg"
                  style={{ backgroundColor: dj.colorPrimary || "#6b7280" }}
                >
                  {dj.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
              )}
              <div className="pb-2">
                <h1 className="text-3xl font-bold text-gray-900">{dj.name}</h1>
                {dj.tagline && (
                  <p className="text-gray-500 italic mt-1">{dj.tagline}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  {dj.vibe && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {dj.vibe}
                    </span>
                  )}
                  {dj.isWeekend && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      Weekend
                    </span>
                  )}
                  {dj.hometown && (
                    <span className="text-xs text-gray-500">{dj.hometown}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            {dj.bio && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-700 whitespace-pre-line">{dj.bio}</p>
              </div>
            )}

            {/* Background */}
            {dj.background && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="font-semibold text-gray-900 mb-3">Background</h2>
                <p className="text-sm text-gray-700 whitespace-pre-line">{dj.background}</p>
              </div>
            )}

            {/* On-Air Style */}
            {(dj.onAirStyle || dj.atmosphere || dj.philosophy) && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="font-semibold text-gray-900 mb-3">On-Air Style</h2>
                {dj.onAirStyle && <p className="text-sm text-gray-700 mb-3">{dj.onAirStyle}</p>}
                {dj.atmosphere && (
                  <div className="mb-3">
                    <span className="text-xs font-medium text-gray-500">Atmosphere: </span>
                    <span className="text-sm text-gray-700">{dj.atmosphere}</span>
                  </div>
                )}
                {dj.philosophy && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Philosophy: </span>
                    <span className="text-sm text-gray-700">{dj.philosophy}</span>
                  </div>
                )}
              </div>
            )}

            {/* Catchphrases */}
            {dj.catchPhrases && dj.catchPhrases.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-amber-600" />
                  Catchphrases
                </h2>
                <div className="space-y-2">
                  {dj.catchPhrases.map((phrase, i) => (
                    <div key={i} className="text-sm text-gray-700 bg-amber-50 rounded-lg px-4 py-2 border border-amber-100">
                      &ldquo;{phrase}&rdquo;
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Show Schedule */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Show Schedule
              </h2>
              {showSchedule.length > 0 ? (
                <div className="space-y-2">
                  {showSchedule.map((show, i) => (
                    <div key={i} className="text-sm">
                      <div className="font-medium text-gray-900">{show.name}</div>
                      <div className="text-gray-500">{show.day} {show.time}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {dj.isWeekend ? "Weekends" : "Weekdays"} on North Country Radio
                </p>
              )}
            </div>

            {/* Musical Focus */}
            {dj.musicalFocus && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4 text-gray-400" />
                  Musical Focus
                </h2>
                <p className="text-sm text-gray-700">{dj.musicalFocus}</p>
              </div>
            )}

            {/* Quick Facts */}
            {(dj.age || dj.showFormat || dj.quirksAndHabits) && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h2 className="font-semibold text-gray-900 mb-3">Quick Facts</h2>
                <div className="space-y-2 text-sm">
                  {dj.age && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Age</span>
                      <span className="text-gray-900">{dj.age}</span>
                    </div>
                  )}
                  {dj.showFormat && (
                    <div>
                      <span className="text-gray-500">Show Format: </span>
                      <span className="text-gray-900">{dj.showFormat}</span>
                    </div>
                  )}
                  {dj.quirksAndHabits && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-500 block mb-1">Quirks & Habits</span>
                      <span className="text-gray-700">{dj.quirksAndHabits}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
