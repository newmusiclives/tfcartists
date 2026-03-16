"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { CalendarDays, Save, Loader2, Clock } from "lucide-react";
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
  hour: number; // 0-23
  djId: string;
  clockTemplateId: string;
}

// Generate all 24 hours
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// DJ shift hours (6am-6pm)
const DJ_HOURS = Array.from({ length: 12 }, (_, i) => i + 6); // 6-17

const DAY_TYPES = [
  { key: "weekday", label: "Weekdays" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
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

        // clock-templates returns array directly now
        const clockList = Array.isArray(clockRes) ? clockRes : clockRes.templates || [];
        setClocks(clockList.map((c: { id: string; name: string; clock_type?: string; clockType?: string }) => ({
          id: c.id,
          name: c.name,
          clockType: c.clock_type || c.clockType || "general",
        })));

        // Map assignments to per-hour slots
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
      // Group consecutive hours by DJ+clock into time slot ranges
      const validSlots = schedule.filter((s) => s.djId && s.clockTemplateId);

      // Convert per-hour slots to time slot assignments
      type Assignment = { dayType: string; djId: string; clockTemplateId: string; timeSlotStart: string; timeSlotEnd: string };
      const assignments: Assignment[] = [];

      for (const dt of DAY_TYPES) {
        const daySlots = validSlots
          .filter((s) => s.dayType === dt.key)
          .sort((a, b) => a.hour - b.hour);

        let current: Assignment | null = null;
        for (const slot of daySlots) {
          if (current && current.djId === slot.djId && current.clockTemplateId === slot.clockTemplateId) {
            // Extend current range
            current.timeSlotEnd = `${(slot.hour + 1).toString().padStart(2, "0")}:00`;
          } else {
            if (current) assignments.push(current);
            current = {
              dayType: dt.key,
              djId: slot.djId,
              clockTemplateId: slot.clockTemplateId,
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
      if (res.ok) {
        toast("Schedule saved successfully", "success");
      } else {
        toast("Failed to save schedule", "error");
      }
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

  // Group hours by DJ for visual grouping
  const getDjForHour = (dayType: string, hour: number) => {
    const slot = schedule.find((s) => s.dayType === dayType && s.hour === hour);
    return slot?.djId || "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-indigo-600" />
              Schedule Editor
            </h1>
            <p className="text-gray-600 mt-1">Assign DJs and clock templates to each hour</p>
          </div>
          <button
            onClick={saveSchedule}
            disabled={saving || !stationId}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Schedule
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {DAY_TYPES.map((dt) => (
              <div key={dt.key}>
                <h2 className="font-semibold text-gray-900 mb-3 text-center text-lg">{dt.label}</h2>
                <div className="space-y-1">
                  {DJ_HOURS.map((hour) => {
                    const slot = schedule.find((s) => s.dayType === dt.key && s.hour === hour);
                    const isCurrent = dt.key === currentDayType && hour === currentHour;
                    const selectedDj = djs.find((d) => d.id === slot?.djId);
                    const prevDj = getDjForHour(dt.key, hour - 1);
                    const isShiftStart = slot?.djId !== prevDj;

                    return (
                      <div
                        key={`${dt.key}-${hour}`}
                        className={`bg-white rounded-lg p-2.5 border transition-all ${
                          isCurrent ? "ring-2 ring-indigo-500 border-indigo-300" : ""
                        } ${isShiftStart && hour > 6 ? "mt-3 border-t-2 border-t-amber-300" : ""}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 w-14 flex-shrink-0">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs font-mono font-bold text-gray-600">{formatHour(hour)}</span>
                          </div>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                              NOW
                            </span>
                          )}
                          <select
                            value={slot?.djId || ""}
                            onChange={(e) => updateSlot(dt.key, hour, "djId", e.target.value)}
                            className="flex-1 border rounded px-1.5 py-1 text-xs"
                            style={selectedDj?.colorPrimary ? { borderLeftColor: selectedDj.colorPrimary, borderLeftWidth: "3px" } : {}}
                          >
                            <option value="">-- DJ --</option>
                            {djs.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <select
                            value={slot?.clockTemplateId || ""}
                            onChange={(e) => updateSlot(dt.key, hour, "clockTemplateId", e.target.value)}
                            className="flex-1 border rounded px-1.5 py-1 text-xs text-gray-600"
                          >
                            <option value="">-- Clock --</option>
                            {clocks.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
