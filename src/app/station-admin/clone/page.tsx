"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SharedNav } from "@/components/shared-nav";
import {
  Copy,
  Loader2,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  Mic,
  Music,
  Radio,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface StationInfo {
  id: string;
  name: string;
  callSign: string | null;
  genre: string;
  formatType: string | null;
  _count: {
    stationDJs: number;
    clockTemplates: number;
    clockAssignments: number;
    imagingVoices: number;
  };
}

interface CloneResult {
  success: boolean;
  stationId: string;
  stationName: string;
  djCount: number;
  templateCount: number;
  assignmentCount: number;
  featureCount: number;
  voiceCount: number;
  bedCount: number;
}

const CLONE_ITEMS = [
  { icon: Users, label: "AI DJ Personalities", desc: "All DJs with voices, traits, and bios" },
  { icon: Clock, label: "Clock Templates", desc: "Rotation patterns and music programming" },
  { icon: Clock, label: "Schedule Assignments", desc: "DJ-to-timeslot mappings across all day types" },
  { icon: Sparkles, label: "Show Features", desc: "Feature schedules (trivia, weather, segments)" },
  { icon: Mic, label: "Imaging Voices", desc: "Station voice configurations for promos and IDs" },
  { icon: Music, label: "Music Beds", desc: "Background music bed references" },
];

export default function StationClonePage() {
  const router = useRouter();
  const [station, setStation] = useState<StationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [result, setResult] = useState<CloneResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState("");
  const [newCallSign, setNewCallSign] = useState("");
  const [newGenre, setNewGenre] = useState("");

  // Load current station
  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          setStation(stations[0]);
        }
      })
      .catch(() => setError("Failed to load station"))
      .finally(() => setLoading(false));
  }, []);

  const handleClone = async () => {
    if (!station || !newName.trim()) return;

    setCloning(true);
    setError(null);

    try {
      const res = await fetch("/api/stations/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceStationId: station.id,
          newName: newName.trim(),
          newCallSign: newCallSign.trim() || undefined,
          newGenre: newGenre.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Clone failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setCloning(false);
    }
  };

  // Success state
  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <SharedNav />
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Station Cloned</h1>
            <p className="text-zinc-400 mb-8">
              <span className="text-white font-medium">{result.stationName}</span> is ready to go.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "DJs", count: result.djCount },
                { label: "Clock Templates", count: result.templateCount },
                { label: "Schedule Slots", count: result.assignmentCount },
                { label: "Feature Schedules", count: result.featureCount },
                { label: "Imaging Voices", count: result.voiceCount },
                { label: "Music Beds", count: result.bedCount },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-2xl font-bold text-amber-400">{item.count}</div>
                  <div className="text-xs text-zinc-400">{item.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/station-admin/wizard")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
            >
              Open Station Admin
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Copy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Clone Station</h1>
            <p className="text-sm text-zinc-400">Duplicate an existing station with all its configuration</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : !station ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <Radio className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No station found to clone. Create one first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Source station info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Cloning from</div>
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-white font-semibold">{station.name}</div>
                  <div className="text-sm text-zinc-400">
                    {station.callSign && <span className="text-amber-400 mr-2">{station.callSign}</span>}
                    {station.genre}
                    {station.formatType && <span className="text-zinc-500"> / {station.formatType}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                <span>{station._count.stationDJs} DJs</span>
                <span>{station._count.clockTemplates} Clocks</span>
                <span>{station._count.clockAssignments} Assignments</span>
                <span>{station._count.imagingVoices} Imaging Voices</span>
              </div>
            </div>

            {/* New station form */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">New Station Details</div>

              <div>
                <label className="block text-sm text-zinc-300 mb-1">
                  Station Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Desert Rock Radio"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-1">Call Sign</label>
                <input
                  type="text"
                  value={newCallSign}
                  onChange={(e) => setNewCallSign(e.target.value.toUpperCase())}
                  placeholder="e.g. DRR"
                  maxLength={5}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors uppercase"
                />
                <p className="text-xs text-zinc-500 mt-1">2-5 letters, optional</p>
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-1">Genre Override</label>
                <input
                  type="text"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  placeholder={station.genre}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-1">Leave blank to keep &quot;{station.genre}&quot;</p>
              </div>
            </div>

            {/* What gets cloned */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">What gets cloned</div>
              <div className="space-y-3">
                {CLONE_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{item.label}</div>
                      <div className="text-xs text-zinc-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Clone button */}
            <button
              onClick={handleClone}
              disabled={cloning || !newName.trim()}
              className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {cloning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cloning Station...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Clone Station
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
