"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  ArrowUp,
  ArrowDown,
  Copy,
  Sparkles,
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

interface DJShowHour {
  hour: number;
  startTime: string;
  endTime: string;
  assignment?: DJAssignment;
  template?: ClockTemplate;
}

interface DJShow {
  djId: string;
  djName: string;
  shiftStart: number;
  shiftEnd: number;
  hours: DJShowHour[];
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

const CATEGORY_HEX: Record<string, string> = {
  TOH: "#dc2626",
  A: "#ef4444",
  B: "#3b82f6",
  C: "#22c55e",
  D: "#a855f7",
  E: "#f97316",
  DJ: "#f59e0b",
  Sponsor: "#6b7280",
  Feature: "#14b8a6",
  Imaging: "#ec4899",
};

const SLOT_LABELS: Record<string, string> = {
  toh: "TOH",
  voice_track: "DJ",
  sponsor: "Ad",
  feature: "Feat",
  sweeper: "Swp",
  promo: "Pro",
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

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function buildDJShows(
  assignments: DJAssignment[],
  templates: ClockTemplate[]
): DJShow[] {
  const byDJ: Record<string, DJAssignment[]> = {};
  for (const a of assignments) {
    if (!a.is_active) continue;
    if (!byDJ[a.dj_id]) byDJ[a.dj_id] = [];
    byDJ[a.dj_id].push(a);
  }

  const templateMap = new Map(templates.map((t) => [t.id, t]));
  const shows: DJShow[] = [];

  for (const [djId, djAssigns] of Object.entries(byDJ)) {
    let minStart = 24;
    let maxEnd = 0;
    for (const a of djAssigns) {
      if (a.time_slot_start) {
        const h = parseInt(a.time_slot_start.split(":")[0]);
        if (h < minStart) minStart = h;
      }
      if (a.time_slot_end) {
        const h = parseInt(a.time_slot_end.split(":")[0]);
        if (h > maxEnd) maxEnd = h;
      }
    }

    if (maxEnd - minStart < 2) continue;
    const numHours = Math.min(maxEnd - minStart, 3);
    const hours: DJShowHour[] = [];

    for (let i = 0; i < numHours; i++) {
      const hourStart = minStart + i;
      const startTime = `${String(hourStart).padStart(2, "0")}:00`;
      const endTime = `${String(hourStart + 1).padStart(2, "0")}:00`;

      const matching = djAssigns.find((a) => {
        if (!a.time_slot_start) return false;
        const aStart = parseInt(a.time_slot_start.split(":")[0]);
        const aEnd = a.time_slot_end
          ? parseInt(a.time_slot_end.split(":")[0])
          : aStart + 1;
        return aStart <= hourStart && aEnd > hourStart;
      });

      hours.push({
        hour: i + 1,
        startTime,
        endTime,
        assignment: matching,
        template: matching
          ? templateMap.get(matching.clock_template_id)
          : undefined,
      });
    }

    shows.push({
      djId,
      djName: djAssigns[0].dj_name,
      shiftStart: minStart,
      shiftEnd: maxEnd,
      hours,
    });
  }

  shows.sort((a, b) => a.shiftStart - b.shiftStart);
  return shows;
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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleWedgeClick = (idx: number) => {
    setSelectedIdx(idx);
    slotRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const updateSlot = (idx: number, field: keyof ClockSlot, value: string | number) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  };

  const moveSlot = (sortedIdx: number, direction: "up" | "down") => {
    const sorted = [...slots].sort((a, b) => a.minute - b.minute);
    const targetIdx = direction === "up" ? sortedIdx - 1 : sortedIdx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    // Swap minute values so the visual order changes
    const currentReal = slots.indexOf(sorted[sortedIdx]);
    const targetReal = slots.indexOf(sorted[targetIdx]);
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i === currentReal) return { ...s, minute: sorted[targetIdx].minute };
        if (i === targetReal) return { ...s, minute: sorted[sortedIdx].minute };
        return s;
      })
    );
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
      {/* Two-column layout: slot list + clock face */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: summary, slots, add, save */}
        <div className="flex-1 min-w-0 space-y-4 order-2 lg:order-1">

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
      <div className="overflow-y-auto space-y-1">
        {slots
          .slice()
          .sort((a, b) => a.minute - b.minute)
          .map((slot, sortedIdx) => {
            const realIdx = slots.indexOf(slot);
            return (
              <div
                key={realIdx}
                ref={(el) => { slotRefs.current[sortedIdx] = el; }}
                onClick={() => setSelectedIdx(sortedIdx)}
                className={`flex items-center gap-2 border rounded px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                  selectedIdx === sortedIdx
                    ? "bg-blue-50 border-blue-400 ring-2 ring-blue-300"
                    : "bg-white hover:bg-gray-50"
                }`}
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
                  onClick={() => moveSlot(sortedIdx, "up")}
                  disabled={sortedIdx === 0}
                  className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveSlot(sortedIdx, "down")}
                  disabled={sortedIdx === slots.length - 1}
                  className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
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

        {/* Right column: large clock face (sticky) */}
        {slots.length > 0 && (
          <div className="lg:w-[540px] shrink-0 lg:sticky lg:top-4 lg:self-start order-1 lg:order-2">
            <ClockFace
              slots={slots}
              size={500}
              selectedIdx={selectedIdx}
              onWedgeClick={handleWedgeClick}
            />
          </div>
        )}
      </div>

      {/* Timeline Bar (full width below columns) */}
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
    </div>
  );
}

// ============================================================================
// Clock Face Visualization
// ============================================================================

function ClockFace({
  slots,
  size = 500,
  selectedIdx: externalSelectedIdx,
  onWedgeClick,
}: {
  slots: ClockSlot[];
  size?: number;
  selectedIdx?: number | null;
  onWedgeClick?: (idx: number) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => a.minute - b.minute),
    [slots]
  );

  const cx = 110;
  const cy = 110;
  const outerR = 92;
  const innerR = 44;

  // Convert minute to angle (0 min = 12 o'clock = -90deg in SVG coords)
  const minToAngle = (min: number) => (min / 60) * 360 - 90;

  // Convert polar to cartesian
  const polarToCart = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // Build annular sector path
  const arcPath = (startMin: number, endMin: number, rOuter = outerR, rInner = innerR) => {
    const visualEnd = Math.max(endMin, startMin + 0.5);
    const a1 = minToAngle(startMin);
    const a2 = minToAngle(visualEnd);
    const sweep = a2 - a1;
    const largeArc = sweep > 180 ? 1 : 0;

    const oStart = polarToCart(a1, rOuter);
    const oEnd = polarToCart(a2, rOuter);
    const iStart = polarToCart(a1, rInner);
    const iEnd = polarToCart(a2, rInner);

    return [
      `M ${oStart.x} ${oStart.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
      `L ${iEnd.x} ${iEnd.y}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}`,
      "Z",
    ].join(" ");
  };

  // Slot label
  const slotLabel = (slot: ClockSlot) => {
    if (slot.type === "song") return slot.category;
    return SLOT_LABELS[slot.type] || slot.type.charAt(0).toUpperCase();
  };

  // Label position (midpoint of song wedge)
  const labelPos = (slot: ClockSlot) => {
    const midMin = slot.minute + slot.duration / 2;
    const midAngle = minToAngle(midMin);
    const labelR = (outerR + innerR) / 2;
    return polarToCart(midAngle, labelR);
  };

  // Tick marks
  const ticks = useMemo(() => {
    const result: { min: number; major: boolean }[] = [];
    for (let m = 0; m < 60; m += 5) {
      result.push({ min: m, major: m % 15 === 0 });
    }
    return result;
  }, []);

  const hoveredSlot = hoveredIdx !== null ? sortedSlots[hoveredIdx] : null;

  return (
    <div className="flex flex-col items-center gap-3" style={{ maxWidth: size }}>
      <svg viewBox="0 0 220 220" className="w-full" style={{ maxWidth: size }}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={outerR} fill="#e5e7eb" />
        <circle cx={cx} cy={cy} r={innerR} fill="white" />

        {/* Song wedges — bold and colorful */}
        {sortedSlots.map((slot, i) => {
          if (slot.type !== "song") return null;
          const fill = CATEGORY_HEX[slot.category] || "#d1d5db";
          const isSelected = externalSelectedIdx === i;
          const isHovered = hoveredIdx === i;
          const somethingActive = hoveredIdx !== null || externalSelectedIdx != null;
          const dimmed = somethingActive && !isSelected && !isHovered;
          return (
            <path
              key={i}
              d={arcPath(slot.minute, slot.minute + slot.duration)}
              fill={fill}
              stroke={isSelected ? "#3b82f6" : "white"}
              strokeWidth={isSelected ? 2.5 : 2}
              opacity={dimmed ? 0.35 : 0.92}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onWedgeClick?.(i)}
              className="transition-opacity duration-150 cursor-pointer"
            />
          );
        })}

        {/* Non-song slots — invisible but clickable for interaction */}
        {sortedSlots.map((slot, i) => {
          if (slot.type === "song") return null;
          const isSelected = externalSelectedIdx === i;
          const isHovered = hoveredIdx === i;
          return (
            <path
              key={`ns-${i}`}
              d={arcPath(slot.minute, slot.minute + slot.duration)}
              fill={isHovered ? "#6b7280" : "transparent"}
              stroke={isSelected ? "#3b82f6" : "none"}
              strokeWidth={isSelected ? 2 : 0}
              opacity={isHovered ? 0.4 : 0}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onWedgeClick?.(i)}
              className="cursor-pointer"
            />
          );
        })}

        {/* Song labels only */}
        {sortedSlots.map((slot, i) => {
          if (slot.type !== "song" || slot.duration < 2.5) return null;
          const pos = labelPos(slot);
          const label = slotLabel(slot);
          const fontSize = slot.duration < 3.5 ? 9 : 11;
          return (
            <text
              key={`lbl-${i}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={fontSize}
              fontWeight="bold"
              pointerEvents="none"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
            >
              {label}
            </text>
          );
        })}

        {/* Tick marks */}
        {ticks.map(({ min, major }) => {
          const angle = minToAngle(min);
          const tickOuter = polarToCart(angle, outerR + 2);
          const tickInner = polarToCart(angle, outerR - (major ? 4 : 2));
          const labelPt = polarToCart(angle, outerR + 10);
          return (
            <g key={`tick-${min}`}>
              <line
                x1={tickInner.x}
                y1={tickInner.y}
                x2={tickOuter.x}
                y2={tickOuter.y}
                stroke={major ? "#374151" : "#9ca3af"}
                strokeWidth={major ? 1 : 0.5}
              />
              {major && (
                <text
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={8}
                  fill="#6b7280"
                  fontWeight="600"
                >
                  :{String(min).padStart(2, "0")}
                </text>
              )}
            </g>
          );
        })}

        {/* Center text */}
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight="bold"
          fill="#374151"
        >
          {sortedSlots.length}
        </text>
        <text
          x={cx}
          y={cy + 9}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={7}
          fill="#6b7280"
        >
          slots/hr
        </text>
      </svg>

      {/* Hover tooltip */}
      {hoveredSlot && (
        <div className="text-sm text-center bg-gray-800 text-white rounded-lg px-4 py-2 -mt-1">
          <span className="font-semibold">{hoveredSlot.type}</span>
          {" "}({hoveredSlot.category}) at :{String(hoveredSlot.minute).padStart(2, "0")}
          {" "}&mdash; {hoveredSlot.duration}min
          {hoveredSlot.notes && <span className="opacity-75"> &middot; {hoveredSlot.notes}</span>}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {Object.entries(CATEGORY_HEX).map(([cat, hex]) => {
          const hasCategory = sortedSlots.some((s) => s.category === cat);
          if (!hasCategory) return null;
          return (
            <span
              key={cat}
              className="text-white text-xs px-2 py-0.5 rounded font-medium"
              style={{ backgroundColor: hex }}
            >
              {cat}
            </span>
          );
        })}
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
  const [showHourEditing, setShowHourEditing] = useState<{
    djId: string;
    hour: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch all data — each request independent so one failure doesn't block others
  const fetchAll = useCallback(async () => {
    try {
      const [tRes, aRes] = await Promise.all([
        fetch("/api/clock-templates"),
        fetch("/api/clock-assignments"),
      ]);
      const tData = await tRes.json();
      const aData = await aRes.json();
      setTemplates(tData.templates || []);
      setAssignments(aData.assignments || []);
    } catch (err) {
      console.error("Failed to fetch templates/assignments:", err);
    }

    // DJs fetched separately — cross-origin call may fail due to CORS
    try {
      const dRes = await fetch("/api/clock-djs");
      const dData = await dRes.json();
      setDjs(dData.djs || []);
    } catch (err) {
      console.error("Failed to fetch DJs:", err);
    }

    setLoading(false);
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
        setShowHourEditing(null);
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

  const duplicateTemplate = async (source: ClockTemplate) => {
    setSaving(true);
    try {
      const sourceSlots = Array.isArray(source.clock_pattern) ? source.clock_pattern : [];
      const res = await fetch("/api/clock-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${source.name} (Copy)`,
          description: source.description || "",
          clock_type: source.clock_type,
          tempo: source.tempo || "moderate",
          clock_pattern: sourceSlots.map((s) => ({ ...s })),
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Template duplicated");
        await fetchAll();
      } else {
        showToast(data.detail || "Failed to duplicate");
      }
    } catch {
      showToast("Failed to duplicate template");
    } finally {
      setSaving(false);
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
      await fetch(`/api/clock-assignments/${id}`, { method: "DELETE" });
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

  // === DJ Show Clocks logic ===

  const assignTemplateToHour = async (
    show: DJShow,
    hourIdx: number,
    templateId: string
  ) => {
    if (!templateId) return;
    setSaving(true);
    try {
      // Determine what template each hour should have after the change
      const hourTemplates = show.hours.map((h, i) =>
        i === hourIdx ? templateId : h.template?.id || ""
      );

      // Delete all existing assignments for this DJ
      const djAssigns = assignments.filter((a) => a.dj_id === show.djId);
      await Promise.all(
        djAssigns.map((a) =>
          fetch(`/api/clock-assignments/${a.id}`, { method: "DELETE" })
        )
      );

      // Create new 1-hour assignments for hours that have a template
      for (let i = 0; i < show.hours.length; i++) {
        if (!hourTemplates[i]) continue;
        const startHour = show.shiftStart + i;
        await fetch("/api/clock-assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dj_id: show.djId,
            clock_template_id: hourTemplates[i],
            day_of_week: null,
            time_slot_start: `${String(startHour).padStart(2, "0")}:00`,
            time_slot_end: `${String(startHour + 1).padStart(2, "0")}:00`,
          }),
        });
      }

      showToast("Hour assignment updated");
      await fetchAll();
    } catch {
      showToast("Failed to update assignment");
    } finally {
      setSaving(false);
    }
  };

  const generateShowClocks = async (show: DJShow) => {
    setSaving(true);
    try {
      // Use the first hour's template as source pattern
      const sourceTemplate = show.hours[0]?.template;
      const sourceSlots =
        sourceTemplate && Array.isArray(sourceTemplate.clock_pattern)
          ? sourceTemplate.clock_pattern
          : [];

      const hourLabels = ["Hour 1 (Open)", "Hour 2 (Body)", "Hour 3 (Close)"];
      const templateNames = hourLabels.map(
        (label) => `${show.djName} - ${label}`
      );

      // Create 3 new templates, collecting IDs from responses
      const newTemplateIds: string[] = [];
      for (const name of templateNames) {
        const res = await fetch("/api/clock-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: `Auto-generated show clock for ${show.djName}`,
            clock_type: sourceTemplate?.clock_type || "midday",
            tempo: sourceTemplate?.tempo || "moderate",
            clock_pattern: sourceSlots.map((s) => ({ ...s })),
          }),
        });
        const data = await res.json();
        if (data.template?.id) {
          newTemplateIds.push(data.template.id);
        }
      }

      // If we didn't get IDs from responses, refetch templates and find by name
      if (newTemplateIds.length < 3) {
        const tRes = await fetch("/api/clock-templates");
        const tData = await tRes.json();
        const freshTemplates: ClockTemplate[] = tData.templates || [];
        newTemplateIds.length = 0;
        for (const name of templateNames) {
          const found = freshTemplates.find(
            (t) => t.name === name && t.is_active
          );
          if (found) newTemplateIds.push(found.id);
        }
      }

      if (newTemplateIds.length !== 3) {
        showToast("Failed to create all 3 templates");
        setSaving(false);
        return;
      }

      // Delete all existing assignments for this DJ
      const djAssigns = assignments.filter((a) => a.dj_id === show.djId);
      await Promise.all(
        djAssigns.map((a) =>
          fetch(`/api/clock-assignments/${a.id}`, { method: "DELETE" })
        )
      );

      // Create new 1-hour assignments
      for (let i = 0; i < 3; i++) {
        const startHour = show.shiftStart + i;
        await fetch("/api/clock-assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dj_id: show.djId,
            clock_template_id: newTemplateIds[i],
            day_of_week: null,
            time_slot_start: `${String(startHour).padStart(2, "0")}:00`,
            time_slot_end: `${String(startHour + 1).padStart(2, "0")}:00`,
          }),
        });
      }

      showToast(`Generated 3 show clocks for ${show.djName}`);
      await fetchAll();
    } catch {
      showToast("Failed to generate show clocks");
    } finally {
      setSaving(false);
    }
  };

  const djShows = useMemo(
    () => buildDJShows(assignments, templates),
    [assignments, templates]
  );

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

        {/* ================================================================ */}
        {/* DJ Show Clocks */}
        {/* ================================================================ */}
        {!loading && djShows.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6">
              <Users className="w-7 h-7 text-amber-600" />
              DJ Show Clocks
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Assign different clock templates to each hour of a DJ&apos;s shift,
              or generate 3 dedicated templates per DJ.
            </p>
            <div className="space-y-4">
              {djShows.map((show) => (
                <div
                  key={show.djId}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden"
                >
                  {/* DJ Header */}
                  <div className="p-4 flex items-center justify-between border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <Users className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {show.djName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatTime12(show.hours[0].startTime)} –{" "}
                          {formatTime12(show.hours[show.hours.length - 1].endTime)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => generateShowClocks(show)}
                      disabled={saving}
                      className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate 3 Clocks
                    </button>
                  </div>

                  {/* Hour rows */}
                  <div className="divide-y">
                    {show.hours.map((hour, idx) => {
                      const hourSlots = hour.template
                        ? parseSlots(hour.template.clock_pattern)
                        : [];
                      const isEditingThisHour =
                        showHourEditing?.djId === show.djId &&
                        showHourEditing?.hour === idx;

                      return (
                        <div key={idx}>
                          <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="sm:w-40 shrink-0">
                              <span className="text-sm font-medium text-gray-700">
                                Hour {hour.hour}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">
                                ({formatTime12(hour.startTime)}–
                                {formatTime12(hour.endTime)})
                              </span>
                            </div>
                            <select
                              value={hour.template?.id || ""}
                              onChange={(e) =>
                                assignTemplateToHour(show, idx, e.target.value)
                              }
                              disabled={saving}
                              className="border rounded-lg px-2 py-1.5 text-sm w-full sm:w-56"
                            >
                              <option value="">No template</option>
                              {activeTemplates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            {hour.template && (
                              <button
                                onClick={() =>
                                  setShowHourEditing(
                                    isEditingThisHour
                                      ? null
                                      : { djId: show.djId, hour: idx }
                                  )
                                }
                                className={`p-1.5 rounded hover:bg-blue-100 ${
                                  isEditingThisHour
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-blue-600"
                                }`}
                                title="Edit slots"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {/* Mini timeline bar */}
                            <div className="flex-1 relative h-6 bg-gray-200 rounded overflow-hidden">
                              {hourSlots.map((slot, i) => (
                                <div
                                  key={i}
                                  className={`absolute top-0 h-full ${slotColor(
                                    slot.category
                                  )} opacity-85 border-r border-white/30`}
                                  style={{
                                    left: `${(slot.minute / 60) * 100}%`,
                                    width: `${Math.max(
                                      (slot.duration / 60) * 100,
                                      1.2
                                    )}%`,
                                  }}
                                  title={`${slot.type} (${
                                    slot.category
                                  }) @ :${String(slot.minute).padStart(
                                    2,
                                    "0"
                                  )} — ${slot.duration}min`}
                                />
                              ))}
                              {hourSlots.length === 0 && (
                                <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                  No slots
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Inline slot editor for this hour */}
                          {isEditingThisHour && hour.template && (
                            <SlotEditor
                              template={hour.template}
                              onSave={(pattern) =>
                                savePattern(hour.template!.id, pattern)
                              }
                              onCancel={() => setShowHourEditing(null)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                              duplicateTemplate(t);
                            }}
                            className="p-1.5 rounded hover:bg-green-100 text-green-600"
                            title="Duplicate template"
                          >
                            <Copy className="w-4 h-4" />
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
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1 min-w-0 order-2 lg:order-1">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Slot Summary</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {[...slots].sort((a, b) => a.minute - b.minute).map((slot, i) => (
                                <span
                                  key={i}
                                  className="text-white text-xs px-2 py-0.5 rounded font-medium"
                                  style={{ backgroundColor: CATEGORY_HEX[slot.category] || "#d1d5db" }}
                                >
                                  {SLOT_LABELS[slot.type] || slot.type} :{String(slot.minute).padStart(2, "0")}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="lg:w-[540px] shrink-0 order-1 lg:order-2">
                            <ClockFace slots={slots} size={500} />
                          </div>
                        </div>
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
            <div className="bg-white rounded-xl shadow-sm border overflow-x-auto mb-6">
              <table className="w-full text-sm min-w-[640px]">
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
                  {[...assignments].sort((a, b) => {
                    // DJ schedule order: Hank(6-9) → Loretta(9-12) → Doc(12-3) → Cody(3-6) → others
                    const DJ_ORDER: Record<string, number> = {
                      hank_westwood: 0,
                      loretta_merrick: 1,
                      doc_holloway: 2,
                      cody_rampart: 3,
                      automation: 4,
                    };
                    const oa = DJ_ORDER[a.dj_id] ?? 99;
                    const ob = DJ_ORDER[b.dj_id] ?? 99;
                    if (oa !== ob) return oa - ob;
                    // Within same DJ, sort by day then time
                    const da = a.day_of_week ?? -1;
                    const db = b.day_of_week ?? -1;
                    if (da !== db) return da - db;
                    return (a.time_slot_start || "").localeCompare(b.time_slot_start || "");
                  }).map((a) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-4">
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
