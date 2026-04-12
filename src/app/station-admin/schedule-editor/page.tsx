"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { CalendarDays, Save, Loader2, Clock, Radio, ChevronDown } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface DJOption {
  id: string;
  name: string;
  slug: string;
  colorPrimary: string | null;
}

interface ClockOption {
  id: string;
  name: string;
  clockType: string;
}

interface HourSlot {
  dayType: string;
  hour: number;
  djId: string;
  clockTemplateId: string;
}

const DJ_HOURS = Array.from({ length: 12 }, (_, i) => i + 6); // 6am-5pm

const DAY_TYPES = [
  { key: "weekday", label: "Weekdays", subtitle: "Mon — Fri" },
  { key: "saturday", label: "Saturday", subtitle: "Sat" },
  { key: "sunday", label: "Sunday", subtitle: "Sun" },
];

// DJ color palette fallback
const DJ_COLORS: Record<string, string> = {
  "hank-westwood": "#b45309",
  "loretta-merrick": "#9333ea",
  "doc-holloway": "#0d9488",
  "cody-rampart": "#2563eb",
};

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function formatHourRange(hour: number): string {
  return `${formatHour(hour)} — ${formatHour(hour + 1)}`;
}

function emptySchedule(): HourSlot[] {
  const slots: HourSlot[] = [];
  for (const dt of DAY_TYPES) {
    for (const hour of DJ_HOURS) {
      slots.push({ dayType: dt.key, hour, djId: "", clockTemplateId: "" });
    }
  }
  return slots;
}

export default function ScheduleEditorPage() {
  const [djs, setDjs] = useState<DJOption[]>([]);
  const [clocks, setClocks] = useState<ClockOption[]>([]);
  const [schedule, setSchedule] = useState<HourSlot[]>(emptySchedule());
  const [stationId, setStationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState("weekday");
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const stationsRes = await fetch("/api/stations");
        const stationsData = await stationsRes.json();
        const stations = stationsData.stations || [];
        if (stations.length === 0) { setLoading(false); return; }
        const sid = stations[0].id;
        setStationId(sid);

        const [djRes, clockRes, assignRes] = await Promise.all([
          fetch(`/api/station-djs?stationId=${sid}`).then((r) => r.json()),
          fetch("/api/clock-templates").then((r) => r.json()),
          fetch("/api/clock-assignments").then((r) => r.json()),
        ]);

        setDjs(djRes.djs || []);

        const clockList = Array.isArray(clockRes) ? clockRes : clockRes.templates || [];
        setClocks(clockList.map((c: { id: string; name: string; clock_type?: string; clockType?: string }) => ({
          id: c.id,
          name: c.name,
          clockType: c.clock_type || c.clockType || "general",
        })));

        const assignments = Array.isArray(assignRes) ? assignRes : assignRes.assignments || [];
        if (assignments.length > 0) {
          const newSchedule = emptySchedule();
          for (const a of assignments) {
            const djId = a.dj_id || a.djId || a.dj?.id || "";
            const clockId = a.clock_template_id || a.clockTemplateId || a.clockTemplate?.id || "";
            const dayType = a.day_type || a.dayType || "weekday";
            const startHour = parseInt((a.time_slot_start || a.timeSlotStart || "06:00").split(":")[0], 10);
            const endHour = parseInt((a.time_slot_end || a.timeSlotEnd || "09:00").split(":")[0], 10);
            const total = endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;

            for (let i = 0; i < total; i++) {
              const hour = (startHour + i) % 24;
              const idx = newSchedule.findIndex((s) => s.dayType === dayType && s.hour === hour);
              if (idx >= 0) {
                newSchedule[idx].djId = djId;
                newSchedule[idx].clockTemplateId = clockId;
              }
            }
          }
          setSchedule(newSchedule);
        }
      } catch {
        // Failed to load
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateSlot = (dayType: string, hour: number, field: string, value: string) => {
    setSchedule(
      schedule.map((s) =>
        s.dayType === dayType && s.hour === hour ? { ...s, [field]: value } : s
      )
    );
  };

  const saveSchedule = async () => {
    if (!stationId) return;
    setSaving(true);
    try {
      const validSlots = schedule.filter((s) => s.djId && s.clockTemplateId);
      type Assignment = { dayType: string; djId: string; clockTemplateId: string; timeSlotStart: string; timeSlotEnd: string };
      const assignments: Assignment[] = [];

      for (const dt of DAY_TYPES) {
        const daySlots = validSlots.filter((s) => s.dayType === dt.key).sort((a, b) => a.hour - b.hour);
        let current: Assignment | null = null;
        for (const slot of daySlots) {
          if (current && current.djId === slot.djId && current.clockTemplateId === slot.clockTemplateId) {
            current.timeSlotEnd = `${(slot.hour + 1).toString().padStart(2, "0")}:00`;
          } else {
            if (current) assignments.push(current);
            current = {
              dayType: dt.key, djId: slot.djId, clockTemplateId: slot.clockTemplateId,
              timeSlotStart: `${slot.hour.toString().padStart(2, "0")}:00`,
              timeSlotEnd: `${(slot.hour + 1).toString().padStart(2, "0")}:00`,
            };
          }
        }
        if (current) assignments.push(current);
      }

      const res = await fetch("/api/station-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId, schedule: assignments }),
      });
      if (res.ok) toast("Schedule saved successfully", "success");
      else toast("Failed to save schedule", "error");
    } catch {
      toast("Network error saving schedule", "error");
    } finally {
      setSaving(false);
    }
  };

  // Current hour highlight
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const currentDayType = currentDay === 0 ? "sunday" : currentDay === 6 ? "saturday" : "weekday";

  // Get DJ info for grouping
  const getDjForHour = (dayType: string, hour: number) => {
    const slot = schedule.find((s) => s.dayType === dayType && s.hour === hour);
    return slot?.djId || "";
  };

  const getDjSlug = (djId: string) => {
    return djs.find((d) => d.id === djId)?.slug || "";
  };

  const getDjColor = (djId: string): string => {
    const dj = djs.find((d) => d.id === djId);
    return dj?.colorPrimary || DJ_COLORS[dj?.slug || ""] || "#6b7280";
  };

  const getDjName = (djId: string): string => {
    return djs.find((d) => d.id === djId)?.name || "";
  };

  const getClockName = (clockId: string): string => {
    return clocks.find((c) => c.id === clockId)?.name || "";
  };

  // Group consecutive hours by same DJ for visual grouping
  const getHourLabel = (dayType: string, hour: number): string | null => {
    const currentDj = getDjForHour(dayType, hour);
    const prevDj = getDjForHour(dayType, hour - 1);
    if (currentDj && currentDj !== prevDj) {
      // Count consecutive hours for this DJ
      let count = 1;
      for (let h = hour + 1; h < 24; h++) {
        if (getDjForHour(dayType, h) === currentDj) count++;
        else break;
      }
      return `${getDjName(currentDj)}'s Show (${count} hours)`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-indigo-600" />
              Schedule Editor
            </h1>
            <p className="text-zinc-500 mt-1">Assign hosts and clock templates to each hour of programming</p>
          </div>
          <button
            onClick={saveSchedule}
            disabled={saving || !stationId}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Schedule
          </button>
        </div>

        {/* Day Type Tabs */}
        <div className="flex gap-2 mb-6">
          {DAY_TYPES.map((dt) => (
            <button
              key={dt.key}
              onClick={() => setActiveDay(dt.key)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                activeDay === dt.key
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 border border-zinc-800"
              }`}
            >
              <div>{dt.label}</div>
              <div className={`text-xs mt-0.5 ${activeDay === dt.key ? "text-indigo-200" : "text-zinc-500"}`}>
                {dt.subtitle}
              </div>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {DJ_HOURS.map((hour) => {
              const slot = schedule.find((s) => s.dayType === activeDay && s.hour === hour);
              const isCurrent = activeDay === currentDayType && hour === currentHour;
              const selectedDj = djs.find((d) => d.id === slot?.djId);
              const djColor = getDjColor(slot?.djId || "");
              const showLabel = getHourLabel(activeDay, hour);
              const selectedClock = clocks.find((c) => c.id === slot?.clockTemplateId);

              // Determine hour position within DJ's show
              const prevDj = getDjForHour(activeDay, hour - 1);
              const nextDj = getDjForHour(activeDay, hour + 1);
              const isFirst = slot?.djId && slot.djId !== prevDj;
              const isLast = slot?.djId && slot.djId !== nextDj;

              return (
                <div key={`${activeDay}-${hour}`}>
                  {/* DJ Show Header */}
                  {showLabel && (
                    <div
                      className="mt-6 mb-2 flex items-center gap-2 px-2"
                      style={{ color: djColor }}
                    >
                      <Radio className="w-4 h-4" />
                      <span className="font-bold text-sm">{showLabel}</span>
                      <div className="flex-1 h-px opacity-30" style={{ backgroundColor: djColor }} />
                    </div>
                  )}

                  <div
                    className={`bg-zinc-900/80 rounded-xl p-4 border-2 transition-all ${
                      isCurrent
                        ? "ring-2 ring-indigo-500 border-indigo-400 shadow-lg shadow-black/20"
                        : "border-zinc-800 hover:border-zinc-700"
                    }`}
                    style={selectedDj ? { borderLeftColor: djColor, borderLeftWidth: "4px" } : {}}
                  >
                    <div className="flex items-center gap-4">
                      {/* Time */}
                      <div className="w-32 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-500" />
                          <span className="font-bold text-zinc-100">{formatHourRange(hour)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {isCurrent && (
                            <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                              ON AIR
                            </span>
                          )}
                          {isFirst && selectedDj && (
                            <span className="text-[10px] text-amber-600 font-semibold">Show Start</span>
                          )}
                          {isLast && selectedDj && (
                            <span className="text-[10px] text-rose-600 font-semibold">Show End</span>
                          )}
                        </div>
                      </div>

                      {/* DJ Selector */}
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Host</label>
                        <div className="relative">
                          <select
                            value={slot?.djId || ""}
                            onChange={(e) => updateSlot(activeDay, hour, "djId", e.target.value)}
                            className="w-full border border-zinc-700 rounded-lg px-3 py-2.5 text-sm font-medium bg-zinc-800 text-white appearance-none cursor-pointer hover:border-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">— No Host —</option>
                            {djs.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                      </div>

                      {/* Clock Selector */}
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Clock Template</label>
                        <div className="relative">
                          <select
                            value={slot?.clockTemplateId || ""}
                            onChange={(e) => updateSlot(activeDay, hour, "clockTemplateId", e.target.value)}
                            className="w-full border border-zinc-700 rounded-lg px-3 py-2.5 text-sm bg-zinc-800 text-white appearance-none cursor-pointer hover:border-zinc-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">— No Clock —</option>
                            {clocks.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="w-24 flex-shrink-0 text-right">
                        {selectedClock && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-1 rounded-full">
                            {selectedClock.clockType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
