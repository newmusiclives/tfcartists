"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Loader2 } from "lucide-react";
import { StationName } from "@/components/station-name";

interface DJShow {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface DJData {
  id: string;
  name: string;
  slug: string;
  bio: string;
  age: string | null;
  background: string | null;
  vibe: string | null;
  tagline: string | null;
  musicalFocus: string | null;
  personalityTraits: string | null;
  photoUrl: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  isActive: boolean;
  isWeekend: boolean;
  shows: DJShow[];
}

function parseTraits(traits: string | null): string[] {
  if (!traits) return [];
  try {
    const parsed = JSON.parse(traits);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Try comma-separated
    return traits.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "pm" : "am";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return m === "00" ? `${display}:00${suffix}` : `${display}:${m}${suffix}`;
}

function getShowTimeLabel(dj: DJData): string {
  if (dj.shows.length === 0) return "";
  const show = dj.shows[0];
  return `${formatTime(show.startTime)} – ${formatTime(show.endTime)}`;
}

function DJPhoto({ dj, size = 80 }: { dj: DJData; size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (dj.photoUrl && !imgError) {
    return (
      <Image
        src={dj.photoUrl}
        alt={dj.name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: colored initials circle
  const initials = dj.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        backgroundColor: dj.colorPrimary || "#6b7280",
      }}
    >
      {initials}
    </div>
  );
}

function DJCard({ dj }: { dj: DJData }) {
  const traits = parseTraits(dj.personalityTraits);
  const color = `bg-gradient-to-br from-[${dj.colorPrimary || "#b45309"}] to-[${dj.colorSecondary || "#d97706"}]`;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div
        className="text-white p-6"
        style={{
          background: `linear-gradient(to bottom right, ${dj.colorPrimary || "#b45309"}, ${dj.colorSecondary || "#d97706"})`,
        }}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <DJPhoto dj={dj} size={80} />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-serif font-bold mb-1">{dj.name}</h3>
            {dj.shows[0] && <p className="text-xl font-medium mb-2">{dj.shows[0].name}</p>}
            <p className="text-sm opacity-90 mb-3">{getShowTimeLabel(dj)}</p>
            {dj.tagline && <p className="italic text-lg">&quot;{dj.tagline}&quot;</p>}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {(dj.age || dj.background) && (
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Character Profile</h4>
            <p className="text-sm text-gray-600">
              {dj.age && <><strong>Age:</strong> {dj.age}</>}
              {dj.age && dj.background && " · "}
              {dj.background && <><strong>Background:</strong> {dj.background}</>}
            </p>
          </div>
        )}

        {dj.vibe && (
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Vibe</h4>
            <p className="text-gray-700">{dj.vibe}</p>
          </div>
        )}

        {dj.musicalFocus && (
          <div>
            <h4 className="font-bold text-gray-900 mb-1">Musical Focus</h4>
            <p className="text-gray-700">{dj.musicalFocus}</p>
          </div>
        )}

        {traits.length > 0 && (
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Personality Traits</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              {traits.map((trait, i) => (
                <li key={i}>· {trait}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function WeekendDJCard({ dj }: { dj: DJData }) {
  const dayLabel = dj.shows[0]?.dayOfWeek === 6 ? "Saturday" : "Sunday";

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-md">
      <div className="flex items-center space-x-3 mb-3">
        <DJPhoto dj={dj} size={48} />
        <div>
          <h3 className="text-xl font-bold text-gray-900">{dj.name}</h3>
          {dj.shows[0] && <p className="text-base font-medium text-gray-700">{dj.shows[0].name}</p>}
        </div>
      </div>
      <p className="text-base text-gray-600 mb-3">{dayLabel}, {getShowTimeLabel(dj)}</p>
      {dj.musicalFocus && <p className="text-base text-gray-700">{dj.musicalFocus}</p>}
      {dj.vibe && <p className="text-sm text-gray-500 mt-2 italic">{dj.vibe}</p>}
    </div>
  );
}

export default function DJsPage() {
  const [djs, setDjs] = useState<DJData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/station-djs")
      .then((r) => r.json())
      .then((data) => setDjs(data.djs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const weekdayDJs = djs.filter((dj) => !dj.isWeekend && dj.isActive);
  const saturdayDJs = djs.filter(
    (dj) => dj.isWeekend && dj.isActive && dj.shows.some((s) => s.dayOfWeek === 6)
  );
  const sundayDJs = djs.filter(
    (dj) => dj.isWeekend && dj.isActive && dj.shows.some((s) => s.dayOfWeek === 0)
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Radio className="w-6 h-6 text-amber-700" />
              <StationName className="font-bold text-xl text-gray-900" />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/station" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">
                Station
              </Link>
              <Link href="/schedule" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">
                Schedule
              </Link>
              <Link href="/network" className="text-gray-600 hover:text-gray-900 transition-colors">
                Network
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-6xl font-serif font-bold text-gray-900 mb-4">Meet Our DJs</h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Each DJ is a character with a distinct personality, musical focus, and time of day.
          <br />
          <strong>We&apos;re not generic announcers — we&apos;re storytellers.</strong>
        </p>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : (
        <>
          {/* Weekday DJs */}
          {weekdayDJs.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
                Weekday Lineup <span className="text-xl font-sans text-gray-500">(Mon–Fri)</span>
              </h2>
              <div className="space-y-8">
                {weekdayDJs.map((dj) => (
                  <DJCard key={dj.id} dj={dj} />
                ))}
              </div>
            </section>
          )}

          {/* Automation Note */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="bg-gray-100 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Radio className="w-5 h-5 text-gray-500" />
                <span className="font-bold text-gray-700">Overnight Automation</span>
              </div>
              <p className="text-gray-600">
                6:00pm – 6:00am daily · Pure music, no DJ — curated playlists run through the night
              </p>
            </div>
          </section>

          {/* Saturday DJs */}
          {saturdayDJs.length > 0 && (
            <section className="bg-white py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
                  Saturday Lineup
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {saturdayDJs.map((dj) => (
                    <WeekendDJCard key={dj.id} dj={dj} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Sunday DJs */}
          {sundayDJs.length > 0 && (
            <section className="py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
                  Sunday Lineup
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sundayDJs.map((dj) => (
                    <WeekendDJCard key={dj.id} dj={dj} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Programming Principles */}
      <section className="bg-gradient-to-br from-amber-700 to-orange-700 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center mb-8">Our DJ Philosophy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="text-xl font-bold mb-3">Respect the Artist</h3>
              <p className="text-amber-100">
                Always introduce with care: name, song title, context. Share backstory when relevant.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Create Flow</h3>
              <p className="text-amber-100">
                Songs transition naturally. Build arcs within each hour. Use silence strategically.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Be Story-Driven</h3>
              <p className="text-amber-100">
                Every song has a story. Context makes music more meaningful. Listeners remember stories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-serif font-bold mb-6 text-gray-900">Ready to Tune In?</h2>
        <p className="text-xl text-gray-700 mb-8">
          Check out the full programming schedule to see when your favorite DJs are on air.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            href="/schedule"
            className="inline-flex items-center space-x-2 bg-amber-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-800 transition-colors shadow-lg"
          >
            <Radio className="w-5 h-5" />
            <span>View Schedule</span>
          </Link>
          <Link
            href="/station"
            className="inline-flex items-center space-x-2 border-2 border-amber-700 text-amber-800 px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-50 transition-colors"
          >
            <span>Back to Station</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <StationName className="text-2xl font-serif font-bold text-white" />
          </div>
          <p className="text-lg italic text-amber-400 mb-6">&quot;Where the music finds you.&quot;</p>
          <p className="text-sm">
            Part of the{" "}
            <Link href="/network" className="text-amber-400 hover:text-amber-300">
              TrueFans RADIO™ Network
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
