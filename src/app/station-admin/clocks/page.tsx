"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { Clock, Plus, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface ClockSlot {
  position: number;
  minute: number;
  duration: number;
  category: string;
  type: string;
  notes: string;
}

interface ClockTemplateData {
  id: string;
  name: string;
  description: string | null;
  clockType: string;
  tempo: string | null;
  energyLevel: string | null;
  hitsPerHour: number;
  indiePerHour: number;
  clockPattern: string | null;
  isActive: boolean;
  _count: { assignments: number };
}

const CATEGORY_COLORS: Record<string, string> = {
  TOH: "bg-red-600 text-white",
  A: "bg-red-500 text-white",
  B: "bg-blue-500 text-white",
  C: "bg-green-500 text-white",
  D: "bg-purple-500 text-white",
  E: "bg-orange-500 text-white",
  DJ: "bg-amber-500 text-white",
  Sponsor: "bg-gray-500 text-white",
  Feature: "bg-teal-500 text-white",
  Imaging: "bg-pink-500 text-white",
};

const CLOCK_TYPES = ["morning_drive", "midday", "evening", "late_night", "weekend"];

function formatClockType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RadioClocksPage() {
  const [templates, setTemplates] = useState<ClockTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    clockType: "midday",
    tempo: "moderate",
    energyLevel: "medium",
    hitsPerHour: 6,
    indiePerHour: 3,
  });
  const [stationId, setStationId] = useState<string | null>(null);

  useEffect(() => {
    // Get first station
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          setStationId(stations[0].id);
          return fetch(`/api/clock-templates?stationId=${stations[0].id}`);
        }
        return null;
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) setTemplates(data.templates || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createTemplate = async () => {
    if (!stationId || !newTemplate.name) return;
    const res = await fetch("/api/clock-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId, ...newTemplate }),
    });
    const data = await res.json();
    if (data.template) {
      setTemplates([{ ...data.template, _count: { assignments: 0 } }, ...templates]);
      setShowCreate(false);
      setNewTemplate({ name: "", description: "", clockType: "midday", tempo: "moderate", energyLevel: "medium", hitsPerHour: 6, indiePerHour: 3 });
    }
  };

  const parsePattern = (pattern: string | null): ClockSlot[] => {
    if (!pattern) return [];
    try {
      return JSON.parse(pattern);
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              Radio Clocks
            </h1>
            <p className="text-gray-600 mt-1">Manage clock templates and rotation patterns</p>
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
                value={newTemplate.clockType}
                onChange={(e) => setNewTemplate({ ...newTemplate, clockType: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                {CLOCK_TYPES.map((t) => (
                  <option key={t} value={t}>{formatClockType(t)}</option>
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
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500">Tempo</label>
                <select value={newTemplate.tempo} onChange={(e) => setNewTemplate({ ...newTemplate, tempo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="upbeat">Upbeat</option>
                  <option value="moderate">Moderate</option>
                  <option value="laid_back">Laid Back</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Energy</label>
                <select value={newTemplate.energyLevel} onChange={(e) => setNewTemplate({ ...newTemplate, energyLevel: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Hits/Hour</label>
                <input type="number" value={newTemplate.hitsPerHour} onChange={(e) => setNewTemplate({ ...newTemplate, hitsPerHour: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Indie/Hour</label>
                <input type="number" value={newTemplate.indiePerHour} onChange={(e) => setNewTemplate({ ...newTemplate, indiePerHour: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <button onClick={createTemplate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Create Template
            </button>
          </div>
        )}

        {/* Category legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(CATEGORY_COLORS).map(([cat, cls]) => (
            <span key={cat} className={`${cls} text-xs px-2 py-1 rounded font-medium`}>{cat}</span>
          ))}
        </div>

        {/* Templates grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No clock templates yet.</p>
            <p className="text-sm text-gray-400">Create one or run the seed script to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((t) => {
              const slots = parsePattern(t.clockPattern);
              const isExpanded = expanded === t.id;
              return (
                <div key={t.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : t.id)}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-2.5 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{t.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{formatClockType(t.clockType)}</span>
                          {t.tempo && <span>Tempo: {t.tempo}</span>}
                          {t.energyLevel && <span>Energy: {t.energyLevel}</span>}
                          <span>{t.hitsPerHour} hits/hr</span>
                          <span>{t.indiePerHour} indie/hr</span>
                          <span>{t._count.assignments} DJ{t._count.assignments !== 1 ? "s" : ""} assigned</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t px-5 py-4">
                      {t.description && <p className="text-sm text-gray-600 mb-4">{t.description}</p>}
                      {slots.length > 0 ? (
                        <div className="grid grid-cols-10 gap-1">
                          {slots.map((slot, i) => (
                            <div
                              key={i}
                              className={`${CATEGORY_COLORS[slot.category] || "bg-gray-200 text-gray-700"} rounded px-1.5 py-2 text-center text-xs`}
                              title={`${slot.category} @ :${String(slot.minute).padStart(2, "0")} (${slot.duration}min) ${slot.notes || ""}`}
                            >
                              <div className="font-bold">{slot.category}</div>
                              <div className="opacity-75">:{String(slot.minute).padStart(2, "0")}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No clock pattern defined. Edit to add slots.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
