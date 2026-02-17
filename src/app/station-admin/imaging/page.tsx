"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { Mic, Plus, X, Loader2, Save, Trash2, ChevronDown, ChevronRight, Music, FileText } from "lucide-react";

interface ImagingScript {
  label: string;
  text: string;
  musicBed: string;
}

interface ImagingMetadata {
  voiceCharacter?: string;
  scripts?: {
    station_id?: ImagingScript[];
    sweeper?: ImagingScript[];
    promo?: ImagingScript[];
    commercial?: ImagingScript[];
  };
}

interface ImagingVoice {
  id: string;
  displayName: string;
  voiceType: string;
  elevenlabsVoiceId: string | null;
  voiceStability: number;
  voiceSimilarityBoost: number;
  voiceStyle: number;
  usageTypes: string;
  isActive: boolean;
  metadata?: ImagingMetadata | null;
}

const USAGE_OPTIONS = ["promo", "id", "sweeper"];

export default function StationImagingPage() {
  const [voices, setVoices] = useState<ImagingVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationId, setStationId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ImagingVoice | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newVoice, setNewVoice] = useState({
    displayName: "",
    voiceType: "male",
    elevenlabsVoiceId: "",
    usageTypes: "id",
  });

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          setStationId(stations[0].id);
          return fetch(`/api/station-imaging?stationId=${stations[0].id}`);
        }
        return null;
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) setVoices(data.voices || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addVoice = async () => {
    if (!stationId || !newVoice.displayName) return;
    const res = await fetch("/api/station-imaging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId, ...newVoice }),
    });
    const data = await res.json();
    if (data.voice) {
      setVoices([data.voice, ...voices]);
      setShowAdd(false);
      setNewVoice({ displayName: "", voiceType: "male", elevenlabsVoiceId: "", usageTypes: "id" });
    }
  };

  const saveVoice = async (voice: ImagingVoice) => {
    const { id, ...data } = voice;
    await fetch(`/api/station-imaging/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setVoices(voices.map((v) => (v.id === id ? voice : v)));
    setEditing(null);
  };

  const deleteVoice = async (id: string) => {
    if (!confirm("Delete this imaging voice?")) return;
    await fetch(`/api/station-imaging/${id}`, { method: "DELETE" });
    setVoices(voices.filter((v) => v.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const toggleUsage = (voice: ImagingVoice, usage: string): ImagingVoice => {
    const types = voice.usageTypes.split(",").filter(Boolean);
    const idx = types.indexOf(usage);
    if (idx >= 0) types.splice(idx, 1);
    else types.push(usage);
    return { ...voice, usageTypes: types.join(",") || "id" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Mic className="w-8 h-8 text-rose-600" />
              Station Imaging
            </h1>
            <p className="text-gray-600 mt-1">Configure imaging voices for promos, IDs, and sweepers</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Voice
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">New Imaging Voice</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                value={newVoice.displayName}
                onChange={(e) => setNewVoice({ ...newVoice, displayName: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Display name"
              />
              <select
                value={newVoice.voiceType}
                onChange={(e) => setNewVoice({ ...newVoice, voiceType: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <input
                type="text"
                value={newVoice.elevenlabsVoiceId}
                onChange={(e) => setNewVoice({ ...newVoice, elevenlabsVoiceId: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="ElevenLabs Voice ID"
              />
            </div>
            <button onClick={addVoice} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700">
              Add Voice
            </button>
          </div>
        )}

        {/* Voice list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : voices.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <Mic className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No imaging voices configured.</p>
            <p className="text-sm text-gray-400 mt-1">Add voices for station promos, IDs, and sweepers.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {voices.map((voice) => {
              const isEditing = editing?.id === voice.id;
              const current = isEditing ? editing : voice;

              return (
                <div key={voice.id} className="bg-white rounded-xl p-5 shadow-sm border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${voice.voiceType === "female" ? "bg-pink-500" : "bg-blue-500"}`}>
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={current.displayName}
                            onChange={(e) => setEditing({ ...current, displayName: e.target.value })}
                            className="border rounded px-2 py-1 text-sm font-semibold"
                          />
                        ) : (
                          <h3 className="font-semibold text-gray-900">{voice.displayName}</h3>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${voice.voiceType === "female" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
                            {voice.voiceType}
                          </span>
                          {voice.usageTypes.split(",").map((u) => (
                            <span key={u} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{u}</span>
                          ))}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${voice.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {voice.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveVoice(current)} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1">
                            <Save className="w-3 h-3" /> Save
                          </button>
                          <button onClick={() => setEditing(null)} className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditing({ ...voice })} className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200">Edit</button>
                          <button onClick={() => deleteVoice(voice.id)} className="text-sm text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Voice character description */}
                  {voice.metadata?.voiceCharacter && (
                    <p className="mt-3 text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3">
                      {voice.metadata.voiceCharacter}
                    </p>
                  )}

                  {isEditing && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">ElevenLabs Voice ID</label>
                          <input
                            type="text"
                            value={current.elevenlabsVoiceId || ""}
                            onChange={(e) => setEditing({ ...current, elevenlabsVoiceId: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Voice Type</label>
                          <select
                            value={current.voiceType}
                            onChange={(e) => setEditing({ ...current, voiceType: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Stability: {current.voiceStability}</label>
                          <input type="range" min="0" max="1" step="0.05" value={current.voiceStability} onChange={(e) => setEditing({ ...current, voiceStability: parseFloat(e.target.value) })} className="w-full" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Similarity: {current.voiceSimilarityBoost}</label>
                          <input type="range" min="0" max="1" step="0.05" value={current.voiceSimilarityBoost} onChange={(e) => setEditing({ ...current, voiceSimilarityBoost: parseFloat(e.target.value) })} className="w-full" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Style: {current.voiceStyle}</label>
                          <input type="range" min="0" max="1" step="0.05" value={current.voiceStyle} onChange={(e) => setEditing({ ...current, voiceStyle: parseFloat(e.target.value) })} className="w-full" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-2">Usage Types</label>
                        <div className="flex gap-3">
                          {USAGE_OPTIONS.map((u) => (
                            <label key={u} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={current.usageTypes.includes(u)}
                                onChange={() => setEditing(toggleUsage(current, u))}
                                className="rounded"
                              />
                              <span className="text-sm capitalize">{u}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={current.isActive} onChange={(e) => setEditing({ ...current, isActive: e.target.checked })} className="rounded" />
                        <span className="text-sm">Active</span>
                      </label>
                    </div>
                  )}

                  {/* Production Scripts */}
                  {voice.metadata?.scripts && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [voice.id]: !prev[voice.id] }))}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        {expanded[voice.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <FileText className="w-4 h-4" />
                        Production Scripts
                      </button>
                      {expanded[voice.id] && (
                        <div className="mt-3 space-y-4">
                          {(["station_id", "sweeper", "promo", "commercial"] as const).map((scriptType) => {
                            const scripts = voice.metadata?.scripts?.[scriptType];
                            if (!scripts || scripts.length === 0) return null;
                            const typeLabels: Record<string, string> = { station_id: "Station IDs", sweeper: "Sweepers", promo: "Promos", commercial: "Commercials" };
                            const typeBg: Record<string, string> = { station_id: "bg-amber-50 border-amber-200", sweeper: "bg-blue-50 border-blue-200", promo: "bg-purple-50 border-purple-200", commercial: "bg-green-50 border-green-200" };
                            const typeTag: Record<string, string> = { station_id: "bg-amber-100 text-amber-700", sweeper: "bg-blue-100 text-blue-700", promo: "bg-purple-100 text-purple-700", commercial: "bg-green-100 text-green-700" };
                            return (
                              <div key={scriptType}>
                                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${typeTag[scriptType]}`}>
                                  {typeLabels[scriptType]}
                                </span>
                                <div className="space-y-2">
                                  {scripts.map((script, i) => (
                                    <div key={i} className={`rounded-lg border p-3 ${typeBg[scriptType]}`}>
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <span className="text-xs font-medium text-gray-500">{script.label}</span>
                                          <p className="text-sm font-medium text-gray-900 mt-0.5">&ldquo;{script.text}&rdquo;</p>
                                        </div>
                                      </div>
                                      {script.musicBed && (
                                        <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-gray-200/50">
                                          <Music className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                          <p className="text-xs text-gray-500">{script.musicBed}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
