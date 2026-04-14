import Link from "next/link";
import { notFound } from "next/navigation";
import { Mic, Clock, ArrowRight, ArrowLeft, Music, Sparkles } from "lucide-react";
import { STATION_TEMPLATES, type StationTemplate } from "@/lib/station-templates";

/* ---------- Static generation ---------- */

export function generateStaticParams() {
  return STATION_TEMPLATES.map((tpl) => ({ slug: tpl.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tpl = STATION_TEMPLATES.find((t) => t.id === slug);
  if (!tpl) return { title: "Genre Not Found" };
  return {
    title: `${tpl.name} | TrueFans RADIO`,
    description: tpl.description,
  };
}

/* ---------- Schedule helpers ---------- */

function buildSchedule(djs: StationTemplate["djPresets"]) {
  const blockHours = djs.length <= 2 ? 6 : 3;
  const totalSlots = Math.floor(24 / blockHours);
  const startHour = 6; // 6 AM start

  return Array.from({ length: Math.min(djs.length, totalSlots) }, (_, i) => {
    const dj = djs[i % djs.length];
    const hour = (startHour + i * blockHours) % 24;
    const endHour = (hour + blockHours) % 24;
    const fmt = (h: number) => {
      const suffix = h >= 12 ? "PM" : "AM";
      const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${display}${suffix}`;
    };
    return { dj, time: `${fmt(hour)} - ${fmt(endHour)}` };
  });
}

/* ---------- Page component ---------- */

export default async function GenreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tpl = STATION_TEMPLATES.find((t) => t.id === slug);
  if (!tpl) notFound();

  const schedule = buildSchedule(tpl.djPresets);

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-zinc-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-lg text-amber-800 dark:text-amber-400">
            TrueFans RADIO
          </Link>
          <Link
            href="/genres"
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Genres</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="mb-10">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-4"
            style={{ backgroundColor: tpl.primaryColor }}
          >
            {tpl.genre}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {tpl.name}
          </h1>
          <p
            className="text-xl font-medium mb-4"
            style={{ color: tpl.primaryColor }}
          >
            {tpl.tagline}
          </p>
          <p className="text-gray-600 dark:text-zinc-400 text-lg max-w-3xl">{tpl.description}</p>
        </div>

        {/* Details row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <DetailCard label="Format" value={tpl.formatType} />
          <DetailCard label="Music Era" value={tpl.musicEra} />
          <DetailCard
            label="AI DJs"
            value={`${tpl.djPresets.length}`}
          />
          <DetailCard label="Genre" value={tpl.genre.split(",")[0].trim()} />
        </div>

        {/* DJ Presets */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <Mic className="w-6 h-6" style={{ color: tpl.primaryColor }} />
            <span>AI DJ Lineup</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tpl.djPresets.map((dj) => (
              <div
                key={dj.name}
                className="bg-white dark:bg-zinc-900 rounded-xl border shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {dj.name}
                    </h3>
                    <p
                      className="text-sm font-medium"
                      style={{ color: dj.colorPrimary }}
                    >
                      {dj.tagline}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {dj.age}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-zinc-400 text-sm mb-3">{dj.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {dj.traits.split(",").map((trait) => (
                    <span
                      key={trait.trim()}
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        borderColor: tpl.primaryColor,
                        color: tpl.primaryColor,
                      }}
                    >
                      {trait.trim()}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-400 italic">
                  Vibe: {dj.vibe}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sample Schedule */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <Clock className="w-6 h-6" style={{ color: tpl.primaryColor }} />
            <span>Sample Schedule</span>
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-hidden">
            {schedule.map(({ dj, time }, i) => (
              <div
                key={i}
                className={`flex items-center px-6 py-4 ${
                  i > 0 ? "border-t" : ""
                }`}
              >
                <div
                  className="w-1.5 h-10 rounded-full mr-4"
                  style={{ backgroundColor: dj.colorPrimary }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{dj.name}</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">{dj.tagline}</p>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  {time}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-8">
          <Link
            href="/operator/signup"
            className="inline-flex items-center space-x-2 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: tpl.primaryColor }}
          >
            <Sparkles className="w-5 h-5" />
            <span>Launch Your {tpl.name.replace(" Station", "")} Station</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-sm text-gray-500 dark:text-zinc-500">
            Pre-configured with {tpl.djPresets.length} AI DJs, scheduling, and
            branding
          </p>
        </div>
      </div>
    </main>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border p-4">
      <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">{label}</p>
      <p className="font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  );
}
