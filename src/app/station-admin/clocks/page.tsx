"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Clock,
  Plus,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Save,
  Users,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface ClockSlot {
  position: number;
  minute: number;
  duration: number;
  category: string;
  type: string;
  notes: string;
}

interface ClockTemplate {
  id: string;
  name: string;
  description: string | null;
  clock_pattern: ClockSlot[] | Record<string, never>;
  is_active: boolean;
  usage_count: number;
  clock_type: string;
  tempo: string | null;
  programming_notes: string | null;
  created_at: string | null;
  hits_per_hour: number;
  indie_per_hour: number;
  energy_level: string;
  gender_balance_target: number;
}

interface DJAssignment {
  id: string;
  dj_id: string;
  dj_name: string;
  clock_template_id: string;
  clock_template_name: string;
  day_of_week: number | null;
  time_slot_start: string | null;
  time_slot_end: string | null;
  priority: number;
  is_active: boolean;
}

interface DJ {
  id: string;
  display_name: string;
  is_active: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  TOH: "bg-red-600",
  A: "bg-red-500",
  B: "bg-blue-500",
  C: "bg-green-500",
  D: "bg-purple-500",
  E: "bg-orange-500",
  DJ: "bg-amber-500",
  Sponsor: "bg-gray-500",
  Feature: "bg-teal-500",
  Imaging: "bg-pink-500",
};

const SLOT_TYPES = ["toh", "voice_track", "song", "sponsor", "feature", "sweeper", "promo"];
const SLOT_CATEGORIES = ["TOH", "A", "B", "C", "D", "E", "DJ", "Sponsor", "Feature", "Imaging"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatClockType(t: string) {
  return (t || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function slotColor(category: string) {
  return CATEGORY_COLORS[category] || "bg-gray-300";
}

// ============================================================================
// Slot Editor Component
// ============================================================================

function SlotEditor({
  template,
  onSave,
  onCancel,
}: {
  template: ClockTemplate;
  onSave: (pattern: ClockSlot[]) => void;
  onCancel: () => void;
}) {
  const initialSlots = Array.isArray(template.clock_pattern) ? template.clock_pattern : [];
  const [slots, setSlots] = useState<ClockSlot[]>([...initialSlots]);
  const [newSlot, setNewSlot] = useState<Partial<ClockSlot>>({
    type: "song",
    category: "C",
    minute: 0,
    duration: 4,
    notes: "",
  });

  const updateSlot = (idx: number, field: keyof ClockSlot, value: string | number) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSlot = () => {
    const slot: ClockSlot = {
      position: slots.length + 1,
      minute: Number(newSlot.minute) || 0,
      duration: Number(newSlot.duration) || 0,
      category: newSlot.category || "C",
      type: newSlot.type || "song",
      notes: newSlot.notes || "",
    };
    setSlots((prev) => [...prev, slot]);
    setNewSlot({ type: "song", category: "C", minute: 0, duration: 4, notes: "" });
  };

  const handleSave = () => {
    const sorted = [...slots]
      .sort((a, b) => a.minute - b.minute)
      .map((s, i) => ({ ...s, position: i + 1 }));
    onSave(sorted);
  };

  // Summary counts
  const typeCounts: Record<string, number> = {};
  for (const s of slots) {
    typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
  }

  return (
    <div className="border-t bg-gray-50 p-5 space-y-5">
      {/* Timeline Bar */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">60-Minute Timeline</h4>
        <div className="relative h-10 bg-gray-200 rounded-lg overflow-hidden">
          {slots.map((slot, i) => {
            const left = (slot.minute / 60) * 100;
            const width = Math.max((slot.duration / 60) * 100, 1.2);
            return (
              <div
                key={i}
                className={`absolute top-0 h-full ${slotColor(slot.category)} opacity-85 border-r border-white/30`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${slot.type} (${slot.category}) @ :${String(slot.minute).padStart(2, "0")} — ${slot.duration}min`}
              />
            );
          })}
          {/* Minute markers */}
          {[0, 15, 30, 45].map((m) => (
            <div
              key={m}
              className="absolute top-0 h-full border-l border-black/20"
              style={{ left: `${(m / 60) * 100}%` }}
            >
              <span className="text-[9px] text-gray-600 ml-0.5">:{String(m).padStart(2, "0")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(typeCounts).map(([type, count]) => (
          <span key={type} className="bg-white border rounded px-2 py-0.5">
            {type}: {count}
          </span>
        ))}
        <span className="bg-white border rounded px-2 py-0.5 font-semibold">
          Total: {slots.length} slots
        </span>
      </div>

      {/* Slot List */}
      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {slots
          .slice()
          .sort((a, b) => a.minute - b.minute)
          .map((slot, sortedIdx) => {
            const realIdx = slots.indexOf(slot);
            return (
              <div
                key={realIdx}
                className="flex items-center gap-2 bg-white border rounded px-3 py-1.5 text-sm"
              >
                <span className={`w-3 h-3 rounded-sm ${slotColor(slot.category)}`} />
                <select
                  value={slot.type}
                  onChange={(e) => updateSlot(realIdx, "type", e.target.value)}
                  className="border rounded px-1.5 py-0.5 text-xs w-28"
                >
                  {SLOT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={slot.category}
                  onChange={(e) => updateSlot(realIdx, "category", e.target.value)}
                  className="border rounded px-1.5 py-0.5 text-xs w-20"
                >
                  {SLOT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <label className="text-xs text-gray-500">min:</label>
                <input
                  type="number"
                  value={slot.minute}
                  onChange={(e) => updateSlot(realIdx, "minute", parseInt(e.target.value) || 0)}
                  className="border rounded px-1.5 py-0.5 text-xs w-14 text-center"
                  min={0}
                  max={59}
                />
                <label className="text-xs text-gray-500">dur:</label>
                <input
                  type="number"
                  value={slot.duration}
                  onChange={(e) => updateSlot(realIdx, "duration", parseInt(e.target.value) || 0)}
                  className="border rounded px-1.5 py-0.5 text-xs w-14 text-center"
                  min={0}
                  max={10}
                />
                <input
                  type="text"
                  value={slot.notes}
                  onChange={(e) => updateSlot(realIdx, "notes", e.target.value)}
                  className="border rounded px-1.5 py-0.5 text-xs flex-1"
                  placeholder="notes"
                />
                <button
                  onClick={() => removeSlot(realIdx)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
      </div>

      {/* Add Slot */}
      <div className="flex items-center gap-2 bg-white border-2 border-dashed rounded px-3 py-2 text-sm">
        <Plus className="w-4 h-4 text-gray-400" />
        <select
          value={newSlot.type}
          onChange={(e) => setNewSlot({ ...newSlot, type: e.target.value })}
          className="border rounded px-1.5 py-0.5 text-xs w-28"
        >
          {SLOT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={newSlot.category}
          onChange={(e) => setNewSlot({ ...newSlot, category: e.target.value })}
          className="border rounded px-1.5 py-0.5 text-xs w-20"
        >
          {SLOT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="text-xs text-gray-500">min:</label>
        <input
          type="number"
          value={newSlot.minute ?? 0}
          onChange={(e) => setNewSlot({ ...newSlot, minute: parseInt(e.target.value) || 0 })}
          className="border rounded px-1.5 py-0.5 text-xs w-14 text-center"
          min={0}
          max={59}
        />
        <label className="text-xs text-gray-500">dur:</label>
        <input
          type="number"
          value={newSlot.duration ?? 0}
          onChange={(e) => setNewSlot({ ...newSlot, duration: parseInt(e.target.value) || 0 })}
          className="border rounded px-1.5 py-0.5 text-xs w-14 text-center"
          min={0}
          max={10}
        />
        <input
          type="text"
          value={newSlot.notes || ""}
          onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
          className="border rounded px-1.5 py-0.5 text-xs flex-1"
          placeholder="notes"
        />
        <button
          onClick={addSlot}
          className="bg-blue-600 text-white px-3 py-0.5 rounded text-xs font-medium hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Pattern
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function RadioClocksPage() {
  const [templates, setTemplates] = useState<ClockTemplate[]>([]);
  const [assignments, setAssignments] = useState<DJAssignment[]>([]);
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    clock_type: "midday",
    tempo: "moderate",
  });
  const [newAssignment, setNewAssignment] = useState({
    dj_id: "",
    clock_template_id: "",
    day_of_week: "",
    time_slot_start: "06:00",
    time_slot_end: "09:00",
  });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch all data
  const fetchAll = useCallback(async () => {
    try {
      const [tRes, aRes, dRes] = await Promise.all([
        fetch("/api/clock-templates"),
        fetch("/api/clock-assignments"),
        fetch(
          "https://tfc-radio-backend-production.up.railway.app/api/clocks/djs"
        ),
      ]);
      const tData = await tRes.json();
      const aData = await aRes.json();
      const dData = await dRes.json();

      setTemplates(tData.templates || []);
      setAssignments(aData.assignments || []);
      setDjs(dData.djs || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Template CRUD
  const createTemplate = async () => {
    if (!newTemplate.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clock-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Template created");
        setShowCreate(false);
        setNewTemplate({ name: "", description: "", clock_type: "midday", tempo: "moderate" });
        await fetchAll();
      }
    } catch {
      showToast("Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  const savePattern = async (templateId: string, pattern: ClockSlot[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clock-templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clock_pattern: pattern }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Pattern saved");
        setEditing(null);
        await fetchAll();
      }
    } catch {
      showToast("Failed to save pattern");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Deactivate this clock template?")) return;
    try {
      const res = await fetch(`/api/clock-templates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Template deactivated");
        await fetchAll();
      } else {
        showToast(data.detail || "Failed to delete");
      }
    } catch {
      showToast("Failed to delete template");
    }
  };

  // Assignment CRUD
  const createAssignment = async () => {
    if (!newAssignment.dj_id || !newAssignment.clock_template_id) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clock-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dj_id: newAssignment.dj_id,
          clock_template_id: newAssignment.clock_template_id,
          day_of_week: newAssignment.day_of_week ? parseInt(newAssignment.day_of_week) : null,
          time_slot_start: newAssignment.time_slot_start,
          time_slot_end: newAssignment.time_slot_end,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Assignment created");
        setNewAssignment({ dj_id: "", clock_template_id: "", day_of_week: "", time_slot_start: "06:00", time_slot_end: "09:00" });
        await fetchAll();
      }
    } catch {
      showToast("Failed to create assignment");
    } finally {
      setSaving(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this DJ assignment?")) return;
    try {
      await fetch(
        `https://tfc-radio-backend-production.up.railway.app/api/clocks/assignments/${id}`,
        { method: "DELETE" }
      );
      showToast("Assignment deleted");
      await fetchAll();
    } catch {
      showToast("Failed to delete assignment");
    }
  };

  const parseSlots = (pattern: ClockSlot[] | Record<string, never>): ClockSlot[] => {
    if (Array.isArray(pattern)) return pattern;
    return [];
  };

  const activeTemplates = templates.filter((t) => t.is_active);

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              Radio Clocks
            </h1>
            <p className="text-gray-600 mt-1">
              Edit clock templates, slot patterns, and DJ assignments
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">New Clock Template</h3>
              <button onClick={() => setShowCreate(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Template name"
              />
              <select
                value={newTemplate.clock_type}
                onChange={(e) => setNewTemplate({ ...newTemplate, clock_type: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                {["morning_drive", "midday", "evening", "late_night", "weekend"].map((t) => (
                  <option key={t} value={t}>
                    {formatClockType(t)}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              rows={2}
              placeholder="Description..."
            />
            <div className="flex gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500">Tempo</label>
                <select
                  value={newTemplate.tempo}
                  onChange={(e) => setNewTemplate({ ...newTemplate, tempo: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="upbeat">Upbeat</option>
                  <option value="moderate">Moderate</option>
                  <option value="laid_back">Laid Back</option>
                </select>
              </div>
            </div>
            <button
              onClick={createTemplate}
              disabled={saving || !newTemplate.name}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Template"}
            </button>
          </div>
        )}

        {/* Category legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(CATEGORY_COLORS).map(([cat, cls]) => (
            <span
              key={cat}
              className={`${cls} text-white text-xs px-2 py-1 rounded font-medium`}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Templates */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No clock templates yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((t) => {
              const slots = parseSlots(t.clock_pattern);
              const isExpanded = expanded === t.id;
              const isEditing = editing === t.id;

              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    !t.is_active ? "opacity-60" : ""
                  }`}
                >
                  <button
                    onClick={() => {
                      if (isEditing) return;
                      setExpanded(isExpanded ? null : t.id);
                    }}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-2.5 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">
                          {t.name}
                          {!t.is_active && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">
                            {formatClockType(t.clock_type)}
                          </span>
                          {t.tempo && <span>Tempo: {t.tempo}</span>}
                          {t.energy_level && <span>Energy: {t.energy_level}</span>}
                          <span>{slots.length} slots</span>
                          <span>{t.usage_count} DJ{t.usage_count !== 1 ? "s" : ""} assigned</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.is_active && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(isEditing ? null : t.id);
                              setExpanded(t.id);
                            }}
                            className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
                            title="Edit slots"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(t.id);
                            }}
                            className="p-1.5 rounded hover:bg-red-100 text-red-500"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && !isEditing && (
                    <div className="border-t px-5 py-4">
                      {t.description && (
                        <p className="text-sm text-gray-600 mb-4">{t.description}</p>
                      )}
                      {slots.length > 0 ? (
                        <>
                          {/* Mini timeline */}
                          <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden mb-3">
                            {slots.map((slot, i) => {
                              const left = (slot.minute / 60) * 100;
                              const width = Math.max((slot.duration / 60) * 100, 1.2);
                              return (
                                <div
                                  key={i}
                                  className={`absolute top-0 h-full ${slotColor(
                                    slot.category
                                  )} opacity-85 border-r border-white/30`}
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                  title={`${slot.type} (${slot.category}) @ :${String(
                                    slot.minute
                                  ).padStart(2, "0")} — ${slot.duration}min`}
                                />
                              );
                            })}
                          </div>
                          {/* Slot grid */}
                          <div className="grid grid-cols-10 gap-1">
                            {slots.map((slot, i) => (
                              <div
                                key={i}
                                className={`${slotColor(
                                  slot.category
                                )} text-white rounded px-1.5 py-2 text-center text-xs`}
                                title={`${slot.type} (${slot.category}) @ :${String(
                                  slot.minute
                                ).padStart(2, "0")} (${slot.duration}min) ${slot.notes || ""}`}
                              >
                                <div className="font-bold">{slot.category}</div>
                                <div className="opacity-75">
                                  :{String(slot.minute).padStart(2, "0")}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No clock pattern defined. Click the edit button to add slots.
                        </p>
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <SlotEditor
                      template={t}
                      onSave={(pattern) => savePattern(t.id, pattern)}
                      onCancel={() => setEditing(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ================================================================ */}
        {/* DJ Assignment Manager */}
        {/* ================================================================ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6">
            <Users className="w-7 h-7 text-blue-600" />
            DJ Clock Assignments
          </h2>

          {/* Assignment table */}
          {assignments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">DJ</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Template</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Day</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Start</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">End</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Priority</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignments.map((a) => (
                    <tr key={a.id} className={!a.is_active ? "opacity-50" : ""}>
                      <td className="px-4 py-3 font-medium">{a.dj_name}</td>
                      <td className="px-4 py-3">{a.clock_template_name}</td>
                      <td className="px-4 py-3">
                        {a.day_of_week !== null ? DAY_NAMES[a.day_of_week] : "All"}
                      </td>
                      <td className="px-4 py-3">{a.time_slot_start || "—"}</td>
                      <td className="px-4 py-3">{a.time_slot_end || "—"}</td>
                      <td className="px-4 py-3">{a.priority}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            a.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {a.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteAssignment(a.id)}
                          className="text-red-400 hover:text-red-600"
                          title="Delete assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add assignment form */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Add Assignment</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">DJ</label>
                <select
                  value={newAssignment.dj_id}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, dj_id: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select DJ...</option>
                  {djs
                    .filter((d) => d.is_active)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.display_name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Template</label>
                <select
                  value={newAssignment.clock_template_id}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      clock_template_id: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select template...</option>
                  {activeTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Day</label>
                <select
                  value={newAssignment.day_of_week}
                  onChange={(e) =>
                    setNewAssignment({ ...newAssignment, day_of_week: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All days</option>
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start</label>
                <input
                  type="time"
                  value={newAssignment.time_slot_start}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      time_slot_start: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End</label>
                <input
                  type="time"
                  value={newAssignment.time_slot_end}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      time_slot_end: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={createAssignment}
              disabled={saving || !newAssignment.dj_id || !newAssignment.clock_template_id}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {saving ? "Creating..." : "Add Assignment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
