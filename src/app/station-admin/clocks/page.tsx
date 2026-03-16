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
  ChevronRight,
  Layers,
  Pencil,
  Trash2,
  Save,
  Users,
  ArrowUp,
  ArrowDown,
  Copy,
  Sparkles,
  AlertTriangle,
  AlertCircle,
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

interface BreakBlock {
  id: string;
  num: number;              // 1-based break number
  breakType: BreakType;
  label: string;
  slots: ClockSlot[];
  startMinute: number;
  totalDuration: number;
}

type BreakType = "toh" | "dj" | "sponsor" | "feature" | "quick" | "custom";

type EditorRow =
  | { kind: "song"; slot: ClockSlot; sortedIdx: number }
  | { kind: "break"; block: BreakBlock; firstSortedIdx: number };

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

const BREAK_PRESETS: Record<Exclude<BreakType, "custom">, {
  label: string;
  slots: Omit<ClockSlot, "position" | "minute">[];
}> = {
  toh: {
    label: "TOH Break",
    slots: [
      { type: "toh", category: "TOH", duration: 2, notes: "Top of hour ID" },
      { type: "voice_track", category: "DJ", duration: 0.2, notes: "DJ intro" },
    ],
  },
  dj: {
    label: "DJ Break",
    slots: [
      { type: "voice_track", category: "DJ", duration: 0.5, notes: "DJ voice track" },
    ],
  },
  sponsor: {
    label: "Sponsor Break",
    slots: [
      { type: "sweeper", category: "Imaging", duration: 1, notes: "Station sweeper" },
      { type: "sponsor", category: "Sponsor", duration: 1, notes: "Sponsor spot 1" },
      { type: "sponsor", category: "Sponsor", duration: 1, notes: "Sponsor spot 2" },
      { type: "promo", category: "Imaging", duration: 1, notes: "TFC promo" },
    ],
  },
  feature: {
    label: "Feature Break",
    slots: [
      { type: "sweeper", category: "Imaging", duration: 1, notes: "Station sweeper" },
      { type: "feature", category: "Feature", duration: 0.5, notes: "Feature segment" },
      { type: "sponsor", category: "Sponsor", duration: 1, notes: "Sponsor spot" },
      { type: "promo", category: "Imaging", duration: 1, notes: "TFC promo" },
    ],
  },
  quick: {
    label: "Quick Break",
    slots: [
      { type: "sweeper", category: "Imaging", duration: 1, notes: "Station sweeper" },
      { type: "promo", category: "Imaging", duration: 1, notes: "TFC promo" },
    ],
  },
};

const BREAK_COLORS: Record<BreakType, string> = {
  toh: "#dc2626", dj: "#f59e0b", sponsor: "#6b7280", feature: "#14b8a6",
  quick: "#ec4899", custom: "#8b5cf6",
};

// ============================================================================
// Clock Programming Rules
// ============================================================================

interface RuleViolation {
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  slotIndices?: number[];   // indices into sorted slots for highlighting
}

const CLOCK_RULES = {
  maxAListPerHour: 4,
  minEstablishedPct: 20,    // at least 20% of songs must be A, B, C, or D
  establishedCategories: new Set(["A", "B", "C", "D"]),
  replaceableByE: new Set(["B", "C", "D"]),  // E can replace these once E has songs
  eFallbackOrder: ["B", "C", "D"],  // when E is empty, fill from least-played B→C→D
};

function validateClockRules(slots: ClockSlot[]): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const sorted = [...slots].sort((a, b) => a.minute - b.minute);
  const songs = sorted.filter((s) => s.type === "song");

  if (songs.length === 0) return violations;

  // Rule 1: Max 4 A-list songs per hour
  const aSongs = songs.filter((s) => s.category === "A");
  if (aSongs.length > CLOCK_RULES.maxAListPerHour) {
    const indices = aSongs.map((s) => sorted.indexOf(s));
    violations.push({
      severity: "error",
      rule: "A-list limit",
      message: `${aSongs.length} A-list songs (max ${CLOCK_RULES.maxAListPerHour} per hour)`,
      slotIndices: indices,
    });
  }

  // Rule 2: At least 20% of songs must be from established categories (A, B, C, D)
  const establishedCount = songs.filter((s) => CLOCK_RULES.establishedCategories.has(s.category)).length;
  const establishedPct = (establishedCount / songs.length) * 100;
  if (establishedPct < CLOCK_RULES.minEstablishedPct) {
    violations.push({
      severity: "error",
      rule: "Established minimum",
      message: `Only ${Math.round(establishedPct)}% established (A-D) songs — minimum ${CLOCK_RULES.minEstablishedPct}%`,
    });
  }

  // Rule 3: E-category fallback — when no E songs exist, fill from least-played B → C → D
  const eSongs = songs.filter((s) => s.category === "E");
  if (eSongs.length > 0) {
    violations.push({
      severity: "info",
      rule: "E fallback",
      message: `${eSongs.length} E-category slot${eSongs.length !== 1 ? "s" : ""} — if no E songs available, scheduler fills from least-played B, then C, then D in rotation`,
    });
  }

  // Rule 4: Avoid back-to-back same song category (proxy for gender diversity)
  for (let i = 1; i < songs.length; i++) {
    if (songs[i].category === songs[i - 1].category) {
      violations.push({
        severity: "warning",
        rule: "Variety",
        message: `Back-to-back ${songs[i].category}-category songs at :${String(songs[i - 1].minute).padStart(2, "0")} and :${String(songs[i].minute).padStart(2, "0")} — avoid consecutive same category for vocal variety`,
        slotIndices: [sorted.indexOf(songs[i - 1]), sorted.indexOf(songs[i])],
      });
    }
  }

  // Rule 5: Least-played selection — all categories use least-played-first to reduce repetition
  const categoriesUsed = [...new Set(songs.map((s) => s.category))].sort().join(", ");
  violations.push({
    severity: "info",
    rule: "Deep selection",
    message: `All categories (${categoriesUsed}) use least-played-first selection — songs with fewest recent plays are scheduled first to maximize rotation depth and reduce repetition`,
  });

  return violations;
}

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
    // Collect all assigned start-hours
    const assignedHours = new Set<number>();
    for (const a of djAssigns) {
      if (a.time_slot_start) {
        assignedHours.add(parseInt(a.time_slot_start.split(":")[0]));
      }
    }

    if (assignedHours.size === 0) continue;

    // Detect overnight: has hours >= 18 AND hours < 6
    const hasEvening = [...assignedHours].some((h) => h >= 18);
    const hasMorning = [...assignedHours].some((h) => h < 6);
    const isOvernight = hasEvening && hasMorning;

    // Sort hours: overnight puts evening first (18+), then morning (0-5)
    const sortedHours = [...assignedHours].sort((a, b) => {
      if (isOvernight) {
        const aKey = a >= 18 ? a : a + 24;
        const bKey = b >= 18 ? b : b + 24;
        return aKey - bKey;
      }
      return a - b;
    });

    const hours: DJShowHour[] = [];
    for (let i = 0; i < sortedHours.length; i++) {
      const hourStart = sortedHours[i];
      const endHour = (hourStart + 1) % 24;
      const startTime = `${String(hourStart).padStart(2, "0")}:00`;
      const endTime = `${String(endHour).padStart(2, "0")}:00`;

      const matching = djAssigns.find((a) => {
        if (!a.time_slot_start) return false;
        return parseInt(a.time_slot_start.split(":")[0]) === hourStart;
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

    // shiftStart: first hour in sorted order
    const shiftStart = sortedHours[0];
    // shiftEnd: hour after the last sorted hour (mod 24)
    const shiftEnd = (sortedHours[sortedHours.length - 1] + 1) % 24;

    shows.push({
      djId,
      djName: djAssigns[0].dj_name,
      shiftStart,
      shiftEnd,
      hours,
    });
  }

  // Sort shows: use effective sort key (overnight shifts sort by 18+)
  shows.sort((a, b) => {
    const aKey = a.shiftStart;
    const bKey = b.shiftStart;
    return aKey - bKey;
  });
  return shows;
}

// ============================================================================
// Break Detection
// ============================================================================

function matchBreakType(group: ClockSlot[]): BreakType {
  const types = new Set(group.map((s) => s.type));
  if (types.has("toh")) return "toh";
  if (types.has("feature")) return "feature";
  if (types.has("sponsor")) return "sponsor";
  if (types.has("voice_track")) return "dj";
  if (types.has("sweeper") || types.has("promo")) return "quick";
  return "custom";
}

const BREAK_TYPE_LABELS: Record<BreakType, string> = {
  toh: "TOH Break", dj: "DJ Break", sponsor: "Sponsor Break",
  feature: "Feature Break", quick: "Quick Break", custom: "Custom Break",
};

function detectBreaks(slots: ClockSlot[]): EditorRow[] {
  const sorted = [...slots].sort((a, b) => a.minute - b.minute);
  const rows: EditorRow[] = [];
  let nonSongGroup: ClockSlot[] = [];
  let groupStartIdx = 0;
  let breakCounter = 0;

  // Collect all break blocks first, then assign positional labels
  const pendingBreaks: { group: ClockSlot[]; startIdx: number }[] = [];

  const finalizeGroup = () => {
    if (nonSongGroup.length === 0) return;
    pendingBreaks.push({ group: [...nonSongGroup], startIdx: groupStartIdx });
    nonSongGroup = [];
  };

  // Build rows with placeholder breaks
  const rowInserts: { position: number; breakIdx: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const slot = sorted[i];
    if (slot.type === "song") {
      if (nonSongGroup.length > 0) {
        rowInserts.push({ position: rows.length, breakIdx: pendingBreaks.length });
        finalizeGroup();
        rows.push(null as unknown as EditorRow); // placeholder
      }
      rows.push({ kind: "song", slot, sortedIdx: i });
    } else {
      if (nonSongGroup.length === 0) groupStartIdx = i;
      nonSongGroup.push(slot);
    }
  }
  if (nonSongGroup.length > 0) {
    rowInserts.push({ position: rows.length, breakIdx: pendingBreaks.length });
    finalizeGroup();
    rows.push(null as unknown as EditorRow); // placeholder
  }

  // Now assign labels with positional context
  for (let bi = 0; bi < pendingBreaks.length; bi++) {
    const { group, startIdx } = pendingBreaks[bi];
    const breakType = matchBreakType(group);
    const startMinute = group[0].minute;

    let label: string;
    // Only label as Show Opening/Closing if the actual slot notes say so
    const groupNotes = group.map(s => (s.notes || "").toUpperCase()).join(" ");
    if (groupNotes.includes("SHOW INTRO") || groupNotes.includes("SHOW OPEN")) {
      label = "Show Opening";
    } else if (groupNotes.includes("SHOW CLOSER") || groupNotes.includes("SHOW CLOSE") || groupNotes.includes("SIGNS OFF")) {
      label = "Show Closing";
    } else if (groupNotes.includes("SHOW TRANSITION") || groupNotes.includes("HANDS OFF")) {
      label = "Show Transition";
    } else {
      label = BREAK_TYPE_LABELS[breakType];
    }

    breakCounter++;
    const insert = rowInserts.find((r) => r.breakIdx === bi);
    if (insert) {
      rows[insert.position] = {
        kind: "break",
        block: {
          id: `break-${breakCounter}`,
          num: breakCounter,
          breakType,
          label,
          slots: group,
          startMinute,
          totalDuration: group.reduce((sum, s) => sum + s.duration, 0),
        },
        firstSortedIdx: startIdx,
      };
    }
  }

  return rows;
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
  const [expandedBreaks, setExpandedBreaks] = useState<Set<string>>(new Set());
  const [showInsertBreak, setShowInsertBreak] = useState(false);
  const [insertBreakMinute, setInsertBreakMinute] = useState(0);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const editorRows = useMemo(() => detectBreaks(slots), [slots]);
  const breakBlocks = useMemo(
    () => editorRows.filter((r): r is Extract<EditorRow, { kind: "break" }> => r.kind === "break").map((r) => r.block),
    [editorRows]
  );

  // Drag-and-drop: reorder slots by swapping minute values
  const handleDragStart = (sortedIdx: number) => {
    setDragIdx(sortedIdx);
  };

  const handleDragOver = (e: React.DragEvent, sortedIdx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== sortedIdx) {
      setDragOverIdx(sortedIdx);
    }
  };

  const handleDrop = (sortedIdx: number) => {
    if (dragIdx === null || dragIdx === sortedIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }

    const sorted = [...slots].sort((a, b) => a.minute - b.minute);
    const dragSlot = sorted[dragIdx];
    const dropSlot = sorted[sortedIdx];

    if (!dragSlot || !dropSlot) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }

    // For break blocks: find all consecutive non-song slots from the drag source
    const isDragBreak = dragSlot.type !== "song";
    const isDropBreak = dropSlot.type !== "song";

    if (!isDragBreak && !isDropBreak) {
      // Song ↔ Song: simple swap of minute values
      const dragReal = slots.indexOf(dragSlot);
      const dropReal = slots.indexOf(dropSlot);
      setSlots(prev => prev.map((s, i) => {
        if (i === dragReal) return { ...s, minute: dropSlot.minute };
        if (i === dropReal) return { ...s, minute: dragSlot.minute };
        return s;
      }));
    } else {
      // Break or mixed: collect the contiguous group and shift minutes
      // Find the group of slots to move (consecutive non-song or single song)
      const getGroup = (startIdx: number): number[] => {
        const indices = [startIdx];
        const startSlot = sorted[startIdx];
        if (startSlot.type === "song") return indices;
        // Expand forward through consecutive non-song slots
        for (let i = startIdx + 1; i < sorted.length; i++) {
          if (sorted[i].type !== "song" && sorted[i].minute - sorted[i - 1].minute <= 1) {
            indices.push(i);
          } else break;
        }
        return indices;
      };

      const dragGroup = getGroup(dragIdx);
      const dropMinute = dropSlot.minute;
      const dragMinuteStart = sorted[dragGroup[0]].minute;
      const offset = dropMinute - dragMinuteStart;

      // Shift all slots in the drag group by the offset
      const dragRealIndices = dragGroup.map(si => slots.indexOf(sorted[si]));
      setSlots(prev => prev.map((s, i) => {
        const groupPos = dragRealIndices.indexOf(i);
        if (groupPos >= 0) {
          return { ...s, minute: Math.max(0, Math.min(59, s.minute + offset)) };
        }
        return s;
      }));
    }

    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

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

  const toggleBreak = (id: string) => {
    setExpandedBreaks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const removeBreak = (block: BreakBlock) => {
    const breakSlotKeys = new Set(
      block.slots.map((s) => `${s.type}:${s.minute}:${s.duration}:${s.notes}`)
    );
    setSlots((prev) => {
      const toRemove = new Set<number>();
      for (let i = 0; i < prev.length; i++) {
        const key = `${prev[i].type}:${prev[i].minute}:${prev[i].duration}:${prev[i].notes}`;
        if (breakSlotKeys.has(key) && !toRemove.has(i)) {
          breakSlotKeys.delete(key);
          toRemove.add(i);
        }
      }
      return prev.filter((_, i) => !toRemove.has(i));
    });
    setSelectedIdx(null);
  };

  const insertBreak = (breakType: Exclude<BreakType, "custom">, atMinute: number) => {
    const preset = BREAK_PRESETS[breakType];
    let minute = atMinute;
    const newSlots: ClockSlot[] = preset.slots.map((s, i) => {
      const slot: ClockSlot = {
        position: slots.length + i + 1,
        minute,
        duration: s.duration,
        category: s.category,
        type: s.type,
        notes: s.notes,
      };
      minute += s.duration;
      return slot;
    });
    setSlots((prev) => [...prev, ...newSlots]);
    setShowInsertBreak(false);
  };

  const updateBreakSlot = (block: BreakBlock, slotIdx: number, field: keyof ClockSlot, value: string | number) => {
    const target = block.slots[slotIdx];
    setSlots((prev) =>
      prev.map((s) =>
        s.type === target.type && s.minute === target.minute && s.duration === target.duration && s.notes === target.notes
          ? { ...s, [field]: value }
          : s
      )
    );
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

  // Rule validation
  const ruleViolations = useMemo(() => validateClockRules(slots), [slots]);
  const violatedSlotIndices = useMemo(() => {
    const set = new Set<number>();
    for (const v of ruleViolations) {
      if (v.slotIndices) v.slotIndices.forEach((i) => set.add(i));
    }
    return set;
  }, [ruleViolations]);
  const errors = ruleViolations.filter((v) => v.severity === "error");
  const warnings = ruleViolations.filter((v) => v.severity === "warning");
  const infos = ruleViolations.filter((v) => v.severity === "info");

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
        {(() => {
          const breaks = editorRows.filter((r) => r.kind === "break");
          if (breaks.length === 0) return null;
          const labels = breaks.map((r) => r.kind === "break" ? r.block.label.replace(" Break", "") : "").join(", ");
          return (
            <span className="bg-purple-50 border border-purple-200 text-purple-700 rounded px-2 py-0.5">
              {breaks.length} break{breaks.length !== 1 ? "s" : ""} ({labels})
            </span>
          );
        })()}
      </div>

      {/* Rule Violations */}
      {ruleViolations.length > 0 && (
        <div className="space-y-1.5">
          {errors.map((v, i) => (
            <div key={`err-${i}`} className="flex items-start gap-2 bg-red-50 border border-red-200 rounded px-3 py-1.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span><strong>{v.rule}:</strong> {v.message}</span>
            </div>
          ))}
          {warnings.map((v, i) => (
            <div key={`warn-${i}`} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 text-xs text-amber-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span><strong>{v.rule}:</strong> {v.message}</span>
            </div>
          ))}
          {infos.map((v, i) => (
            <div key={`info-${i}`} className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-1.5 text-xs text-blue-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span><strong>{v.rule}:</strong> {v.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Slot List with Break Blocks */}
      <div className="overflow-y-auto space-y-1">
        {editorRows.map((row) => {
          if (row.kind === "song") {
            const { slot, sortedIdx } = row;
            const realIdx = slots.indexOf(slot);
            const hasViolation = violatedSlotIndices.has(sortedIdx);
            return (
              <div
                key={`song-${sortedIdx}`}
                ref={(el) => { slotRefs.current[sortedIdx] = el; }}
                onClick={() => setSelectedIdx(sortedIdx)}
                draggable
                onDragStart={() => handleDragStart(sortedIdx)}
                onDragOver={(e) => handleDragOver(e, sortedIdx)}
                onDrop={() => handleDrop(sortedIdx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 border rounded px-3 py-1.5 text-sm cursor-grab active:cursor-grabbing transition-all ${
                  dragOverIdx === sortedIdx
                    ? "border-blue-500 border-2 bg-blue-50 scale-[1.02] shadow-md"
                    : dragIdx === sortedIdx
                    ? "opacity-40 border-dashed"
                    : selectedIdx === sortedIdx
                    ? "bg-blue-50 border-blue-400 ring-2 ring-blue-300"
                    : hasViolation
                    ? "bg-red-50 border-red-300 ring-1 ring-red-200"
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
          }

          // Break block row
          const { block, firstSortedIdx } = row;
          const isExpanded = expandedBreaks.has(block.id);
          return (
            <div key={block.id}>
              {/* Break summary row */}
              <div
                ref={(el) => { slotRefs.current[firstSortedIdx] = el; }}
                onClick={() => setSelectedIdx(firstSortedIdx)}
                draggable
                onDragStart={() => handleDragStart(firstSortedIdx)}
                onDragOver={(e) => handleDragOver(e, firstSortedIdx)}
                onDrop={() => handleDrop(firstSortedIdx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 border rounded px-3 py-1.5 text-sm cursor-grab active:cursor-grabbing transition-all ${
                  dragOverIdx === firstSortedIdx
                    ? "border-blue-500 border-2 bg-blue-50 scale-[1.02] shadow-md"
                    : dragIdx === firstSortedIdx
                    ? "opacity-40 border-dashed"
                    : selectedIdx === firstSortedIdx
                    ? "bg-blue-50 border-blue-400 ring-2 ring-blue-300"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                style={{ borderLeftWidth: 3, borderLeftColor: BREAK_COLORS[block.breakType] }}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: BREAK_COLORS[block.breakType] }}
                />
                <Layers className="w-4 h-4 text-gray-500 shrink-0" />
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: BREAK_COLORS[block.breakType] }}
                >
                  {block.num}
                </span>
                <span className="font-medium text-gray-800">{block.label}</span>
                <span className="text-xs text-gray-500">
                  {block.slots.length} slot{block.slots.length !== 1 ? "s" : ""}, {Math.round(block.totalDuration * 10) / 10}min at :{String(block.startMinute).padStart(2, "0")}
                </span>
                <span className="flex-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBreak(block.id); }}
                  className="text-gray-400 hover:text-gray-700 p-0.5"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeBreak(block); }}
                  className="text-red-400 hover:text-red-600 p-0.5"
                  title="Delete entire break"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expanded break slots */}
              {isExpanded && (
                <div className="ml-6 border-l-2 pl-2 space-y-1 my-1" style={{ borderColor: BREAK_COLORS[block.breakType] }}>
                  {block.slots.map((bSlot, bIdx) => (
                    <div
                      key={`${block.id}-${bIdx}`}
                      className="flex items-center gap-2 border rounded px-3 py-1.5 text-sm bg-white hover:bg-gray-50"
                    >
                      <span className={`w-3 h-3 rounded-sm ${slotColor(bSlot.category)}`} />
                      <select
                        value={bSlot.type}
                        onChange={(e) => updateBreakSlot(block, bIdx, "type", e.target.value)}
                        className="border rounded px-1.5 py-0.5 text-xs w-28"
                      >
                        {SLOT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <select
                        value={bSlot.category}
                        onChange={(e) => updateBreakSlot(block, bIdx, "category", e.target.value)}
                        className="border rounded px-1.5 py-0.5 text-xs w-20"
                      >
                        {SLOT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <label className="text-xs text-gray-500">min:</label>
                      <input
                        type="number"
                        value={bSlot.minute}
                        onChange={(e) => updateBreakSlot(block, bIdx, "minute", parseInt(e.target.value) || 0)}
                        className="border rounded px-1.5 py-0.5 text-xs w-14 text-center"
                        min={0}
                        max={59}
                      />
                      <label className="text-xs text-gray-500">dur:</label>
                      <input
                        type="number"
                        value={bSlot.duration}
                        onChange={(e) => updateBreakSlot(block, bIdx, "duration", parseFloat(e.target.value) || 0)}
                        className="border rounded px-1.5 py-0.5 text-xs w-14 text-center"
                        min={0}
                        max={10}
                        step={0.1}
                      />
                      <input
                        type="text"
                        value={bSlot.notes}
                        onChange={(e) => updateBreakSlot(block, bIdx, "notes", e.target.value)}
                        className="border rounded px-1.5 py-0.5 text-xs flex-1"
                        placeholder="notes"
                      />
                    </div>
                  ))}
                </div>
              )}
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

      {/* Insert Break */}
      <div>
        <button
          onClick={() => setShowInsertBreak(!showInsertBreak)}
          className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800"
        >
          <Layers className="w-4 h-4" />
          Insert Break Block
        </button>
        {showInsertBreak && (
          <div className="mt-2 bg-white border rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">At minute:</label>
              <input
                type="number"
                value={insertBreakMinute}
                onChange={(e) => setInsertBreakMinute(parseInt(e.target.value) || 0)}
                className="border rounded px-2 py-1 text-xs w-16 text-center"
                min={0}
                max={59}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(BREAK_PRESETS) as [Exclude<BreakType, "custom">, typeof BREAK_PRESETS[keyof typeof BREAK_PRESETS]][]).map(([key, preset]) => {
                const totalDur = preset.slots.reduce((s, sl) => s + sl.duration, 0);
                return (
                  <button
                    key={key}
                    onClick={() => insertBreak(key, insertBreakMinute)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: BREAK_COLORS[key] }}
                  >
                    {preset.label} ({totalDur}min)
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
              breaks={breakBlocks}
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
  breaks,
}: {
  slots: ClockSlot[];
  size?: number;
  selectedIdx?: number | null;
  onWedgeClick?: (idx: number) => void;
  breaks?: BreakBlock[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Build sequential segments: songs + break blocks in order, sized by duration
  type Segment =
    | { kind: "song"; slot: ClockSlot; sortedIdx: number; duration: number }
    | { kind: "break"; block: BreakBlock; duration: number };

  const segments = useMemo((): Segment[] => {
    const rows = detectBreaks(slots);
    return rows.map((row) => {
      if (row.kind === "song") {
        return { kind: "song", slot: row.slot, sortedIdx: row.sortedIdx, duration: row.slot.duration };
      }
      return { kind: "break", block: row.block, duration: row.block.totalDuration };
    });
  }, [slots]);

  const totalDuration = useMemo(
    () => segments.reduce((sum, seg) => sum + seg.duration, 0),
    [segments]
  );

  // Pre-compute sequential angles — breaks get a minimum width so numbers fit
  const segmentArcs = useMemo(() => {
    const MIN_BREAK_DEG = 18; // minimum degrees for a break segment
    if (totalDuration <= 0) return segments.map(() => ({ startAngle: -90, endAngle: -90 }));

    // First pass: compute raw angles
    const raw = segments.map((seg) => (seg.duration / totalDuration) * 360);

    // Second pass: enforce minimum for breaks, steal from songs proportionally
    let deficit = 0;
    const adjusted = raw.map((deg, i) => {
      if (segments[i].kind === "break" && deg < MIN_BREAK_DEG) {
        deficit += MIN_BREAK_DEG - deg;
        return MIN_BREAK_DEG;
      }
      return deg;
    });

    // Shrink song segments proportionally to cover the deficit
    if (deficit > 0) {
      const songTotal = adjusted.reduce((sum, deg, i) => sum + (segments[i].kind === "song" ? deg : 0), 0);
      if (songTotal > 0) {
        const scale = (songTotal - deficit) / songTotal;
        for (let i = 0; i < adjusted.length; i++) {
          if (segments[i].kind === "song") adjusted[i] *= scale;
        }
      }
    }

    const arcs: { startAngle: number; endAngle: number }[] = [];
    let cursor = -90;
    for (const deg of adjusted) {
      arcs.push({ startAngle: cursor, endAngle: cursor + deg });
      cursor += deg;
    }
    return arcs;
  }, [segments, totalDuration]);

  const cx = 110;
  const cy = 110;
  const outerR = 92;
  const innerR = 44;

  const polarToCart = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (startAngle: number, endAngle: number, rOuter = outerR, rInner = innerR) => {
    const sweep = endAngle - startAngle;
    if (sweep <= 0) return "";
    const largeArc = sweep > 180 ? 1 : 0;
    const oStart = polarToCart(startAngle, rOuter);
    const oEnd = polarToCart(endAngle, rOuter);
    const iStart = polarToCart(startAngle, rInner);
    const iEnd = polarToCart(endAngle, rInner);
    return [
      `M ${oStart.x} ${oStart.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
      `L ${iEnd.x} ${iEnd.y}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}`,
      "Z",
    ].join(" ");
  };

  const hoveredSeg = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="flex flex-col items-center gap-3" style={{ maxWidth: size }}>
      <svg viewBox="0 0 220 220" className="w-full" style={{ maxWidth: size }}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={outerR} fill="#e5e7eb" />
        <circle cx={cx} cy={cy} r={innerR} fill="white" />

        {/* All segments — songs and breaks in sequence */}
        {segments.map((seg, i) => {
          const arc = segmentArcs[i];
          const isHovered = hoveredIdx === i;
          const isSelected = seg.kind === "song" && externalSelectedIdx === seg.sortedIdx;
          const somethingActive = hoveredIdx !== null || externalSelectedIdx != null;
          const dimmed = somethingActive && !isSelected && !isHovered;

          if (seg.kind === "song") {
            const fill = CATEGORY_HEX[seg.slot.category] || "#d1d5db";
            return (
              <path
                key={`seg-${i}`}
                d={arcPath(arc.startAngle, arc.endAngle)}
                fill={fill}
                stroke={isSelected ? "#3b82f6" : "white"}
                strokeWidth={isSelected ? 2.5 : 1.5}
                opacity={dimmed ? 0.35 : 0.92}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onWedgeClick?.(seg.sortedIdx)}
                className="transition-opacity duration-150 cursor-pointer"
              />
            );
          }

          // Break segment
          const color = BREAK_COLORS[seg.block.breakType];
          return (
            <path
              key={`seg-${i}`}
              d={arcPath(arc.startAngle, arc.endAngle)}
              fill={color}
              stroke="white"
              strokeWidth={1.5}
              opacity={isHovered ? 0.5 : 0.3}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            />
          );
        })}

        {/* Song labels */}
        {segments.map((seg, i) => {
          if (seg.kind !== "song") return null;
          const arc = segmentArcs[i];
          const sweep = arc.endAngle - arc.startAngle;
          if (sweep < 15) return null; // too small for label
          const midAngle = (arc.startAngle + arc.endAngle) / 2;
          const labelR = (outerR + innerR) / 2;
          const pos = polarToCart(midAngle, labelR);
          const fontSize = sweep < 22 ? 9 : 11;
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
              {seg.slot.category}
            </text>
          );
        })}

        {/* Break number badges */}
        {segments.map((seg, i) => {
          if (seg.kind !== "break") return null;
          const arc = segmentArcs[i];
          const midAngle = (arc.startAngle + arc.endAngle) / 2;
          const labelR = (outerR + innerR) / 2;
          const pos = polarToCart(midAngle, labelR);
          const color = BREAK_COLORS[seg.block.breakType];
          return (
            <g key={`brk-${i}`}>
              <circle cx={pos.x} cy={pos.y} r={7} fill={color} opacity={0.9} />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={8}
                fontWeight="bold"
                pointerEvents="none"
              >
                {seg.block.num}
              </text>
            </g>
          );
        })}

        {/* Divider ticks between segments */}
        {segmentArcs.map((arc, i) => {
          if (i === 0) return null;
          const pt1 = polarToCart(arc.startAngle, innerR);
          const pt2 = polarToCart(arc.startAngle, outerR);
          return (
            <line
              key={`div-${i}`}
              x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
              stroke="white" strokeWidth={1} opacity={0.6}
            />
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
          {slots.length}
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
      {hoveredSeg && (
        <div className="text-sm text-center bg-gray-800 text-white rounded-lg px-4 py-2 -mt-1">
          {hoveredSeg.kind === "song" ? (
            <>
              <span className="font-semibold">{hoveredSeg.slot.type}</span>
              {" "}({hoveredSeg.slot.category}) at :{String(hoveredSeg.slot.minute).padStart(2, "0")}
              {" "}&mdash; {hoveredSeg.slot.duration}min
              {hoveredSeg.slot.notes && <span className="opacity-75"> &middot; {hoveredSeg.slot.notes}</span>}
            </>
          ) : (
            <>
              <span className="font-semibold">#{hoveredSeg.block.num} {hoveredSeg.block.label}</span>
              {" "}&mdash; {hoveredSeg.block.slots.length} slots, {Math.round(hoveredSeg.block.totalDuration * 10) / 10}min at :{String(hoveredSeg.block.startMinute).padStart(2, "0")}
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {Object.entries(CATEGORY_HEX).map(([cat, hex]) => {
          const hasCategory = slots.some((s) => s.category === cat && s.type === "song");
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
        {breaks && breaks.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-200 text-gray-600">
            {breaks.length} breaks
          </span>
        )}
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
      if (!tRes.ok || !aRes.ok) {
        const errMsg = !tRes.ok
          ? `Templates: ${tRes.status} ${tRes.statusText}`
          : `Assignments: ${aRes.status} ${aRes.statusText}`;
        console.error("Clock API error:", errMsg);
        showToast(`Failed to load clocks (${errMsg})`);
      } else {
        const tData = await tRes.json();
        const aData = await aRes.json();
        setTemplates(Array.isArray(tData) ? tData : tData.templates || []);
        setAssignments(Array.isArray(aData) ? aData : aData.assignments || []);
      }
    } catch (err) {
      console.error("Failed to fetch templates/assignments:", err);
      showToast("Network error loading clocks");
    }

    // DJs fetched separately — cross-origin call may fail due to CORS
    try {
      const dRes = await fetch("/api/clock-djs");
      if (dRes.ok) {
        const dData = await dRes.json();
        setDjs(Array.isArray(dData) ? dData : dData.djs || []);
      }
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

      const totalHours = show.hours.length;
      // Divide hours into 3 blocks (e.g. 3→1,1,1  12→4,4,4  6→2,2,2)
      const blockSize = Math.ceil(totalHours / 3);
      const blocks: DJShowHour[][] = [];
      for (let i = 0; i < totalHours; i += blockSize) {
        blocks.push(show.hours.slice(i, i + blockSize));
      }

      // Generate block labels based on shift length
      const blockLabels =
        totalHours <= 3
          ? ["Hour 1 (Open)", "Hour 2 (Body)", "Hour 3 (Close)"]
          : blocks.map((blk, i) => {
              const start = formatTime12(blk[0].startTime);
              const end = formatTime12(blk[blk.length - 1].endTime);
              return `Block ${i + 1} (${start}–${end})`;
            });

      const templateNames = blockLabels.map(
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
      if (newTemplateIds.length < blocks.length) {
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

      if (newTemplateIds.length !== blocks.length) {
        showToast(`Failed to create all ${blocks.length} templates`);
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

      // Create new 1-hour assignments, one per hour in each block
      for (let b = 0; b < blocks.length; b++) {
        for (const hr of blocks[b]) {
          await fetch("/api/clock-assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dj_id: show.djId,
              clock_template_id: newTemplateIds[b],
              day_of_week: null,
              time_slot_start: hr.startTime,
              time_slot_end: hr.endTime,
            }),
          });
        }
      }

      showToast(`Generated ${blocks.length} show clocks for ${show.djName}`);
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
                      {show.hours.length > 3 &&
                        ` (${Math.ceil(show.hours.length / 3)}h each)`}
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
