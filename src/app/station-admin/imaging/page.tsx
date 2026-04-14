"use client";

import { useEffect, useRef, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { Mic, Plus, X, Loader2, Save, Trash2, ChevronDown, ChevronRight, FileText, Upload, Play, Pause, Square, Volume2 } from "lucide-react";
import { csrfFetch } from "@/lib/csrf-client";

interface ImagingScript {
  label: string;
  text: string;
}

interface ImagingMetadata {
  voiceCharacter?: string;
  voiceDirection?: string;
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
  // Stored in DB column `elevenlabsVoiceId` for legacy reasons,
  // now holds the Gemini prebuilt voice name (e.g. "Algieba", "Autonoe")
  elevenlabsVoiceId: string | null;
  voiceStability: number;
  voiceSimilarityBoost: number;
  voiceStyle: number;
  usageTypes: string;
  isActive: boolean;
  metadata?: ImagingMetadata | null;
}

const GEMINI_VOICES_FEMALE = [
  { name: "Zephyr", desc: "Bright, cheerful" },
  { name: "Kore", desc: "Firm, confident" },
  { name: "Leda", desc: "Youthful, energetic" },
  { name: "Aoede", desc: "Warm" },
  { name: "Autonoe", desc: "Bright, optimistic" },
  { name: "Callirhoe", desc: "Easy-going, relaxed" },
  { name: "Despina", desc: "Smooth, flowing" },
  { name: "Erinome", desc: "Clear, precise" },
  { name: "Gacrux", desc: "Mature, experienced" },
  { name: "Laomedeia", desc: "Upbeat, lively" },
  { name: "Pulcherrima", desc: "Forward, expressive" },
  { name: "Vindemiatrix", desc: "Gentle, kind" },
  { name: "Achernar", desc: "Soft, gentle" },
];

const GEMINI_VOICES_MALE = [
  { name: "Puck", desc: "Upbeat, energetic" },
  { name: "Charon", desc: "Informative, clear" },
  { name: "Fenrir", desc: "Excitable, dynamic" },
  { name: "Orus", desc: "Firm, decisive" },
  { name: "Achird", desc: "Friendly, approachable" },
  { name: "Algenib", desc: "Gravelly texture" },
  { name: "Algieba", desc: "Smooth, pleasant" },
  { name: "Alnilam", desc: "Firm, strong" },
  { name: "Enceladus", desc: "Breathy, soft" },
  { name: "Iapetus", desc: "Clear, articulate" },
  { name: "Rasalgethi", desc: "Informative, professional" },
  { name: "Sadachbia", desc: "Lively, animated" },
  { name: "Sadaltager", desc: "Knowledgeable, authoritative" },
  { name: "Schedar", desc: "Deliberate" },
  { name: "Umbriel", desc: "Easy-going" },
  { name: "Zubenelgenubi", desc: "Inventive" },
];

interface ProducedImagingItem {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  durationSeconds: number | null;
  category: string;
  isActive: boolean;
}

const USAGE_OPTIONS = ["promo", "id", "sweeper", "sponsor"];
const PRODUCED_CATEGORIES = ["promo", "sweeper", "station_id", "toh", "positioning"];

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

  const [audioEl] = useState(() => typeof Audio !== "undefined" ? new Audio() : null);

  // Voice preview state
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewLoadingVoiceId, setPreviewLoadingVoiceId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Produced Imaging state
  const [producedImaging, setProducedImaging] = useState<ProducedImagingItem[]>([]);
  const [prodUploadName, setProdUploadName] = useState("");
  const [prodUploadCategory, setProdUploadCategory] = useState("sweeper");
  const [prodUploadFile, setProdUploadFile] = useState<File | null>(null);
  const [prodUploading, setProdUploading] = useState(false);
  const [playingProdId, setPlayingProdId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          const sid = stations[0].id;
          setStationId(sid);
          Promise.all([
            fetch(`/api/station-imaging?stationId=${sid}`).then((r) => r.json()),
            fetch(`/api/produced-imaging?stationId=${sid}`).then((r) => r.json()),
          ]).then(([voiceData, prodData]) => {
            setVoices(voiceData.voices || []);
            setProducedImaging(prodData.producedImaging || []);
          });
        }
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

  // Voice preview — generate a TTS sample for this voice using its configured
  // Gemini voice + voiceDirection metadata.
  const playVoicePreview = async (voice: ImagingVoice) => {
    if (previewingVoiceId === voice.id) {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
      setPreviewingVoiceId(null);
      return;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPreviewingVoiceId(null);
    }
    if (!voice.elevenlabsVoiceId) {
      alert("Assign a Gemini voice before previewing.");
      return;
    }
    setPreviewLoadingVoiceId(voice.id);
    try {
      const res = await csrfFetch("/api/voice-preview", {
        method: "POST",
        body: JSON.stringify({
          voice: voice.elevenlabsVoiceId,
          provider: "gemini",
          voiceDirection: voice.metadata?.voiceDirection || voice.metadata?.voiceCharacter,
          text: `You're listening to North Country Radio. The best new Americana and indie, all day long.`,
        }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(data.audio);
        previewAudioRef.current = audio;
        audio.onended = () => {
          setPreviewingVoiceId(null);
          previewAudioRef.current = null;
        };
        await audio.play();
        setPreviewingVoiceId(voice.id);
      } else if (data.error) {
        const msg = typeof data.error === "string" ? data.error : (data.error.message || JSON.stringify(data.error));
        alert(`Voice preview failed: ${msg}`);
      }
    } catch (err) {
      console.error("Voice preview error", err);
    } finally {
      setPreviewLoadingVoiceId(null);
    }
  };

  // Produced Imaging functions
  const uploadProducedImaging = async () => {
    if (!stationId || !prodUploadName || !prodUploadFile) return;
    setProdUploading(true);
    const formData = new FormData();
    formData.append("stationId", stationId);
    formData.append("name", prodUploadName);
    formData.append("category", prodUploadCategory);
    formData.append("file", prodUploadFile);
    try {
      const res = await fetch("/api/produced-imaging", { method: "POST", body: formData });
      const data = await res.json();
      if (data.producedImaging) {
        setProducedImaging([data.producedImaging, ...producedImaging]);
        setProdUploadName("");
        setProdUploadCategory("sweeper");
        setProdUploadFile(null);
      }
    } catch {}
    setProdUploading(false);
  };

  const deleteProducedImaging = async (id: string) => {
    if (!confirm("Delete this imaging element?")) return;
    await fetch(`/api/produced-imaging/${id}`, { method: "DELETE" });
    setProducedImaging(producedImaging.filter((p) => p.id !== id));
    if (playingProdId === id) {
      audioEl?.pause();
      setPlayingProdId(null);
    }
  };

  const togglePlayProd = (item: ProducedImagingItem) => {
    if (!audioEl) return;
    if (playingProdId === item.id) {
      audioEl.pause();
      setPlayingProdId(null);
    } else {
      audioEl.src = item.filePath;
      audioEl.play();
      setPlayingProdId(item.id);
      audioEl.onended = () => setPlayingProdId(null);
    }
  };

  const categoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      promo: "Promo",
      sweeper: "Sweeper",
      station_id: "Station ID",
      toh: "TOH",
      positioning: "Positioning",
    };
    return labels[cat] || cat;
  };

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      promo: "bg-purple-500/15 text-purple-400",
      sweeper: "bg-blue-500/15 text-blue-400",
      station_id: "bg-amber-500/15 text-amber-400",
      toh: "bg-rose-500/15 text-rose-400",
      positioning: "bg-teal-500/15 text-teal-400",
    };
    return colors[cat] || "bg-zinc-800 text-zinc-400";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Mic className="w-8 h-8 text-rose-600" />
              Station Imaging
            </h1>
            <p className="text-zinc-400 mt-1">Configure imaging voices for promos, IDs, and sweepers</p>
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
          <div className="bg-zinc-900/80 rounded-xl p-6 border border-zinc-800 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">New Imaging Voice</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-zinc-500" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                value={newVoice.displayName}
                onChange={(e) => setNewVoice({ ...newVoice, displayName: e.target.value })}
                className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                placeholder="Display name"
              />
              <select
                value={newVoice.voiceType}
                onChange={(e) => setNewVoice({ ...newVoice, voiceType: e.target.value, elevenlabsVoiceId: "" })}
                className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <select
                value={newVoice.elevenlabsVoiceId}
                onChange={(e) => setNewVoice({ ...newVoice, elevenlabsVoiceId: e.target.value })}
                className="bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select Gemini voice...</option>
                {(newVoice.voiceType === "female" ? GEMINI_VOICES_FEMALE : GEMINI_VOICES_MALE).map((v) => (
                  <option key={v.name} value={v.name}>{v.name} — {v.desc}</option>
                ))}
              </select>
            </div>
            <button onClick={addVoice} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700">
              Add Voice
            </button>
          </div>
        )}

        {/* Voice list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : voices.length === 0 ? (
          <div className="bg-zinc-900/80 rounded-xl p-12 border border-zinc-800 text-center">
            <Mic className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">No imaging voices configured.</p>
            <p className="text-sm text-zinc-500 mt-1">Add voices for station promos, IDs, and sweepers.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {voices.map((voice) => {
              const isEditing = editing?.id === voice.id;
              const current = isEditing ? editing : voice;

              return (
                <div key={voice.id} className="bg-zinc-900/80 rounded-xl p-5 border border-zinc-800">
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
                            className="bg-zinc-800 text-white border border-zinc-700 rounded px-2 py-1 text-sm font-semibold"
                          />
                        ) : (
                          <h3 className="font-semibold text-white">{voice.displayName}</h3>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${voice.voiceType === "female" ? "bg-pink-500/15 text-pink-400" : "bg-blue-500/15 text-blue-400"}`}>
                            {voice.voiceType}
                          </span>
                          {voice.usageTypes.split(",").map((u) => (
                            <span key={u} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{u}</span>
                          ))}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${voice.isActive ? "bg-green-500/15 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>
                            {voice.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isEditing && (
                        <button
                          onClick={() => playVoicePreview(voice)}
                          disabled={previewLoadingVoiceId === voice.id}
                          className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                            previewingVoiceId === voice.id
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-zinc-800 text-zinc-300 hover:bg-rose-500/15 hover:text-rose-300"
                          } disabled:opacity-50`}
                          title="Play a voice sample"
                        >
                          {previewLoadingVoiceId === voice.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : previewingVoiceId === voice.id ? (
                            <Square className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          {previewLoadingVoiceId === voice.id
                            ? "Generating..."
                            : previewingVoiceId === voice.id
                            ? "Stop"
                            : "Play Sample"}
                        </button>
                      )}
                      {isEditing ? (
                        <>
                          <button onClick={() => saveVoice(current)} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1">
                            <Save className="w-3 h-3" /> Save
                          </button>
                          <button onClick={() => setEditing(null)} className="text-sm bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditing({ ...voice })} className="text-sm bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-zinc-700">Edit</button>
                          <button onClick={() => deleteVoice(voice.id)} className="text-sm text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Voice character description */}
                  {voice.metadata?.voiceCharacter && (
                    <p className="mt-3 text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-3">
                      {voice.metadata.voiceCharacter}
                    </p>
                  )}

                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">Gemini Voice</label>
                          <select
                            value={current.elevenlabsVoiceId || ""}
                            onChange={(e) => setEditing({ ...current, elevenlabsVoiceId: e.target.value })}
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">Not set</option>
                            <optgroup label={current.voiceType === "female" ? "Female Voices" : "Male Voices"}>
                              {(current.voiceType === "female" ? GEMINI_VOICES_FEMALE : GEMINI_VOICES_MALE).map((v) => (
                                <option key={v.name} value={v.name}>{v.name} — {v.desc}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">Voice Type</label>
                          <select
                            value={current.voiceType}
                            onChange={(e) => setEditing({ ...current, voiceType: e.target.value })}
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Voice Direction (Gemini prompt instructions)</label>
                        <p className="text-xs text-zinc-500 mb-1">Tone, accent, pacing, atmosphere — passed to Gemini before each script.</p>
                        <textarea
                          value={current.metadata?.voiceDirection || ""}
                          onChange={(e) => setEditing({ ...current, metadata: { ...(current.metadata || {}), voiceDirection: e.target.value } })}
                          rows={6}
                          className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                          placeholder="Role: Authoritative station voice. Voice Texture: Deep, resonant. Atmosphere: Sound-treated room, close-mic. Personality: Confident, commanding. Delivery: Smooth, measured pacing."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">Stability: {current.voiceStability}</label>
                          <input type="range" min="0" max="1" step="0.05" value={current.voiceStability} onChange={(e) => setEditing({ ...current, voiceStability: parseFloat(e.target.value) })} className="w-full" />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">Similarity: {current.voiceSimilarityBoost}</label>
                          <input type="range" min="0" max="1" step="0.05" value={current.voiceSimilarityBoost} onChange={(e) => setEditing({ ...current, voiceSimilarityBoost: parseFloat(e.target.value) })} className="w-full" />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500 block mb-1">Style: {current.voiceStyle}</label>
                          <input type="range" min="0" max="1" step="0.05" value={current.voiceStyle} onChange={(e) => setEditing({ ...current, voiceStyle: parseFloat(e.target.value) })} className="w-full" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 block mb-2">Usage Types</label>
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
                        className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white"
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
                            const typeBg: Record<string, string> = { station_id: "bg-amber-500/10 border-amber-500/20", sweeper: "bg-blue-500/10 border-blue-500/20", promo: "bg-purple-500/10 border-purple-500/20", commercial: "bg-green-500/10 border-green-500/20" };
                            const typeTag: Record<string, string> = { station_id: "bg-amber-500/15 text-amber-400", sweeper: "bg-blue-500/15 text-blue-400", promo: "bg-purple-500/15 text-purple-400", commercial: "bg-green-500/15 text-green-400" };
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
                                          <span className="text-xs font-medium text-zinc-500">{script.label}</span>
                                          <p className="text-sm font-medium text-white mt-0.5">&ldquo;{script.text}&rdquo;</p>
                                        </div>
                                      </div>
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

        {/* ===== Pre-Produced Imaging Section ===== */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Mic className="w-7 h-7 text-indigo-600" />
                Pre-Produced Imaging
              </h2>
              <p className="text-zinc-400 mt-1">Upload ready-to-air promos, sweepers, station IDs, and more</p>
            </div>
          </div>

          {/* Upload form */}
          <div className="bg-zinc-900/80 rounded-xl p-6 border border-zinc-800 mb-6">
            <h3 className="font-semibold text-white mb-4">Upload Imaging Element</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Name</label>
                <input
                  type="text"
                  value={prodUploadName}
                  onChange={(e) => setProdUploadName(e.target.value)}
                  className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Morning Station ID"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Category</label>
                <select
                  value={prodUploadCategory}
                  onChange={(e) => setProdUploadCategory(e.target.value)}
                  className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                >
                  {PRODUCED_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{categoryLabel(c)}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-zinc-500 block mb-1">Audio File (MP3/WAV)</label>
                <input
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav"
                  onChange={(e) => setProdUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg px-3 py-1.5 text-sm file:mr-2 file:rounded file:border-0 file:bg-indigo-500/15 file:text-indigo-400 file:px-2 file:py-1 file:text-xs"
                />
              </div>
              <button
                onClick={uploadProducedImaging}
                disabled={prodUploading || !prodUploadName || !prodUploadFile}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                {prodUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload
              </button>
            </div>
          </div>

          {/* Produced imaging list */}
          {producedImaging.length === 0 ? (
            <div className="bg-zinc-900/80 rounded-xl p-12 border border-zinc-800 text-center">
              <Mic className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500">No pre-produced imaging uploaded yet.</p>
              <p className="text-sm text-zinc-500 mt-1">Upload ready-to-air promos, sweepers, IDs, and more.</p>
            </div>
          ) : (
            <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
              {producedImaging.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePlayProd(item)}
                      className="w-9 h-9 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/25"
                    >
                      {playingProdId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div>
                      <p className="font-medium text-white text-sm">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor(item.category)}`}>
                          {categoryLabel(item.category)}
                        </span>
                        <span className="text-xs text-zinc-500">{item.fileName}</span>
                        {item.durationSeconds && (
                          <span className="text-xs text-zinc-500">{Math.round(item.durationSeconds)}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteProducedImaging(item.id)}
                    className="text-sm text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
