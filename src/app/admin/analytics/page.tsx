import { flag } from "@/lib/flags";
import {
  getTotals,
  getTopArtists,
  getTopTracks,
  getPlaysByDay,
  getTimeSlotSplit,
  getRotationBalance,
  type Row,
} from "@/lib/analytics/listener";
import Link from "next/link";
import { BarChart3, Music, Users, Clock, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Listener Analytics | TrueFans RADIO" };

const WINDOW_DAYS = 30;

export default async function AnalyticsPage() {
  const enabled = await flag("listener_analytics");

  if (!enabled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-8">
        <div className="max-w-3xl mx-auto text-center py-20">
          <BarChart3 className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
            Listener Analytics
          </h1>
          <p className="text-gray-600 dark:text-zinc-300">
            This addon is not enabled for your station.
          </p>
          <Link
            href="/admin"
            className="inline-block mt-6 text-amber-700 dark:text-amber-300 underline"
          >
            Back to admin
          </Link>
        </div>
      </div>
    );
  }

  const [totals, artists, tracks, byDay, slots, balance] = await Promise.all([
    getTotals(WINDOW_DAYS),
    getTopArtists(WINDOW_DAYS),
    getTopTracks(WINDOW_DAYS),
    getPlaysByDay(WINDOW_DAYS),
    getTimeSlotSplit(WINDOW_DAYS),
    getRotationBalance(WINDOW_DAYS),
  ]);

  const peak = Math.max(1, ...byDay.map((d) => d.plays));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <main className="max-w-6xl mx-auto px-4 py-10">
        <header className="mb-8">
          <Link
            href="/admin"
            className="text-sm text-amber-700 dark:text-amber-300 hover:underline"
          >
            ← Admin
          </Link>
          <div className="flex items-center gap-3 mt-3">
            <BarChart3 className="w-7 h-7 text-amber-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
              Listener Analytics
            </h1>
          </div>
          <p className="text-gray-600 dark:text-zinc-300 mt-1">
            Actual airplay over the last {WINDOW_DAYS} days.
          </p>
        </header>

        {totals.plays === 0 ? (
          <Empty />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Stat icon={<Music className="w-4 h-4" />} label="Plays" value={totals.plays.toLocaleString()} />
              <Stat icon={<Users className="w-4 h-4" />} label="Artists aired" value={totals.artists.toLocaleString()} />
              <Stat icon={<Music className="w-4 h-4" />} label="Distinct tracks" value={totals.tracks.toLocaleString()} />
              <Stat icon={<Clock className="w-4 h-4" />} label="Hours of music" value={totals.hoursOfMusic.toLocaleString()} />
            </div>

            {balance.skewed && (
              <div className="mb-8 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-800 dark:text-zinc-200">
                  <strong className="font-semibold">Rotation is skewed.</strong>{" "}
                  {artists[0]?.label} takes {balance.topArtistShare.toFixed(1)}% of
                  airplay across {balance.artistsInRotation} artists — an even split
                  would be {balance.evenShare.toFixed(1)}%. One artist dominating is
                  what makes a station sound automated.
                </div>
              </div>
            )}

            <Panel title="Plays per day">
              <div className="flex items-end gap-1 h-40">
                {byDay.map((d) => (
                  // The column needs an explicit full height: a percentage
                  // height only resolves against a parent with a definite one,
                  // so without h-full every bar collapsed to zero and the chart
                  // rendered empty while reporting a peak.
                  <div key={d.day} className="flex-1 h-full flex flex-col justify-end">
                    <div
                      className="bg-amber-500 dark:bg-amber-400 rounded-t min-h-[2px]"
                      style={{ height: `${Math.max(2, (d.plays / peak) * 100)}%` }}
                      title={`${d.day}: ${d.plays} plays`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-zinc-400 tabular-nums">
                <span>{byDay[0]?.day}</span>
                <span>peak {peak}/day</span>
                <span>{byDay[byDay.length - 1]?.day}</span>
              </div>
            </Panel>

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <Panel title="Most played artists">
                <Bars rows={artists} />
              </Panel>
              <Panel title="Most played tracks">
                <Bars rows={tracks} />
              </Panel>
            </div>

            <div className="mt-6">
              <Panel title="Airplay by time slot">
                <Bars rows={slots} />
              </Panel>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Bars({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-gray-600 dark:text-zinc-400 text-sm">No plays recorded.</p>;
  }
  const max = Math.max(...rows.map((r) => r.plays));
  return (
    <ol className="space-y-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between items-baseline gap-3 text-sm">
            <span className="text-gray-900 dark:text-zinc-100 truncate">{r.label}</span>
            <span className="text-gray-700 dark:text-zinc-300 tabular-nums shrink-0">
              {r.plays.toLocaleString()}{" "}
              <span className="text-gray-500 dark:text-zinc-400">({r.share.toFixed(1)}%)</span>
            </span>
          </div>
          <div className="mt-1 h-2 rounded bg-gray-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 dark:bg-amber-400"
              style={{ width: `${(r.plays / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-zinc-100 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400 text-sm font-medium">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-extrabold text-gray-900 dark:text-zinc-100 tabular-nums mt-1">
        {value}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center">
      <BarChart3 className="w-8 h-8 text-amber-500 mx-auto mb-3" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">
        No plays in this window
      </h2>
      <p className="text-gray-600 dark:text-zinc-300 max-w-md mx-auto">
        Airplay is synced from the playout engine every 15 minutes. If the station
        has been off air for the whole period, there is nothing to show.
      </p>
    </div>
  );
}
