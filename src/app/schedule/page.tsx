import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, Music, Headphones } from "lucide-react";
import { StationName } from "@/components/station-name";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Schedule | North Country Radio",
  description: "24/7 music programming schedule — great music around the clock.",
};

export const revalidate = 300;

interface TimeBlock {
  label: string;
  timeRange: string;
  clockName: string | null;
  clockType: string | null;
  startHour: number;
  endHour: number;
  songsPerHour: number;
}

function formatTime(hour: number): string {
  if (hour === 0 || hour === 24) return "12:00am";
  if (hour === 12) return "12:00pm";
  if (hour < 12) return `${hour}:00am`;
  return `${hour - 12}:00pm`;
}

function countSongs(clockPattern: string | null): number {
  if (!clockPattern) return 0;
  try {
    const slots = JSON.parse(clockPattern);
    return slots.filter((s: { type: string }) => s.type === "song").length;
  } catch {
    return 0;
  }
}

async function getScheduleBlocks(): Promise<TimeBlock[]> {
  try {
    const station = await prisma.station.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!station) return [];

    const assignments = await prisma.clockAssignment.findMany({
      where: { stationId: station.id, isActive: true, dayType: { in: ["weekday", "all"] } },
      select: {
        timeSlotStart: true,
        timeSlotEnd: true,
        clockTemplate: { select: { name: true, clockType: true, clockPattern: true } },
      },
      orderBy: { timeSlotStart: "asc" },
    });

    const blocks: TimeBlock[] = [];

    for (const a of assignments) {
      const startHour = parseInt(a.timeSlotStart.split(":")[0], 10);
      const endHour = parseInt(a.timeSlotEnd.split(":")[0], 10);
      const songs = countSongs(a.clockTemplate?.clockPattern || null);

      let label: string;
      if (startHour >= 6 && endHour <= 18 && startHour < endHour) {
        label = "Daytime Programming";
      } else {
        label = "After Hours";
      }

      blocks.push({
        label,
        timeRange: `${formatTime(startHour)} - ${formatTime(endHour)}`,
        clockName: a.clockTemplate?.name || null,
        clockType: a.clockTemplate?.clockType || null,
        startHour,
        endHour,
        songsPerHour: songs,
      });
    }

    return blocks;
  } catch {
    return [];
  }
}

export default async function SchedulePage() {
  const blocks = await getScheduleBlocks();
  const hasData = blocks.length > 0;

  return (
    <main className="min-h-screen bg-zinc-950 text-gray-100">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-gray-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image src="/logos/ncr-logo.png" alt="North Country Radio" width={32} height={32} className="h-8 w-auto object-contain" />
              <StationName className="font-bold text-xl text-white" />
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/station" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Station</Link>
              <Link href="/network" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Network</Link>
              <Link
                href="/player"
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                Listen Live
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/15 via-gray-950 to-gray-950" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <p className="text-amber-400 font-medium tracking-widest uppercase text-sm mb-6">
            <Calendar className="w-4 h-4 inline-block mr-2 -mt-0.5" />
            24/7 Music Programming
          </p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
            All Music. All Day.
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Non-stop Americana, country, and singer-songwriter music around the clock.
            <br />
            <span className="text-white font-medium">Just the music you love — no filler, no fluff.</span>
          </p>
        </div>
      </section>

      {!hasData ? (
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 text-lg">Schedule data is being set up. Check back soon!</p>
        </section>
      ) : (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            {blocks.map((block, i) => (
              <div
                key={i}
                className={`rounded-xl p-6 border ${
                  block.label === "Daytime Programming"
                    ? "bg-gradient-to-r from-amber-600/90 to-orange-700/90 border-amber-500/30"
                    : "bg-gradient-to-r from-indigo-800/80 to-slate-800/80 border-indigo-500/20"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-lg font-semibold">{block.timeRange}</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-1">{block.label}</h3>
                    {block.clockName && (
                      <p className="text-sm opacity-80">{block.clockName}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-white/10 border border-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                      <div className="text-2xl font-bold">{block.songsPerHour}</div>
                      <div className="text-xs opacity-80">tracks/hour</div>
                    </div>
                    <div className="bg-white/10 border border-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                      <Music className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs opacity-80">non-stop</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Format highlights */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-amber-400 mb-2">16</div>
              <div className="text-gray-400">Tracks per hour during the day</div>
            </div>
            <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-amber-400 mb-2">24/7</div>
              <div className="text-gray-400">Music around the clock</div>
            </div>
            <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-amber-400 mb-2">0</div>
              <div className="text-gray-400">Interruptions — just music</div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-white/5 bg-gradient-to-b from-gray-950 to-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold mb-4 text-white">
            Tune In Anytime
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Great music is always playing. No schedule to follow — just press play.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/player"
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-8 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg shadow-amber-500/20"
            >
              <Headphones className="w-5 h-5" />
              <span>Listen Now</span>
            </Link>
            <Link
              href="/station"
              className="inline-flex items-center space-x-2 border border-white/20 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/5 transition-colors"
            >
              <span>Back to Station</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <StationName className="text-2xl font-serif font-bold text-white mb-2" />
          <p className="text-amber-400/80 italic mb-6">Where the music finds you.</p>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Part of the{" "}
            <Link href="/network" className="text-amber-400/60 hover:text-amber-400">
              TrueFans RADIO Network
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
