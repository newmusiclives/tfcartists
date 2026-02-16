"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  ArrowRightLeft,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  X,
  Save,
  Mic,
  Play,
  Square,
  CheckCircle2,
} from "lucide-react";

interface DJ {
  id: string;
  name: string;
}

interface ShowTransition {
  id: string;
  transitionType: string;
  name: string;
  description: string | null;
  dayOfWeek: number | null;
  hourOfDay: number | null;
  timeContext: string | null;
  scriptText: string | null;
  audioFilePath: string | null;
  durationSeconds: number;
  fromDjId: string | null;
  toDjId: string | null;
  handoffGroupId: string | null;
  handoffPart: number | null;
  handoffPartName: string | null;
  isActive: boolean;
  priority: number;
}

const TRANSITION_TYPES = [
  { value: "show_intro", label: "Show Intro" },
  { value: "show_outro", label: "Show Outro" },
  { value: "handoff", label: "DJ Handoff" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EMPTY_FORM: Omit<ShowTransition, "id"> = {
  transitionType: "show_intro",
  name: "",
  description: null,
  dayOfWeek: null,
  hourOfDay: null,
  timeContext: null,
  scriptText: null,
  audioFilePath: null,
  durationSeconds: 15,
  fromDjId: null,
  toDjId: null,
  handoffGroupId: null,
  handoffPart: null,
  handoffPartName: null,
  isActive: true,
  priority: 0,
};

export default function ShowTransitionsPage() {
  const [transitions, setTransitions] = useState<ShowTransition[]>([]);
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationId, setStationId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const generateAudio = async (transitionId: string) => {
    setGeneratingId(transitionId);
    try {
      const res = await fetch(
        `/api/show-transitions/${transitionId}/generate-audio`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.audioFilePath) {
        setTransitions(
          transitions.map((t) =>
            t.id === transitionId
              ? { ...t, audioFilePath: data.audioFilePath }
              : t
          )
        );
      }
    } catch {
      // silent
    } finally {
      setGeneratingId(null);
    }
  };

  const generateAllAudio = async () => {
    if (!stationId) return;
    setGeneratingAll(true);
    try {
      const res = await fetch("/api/show-transitions/generate-audio-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId }),
      });
      const data = await res.json();
      if (data.results) {
        const updated = new Map(
          data.results
            .filter((r: { success: boolean }) => r.success)
            .map((r: { id: string; audioFilePath: string }) => [
              r.id,
              r.audioFilePath,
            ])
        );
        setTransitions(
          transitions.map((t) =>
            updated.has(t.id)
              ? { ...t, audioFilePath: updated.get(t.id) as string }
              : t
          )
        );
      }
    } catch {
      // silent
    } finally {
      setGeneratingAll(false);
    }
  };

  const togglePlay = (transition: ShowTransition) => {
    if (playingId === transition.id && audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
      setPlayingId(null);
      setAudioRef(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }

    const audio = new Audio(transition.audioFilePath!);
    audio.addEventListener("ended", () => {
      setPlayingId(null);
      setAudioRef(null);
    });
    audio.play();
    setPlayingId(transition.id);
    setAudioRef(audio);
  };

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then(async (data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          const sid = stations[0].id;
          setStationId(sid);
          const [tRes, djRes] = await Promise.all([
            fetch(`/api/show-transitions?stationId=${sid}`),
            fetch(`/api/station-djs?stationId=${sid}`),
          ]);
          const tData = await tRes.json();
          const djData = await djRes.json();
          setTransitions(tData.transitions || []);
          setDjs(djData.djs || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveTransition = async () => {
    if (!stationId || !form.name) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/show-transitions/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        setTransitions(
          transitions.map((t) => (t.id === editingId ? data.transition : t))
        );
      } else {
        const res = await fetch("/api/show-transitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stationId, ...form }),
        });
        const data = await res.json();
        setTransitions([...transitions, data.transition]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const deleteTransition = async (id: string) => {
    await fetch(`/api/show-transitions/${id}`, { method: "DELETE" });
    setTransitions(transitions.filter((t) => t.id !== id));
  };

  const editTransition = (t: ShowTransition) => {
    setEditingId(t.id);
    const { id: _id, ...rest } = t;
    setForm(rest);
    setShowForm(true);
  };

  // Group by handoffGroupId
  const grouped = transitions.reduce(
    (acc, t) => {
      const key = t.handoffGroupId || t.id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {} as Record<string, ShowTransition[]>
  );

  const typeBadge = (type: string) => {
    switch (type) {
      case "show_intro":
        return "bg-green-100 text-green-700";
      case "show_outro":
        return "bg-blue-100 text-blue-700";
      case "handoff":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ArrowRightLeft className="w-8 h-8 text-amber-600" />
              Show Transitions
            </h1>
            <p className="text-gray-600 mt-1">
              Manage show intros, outros, and DJ handoffs
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateAllAudio}
              disabled={generatingAll || !transitions.some((t) => t.scriptText && !t.audioFilePath)}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {generatingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {generatingAll ? "Generating..." : "Generate All Audio"}
            </button>
            <button
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingId(null);
                setShowForm(true);
              }}
              className="bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Transition
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : transitions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transitions configured yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Add show intros, outros, and DJ handoff scripts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([groupKey, items]) => {
              const isGroup =
                items.length > 1 || items[0].handoffGroupId !== null;
              return (
                <div
                  key={groupKey}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden"
                >
                  {isGroup && items[0].handoffGroupId && (
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        Handoff Group: {items[0].handoffGroupId}
                      </span>
                    </div>
                  )}
                  {items.map((t) => (
                    <div
                      key={t.id}
                      className="px-4 py-3 flex items-center gap-4 border-b last:border-b-0"
                    >
                      {t.handoffPart !== null && (
                        <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {t.handoffPart}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {t.name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadge(t.transitionType)}`}
                          >
                            {
                              TRANSITION_TYPES.find(
                                (tt) => tt.value === t.transitionType
                              )?.label
                            }
                          </span>
                          {t.handoffPartName && (
                            <span className="text-[10px] text-gray-400">
                              {t.handoffPartName}
                            </span>
                          )}
                          {!t.isActive && (
                            <span className="text-[10px] text-red-500 font-medium">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                          <span>{t.durationSeconds}s</span>
                          {t.fromDjId && (
                            <span>
                              From:{" "}
                              {djs.find((d) => d.id === t.fromDjId)?.name ||
                                "Unknown"}
                            </span>
                          )}
                          {t.toDjId && (
                            <span>
                              To:{" "}
                              {djs.find((d) => d.id === t.toDjId)?.name ||
                                "Unknown"}
                            </span>
                          )}
                          {t.dayOfWeek !== null && (
                            <span>{DAYS[t.dayOfWeek]}</span>
                          )}
                          {t.hourOfDay !== null && (
                            <span>{t.hourOfDay}:00</span>
                          )}
                        </div>
                        {t.scriptText && (
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-lg">
                            {t.scriptText}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {t.audioFilePath ? (
                          <>
                            <span className="text-green-500 mr-1" title="Audio ready">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                            <button
                              onClick={() => togglePlay(t)}
                              className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                              title={playingId === t.id ? "Stop" : "Play"}
                            >
                              {playingId === t.id ? (
                                <Square className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        ) : null}
                        {t.scriptText && (
                          <button
                            onClick={() => generateAudio(t.id)}
                            disabled={generatingId === t.id}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                            title={t.audioFilePath ? "Regenerate audio" : "Generate audio"}
                          >
                            {generatingId === t.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => editTransition(t)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTransition(t.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  {editingId ? "Edit Transition" : "Add Transition"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Morning Drive Handoff"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Type
                  </label>
                  <select
                    value={form.transitionType}
                    onChange={(e) =>
                      setForm({ ...form, transitionType: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    {TRANSITION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      From DJ
                    </label>
                    <select
                      value={form.fromDjId || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          fromDjId: e.target.value || null,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">None</option>
                      {djs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      To DJ
                    </label>
                    <select
                      value={form.toDjId || ""}
                      onChange={(e) =>
                        setForm({ ...form, toDjId: e.target.value || null })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">None</option>
                      {djs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Script Text
                  </label>
                  <textarea
                    value={form.scriptText || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        scriptText: e.target.value || null,
                      })
                    }
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Script for AI voice generation..."
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={form.description || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value || null,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Duration (s)
                    </label>
                    <input
                      type="number"
                      value={form.durationSeconds}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          durationSeconds: parseFloat(e.target.value) || 15,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Day
                    </label>
                    <select
                      value={form.dayOfWeek ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dayOfWeek:
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value),
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Any</option>
                      {DAYS.map((d, i) => (
                        <option key={i} value={i}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Hour
                    </label>
                    <select
                      value={form.hourOfDay ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          hourOfDay:
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value),
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Any</option>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {String(i).padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Audio File URL
                  </label>
                  <input
                    type="text"
                    value={form.audioFilePath || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        audioFilePath: e.target.value || null,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Group ID
                    </label>
                    <input
                      type="text"
                      value={form.handoffGroupId || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          handoffGroupId: e.target.value || null,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g. morning-handoff"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Part #
                    </label>
                    <input
                      type="number"
                      value={form.handoffPart ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          handoffPart:
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value),
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Part Name
                    </label>
                    <input
                      type="text"
                      value={form.handoffPartName || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          handoffPartName: e.target.value || null,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g. Intro"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">Active</label>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={saveTransition}
                  disabled={saving || !form.name}
                  className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingId ? "Update" : "Create"}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm"
                >
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
