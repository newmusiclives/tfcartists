"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { SharedNav } from "@/components/shared-nav";
import {
  Paintbrush,
  Save,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Wand2,
  Music,
  Pencil,
} from "lucide-react";

interface ImagingScript {
  label: string;
  text: string;
  musicBed: string;
}

interface StationData {
  id: string;
  name: string;
  callSign: string | null;
  tagline: string | null;
  description: string | null;
  genre: string;
  formatType: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  metadata: Record<string, unknown> | null;
}

type ScriptCategory =
  | "toh"
  | "sweeper_general"
  | "sweeper_hank_westwood"
  | "sweeper_loretta_merrick"
  | "sweeper_doc_holloway"
  | "sweeper_cody_rampart"
  | "promo_general"
  | "promo_hank_westwood"
  | "promo_loretta_merrick"
  | "promo_doc_holloway"
  | "promo_cody_rampart"
  | "overnight";

interface CategoryConfig {
  key: ScriptCategory;
  label: string;
  group: string;
  defaultCount: number;
}

const SCRIPT_CATEGORIES: CategoryConfig[] = [
  // Top of Hour IDs
  { key: "toh", label: "Top of Hour IDs", group: "Top of Hour IDs", defaultCount: 5 },
  // Sweepers
  { key: "sweeper_general", label: "General Sweepers", group: "Sweepers", defaultCount: 6 },
  { key: "sweeper_hank_westwood", label: "Hank Westwood Sweepers", group: "Sweepers", defaultCount: 4 },
  { key: "sweeper_loretta_merrick", label: "Loretta Merrick Sweepers", group: "Sweepers", defaultCount: 4 },
  { key: "sweeper_doc_holloway", label: "Doc Holloway Sweepers", group: "Sweepers", defaultCount: 4 },
  { key: "sweeper_cody_rampart", label: "Cody Rampart Sweepers", group: "Sweepers", defaultCount: 4 },
  // Promos
  { key: "promo_general", label: "General Promos", group: "Promos", defaultCount: 5 },
  { key: "promo_hank_westwood", label: "Hank Westwood Promos", group: "Promos", defaultCount: 3 },
  { key: "promo_loretta_merrick", label: "Loretta Merrick Promos", group: "Promos", defaultCount: 3 },
  { key: "promo_doc_holloway", label: "Doc Holloway Promos", group: "Promos", defaultCount: 3 },
  { key: "promo_cody_rampart", label: "Cody Rampart Promos", group: "Promos", defaultCount: 3 },
  // Overnight
  { key: "overnight", label: "Overnight Automation", group: "Overnight Imaging", defaultCount: 5 },
];

const GROUP_COLORS: Record<string, { bg: string; border: string; tag: string; accent: string }> = {
  "Top of Hour IDs": { bg: "bg-amber-50", border: "border-amber-200", tag: "bg-amber-100 text-amber-700", accent: "text-amber-600" },
  "Sweepers": { bg: "bg-blue-50", border: "border-blue-200", tag: "bg-blue-100 text-blue-700", accent: "text-blue-600" },
  "Promos": { bg: "bg-purple-50", border: "border-purple-200", tag: "bg-purple-100 text-purple-700", accent: "text-purple-600" },
  "Overnight Imaging": { bg: "bg-green-50", border: "border-green-200", tag: "bg-green-100 text-green-700", accent: "text-green-600" },
};

const FORMAT_OPTIONS = ["americana", "country", "rock", "jazz", "blues", "folk"];

export default function StationBrandingPage() {
  const [station, setStation] = useState<StationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [editingScript, setEditingScript] = useState<{ category: ScriptCategory; index: number } | null>(null);
  const [editDraft, setEditDraft] = useState<ImagingScript>({ label: "", text: "", musicBed: "" });

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          const s = stations[0];
          setStation({
            id: s.id,
            name: s.name,
            callSign: s.callSign,
            tagline: s.tagline,
            description: s.description,
            genre: s.genre,
            formatType: s.formatType,
            logoUrl: s.logoUrl,
            primaryColor: s.primaryColor,
            secondaryColor: s.secondaryColor,
            metadata: s.metadata,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getScripts = useCallback(
    (category: ScriptCategory): ImagingScript[] => {
      const meta = station?.metadata as Record<string, unknown> | null;
      const scripts = meta?.imagingScripts as Record<string, ImagingScript[]> | undefined;
      return scripts?.[category] || [];
    },
    [station]
  );

  const setScripts = useCallback(
    (category: ScriptCategory, scripts: ImagingScript[]) => {
      if (!station) return;
      const meta = (station.metadata || {}) as Record<string, unknown>;
      const existing = (meta.imagingScripts || {}) as Record<string, ImagingScript[]>;
      setStation({
        ...station,
        metadata: { ...meta, imagingScripts: { ...existing, [category]: scripts } },
      });
      setSaved(false);
    },
    [station]
  );

  const updateField = (field: keyof StationData, value: unknown) => {
    if (!station) return;
    setStation({ ...station, [field]: value });
    setSaved(false);
  };

  const save = async () => {
    if (!station) return;
    setSaving(true);
    try {
      const { id, ...fields } = station;
      await fetch(`/api/stations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const generateScripts = async (category: ScriptCategory) => {
    if (!station) return;
    setGenerating((prev) => ({ ...prev, [category]: true }));
    try {
      const res = await fetch("/api/station-branding/generate-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: station.id, category }),
      });
      const data = await res.json();
      if (data.scripts) {
        setScripts(category, data.scripts);
      }
    } catch {
      // silent
    } finally {
      setGenerating((prev) => ({ ...prev, [category]: false }));
    }
  };

  const addScript = (category: ScriptCategory) => {
    const scripts = getScripts(category);
    const newScript: ImagingScript = {
      label: `Script ${scripts.length + 1}`,
      text: "",
      musicBed: "",
    };
    setScripts(category, [...scripts, newScript]);
    setEditingScript({ category, index: scripts.length });
    setEditDraft(newScript);
  };

  const deleteScript = (category: ScriptCategory, index: number) => {
    const scripts = getScripts(category);
    setScripts(
      category,
      scripts.filter((_, i) => i !== index)
    );
    if (editingScript?.category === category && editingScript.index === index) {
      setEditingScript(null);
    }
  };

  const startEdit = (category: ScriptCategory, index: number) => {
    setEditingScript({ category, index });
    setEditDraft({ ...getScripts(category)[index] });
  };

  const saveEdit = () => {
    if (!editingScript) return;
    const scripts = [...getScripts(editingScript.category)];
    scripts[editingScript.index] = editDraft;
    setScripts(editingScript.category, scripts);
    setEditingScript(null);
  };

  const groupedCategories = SCRIPT_CATEGORIES.reduce(
    (acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push(cat);
      return acc;
    },
    {} as Record<string, CategoryConfig[]>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">No station found. Create a station first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Paintbrush className="w-8 h-8 text-amber-600" />
              Station Branding
            </h1>
            <p className="text-gray-600 mt-1">Brand identity and imaging script library</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              saved
                ? "bg-green-600 text-white"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved" : "Save All"}
          </button>
        </div>

        <div className="space-y-6">
          {/* Section 1: Brand Identity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Station Name</label>
                <input
                  type="text"
                  value={station.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Call Sign</label>
                <input
                  type="text"
                  value={station.callSign || ""}
                  onChange={(e) => updateField("callSign", e.target.value || null)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="NCR"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Tagline</label>
                <input
                  type="text"
                  value={station.tagline || ""}
                  onChange={(e) => updateField("tagline", e.target.value || null)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Where the music finds you"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Genre</label>
                <input
                  type="text"
                  value={station.genre}
                  onChange={(e) => updateField("genre", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Americana, Country, Singer-Songwriter"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Format Type</label>
                <select
                  value={station.formatType || ""}
                  onChange={(e) => updateField("formatType", e.target.value || null)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select format...</option>
                  {FORMAT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Logo URL</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={station.logoUrl || ""}
                    onChange={(e) => updateField("logoUrl", e.target.value || null)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                  {station.logoUrl && (
                    <Image
                      src={station.logoUrl}
                      alt="Logo"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded object-cover border"
                      unoptimized
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={station.primaryColor || "#d97706"}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={station.primaryColor || ""}
                    onChange={(e) => updateField("primaryColor", e.target.value || null)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="#d97706"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={station.secondaryColor || "#1e3a5f"}
                    onChange={(e) => updateField("secondaryColor", e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={station.secondaryColor || ""}
                    onChange={(e) => updateField("secondaryColor", e.target.value || null)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="#1e3a5f"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 block mb-1">Description</label>
                <textarea
                  value={station.description || ""}
                  onChange={(e) => updateField("description", e.target.value || null)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Station description..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Imaging Script Library */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Imaging Script Library</h2>
              <span className="text-sm text-gray-500">
                {SCRIPT_CATEGORIES.reduce((sum, cat) => sum + getScripts(cat.key).length, 0)} scripts total
              </span>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedCategories).map(([group, categories]) => {
                const colors = GROUP_COLORS[group];
                const groupScriptCount = categories.reduce(
                  (sum, cat) => sum + getScripts(cat.key).length,
                  0
                );

                return (
                  <div key={group}>
                    <button
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [group]: !prev[group] }))
                      }
                      className="flex items-center gap-2 w-full text-left mb-2"
                    >
                      {expanded[group] ? (
                        <ChevronDown className={`w-4 h-4 ${colors.accent}`} />
                      ) : (
                        <ChevronRight className={`w-4 h-4 ${colors.accent}`} />
                      )}
                      <span className="font-semibold text-gray-900">{group}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${colors.tag}`}>
                        {groupScriptCount}
                      </span>
                    </button>

                    {expanded[group] && (
                      <div className="space-y-3 ml-6">
                        {categories.map((cat) => {
                          const scripts = getScripts(cat.key);
                          const isGenerating = generating[cat.key];

                          return (
                            <div
                              key={cat.key}
                              className={`rounded-lg border p-4 ${colors.bg} ${colors.border}`}
                            >
                              {/* Category header */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-gray-900">
                                    {cat.label}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({scripts.length})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => generateScripts(cat.key)}
                                    disabled={isGenerating}
                                    className="text-xs bg-white border rounded-lg px-3 py-1.5 font-medium hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
                                  >
                                    {isGenerating ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Wand2 className="w-3 h-3" />
                                    )}
                                    Generate All
                                  </button>
                                  <button
                                    onClick={() => addScript(cat.key)}
                                    className="text-xs bg-white border rounded-lg px-3 py-1.5 font-medium hover:bg-gray-50 flex items-center gap-1.5"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </button>
                                </div>
                              </div>

                              {/* Scripts */}
                              {scripts.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">
                                  No scripts yet. Click &ldquo;Generate All&rdquo; or
                                  &ldquo;Add&rdquo; to get started.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {scripts.map((script, i) => {
                                    const isEditing =
                                      editingScript?.category === cat.key &&
                                      editingScript.index === i;

                                    if (isEditing) {
                                      return (
                                        <div
                                          key={i}
                                          className="bg-white rounded-lg border p-3 space-y-2"
                                        >
                                          <input
                                            type="text"
                                            value={editDraft.label}
                                            onChange={(e) =>
                                              setEditDraft({
                                                ...editDraft,
                                                label: e.target.value,
                                              })
                                            }
                                            className="w-full border rounded px-2 py-1 text-sm font-medium"
                                            placeholder="Label"
                                          />
                                          <textarea
                                            value={editDraft.text}
                                            onChange={(e) =>
                                              setEditDraft({
                                                ...editDraft,
                                                text: e.target.value,
                                              })
                                            }
                                            className="w-full border rounded px-2 py-1 text-sm"
                                            rows={2}
                                            placeholder="Script text..."
                                          />
                                          <input
                                            type="text"
                                            value={editDraft.musicBed}
                                            onChange={(e) =>
                                              setEditDraft({
                                                ...editDraft,
                                                musicBed: e.target.value,
                                              })
                                            }
                                            className="w-full border rounded px-2 py-1 text-sm"
                                            placeholder="Music bed description"
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              onClick={saveEdit}
                                              className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                                            >
                                              Save
                                            </button>
                                            <button
                                              onClick={() => setEditingScript(null)}
                                              className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={i}
                                        className="bg-white/70 rounded-lg border border-white p-3"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-gray-500">
                                              {script.label}
                                            </span>
                                            <p className="text-sm text-gray-900 mt-0.5">
                                              &ldquo;{script.text}&rdquo;
                                            </p>
                                          </div>
                                          <div className="flex gap-1 shrink-0">
                                            <button
                                              onClick={() => startEdit(cat.key, i)}
                                              className="p-1 text-gray-400 hover:text-gray-600"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => deleteScript(cat.key, i)}
                                              className="p-1 text-gray-400 hover:text-red-500"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                        {script.musicBed && (
                                          <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-gray-100">
                                            <Music className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                            <p className="text-xs text-gray-500">
                                              {script.musicBed}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
