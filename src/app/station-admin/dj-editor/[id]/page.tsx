"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SharedNav } from "@/components/shared-nav";
import { ArrowLeft, Save, Trash2, Loader2, Camera } from "lucide-react";

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
  photoUrl: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  isActive: boolean;
  isWeekend: boolean;
}

export default function DJEditorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [dj, setDj] = useState<DJDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPhoto, setGeneratingPhoto] = useState(false);

  useEffect(() => {
    fetch(`/api/station-djs/${id}`)
      .then((r) => r.json())
      .then((data) => setDj(data.dj || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Basic Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Name</label>
                <input type="text" value={dj.name} onChange={(e) => setDj({ ...dj, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tagline</label>
                <input type="text" value={dj.tagline || ""} onChange={(e) => setDj({ ...dj, tagline: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Age</label>
                <input type="text" value={dj.age || ""} onChange={(e) => setDj({ ...dj, age: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Late 40s" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Vibe</label>
                <input type="text" value={dj.vibe || ""} onChange={(e) => setDj({ ...dj, vibe: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Musical Focus</label>
              <input type="text" value={dj.musicalFocus || ""} onChange={(e) => setDj({ ...dj, musicalFocus: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Personality Traits (comma-separated)</label>
              <input type="text" value={dj.personalityTraits || ""} onChange={(e) => setDj({ ...dj, personalityTraits: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="warm, folksy, philosophical" />
            </div>
          </div>

          {/* Character & Personality */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Character & Personality</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Bio</label>
              <p className="text-xs text-gray-400 mb-1">Public-facing biography — who this DJ is to the listener.</p>
              <textarea value={dj.bio} onChange={(e) => setDj({ ...dj, bio: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={6} />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Back Story</label>
              <p className="text-xs text-gray-400 mb-1">Internal character background — life history, motivations, formative experiences.</p>
              <textarea value={dj.background || ""} onChange={(e) => setDj({ ...dj, background: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={6} />
            </div>
            <div className="mt-4">
              <label className="text-xs text-gray-500 block mb-1">Catch Phrases</label>
              <textarea value={dj.catchPhrases || ""} onChange={(e) => setDj({ ...dj, catchPhrases: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="One phrase per line&#10;e.g. Pour the coffee. Fire up the engine." />
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

          {/* Voice Config */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">Voice Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Voice Description</label>
                <input type="text" value={dj.voiceDescription || ""} onChange={(e) => setDj({ ...dj, voiceDescription: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ElevenLabs Voice ID</label>
                <input type="text" value={dj.voiceProfileId || ""} onChange={(e) => setDj({ ...dj, voiceProfileId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" placeholder="voice_abc123..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
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

          {/* AI Settings */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="font-semibold mb-4">AI Settings</h2>
            <div>
              <label className="text-xs text-gray-500 block mb-1">GPT Temperature: {dj.gptTemperature}</label>
              <input type="range" min="0" max="1" step="0.05" value={dj.gptTemperature} onChange={(e) => setDj({ ...dj, gptTemperature: parseFloat(e.target.value) })} className="w-full" />
              <p className="text-xs text-gray-400 mt-1">Lower = more consistent, higher = more creative. Default: 0.8</p>
            </div>
          </div>

          {/* Visual */}
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

          {/* Toggles */}
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
