"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import { Music, Upload, Search, Loader2, X } from "lucide-react";

interface SongData {
  id: string;
  title: string;
  artistName: string;
  album: string | null;
  duration: number | null;
  genre: string | null;
  rotationCategory: string;
  vocalGender: string;
  bpm: number | null;
  playCount: number;
  isActive: boolean;
  introEnd: number | null;
  outroStart: number | null;
  crossfadeStart: number | null;
  crossfadeDuration: number | null;
  mixInPoint: number | null;
  mixOutPoint: number | null;
  hookStart: number | null;
  hookEnd: number | null;
  cueNotes: string | null;
}

const CATEGORIES = ["All", "A", "B", "C", "D", "E"];
const CATEGORY_BADGES: Record<string, string> = {
  A: "bg-red-100 text-red-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-green-100 text-green-700",
  D: "bg-purple-100 text-purple-700",
  E: "bg-orange-100 text-orange-700",
};

const GENDERS = ["All", "male", "female", "mixed", "instrumental", "unknown"];

function formatDuration(sec: number | null) {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MusicLibraryPage() {
  const [songs, setSongs] = useState<SongData[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [gender, setGender] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stationId, setStationId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SongData | null>(null);

  const fetchSongs = (sid: string, p: number, cat: string, gen: string, q: string) => {
    const params = new URLSearchParams({ stationId: sid, page: String(p), limit: "25" });
    if (cat !== "All") params.set("category", cat);
    if (gen !== "All") params.set("vocalGender", gen);
    if (q) params.set("search", q);

    fetch(`/api/station-songs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSongs(data.songs || []);
        if (data.pagination) setTotalPages(data.pagination.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          setStationId(stations[0].id);
          fetchSongs(stations[0].id, 1, "All", "All", "");
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (stationId) {
      setLoading(true);
      fetchSongs(stationId, page, category, gender, search);
    }
  }, [page, category, gender]);

  const doSearch = () => {
    if (stationId) {
      setPage(1);
      setLoading(true);
      fetchSongs(stationId, 1, category, gender, search);
    }
  };

  const updateSong = async (id: string, data: Partial<SongData>) => {
    await fetch(`/api/station-songs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSongs(songs.map((s) => (s.id === id ? { ...s, ...data } : s)));
    setEditing(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Music className="w-8 h-8 text-green-600" />
              Music Library
            </h1>
            <p className="text-gray-600 mt-1">Browse and manage your station&apos;s song catalog</p>
          </div>
          <Link
            href="/station-admin/music/import"
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Songs
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === c
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {c === "All" ? "All" : `Cat ${c}`}
                </button>
              ))}
            </div>
            <select
              value={gender}
              onChange={(e) => { setGender(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g === "All" ? "All Genders" : g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()}
                  className="w-full border rounded-lg pl-9 pr-3 py-1.5 text-sm"
                  placeholder="Search title or artist..."
                />
              </div>
              <button onClick={doSearch} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm">
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : songs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No songs in the library yet.</p>
            <Link href="/station-admin/music/import" className="text-green-600 text-sm hover:underline mt-2 inline-block">
              Import songs to get started
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Artist</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vocal</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">BPM</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cue</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Plays</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {songs.map((song) => (
                    <tr
                      key={song.id}
                      onClick={() => setEditing(song)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{song.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{song.artistName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{formatDuration(song.duration)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${CATEGORY_BADGES[song.rotationCategory] || "bg-gray-100 text-gray-600"}`}>
                          {song.rotationCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center capitalize">{song.vocalGender}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{song.bpm || "--"}</td>
                      <td className="px-4 py-3 text-center">
                        {(song.introEnd || song.outroStart || song.crossfadeStart || song.hookStart) ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">CUE</span>
                        ) : (
                          <span className="text-gray-300 text-xs">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{song.playCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded text-sm ${p === page ? "bg-gray-900 text-white" : "bg-white border hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Edit Song</h3>
                <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Title</label>
                  <p className="text-sm font-medium">{editing.title}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Artist</label>
                  <p className="text-sm">{editing.artistName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Rotation Category</label>
                  <select
                    value={editing.rotationCategory}
                    onChange={(e) => setEditing({ ...editing, rotationCategory: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    {["A", "B", "C", "D", "E"].map((c) => (
                      <option key={c} value={c}>Category {c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm">Active</label>
                  <input
                    type="checkbox"
                    checked={editing.isActive}
                    onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  />
                </div>

                {/* Cue Points */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Cue Points (seconds)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Intro End</label>
                      <input type="number" step="0.1" value={editing.introEnd ?? ""} onChange={(e) => setEditing({ ...editing, introEnd: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="--" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Outro Start</label>
                      <input type="number" step="0.1" value={editing.outroStart ?? ""} onChange={(e) => setEditing({ ...editing, outroStart: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="--" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Crossfade Start</label>
                      <input type="number" step="0.1" value={editing.crossfadeStart ?? ""} onChange={(e) => setEditing({ ...editing, crossfadeStart: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="--" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Crossfade Duration</label>
                      <input type="number" step="0.1" value={editing.crossfadeDuration ?? ""} onChange={(e) => setEditing({ ...editing, crossfadeDuration: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="--" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Mix In Point</label>
                      <input type="number" step="0.1" value={editing.mixInPoint ?? ""} onChange={(e) => setEditing({ ...editing, mixInPoint: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="--" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Mix Out Point</label>
                      <input type="number" step="0.1" value={editing.mixOutPoint ?? ""} onChange={(e) => setEditing({ ...editing, mixOutPoint: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="--" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Hook Start</label>
                      <input type="number" step="0.1" value={editing.hookStart ?? ""} onChange={(e) => setEditing({ ...editing, hookStart: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="--" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Hook End</label>
                      <input type="number" step="0.1" value={editing.hookEnd ?? ""} onChange={(e) => setEditing({ ...editing, hookEnd: e.target.value === "" ? null : parseFloat(e.target.value) })} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="--" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-gray-500 block mb-1">Cue Notes</label>
                    <textarea value={editing.cueNotes || ""} onChange={(e) => setEditing({ ...editing, cueNotes: e.target.value || null })} rows={2} className="w-full border rounded-lg px-3 py-1.5 text-sm" placeholder="Notes about cue points..." />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => updateSong(editing.id, {
                    rotationCategory: editing.rotationCategory,
                    isActive: editing.isActive,
                    introEnd: editing.introEnd,
                    outroStart: editing.outroStart,
                    crossfadeStart: editing.crossfadeStart,
                    crossfadeDuration: editing.crossfadeDuration,
                    mixInPoint: editing.mixInPoint,
                    mixOutPoint: editing.mixOutPoint,
                    hookStart: editing.hookStart,
                    hookEnd: editing.hookEnd,
                    cueNotes: editing.cueNotes,
                  })}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Save
                </button>
                <button onClick={() => setEditing(null)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
