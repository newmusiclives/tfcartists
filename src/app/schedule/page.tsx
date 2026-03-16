import type { Metadata } from "next";
import Link from "next/link";
import { Radio, Clock, Calendar, Loader2 } from "lucide-react";
import { StationName } from "@/components/station-name";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Schedule",
  description: "View the full 24/7 programming schedule. Weekday and weekend DJ lineups, show times, and featured programming.",
};

// Revalidate every 5 minutes so DJ changes appear without a redeploy
export const revalidate = 300;

interface HourDetail {
  hour: number;
  clockTemplateName: string | null;
  clockType: string | null;
}

interface DJSlot {
  name: string;
  showName: string | null;
  bio: string | null;
  shiftStart: string;
  shiftEnd: string;
  dayType: string; // "weekday" | "saturday" | "sunday"
  hours: HourDetail[];
}

// Color palette for time slots — cycles through these
const WEEKDAY_COLORS = [
  "bg-gradient-to-r from-amber-600 to-orange-600",
  "bg-gradient-to-r from-orange-500 to-red-500",
  "bg-gradient-to-r from-purple-600 to-indigo-600",
  "bg-gradient-to-r from-rose-600 to-pink-600",
  "bg-gradient-to-r from-indigo-700 to-slate-700",
  "bg-gradient-to-r from-gray-600 to-slate-600",
];

function formatTime(hour: number): string {
  if (hour === 0 || hour === 24) return "12:00am";
  if (hour === 12) return "12:00pm";
  if (hour < 12) return `${hour}:00am`;
  return `${hour - 12}:00pm`;
}

async function getScheduleData(): Promise<{
  weekday: DJSlot[];
  saturday: DJSlot[];
  sunday: DJSlot[];
}> {
  try {
    // Fetch active DJs from the first active station
    const station = await prisma.station.findFirst({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });

    if (!station) return { weekday: [], saturday: [], sunday: [] };

    // Fetch clock assignments with clock template details
    const assignments = await prisma.clockAssignment.findMany({
      where: { stationId: station.id, isActive: true },
      select: {
        dayType: true,
        timeSlotStart: true,
        timeSlotEnd: true,
        dj: {
          select: { name: true, showFormat: true, tagline: true, vibe: true, isWeekend: true },
        },
        clockTemplate: {
          select: { name: true, clockType: true },
        },
      },
      orderBy: { timeSlotStart: "asc" },
    });

    // Group assignments by DJ + dayType, collecting per-hour clock info
    const shiftMap = new Map<string, {
      dj: typeof assignments[0]["dj"];
      dayType: string;
      start: string;
      end: string;
      hours: HourDetail[];
    }>();

    for (const a of assignments) {
      const key = `${a.dj.name}-${a.dayType}`;
      const startHour = parseInt(a.timeSlotStart.split(":")[0], 10);
      const endHour = parseInt(a.timeSlotEnd.split(":")[0], 10);

      // Build per-hour details for this assignment
      const totalHours = endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;
      const hourDetails: HourDetail[] = [];
      for (let i = 0; i < totalHours; i++) {
        hourDetails.push({
          hour: (startHour + i) % 24,
          clockTemplateName: a.clockTemplate?.name || null,
          clockType: a.clockTemplate?.clockType || null,
        });
      }

      const existing = shiftMap.get(key);
      if (!existing) {
        shiftMap.set(key, {
          dj: a.dj,
          dayType: a.dayType,
          start: a.timeSlotStart,
          end: a.timeSlotEnd,
          hours: hourDetails,
        });
      } else {
        if (a.timeSlotStart < existing.start) existing.start = a.timeSlotStart;
        if (a.timeSlotEnd > existing.end) existing.end = a.timeSlotEnd;
        existing.hours.push(...hourDetails);
      }
    }

    const weekday: DJSlot[] = [];
    const saturday: DJSlot[] = [];
    const sunday: DJSlot[] = [];

    for (const shift of shiftMap.values()) {
      const startHour = parseInt(shift.start.split(":")[0]);
      const endHour = parseInt(shift.end.split(":")[0]);

      // Sort hours
      shift.hours.sort((a, b) => a.hour - b.hour);

      const slot: DJSlot = {
        name: shift.dj.name,
        showName: shift.dj.showFormat || shift.dj.tagline,
        bio: shift.dj.vibe,
        shiftStart: String(startHour),
        shiftEnd: String(endHour),
        dayType: shift.dayType,
        hours: shift.hours,
      };

      switch (shift.dayType) {
        case "saturday":
          saturday.push(slot);
          break;
        case "sunday":
          sunday.push(slot);
          break;
        default:
          weekday.push(slot);
      }
    }

    // Sort by shift start time
    const sortByStart = (a: DJSlot, b: DJSlot) => parseInt(a.shiftStart) - parseInt(b.shiftStart);
    weekday.sort(sortByStart);
    saturday.sort(sortByStart);
    sunday.sort(sortByStart);

    return { weekday, saturday, sunday };
  } catch {
    return { weekday: [], saturday: [], sunday: [] };
  }
}

export default async function SchedulePage() {
  const { weekday, saturday, sunday } = await getScheduleData();
  const hasData = weekday.length > 0 || saturday.length > 0 || sunday.length > 0;

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
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href="/station" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">Station</Link>
              <Link href="/network" className="text-gray-600 hover:text-gray-900 transition-colors">Network</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Calendar className="w-4 h-4" />
          <span>24/7 Programming Schedule</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 mb-4">
          Programming Schedule
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Every hour, every day — curated with care.
          <br />
          <strong>Find your favorite show and make it part of your routine.</strong>
        </p>
      </section>

      {!hasData ? (
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 text-lg">Schedule data is being set up. Check back soon!</p>
        </section>
      ) : (
        <>
          {/* Weekday Schedule */}
          {weekday.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 className="text-4xl font-serif font-bold text-center mb-8 text-gray-900">
                Weekday Schedule
                <span className="block text-lg font-normal text-gray-600 mt-2">Monday - Friday</span>
              </h2>
              <div className="space-y-4">
                {weekday.map((slot, i) => (
                  <TimeSlot
                    key={`weekday-${i}`}
                    time={`${formatTime(parseInt(slot.shiftStart))} - ${formatTime(parseInt(slot.shiftEnd))}`}
                    show={slot.showName || `${slot.name}'s Show`}
                    dj={slot.name}
                    mood={slot.bio || ""}
                    color={WEEKDAY_COLORS[i % WEEKDAY_COLORS.length]}
                    hours={slot.hours}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Weekend Schedule */}
          {(saturday.length > 0 || sunday.length > 0) && (
            <section className="bg-white py-16">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-serif font-bold text-center mb-8 text-gray-900">
                  Weekend Schedule
                  <span className="block text-lg font-normal text-gray-600 mt-2">Saturday & Sunday</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {saturday.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-6 h-6 mr-2 text-amber-700" />
                        Saturday
                      </h3>
                      <div className="space-y-3">
                        {saturday.map((slot, i) => (
                          <WeekendSlot
                            key={`sat-${i}`}
                            time={`${formatTime(parseInt(slot.shiftStart))} - ${formatTime(parseInt(slot.shiftEnd))}`}
                            show={slot.showName || `${slot.name}'s Show`}
                            dj={slot.name}
                            focus={slot.bio || ""}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {sunday.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-6 h-6 mr-2 text-amber-700" />
                        Sunday
                      </h3>
                      <div className="space-y-3">
                        {sunday.map((slot, i) => (
                          <WeekendSlot
                            key={`sun-${i}`}
                            time={`${formatTime(parseInt(slot.shiftStart))} - ${formatTime(parseInt(slot.shiftEnd))}`}
                            show={slot.showName || `${slot.name}'s Show`}
                            dj={slot.name}
                            focus={slot.bio || ""}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold mb-6 text-gray-900">
            Make It Part of Your Day
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Set your alarm. Bookmark your favorite show. Build a listening habit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/station"
              className="inline-flex items-center space-x-2 bg-amber-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-800 transition-colors shadow-lg"
            >
              <span>Back to Station</span>
            </Link>
            <Link
              href="/listen/register"
              className="inline-flex items-center space-x-2 border-2 border-amber-700 text-amber-800 px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-50 transition-colors"
            >
              <span>Listen Now</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <StationName className="text-2xl font-serif font-bold text-white" />
          </div>
          <p className="text-sm">
            Part of the <Link href="/network" className="text-amber-400 hover:text-amber-300">TrueFans RADIO Network</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}

function TimeSlot({ time, show, dj, mood, color, hours }: {
  time: string; show: string; dj: string; mood: string; color: string; hours: HourDetail[];
}) {
  return (
    <div className={`${color} text-white rounded-xl p-6 shadow-lg`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-semibold">{time}</span>
          </div>
          <h3 className="text-2xl font-serif font-bold mb-1">{show}</h3>
          <p className="text-sm opacity-90 mb-2">with {dj}</p>
          {mood && <p className="text-sm italic opacity-80">{mood}</p>}
        </div>
        {hours.length > 0 && (
          <div className="flex flex-wrap gap-2 md:max-w-xs">
            {hours.map((h) => (
              <div
                key={h.hour}
                className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs"
              >
                <div className="font-bold">{formatTime(h.hour)}</div>
                {h.clockTemplateName && (
                  <div className="opacity-80 truncate max-w-[120px]">{h.clockTemplateName}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WeekendSlot({ time, show, dj, focus }: {
  time: string; show: string; dj: string; focus: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 shadow-md">
      <div className="flex items-start space-x-3 mb-2">
        <Clock className="w-5 h-5 text-amber-700 mt-1" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-1">{time}</p>
          <h4 className="text-xl font-bold text-gray-900 mb-1">{show}</h4>
          <p className="text-sm text-gray-700 mb-2">with {dj}</p>
          {focus && <p className="text-sm text-gray-600">{focus}</p>}
        </div>
      </div>
    </div>
  );
}
