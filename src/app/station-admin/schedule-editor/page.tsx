"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { CalendarDays, Save, Loader2 } from "lucide-react";

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

interface ScheduleSlot {
  dayType: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  djId: string;
  clockTemplateId: string;
  showName: string;
}

const TIME_BLOCKS = [
  { start: "06:00", end: "09:00", label: "6am-9am" },
  { start: "09:00", end: "12:00", label: "9am-12pm" },
  { start: "12:00", end: "15:00", label: "12pm-3pm" },
  { start: "15:00", end: "18:00", label: "3pm-6pm" },
  { start: "18:00", end: "21:00", label: "6pm-9pm" },
  { start: "21:00", end: "00:00", label: "9pm-12am" },
  { start: "00:00", end: "03:00", label: "12am-3am" },
  { start: "03:00", end: "06:00", label: "3am-6am" },
];

const DAY_TYPES = [
  { key: "weekday", label: "Weekdays" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function emptySchedule(): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  for (const dt of DAY_TYPES) {
    for (const tb of TIME_BLOCKS) {
      slots.push({
        dayType: dt.key,
        timeSlotStart: tb.start,
        timeSlotEnd: tb.end,
        djId: "",
        clockTemplateId: "",
        showName: "",
      });
    }
  }
  return slots;
}

export default function ScheduleEditorPage() {
  const [djs, setDjs] = useState<DJOption[]>([]);
  const [clocks, setClocks] = useState<ClockOption[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(emptySchedule());
  const [stationId, setStationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then(async (data) => {
        const stations = data.stations || [];
        if (stations.length === 0) {
          setLoading(false);
          return;
        }
        const sid = stations[0].id;
        setStationId(sid);

        // Fetch DJs and clocks in parallel
        const [djRes, clockRes, scheduleRes] = await Promise.all([
          fetch(`/api/station-djs?stationId=${sid}`).then((r) => r.json()),
          fetch(`/api/clock-templates?stationId=${sid}`).then((r) => r.json()),
          fetch(`/api/station-schedule?stationId=${sid}`).then((r) => r.json()),
        ]);

        setDjs(djRes.djs || []);
        setClocks(clockRes.templates || []);

        // Map existing assignments to schedule
        const assignments = scheduleRes.assignments || [];
        if (assignments.length > 0) {
          const newSchedule = emptySchedule();
          for (const a of assignments) {
            const idx = newSchedule.findIndex(
              (s) => s.dayType === a.dayType && s.timeSlotStart === a.timeSlotStart
            );
            if (idx >= 0) {
              newSchedule[idx].djId = a.dj?.id || a.djId || "";
              newSchedule[idx].clockTemplateId = a.clockTemplate?.id || a.clockTemplateId || "";
            }
          }
          setSchedule(newSchedule);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateSlot = (dayType: string, timeSlotStart: string, field: string, value: string) => {
    setSchedule(
      schedule.map((s) =>
        s.dayType === dayType && s.timeSlotStart === timeSlotStart
          ? { ...s, [field]: value }
          : s
      )
    );
  };

  const saveSchedule = async () => {
    if (!stationId) return;
    setSaving(true);
    try {
      const validSlots = schedule.filter((s) => s.djId && s.clockTemplateId);
      await fetch("/api/station-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId, schedule: validSlots }),
      });
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  // Check if a time slot is the current one
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay(); // 0=Sun
  const currentDayType = currentDay === 0 ? "sunday" : currentDay === 6 ? "saturday" : "weekday";
  const currentBlock = TIME_BLOCKS.find((tb) => {
    const startH = parseInt(tb.start.split(":")[0]);
    const endH = tb.end === "00:00" ? 24 : parseInt(tb.end.split(":")[0]);
    return currentHour >= startH && currentHour < endH;
  });

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
            <p className="text-gray-600 mt-1">Assign DJs and clocks to weekly time blocks</p>
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
          <div className="grid grid-cols-3 gap-6">
            {DAY_TYPES.map((dt) => (
              <div key={dt.key}>
                <h2 className="font-semibold text-gray-900 mb-3 text-center">{dt.label}</h2>
                <div className="space-y-2">
                  {TIME_BLOCKS.map((tb) => {
                    const slot = schedule.find(
                      (s) => s.dayType === dt.key && s.timeSlotStart === tb.start
                    );
                    const isCurrent = dt.key === currentDayType && currentBlock?.start === tb.start;
                    const selectedDj = djs.find((d) => d.id === slot?.djId);

                    return (
                      <div
                        key={`${dt.key}-${tb.start}`}
                        className={`bg-white rounded-lg p-3 border ${
                          isCurrent ? "ring-2 ring-indigo-500 border-indigo-300" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">{tb.label}</span>
                          {isCurrent && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                              NOW
                            </span>
                          )}
                        </div>
                        <select
                          value={slot?.djId || ""}
                          onChange={(e) => updateSlot(dt.key, tb.start, "djId", e.target.value)}
                          className="w-full border rounded px-2 py-1.5 text-sm mb-1.5"
                          style={selectedDj?.colorPrimary ? { borderLeftColor: selectedDj.colorPrimary, borderLeftWidth: "3px" } : {}}
                        >
                          <option value="">-- Select DJ --</option>
                          {djs.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <select
                          value={slot?.clockTemplateId || ""}
                          onChange={(e) => updateSlot(dt.key, tb.start, "clockTemplateId", e.target.value)}
                          className="w-full border rounded px-2 py-1.5 text-xs text-gray-600"
                        >
                          <option value="">-- Clock Template --</option>
                          {clocks.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
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
