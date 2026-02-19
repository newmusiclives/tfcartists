"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SharedNav } from "@/components/shared-nav";
import { ArrowLeft, Save, Trash2, Loader2, Camera, Play, Pause, ToggleLeft, ToggleRight, Sparkles, Mic } from "lucide-react";

interface DJDetail {
  id: string;
  name: string;
  slug: string;
  fullName: string | null;
  bio: string;
  age: string | null;
  background: string | null;
  vibe: string | null;
  tagline: string | null;
  voiceDescription: string | null;
  personalityTraits: string | null;
  musicalFocus: string | null;
  voiceProfileId: string | null;
  voiceStability: number;
  voiceSimilarityBoost: number;
  ttsVoice: string | null;
  ttsProvider: string;
  gptSystemPrompt: string | null;
  gptTemperature: number;
  catchPhrases: string | null;
  additionalKnowledge: string | null;
  hometown: string | null;
  showFormat: string | null;
  onAirStyle: string | null;
  quirksAndHabits: string | null;
  atmosphere: string | null;
  philosophy: string | null;
  photoUrl: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  isActive: boolean;
  isWeekend: boolean;
  stationId: string | null;
}

interface GenericTrack {
  id: string;
  scriptText: string;
  audioFilePath: string | null;
  audioDuration: number | null;
  category: string;
  timeOfDay: string | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function DJEditorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [dj, setDj] = useState<DJDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPhoto, setGeneratingPhoto] = useState(false);
  const [genericTracks, setGenericTracks] = useState<GenericTrack[]>([]);
  const [genericLoading, setGenericLoading] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioRef] = useState<{ current: HTMLAudioElement | null }>({ current: null });

  useEffect(() => {
    fetch(`/api/station-djs/${id}`)
      .then((r) => r.json())
      .then((data) => setDj(data.dj || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const loadGenericTracks = async () => {
    setGenericLoading(true);
    try {
      const res = await fetch(`/api/voice-tracks/generic?djId=${id}`);
      const data = await res.json();
      setGenericTracks(data.tracks || []);
    } catch { /* ignore */ }
    setGenericLoading(false);
  };

  useEffect(() => {
    if (id) loadGenericTracks();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateBatch = async () => {
    if (!dj?.stationId) return;
    setGeneratingBatch(true);
    try {
      await fetch("/api/voice-tracks/generate-generic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: dj.stationId, djId: id, count: 12 }),
      });
      await loadGenericTracks();
    } catch { /* ignore */ }
    setGeneratingBatch(false);
  };

  const toggleGenericTrack = async (trackId: string, active: boolean) => {
    await fetch(`/api/voice-tracks/generic/${trackId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: active }),
    });
    setGenericTracks((prev) => prev.map((t) => t.id === trackId ? { ...t, isActive: active } : t));
  };

  const deleteGenericTrack = async (trackId: string) => {
    await fetch(`/api/voice-tracks/generic/${trackId}`, { method: "DELETE" });
    setGenericTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  const playPreview = (trackId: string, audioPath: string | null) => {
    if (!audioPath) return;
    if (playingTrackId === trackId) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(audioPath);
    audio.onended = () => setPlayingTrackId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingTrackId(trackId);
  };

  const save = async () => {
    if (!dj) return;
    setSaving(true);
    try {
      const { id: _, ...data } = dj as any;
      delete data.shows;
      delete data.clockAssignments;
      delete data.trackPlays;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.stationId;
      delete data.station;
      delete data.metadata;
      delete data.priority;
      await fetch(`/api/station-djs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const deleteDj = async () => {
    if (!confirm("Delete this DJ? This cannot be undone.")) return;
    await fetch(`/api/station-djs/${id}`, { method: "DELETE" });
    router.push("/station-admin/dj-editor");
  };

  const generatePhoto = async () => {
    if (!dj) return;
    setGeneratingPhoto(true);
    try {
      const res = await fetch(`/api/station-djs/${id}/generate-photo`, { method: "POST" });
      const data = await res.json();
      if (data.photoUrl) {
        setDj({ ...dj, photoUrl: data.photoUrl });
      }
    } catch {
      // handle error
    } finally {
      setGeneratingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      </div>
    );
  }

  if (!dj) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">DJ not found.</p>
          <Link href="/station-admin/dj-editor" className="text-purple-600 hover:underline text-sm mt-2 inline-block">Back to DJ Editor</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/station-admin/dj-editor" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to DJ Editor
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {dj.photoUrl ? (
              <Image src={dj.photoUrl} alt={dj.name} width={80} height={80} className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-200 shadow-md" />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: dj.colorPrimary || "#6b7280" }}
              >
                {dj.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{dj.name}</h1>
              {dj.tagline && <p className="text-gray-500 text-sm italic">{dj.tagline}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button onClick={deleteDj} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Identity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Identity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Stage Name</label>
                <input type="text" value={dj.name} onChange={(e) => setDj({ ...dj, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Real Name</label>
                <input type="text" value={dj.fullName || ""} onChange={(e) => setDj({ ...dj, fullName: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full legal or character name" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Age</label>
                <input type="text" value={dj.age || ""} onChange={(e) => setDj({ ...dj, age: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Late 40s" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Hometown</label>
                <input type="text" value={dj.hometown || ""} onChange={(e) => setDj({ ...dj, hometown: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Austin, TX" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Show Format</label>
              <input type="text" value={dj.showFormat || ""} onChange={(e) => setDj({ ...dj, showFormat: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Morning Drive Americana" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tagline</label>
                <input type="text" value={dj.tagline || ""} onChange={(e) => setDj({ ...dj, tagline: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Pour the coffee. Fire up the engine." />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Vibe</label>
                <input type="text" value={dj.vibe || ""} onChange={(e) => setDj({ ...dj, vibe: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Blue-collar optimism" />
              </div>
            </div>
          </div>

          {/* Section 2: Biography & Backstory */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Biography & Backstory</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Short On-Air Bio</label>
              <p className="text-xs text-gray-400 mb-1">Public-facing biography — who this DJ is to the listener.</p>
              <textarea value={dj.bio} onChange={(e) => setDj({ ...dj, bio: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={6} />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Extended Backstory</label>
              <p className="text-xs text-gray-400 mb-1">Internal character background — life history, motivations, formative experiences. Not shown to listeners.</p>
              <textarea value={dj.background || ""} onChange={(e) => setDj({ ...dj, background: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={8} />
            </div>
          </div>

          {/* Section 3: Personality & Behavior */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Personality & Behavior</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Core Personality Traits</label>
              <p className="text-xs text-gray-400 mb-1">One trait per line — who this person is at their core.</p>
              <textarea value={dj.personalityTraits || ""} onChange={(e) => setDj({ ...dj, personalityTraits: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="warm&#10;folksy&#10;philosophical&#10;dry humor" />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Catch Phrases</label>
              <p className="text-xs text-gray-400 mb-1">Signature phrases this DJ uses on air, one per line.</p>
              <textarea value={dj.catchPhrases || ""} onChange={(e) => setDj({ ...dj, catchPhrases: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Pour the coffee. Fire up the engine.&#10;That's the good stuff right there." />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Quirks & Habits</label>
              <p className="text-xs text-gray-400 mb-1">Recurring bits, pet peeves, studio behaviors — the little things that make this character feel real.</p>
              <textarea value={dj.quirksAndHabits || ""} onChange={(e) => setDj({ ...dj, quirksAndHabits: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Always taps the mic twice before speaking&#10;Hates when people call it 'country pop'" />
            </div>
          </div>

          {/* Section 4: Voice & On-Air Presence */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Voice & On-Air Presence</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Voice Profile</label>
              <p className="text-xs text-gray-400 mb-1">How this DJ sounds — tone, pacing, energy, accent, delivery style.</p>
              <textarea value={dj.voiceDescription || ""} onChange={(e) => setDj({ ...dj, voiceDescription: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={6} placeholder="Tone: Warm and gravelly&#10;Pacing: Unhurried, lets moments breathe&#10;Energy: Calm confidence, never rushed&#10;Accent: Slight Texas drawl&#10;Delivery: Conversational, like talking to a friend" />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">On-Air Style</label>
              <p className="text-xs text-gray-400 mb-1">How they run the show — intros, interviews, listener interaction, humor, emotional tone.</p>
              <textarea value={dj.onAirStyle || ""} onChange={(e) => setDj({ ...dj, onAirStyle: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={6} placeholder="Song intros: Brief story about the artist or song&#10;Interviews: Relaxed, lets guests talk&#10;Listener talk: Warm, uses first names&#10;Humor: Dry, self-deprecating&#10;Emotional tone: Genuine, never performative" />
            </div>
          </div>

          {/* Section 5: Musical Identity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Musical Identity</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Musical Identity</label>
              <p className="text-xs text-gray-400 mb-1">Genres, championed artists, and philosophy toward music selection.</p>
              <textarea value={dj.musicalFocus || ""} onChange={(e) => setDj({ ...dj, musicalFocus: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={6} placeholder="Genres: Americana, alt-country, folk, roots rock&#10;Champions: Jason Isbell, Sturgill Simpson, Tyler Childers&#10;Philosophy: Real songs by real people about real life" />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Signature Atmosphere</label>
              <p className="text-xs text-gray-400 mb-1">The sensory mood of the show — what it feels like to listen.</p>
              <textarea value={dj.atmosphere || ""} onChange={(e) => setDj({ ...dj, atmosphere: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Like sitting on a porch at dawn with a cup of black coffee, watching the sun come up over the hills..." />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Guiding Philosophy</label>
              <p className="text-xs text-gray-400 mb-1">This DJ's core belief about music, radio, and connection.</p>
              <textarea value={dj.philosophy || ""} onChange={(e) => setDj({ ...dj, philosophy: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Music is the thread that holds working people together..." />
            </div>
          </div>

          {/* Section 6: Voice Configuration (technical) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Voice Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">ElevenLabs Voice ID</label>
                <input type="text" value={dj.voiceProfileId || ""} onChange={(e) => setDj({ ...dj, voiceProfileId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" placeholder="voice_abc123..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">TTS Provider</label>
                <select
                  value={dj.ttsProvider || "openai"}
                  onChange={(e) => setDj({ ...dj, ttsProvider: e.target.value, ttsVoice: null })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">TTS Voice</label>
                {(dj.ttsProvider || "openai") === "openai" ? (
                  <select
                    value={dj.ttsVoice || ""}
                    onChange={(e) => setDj({ ...dj, ttsVoice: e.target.value || null })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Not set</option>
                    <option value="alloy">Alloy</option>
                    <option value="ash">Ash</option>
                    <option value="ballad">Ballad</option>
                    <option value="coral">Coral</option>
                    <option value="echo">Echo</option>
                    <option value="fable">Fable</option>
                    <option value="nova">Nova</option>
                    <option value="onyx">Onyx</option>
                    <option value="sage">Sage</option>
                    <option value="shimmer">Shimmer</option>
                  </select>
                ) : (
                  <select
                    value={dj.ttsVoice || ""}
                    onChange={(e) => setDj({ ...dj, ttsVoice: e.target.value || null })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Not set</option>
                    <option value="Zephyr">Zephyr</option>
                    <option value="Puck">Puck</option>
                    <option value="Charon">Charon</option>
                    <option value="Kore">Kore</option>
                    <option value="Fenrir">Fenrir</option>
                    <option value="Leda">Leda</option>
                    <option value="Orus">Orus</option>
                    <option value="Aoede">Aoede</option>
                  </select>
                )}
              </div>
              <div />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Voice Stability: {dj.voiceStability}</label>
                <input type="range" min="0" max="1" step="0.05" value={dj.voiceStability} onChange={(e) => setDj({ ...dj, voiceStability: parseFloat(e.target.value) })} className="w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Voice Similarity: {dj.voiceSimilarityBoost}</label>
                <input type="range" min="0" max="1" step="0.05" value={dj.voiceSimilarityBoost} onChange={(e) => setDj({ ...dj, voiceSimilarityBoost: parseFloat(e.target.value) })} className="w-full" />
              </div>
            </div>
          </div>

          {/* Section 7: AI Settings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">AI Settings</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">GPT Temperature: {dj.gptTemperature}</label>
              <input type="range" min="0" max="1" step="0.05" value={dj.gptTemperature} onChange={(e) => setDj({ ...dj, gptTemperature: parseFloat(e.target.value) })} className="w-full" />
              <p className="text-xs text-gray-400 mt-1">Lower = more consistent, higher = more creative. Default: 0.8</p>
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Full AI Prompt</label>
              <p className="text-xs text-gray-400 mb-1">The system prompt sent to the AI when generating DJ dialogue.</p>
              <textarea value={dj.gptSystemPrompt || ""} onChange={(e) => setDj({ ...dj, gptSystemPrompt: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" rows={8} placeholder="You are a radio DJ named..." />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Additional Knowledge</label>
              <p className="text-xs text-gray-400 mb-1">Extra context the AI can reference — opinions, pet peeves, favorite stories, local knowledge.</p>
              <textarea value={dj.additionalKnowledge || ""} onChange={(e) => setDj({ ...dj, additionalKnowledge: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={6} placeholder="Things this character knows, believes, or cares about..." />
            </div>
          </div>

          {/* Section 8: Visual Identity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Visual Identity</h2>
            <div className="flex items-start gap-6 mb-4">
              {dj.photoUrl ? (
                <Image src={dj.photoUrl} alt={dj.name} width={160} height={160} className="w-40 h-40 rounded-2xl object-cover border shadow-lg" />
              ) : (
                <div
                  className="w-40 h-40 rounded-2xl flex items-center justify-center text-white font-bold text-4xl"
                  style={{ backgroundColor: dj.colorPrimary || "#6b7280" }}
                >
                  {dj.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
              )}
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Photo URL</label>
                <input type="text" value={dj.photoUrl || ""} onChange={(e) => setDj({ ...dj, photoUrl: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <button
                  onClick={generatePhoto}
                  disabled={generatingPhoto}
                  className="mt-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {generatingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  {generatingPhoto ? "Generating..." : "Generate Photo"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Primary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={dj.colorPrimary || "#6b7280"} onChange={(e) => setDj({ ...dj, colorPrimary: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                  <input type="text" value={dj.colorPrimary || ""} onChange={(e) => setDj({ ...dj, colorPrimary: e.target.value })} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Secondary Color</label>
                <div className="flex gap-2">
                  <input type="color" value={dj.colorSecondary || "#9ca3af"} onChange={(e) => setDj({ ...dj, colorSecondary: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                  <input type="text" value={dj.colorSecondary || ""} onChange={(e) => setDj({ ...dj, colorSecondary: e.target.value })} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 9: Generic Voice Tracks */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2"><Mic className="w-4 h-4" /> Generic Voice Tracks</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Pre-generated reusable voice breaks — saves 1 AI call per hour during daily cron.
                  {genericTracks.length > 0 && (
                    <span className="ml-1 font-medium text-gray-600">
                      {genericTracks.length} total, {genericTracks.filter((t) => t.isActive).length} active
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={generateBatch}
                disabled={generatingBatch || !dj.stationId}
                className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {generatingBatch ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generatingBatch ? "Generating 12..." : "Generate Batch (12)"}
              </button>
            </div>

            {genericLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : genericTracks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No generic tracks yet. Click &quot;Generate Batch&quot; to create 12.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {genericTracks.map((track) => (
                  <div key={track.id} className={`flex items-center gap-3 p-3 rounded-lg border ${track.isActive ? "bg-white" : "bg-gray-50 opacity-60"}`}>
                    <button
                      onClick={() => playPreview(track.id, track.audioFilePath)}
                      disabled={!track.audioFilePath}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-200 disabled:opacity-30"
                    >
                      {playingTrackId === track.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          track.category === "personality" ? "bg-blue-100 text-blue-700" :
                          track.category === "station_promo" ? "bg-green-100 text-green-700" :
                          track.category === "time_check" ? "bg-yellow-100 text-yellow-700" :
                          "bg-pink-100 text-pink-700"
                        }`}>
                          {track.category.replace("_", " ")}
                        </span>
                        {track.timeOfDay && (
                          <span className="text-[10px] text-gray-400">{track.timeOfDay}</span>
                        )}
                        <span className="text-[10px] text-gray-400">used {track.useCount}x</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{track.scriptText}</p>
                    </div>
                    <button
                      onClick={() => toggleGenericTrack(track.id, !track.isActive)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                      title={track.isActive ? "Deactivate" : "Activate"}
                    >
                      {track.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteGenericTrack(track.id)}
                      className="flex-shrink-0 text-gray-300 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 10: Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Status</h2>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={dj.isActive} onChange={(e) => setDj({ ...dj, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={dj.isWeekend} onChange={(e) => setDj({ ...dj, isWeekend: e.target.checked })} className="rounded" />
                <span className="text-sm">Weekend Only</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
