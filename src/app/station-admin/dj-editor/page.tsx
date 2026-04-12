"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SharedNav } from "@/components/shared-nav";
import { Users, Plus, Loader2, X, Volume2, Square } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";

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
  ttsVoice: string | null;
  ttsProvider: string | null;
  voiceDescription: string | null;
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
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [playingDjId, setPlayingDjId] = useState<string | null>(null);
  const [loadingDjId, setLoadingDjId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const playVoiceDemo = async (e: React.MouseEvent, dj: DJData) => {
    e.preventDefault(); // don't navigate to DJ editor
    e.stopPropagation();

    // If already playing this DJ, stop
    if (playingDjId === dj.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingDjId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingDjId(null);
    }

    setLoadingDjId(dj.id);
    try {
      const res = await csrfFetch("/api/voice-preview", {
        method: "POST",
        body: JSON.stringify({
          voice: dj.ttsVoice || "Leda",
          provider: dj.ttsProvider || "gemini",
          voiceDirection: dj.voiceDescription,
          text: `Hey there, I'm ${dj.name}. You're listening to North Country Radio. Stay tuned, we've got some great music coming up next.`,
        }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(data.audio);
        audioRef.current = audio;
        audio.onended = () => {
          setPlayingDjId(null);
          audioRef.current = null;
        };
        await audio.play();
        setPlayingDjId(dj.id);
      } else if (data.error) {
        console.error("Voice preview error:", data.error);
        const msg = typeof data.error === "string" ? data.error : (data.error.message || JSON.stringify(data.error));
        alert(`Voice preview failed: ${msg}`);
      }
    } catch (err) {
      console.error("Voice preview network error:", err);
    } finally {
      setLoadingDjId(null);
    }
  };

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

  const createDJ = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/station-djs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          bio: newBio.trim() || `${newName.trim()} is a host on North Country Radio.`,
          stationId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const djId = data.dj?.id;
        setShowModal(false);
        setNewName("");
        setNewBio("");
        if (djId) {
          router.push(`/station-admin/dj-editor/${djId}`);
        } else {
          window.location.reload();
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || `Error: ${res.status}`);
      }
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              Host Editor
            </h1>
            <p className="text-zinc-400 mt-1">Create and configure host personalities</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Host
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : djs.length === 0 ? (
          <div className="bg-zinc-900/80 rounded-xl p-12 border border-zinc-800 text-center">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">No hosts configured yet.</p>
            <p className="text-sm text-zinc-500 mt-1">Click &ldquo;Add New Host&rdquo; to create your first host personality.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {djs.map((dj) => (
              <Link
                key={dj.id}
                href={`/station-admin/dj-editor/${dj.id}`}
                className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-800 hover:border-zinc-700 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {dj.photoUrl ? (
                    <img
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
                      <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                        {dj.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          dj.isActive ? "bg-green-500/15 text-green-400" : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {dj.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {dj.tagline && (
                      <p className="text-sm text-zinc-500 italic mt-0.5 truncate">{dj.tagline}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                      <span>{getShowTime(dj)}</span>
                      {dj.isWeekend && <span className="bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded">Weekend</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={(e) => playVoiceDemo(e, dj)}
                        disabled={loadingDjId === dj.id}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          playingDjId === dj.id
                            ? "bg-purple-500/15 text-purple-400"
                            : "bg-zinc-800 text-zinc-400 hover:bg-purple-500/10 hover:text-purple-400"
                        } disabled:opacity-50`}
                      >
                        {loadingDjId === dj.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : playingDjId === dj.id ? (
                          <Square className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                        {loadingDjId === dj.id ? "Generating..." : playingDjId === dj.id ? "Stop" : "Voice Demo"}
                      </button>
                      {dj.ttsVoice && (
                        <span className="text-xs text-zinc-500">{dj.ttsVoice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create DJ Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md shadow-xl border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Create New Host</h2>
              <button onClick={() => { setShowModal(false); setCreateError(null); }} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1">Host Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createDJ()}
                  placeholder="e.g., Hank Westwood"
                  className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1">Bio</label>
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Short bio for this host personality..."
                  rows={3}
                  className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                />
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
              <button
                onClick={createDJ}
                disabled={creating || !newName.trim()}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? "Creating..." : "Create Host"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
