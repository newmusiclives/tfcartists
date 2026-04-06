"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SharedNav } from "@/components/shared-nav";
import {
  Radio,
  Music,
  Users,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
  Rocket,
  Trash2,
  Plus,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { title: "Station Setup", icon: Radio, description: "Name, genre & timezone" },
  { title: "Import Music", icon: Music, description: "Upload your music catalog" },
  { title: "Configure DJs", icon: Users, description: "AI DJ personalities" },
  { title: "Set Schedule", icon: CalendarDays, description: "24/7 time slot grid" },
  { title: "Go Live", icon: Rocket, description: "Review & launch" },
];

const GENRE_PRESETS = [
  "Americana",
  "Country",
  "Pop",
  "Hip-Hop",
  "Jazz",
  "Talk",
  "Rock",
  "EDM",
  "Classical",
  "Latin",
];

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central Europe (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy", description: "Neutral, balanced" },
  { value: "echo", label: "Echo", description: "Warm, conversational" },
  { value: "fable", label: "Fable", description: "Expressive, British" },
  { value: "nova", label: "Nova", description: "Friendly, upbeat" },
  { value: "onyx", label: "Onyx", description: "Deep, authoritative" },
  { value: "shimmer", label: "Shimmer", description: "Clear, bright" },
  { value: "gemini", label: "Gemini TTS", description: "Google Gemini AI voice" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StationSetup {
  name: string;
  tagline: string;
  genre: string;
  timezone: string;
}

interface DJForm {
  id?: string;
  name: string;
  bio: string;
  voice: string;
  startHour: number;
  endHour: number;
}

interface ScheduleCell {
  dayOfWeek: number;
  hour: number;
  djId: string;
}

interface ImportedSong {
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

function parseCSV(raw: string): ImportedSong[] {
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] || "";
    });
    return {
      title: obj.title || obj.track || obj.name || "",
      artist: obj.artist || obj.artistname || obj.artist_name || "",
      album: obj.album || "",
      genre: obj.genre || "",
      duration: obj.duration || "",
    };
  }).filter((s) => s.title && s.artist);
}

function emptyDJ(): DJForm {
  return { name: "", bio: "", voice: "alloy", startHour: 6, endHour: 12 };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stationId, setStationId] = useState<string | null>(null);

  // Step 0: Station Setup
  const [station, setStation] = useState<StationSetup>({
    name: "",
    tagline: "",
    genre: "Americana",
    timezone: "America/Denver",
  });

  // Step 1: Import Music
  const [csvText, setCsvText] = useState("");
  const [parsedSongs, setParsedSongs] = useState<ImportedSong[]>([]);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Step 2: Configure DJs
  const [djs, setDjs] = useState<DJForm[]>([emptyDJ()]);
  const [createdDjs, setCreatedDjs] = useState<
    { id: string; name: string; ttsVoice: string }[]
  >([]);
  const [djsSaved, setDjsSaved] = useState(false);

  // Step 3: Set Schedule
  const [schedule, setSchedule] = useState<ScheduleCell[]>([]);

  // Step 4: Go Live (no extra state needed)

  // ---------------------------------------------------------------------------
  // Resume in-progress wizard
  // ---------------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/station-admin/wizard");
        const data = await res.json();
        if (data.inProgress) {
          setStationId(data.inProgress.id);
          setStation({
            name: data.inProgress.name || "",
            tagline: data.inProgress.tagline || "",
            genre: data.inProgress.genre || "Americana",
            timezone:
              (data.inProgress.metadata as any)?.timezone || "America/Denver",
          });
          const resumeStep = Math.min(data.inProgress.setupStep, 4);
          setStep(resumeStep);

          // If past DJs step, load created DJs
          if (data.inProgress.setupStep >= 3) {
            const fullRes = await fetch(
              `/api/station-admin/wizard?stationId=${data.inProgress.id}`
            );
            const fullData = await fullRes.json();
            if (fullData.station?.stationDJs?.length) {
              setCreatedDjs(
                fullData.station.stationDJs.map((d: any) => ({
                  id: d.id,
                  name: d.name,
                  ttsVoice: d.ttsVoice,
                }))
              );
              setDjsSaved(true);
            }
          }
        }
      } catch {
        // Fresh start
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // CSV parsing
  // ---------------------------------------------------------------------------
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setCsvText(text);
        setParsedSongs(parseCSV(text));
      };
      reader.readAsText(file);
    },
    []
  );

  const handleCsvPaste = useCallback((text: string) => {
    setCsvText(text);
    if (text.trim()) {
      setParsedSongs(parseCSV(text));
    } else {
      setParsedSongs([]);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Schedule toggle
  // ---------------------------------------------------------------------------
  const toggleScheduleCell = (dayOfWeek: number, hour: number, djId: string) => {
    if (!djId) return;
    setSchedule((prev) => {
      const existing = prev.findIndex(
        (s) => s.dayOfWeek === dayOfWeek && s.hour === hour
      );
      if (existing >= 0) {
        if (prev[existing].djId === djId) {
          // Remove
          return prev.filter((_, i) => i !== existing);
        }
        // Replace
        const next = [...prev];
        next[existing] = { dayOfWeek, hour, djId };
        return next;
      }
      return [...prev, { dayOfWeek, hour, djId }];
    });
  };

  const getScheduleCell = (dayOfWeek: number, hour: number) => {
    return schedule.find(
      (s) => s.dayOfWeek === dayOfWeek && s.hour === hour
    );
  };

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const canContinue = (): boolean => {
    if (step === 0) return station.name.trim().length >= 2;
    if (step === 1) return true; // Music import is optional
    if (step === 2) return djs.some((d) => d.name.trim().length > 0);
    return true;
  };

  // ---------------------------------------------------------------------------
  // Save step
  // ---------------------------------------------------------------------------
  const saveStep = async () => {
    setSaving(true);
    setError(null);

    try {
      // ---- Step 0: Station Setup ----
      if (step === 0) {
        const res = await fetch("/api/station-admin/wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: 1,
            stationId,
            data: {
              name: station.name,
              tagline: station.tagline,
              genre: station.genre,
              timezone: station.timezone,
            },
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to save station");
        if (result.station?.id) setStationId(result.station.id);
      }

      // ---- Step 1: Import Music ----
      else if (step === 1) {
        if (parsedSongs.length > 0 && !importResult) {
          const res = await fetch("/api/station-admin/wizard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: 2,
              stationId,
              data: { songs: parsedSongs },
            }),
          });
          const result = await res.json();
          if (!res.ok)
            throw new Error(result.error || "Failed to import songs");
          setImportResult(result.results);
        } else {
          // Skip import, just advance setup step
          await fetch("/api/station-admin/wizard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: 2,
              stationId,
              data: { songs: [] },
            }),
          });
        }
      }

      // ---- Step 2: Configure DJs ----
      else if (step === 2) {
        if (!djsSaved) {
          const validDjs = djs.filter((d) => d.name.trim());
          const res = await fetch("/api/station-admin/wizard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: 3,
              stationId,
              data: { djs: validDjs },
            }),
          });
          const result = await res.json();
          if (!res.ok)
            throw new Error(result.error || "Failed to create DJs");
          setCreatedDjs(result.djs || []);
          setDjsSaved(true);
        }
      }

      // ---- Step 3: Set Schedule ----
      else if (step === 3) {
        const res = await fetch("/api/station-admin/wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: 4,
            stationId,
            data: { assignments: schedule },
          }),
        });
        const result = await res.json();
        if (!res.ok)
          throw new Error(result.error || "Failed to save schedule");
      }

      // ---- Step 4: Go Live ----
      else if (step === 4) {
        const res = await fetch("/api/station-admin/wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: 5,
            stationId,
            data: {},
          }),
        });
        const result = await res.json();
        if (!res.ok)
          throw new Error(result.error || "Failed to launch station");
        router.push("/station-admin");
        return;
      }

      setStep(step + 1);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DJ color helper
  // ---------------------------------------------------------------------------
  const DJ_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
  ];

  const getDjColor = (index: number) => DJ_COLORS[index % DJ_COLORS.length];

  // Selected DJ for schedule painting
  const [selectedDjForSchedule, setSelectedDjForSchedule] = useState<string>("");

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Your Station
        </h1>
        <p className="text-gray-600 mb-8">
          Set up your AI radio station in 5 easy steps
        </p>

        {/* ================================================================ */}
        {/* Progress Indicator                                                */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                      i < step
                        ? "bg-green-500 text-white"
                        : i === step
                        ? "bg-amber-600 text-white ring-4 ring-amber-100"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {i < step ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div
                      className={`text-xs font-semibold ${
                        i === step
                          ? "text-amber-700"
                          : i < step
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {s.description}
                    </div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block w-8 lg:w-16 h-0.5 mx-2 ${
                      i < step ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Error bar */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* Step Content Card                                                 */}
        {/* ================================================================ */}
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border min-h-[420px]">
          {/* ============================================================== */}
          {/* STEP 0 — Station Setup                                          */}
          {/* ============================================================== */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Station Setup
                </h2>
                <p className="text-sm text-gray-500">
                  Give your station an identity
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Station Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Station Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={station.name}
                    onChange={(e) =>
                      setStation({ ...station, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="North Country Radio"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={station.tagline}
                    onChange={(e) =>
                      setStation({ ...station, tagline: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Where the music finds you"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Genre <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={station.genre}
                    onChange={(e) =>
                      setStation({ ...station, genre: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {GENRE_PRESETS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={station.timezone}
                    onChange={(e) =>
                      setStation({ ...station, timezone: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview card */}
              {station.name && (
                <div className="mt-6 p-4 rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
                      <Radio className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {station.name}
                      </h3>
                      {station.tagline && (
                        <p className="text-sm text-gray-500">
                          {station.tagline}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {station.genre}
                        </span>
                        <span className="text-xs text-gray-400">
                          {
                            TIMEZONE_OPTIONS.find(
                              (t) => t.value === station.timezone
                            )?.label
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1 — Import Music                                           */}
          {/* ============================================================== */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Import Music
                </h2>
                <p className="text-sm text-gray-500">
                  Upload a CSV with your music catalog, or skip and add music
                  later
                </p>
              </div>

              {importResult ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">
                        Import Complete
                      </h3>
                      <p className="text-sm text-green-700">
                        {importResult.imported} songs imported
                        {importResult.skipped > 0 &&
                          `, ${importResult.skipped} skipped`}
                      </p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />{" "}
                          {err}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* File upload area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="font-medium text-gray-700 mb-1">
                      Drop your CSV file here or click to upload
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      Required columns: title, artist, album, genre, duration
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Choose File
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Or paste CSV */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Or paste CSV data directly
                    </label>
                    <textarea
                      value={csvText}
                      onChange={(e) => handleCsvPaste(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      rows={6}
                      placeholder={`title,artist,album,genre,duration\nHarvest Moon,Neil Young,Harvest Moon,Americana,312\nJolene,Dolly Parton,Jolene,Country,162`}
                    />
                  </div>

                  {/* Preview */}
                  {parsedSongs.length > 0 && (
                    <div className="border rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-700">
                          Preview ({parsedSongs.length} songs found)
                        </h4>
                        <button
                          onClick={() => {
                            setCsvText("");
                            setParsedSongs([]);
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Title
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Artist
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Album
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Genre
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                Duration
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {parsedSongs.slice(0, 15).map((song, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium">
                                  {song.title}
                                </td>
                                <td className="px-4 py-2 text-gray-600">
                                  {song.artist}
                                </td>
                                <td className="px-4 py-2 text-gray-500">
                                  {song.album || "--"}
                                </td>
                                <td className="px-4 py-2 text-gray-500">
                                  {song.genre || "--"}
                                </td>
                                <td className="px-4 py-2 text-gray-500">
                                  {song.duration || "--"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {parsedSongs.length > 15 && (
                        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
                          Showing 15 of {parsedSongs.length} songs
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skip info */}
                  {parsedSongs.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                      No songs to import? No problem. You can always add music
                      later from the Music Library.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2 — Configure DJs                                          */}
          {/* ============================================================== */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    Configure DJs
                  </h2>
                  <p className="text-sm text-gray-500">
                    Add AI DJ personalities for your station
                  </p>
                </div>
                {!djsSaved && djs.length < 10 && (
                  <button
                    onClick={() => setDjs([...djs, emptyDJ()])}
                    className="flex items-center gap-1.5 text-sm bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add DJ
                  </button>
                )}
              </div>

              {djsSaved ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {createdDjs.length} DJ
                    {createdDjs.length !== 1 ? "s" : ""} created successfully
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {createdDjs.map((dj, i) => (
                      <div
                        key={dj.id}
                        className="flex items-center gap-3 p-4 border rounded-xl bg-gray-50"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: getDjColor(i) }}
                        >
                          {dj.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{dj.name}</p>
                          <p className="text-xs text-gray-500">
                            Voice: {dj.ttsVoice}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {djs.map((dj, i) => (
                    <div
                      key={i}
                      className="border rounded-xl overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between px-4 py-2.5 border-b"
                        style={{
                          backgroundColor: getDjColor(i) + "10",
                          borderLeftWidth: "4px",
                          borderLeftColor: getDjColor(i),
                        }}
                      >
                        <span className="text-sm font-semibold text-gray-700">
                          DJ #{i + 1}
                          {dj.name && (
                            <span className="font-normal text-gray-500">
                              {" "}
                              -- {dj.name}
                            </span>
                          )}
                        </span>
                        {djs.length > 1 && (
                          <button
                            onClick={() =>
                              setDjs(djs.filter((_, j) => j !== i))
                            }
                            className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Row 1: Name & Voice */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Name <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={dj.name}
                              onChange={(e) => {
                                const u = [...djs];
                                u[i] = { ...dj, name: e.target.value };
                                setDjs(u);
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              placeholder="Hank Westwood"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Voice
                            </label>
                            <select
                              value={dj.voice}
                              onChange={(e) => {
                                const u = [...djs];
                                u[i] = { ...dj, voice: e.target.value };
                                setDjs(u);
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                              {VOICE_OPTIONS.map((v) => (
                                <option key={v.value} value={v.value}>
                                  {v.label} -- {v.description}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Gemini TTS info */}
                        {dj.voice === "gemini" && (
                          <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                            <p className="text-xs font-medium text-indigo-700 mb-2">
                              Google Gemini TTS will be used for this DJ. Voice characteristics are configured automatically based on the DJ&apos;s personality.
                            </p>
                            <p className="text-[10px] text-indigo-500 mt-1">
                              Gemini TTS provides high-quality AI voices at $0.004 per generation.
                            </p>
                          </div>
                        )}

                        {/* Row 2: Bio */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Bio
                          </label>
                          <textarea
                            value={dj.bio}
                            onChange={(e) => {
                              const u = [...djs];
                              u[i] = { ...dj, bio: e.target.value };
                              setDjs(u);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            rows={2}
                            placeholder="Brief backstory for this DJ personality..."
                          />
                        </div>

                        {/* Row 3: Schedule */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Start Hour
                            </label>
                            <select
                              value={dj.startHour}
                              onChange={(e) => {
                                const u = [...djs];
                                u[i] = {
                                  ...dj,
                                  startHour: parseInt(e.target.value),
                                };
                                setDjs(u);
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                              {HOURS.map((h) => (
                                <option key={h} value={h}>
                                  {formatHour(h)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              End Hour
                            </label>
                            <select
                              value={dj.endHour}
                              onChange={(e) => {
                                const u = [...djs];
                                u[i] = {
                                  ...dj,
                                  endHour: parseInt(e.target.value),
                                };
                                setDjs(u);
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                              {HOURS.map((h) => (
                                <option key={h} value={h}>
                                  {formatHour(h)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3 — Set Schedule                                           */}
          {/* ============================================================== */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Set Schedule
                </h2>
                <p className="text-sm text-gray-500">
                  Click cells to assign DJs to time slots. Select a DJ below,
                  then click hours on the grid.
                </p>
              </div>

              {createdDjs.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  No DJs configured yet. Go back to the previous step to add
                  DJs first.
                </div>
              ) : (
                <>
                  {/* DJ selector */}
                  <div className="flex flex-wrap gap-2">
                    {createdDjs.map((dj, i) => (
                      <button
                        key={dj.id}
                        onClick={() => setSelectedDjForSchedule(dj.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedDjForSchedule === dj.id
                            ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getDjColor(i) }}
                        />
                        {dj.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedDjForSchedule("")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedDjForSchedule === ""
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 bg-white hover:border-gray-300 text-gray-500"
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                      Eraser
                    </button>
                  </div>

                  {/* 24h x 7 day grid */}
                  <div className="overflow-x-auto -mx-2 px-2">
                    <div className="min-w-[640px]">
                      {/* Header row */}
                      <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px mb-px">
                        <div className="text-xs font-medium text-gray-400 p-1" />
                        {DAYS_OF_WEEK.map((day) => (
                          <div
                            key={day}
                            className="text-xs font-semibold text-gray-600 text-center py-1.5 bg-gray-100 rounded-t"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Hour rows */}
                      <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-gray-200 rounded-b-lg overflow-hidden">
                        {HOURS.map((hour) => (
                          <React.Fragment key={`row-${hour}`}>
                            <div
                              className="text-[11px] font-medium text-gray-500 bg-gray-50 flex items-center justify-end pr-2 py-0.5"
                            >
                              {formatHour(hour)}
                            </div>
                            {DAYS_OF_WEEK.map((_, dayIdx) => {
                              const cell = getScheduleCell(dayIdx, hour);
                              const djIdx = createdDjs.findIndex(
                                (d) => d.id === cell?.djId
                              );
                              const isAssigned = !!cell;

                              return (
                                <button
                                  key={`${dayIdx}-${hour}`}
                                  onClick={() => {
                                    if (selectedDjForSchedule === "" && cell) {
                                      // Eraser mode
                                      setSchedule((prev) =>
                                        prev.filter(
                                          (s) =>
                                            !(
                                              s.dayOfWeek === dayIdx &&
                                              s.hour === hour
                                            )
                                        )
                                      );
                                    } else if (selectedDjForSchedule) {
                                      toggleScheduleCell(
                                        dayIdx,
                                        hour,
                                        selectedDjForSchedule
                                      );
                                    }
                                  }}
                                  className={`h-6 transition-all hover:opacity-80 ${
                                    isAssigned ? "" : "bg-white hover:bg-gray-50"
                                  }`}
                                  style={
                                    isAssigned && djIdx >= 0
                                      ? {
                                          backgroundColor:
                                            getDjColor(djIdx) + "40",
                                          borderLeft: `3px solid ${getDjColor(
                                            djIdx
                                          )}`,
                                        }
                                      : {}
                                  }
                                  title={
                                    isAssigned && djIdx >= 0
                                      ? `${createdDjs[djIdx].name} - ${formatHour(hour)}`
                                      : `${DAYS_OF_WEEK[dayIdx]} ${formatHour(hour)}`
                                  }
                                />
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Schedule summary */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                      {schedule.length} slots assigned
                    </span>
                    <span className="text-gray-400">
                      {168 - schedule.length} hours on automation
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4 — Go Live                                                */}
          {/* ============================================================== */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-2">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Ready to Go Live
                </h2>
                <p className="text-sm text-gray-500">
                  Review your station setup before launching
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Station */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Radio className="w-4 h-4 text-amber-600" />
                    <h3 className="font-semibold text-sm text-gray-900">
                      Station
                    </h3>
                    <button
                      onClick={() => setStep(0)}
                      className="ml-auto text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium">{station.name}</span>
                    </div>
                    {station.tagline && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tagline</span>
                        <span className="text-gray-700">{station.tagline}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Genre</span>
                      <span className="font-medium">{station.genre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Timezone</span>
                      <span className="text-gray-700">
                        {TIMEZONE_OPTIONS.find(
                          (t) => t.value === station.timezone
                        )?.label || station.timezone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Music */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold text-sm text-gray-900">
                      Music Library
                    </h3>
                    <button
                      onClick={() => setStep(1)}
                      className="ml-auto text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-sm">
                    {importResult ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span>
                          {importResult.imported} songs imported
                        </span>
                      </div>
                    ) : parsedSongs.length > 0 ? (
                      <span className="text-gray-600">
                        {parsedSongs.length} songs ready to import
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>No songs imported (can add later)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* DJs */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-sm text-gray-900">
                      DJs
                    </h3>
                    <button
                      onClick={() => setStep(2)}
                      className="ml-auto text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  {createdDjs.length > 0 ? (
                    <div className="space-y-2">
                      {createdDjs.map((dj, i) => (
                        <div
                          key={dj.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: getDjColor(i) }}
                          >
                            {dj.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="font-medium">{dj.name}</span>
                          <span className="text-xs text-gray-400">
                            ({dj.ttsVoice})
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>No DJs configured</span>
                    </div>
                  )}
                </div>

                {/* Schedule */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-sm text-gray-900">
                      Schedule
                    </h3>
                    <button
                      onClick={() => setStep(3)}
                      className="ml-auto text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-sm">
                    {schedule.length > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>
                            {schedule.length} time slots assigned
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {168 - schedule.length} hours on automation
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>No schedule set (automation only)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {(createdDjs.length === 0 || !importResult) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Heads up</p>
                    <ul className="mt-1 space-y-0.5 text-amber-700">
                      {!importResult && (
                        <li>No music imported yet. You can add songs later.</li>
                      )}
                      {createdDjs.length === 0 && (
                        <li>No DJs configured. Station will run on automation.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                Clicking <strong>Launch Station</strong> will activate your
                station and redirect you to the admin dashboard.
              </div>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* Navigation Buttons                                                */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            Step {step + 1} of {STEPS.length}
          </div>

          <button
            onClick={saveStep}
            disabled={saving || !canContinue()}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
              step === 4
                ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === 4 ? (
              <>
                <Rocket className="w-4 h-4" />
                Launch Station
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
