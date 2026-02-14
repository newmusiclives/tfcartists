"use client";

import { useState } from "react";
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
  ChevronDown,
  ChevronRight,
  FileText,
  RotateCcw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { title: "Station Identity", icon: Radio, description: "Name, genre, branding" },
  { title: "Music Library", icon: Music, description: "Import or start fresh" },
  { title: "DJ Configuration", icon: Users, description: "Add AI DJ personalities" },
  { title: "Schedule", icon: CalendarDays, description: "Assign DJs to time slots" },
  { title: "Review & Launch", icon: CheckCircle2, description: "Final checklist" },
];

const FORMAT_OPTIONS = ["americana", "country", "rock", "jazz", "blues", "folk", "mixed"];
const ERA_OPTIONS = ["classic", "modern", "mixed"];

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

const DEFAULT_CLOCK_TEMPLATES = [
  { name: "Morning Drive", clockType: "morning_drive", tempo: "upbeat", energyLevel: "high" },
  { name: "Midday Mix", clockType: "midday", tempo: "moderate", energyLevel: "medium" },
  { name: "Evening Wind-Down", clockType: "evening", tempo: "laid_back", energyLevel: "low" },
  { name: "Late Night", clockType: "late_night", tempo: "laid_back", energyLevel: "low" },
  { name: "Weekend Vibes", clockType: "weekend", tempo: "moderate", energyLevel: "medium" },
];

const STARTER_SONGS = [
  { title: "Harvest Moon", artistName: "Neil Young", genre: "Americana", bpm: 108, rotationCategory: "A", vocalGender: "male", tempoCategory: "medium" },
  { title: "Wagon Wheel", artistName: "Old Crow Medicine Show", genre: "Americana", bpm: 150, rotationCategory: "A", vocalGender: "male", tempoCategory: "fast" },
  { title: "Jolene", artistName: "Dolly Parton", genre: "Country", bpm: 112, rotationCategory: "A", vocalGender: "female", tempoCategory: "medium" },
  { title: "Pancho and Lefty", artistName: "Townes Van Zandt", genre: "Americana", bpm: 100, rotationCategory: "B", vocalGender: "male", tempoCategory: "medium" },
  { title: "Fast Car", artistName: "Tracy Chapman", genre: "Folk", bpm: 104, rotationCategory: "A", vocalGender: "female", tempoCategory: "medium" },
  { title: "Southeastern", artistName: "Jason Isbell", genre: "Americana", bpm: 80, rotationCategory: "B", vocalGender: "male", tempoCategory: "slow" },
  { title: "The Night They Drove Old Dixie Down", artistName: "The Band", genre: "Americana", bpm: 118, rotationCategory: "B", vocalGender: "male", tempoCategory: "medium" },
  { title: "Gentle On My Mind", artistName: "Glen Campbell", genre: "Country", bpm: 120, rotationCategory: "C", vocalGender: "male", tempoCategory: "medium" },
  { title: "If It Makes You Happy", artistName: "Sheryl Crow", genre: "Rock", bpm: 138, rotationCategory: "B", vocalGender: "female", tempoCategory: "fast" },
  { title: "Angel from Montgomery", artistName: "John Prine", genre: "Folk", bpm: 84, rotationCategory: "C", vocalGender: "male", tempoCategory: "slow" },
  { title: "Tennessee Whiskey", artistName: "Chris Stapleton", genre: "Country", bpm: 70, rotationCategory: "A", vocalGender: "male", tempoCategory: "slow" },
  { title: "Midnight Rider", artistName: "The Allman Brothers Band", genre: "Rock", bpm: 108, rotationCategory: "B", vocalGender: "male", tempoCategory: "medium" },
  { title: "Blue Eyes Crying in the Rain", artistName: "Willie Nelson", genre: "Country", bpm: 76, rotationCategory: "C", vocalGender: "male", tempoCategory: "slow" },
  { title: "Teach Your Children", artistName: "Crosby Stills Nash & Young", genre: "Folk", bpm: 128, rotationCategory: "C", vocalGender: "male", tempoCategory: "medium" },
  { title: "Girl from the North Country", artistName: "Bob Dylan", genre: "Folk", bpm: 92, rotationCategory: "C", vocalGender: "male", tempoCategory: "slow" },
  { title: "Traveling Alone", artistName: "Tift Merritt", genre: "Americana", bpm: 96, rotationCategory: "D", vocalGender: "female", tempoCategory: "slow" },
  { title: "Lake Charles", artistName: "Lucinda Williams", genre: "Americana", bpm: 120, rotationCategory: "D", vocalGender: "female", tempoCategory: "medium" },
  { title: "Feathered Indians", artistName: "Tyler Childers", genre: "Americana", bpm: 144, rotationCategory: "E", vocalGender: "male", tempoCategory: "fast" },
  { title: "All I Want Is You", artistName: "Barry Louis Polisar", genre: "Folk", bpm: 100, rotationCategory: "E", vocalGender: "male", tempoCategory: "medium" },
  { title: "Cover Me Up", artistName: "Jason Isbell", genre: "Americana", bpm: 74, rotationCategory: "E", vocalGender: "male", tempoCategory: "slow" },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DJForm {
  name: string;
  tagline: string;
  bio: string;
  traits: string;
  voiceDescription: string;
  colorPrimary: string;
  vibe: string;
  age: string;
  isWeekend: boolean;
}

interface IdentityErrors {
  name?: string;
  genre?: string;
  callSign?: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface ScheduleSlot {
  dayType: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  djId: string;
  clockTemplateId: string;
}

interface CreatedDJ {
  id: string;
  name: string;
  colorPrimary: string | null;
  isWeekend: boolean;
}

interface ClockTemplateOption {
  id: string;
  name: string;
  clockType: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyDJ(): DJForm {
  return { name: "", tagline: "", bio: "", traits: "", voiceDescription: "", colorPrimary: "#6b7280", vibe: "", age: "", isWeekend: false };
}

function emptySchedule(): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  for (const dt of DAY_TYPES) {
    for (const tb of TIME_BLOCKS) {
      slots.push({ dayType: dt.key, timeSlotStart: tb.start, timeSlotEnd: tb.end, djId: "", clockTemplateId: "" });
    }
  }
  return slots;
}

function isValidHex(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

function parseCSV(raw: string) {
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return {
      title: obj.title || obj.track || obj.name || "",
      artistName: obj.artistname || obj.artist || obj.artist_name || "",
      album: obj.album || "",
      duration: obj.duration || "",
      genre: obj.genre || "",
      bpm: obj.bpm || "",
      rotationCategory: obj.rotationcategory || obj.category || obj.rotation || "C",
      vocalGender: obj.vocalgender || obj.vocal || obj.gender || "unknown",
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [stationId, setStationId] = useState<string | null>(null);

  // Step 0: Identity
  const [identity, setIdentity] = useState({
    name: "",
    callSign: "",
    tagline: "",
    description: "",
    genre: "Americana",
    formatType: "americana",
    musicEra: "mixed",
    primaryColor: "#b45309",
    secondaryColor: "#f59e0b",
    logoUrl: "",
  });
  const [identityErrors, setIdentityErrors] = useState<IdentityErrors>({});

  // Step 1: Music Library
  const [musicChoice, setMusicChoice] = useState<"empty" | "starter" | "import">("empty");
  const [importMode, setImportMode] = useState<"csv" | "json">("csv");
  const [rawImportInput, setRawImportInput] = useState("");
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [songCount, setSongCount] = useState(0);
  const [starterImported, setStarterImported] = useState(false);

  // Step 2: DJs
  const [djs, setDjs] = useState<DJForm[]>([emptyDJ()]);
  const [createdDjIds, setCreatedDjIds] = useState<string[]>([]);
  const [createdDjOptions, setCreatedDjOptions] = useState<CreatedDJ[]>([]);
  const [djsSaved, setDjsSaved] = useState(false);

  // Step 3: Schedule
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(emptySchedule());
  const [clockTemplates, setClockTemplates] = useState<ClockTemplateOption[]>([]);

  // Step 4: Review
  const [reviewExpanded, setReviewExpanded] = useState<Record<string, boolean>>({
    identity: true,
    music: false,
    djs: false,
    schedule: false,
  });

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validateIdentity = (): boolean => {
    const errors: IdentityErrors = {};
    if (!identity.name || identity.name.trim().length < 2) errors.name = "Name is required (at least 2 characters)";
    if (!identity.genre || !identity.genre.trim()) errors.genre = "Genre is required";
    if (identity.callSign && !/^[A-Z]{2,5}$/i.test(identity.callSign.trim())) errors.callSign = "Call sign must be 2-5 letters";
    if (identity.logoUrl && identity.logoUrl.trim() && !identity.logoUrl.trim().startsWith("https://")) errors.logoUrl = "Logo URL must start with https://";
    if (identity.primaryColor && !isValidHex(identity.primaryColor)) errors.primaryColor = "Must be a valid hex color (#RRGGBB)";
    setIdentityErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Import helpers
  // ---------------------------------------------------------------------------

  const parseImportInput = () => {
    try {
      if (importMode === "json") {
        const parsed = JSON.parse(rawImportInput);
        setImportPreview(Array.isArray(parsed) ? parsed.slice(0, 10) : []);
      } else {
        setImportPreview(parseCSV(rawImportInput).slice(0, 10));
      }
    } catch {
      setImportPreview([]);
    }
  };

  // ---------------------------------------------------------------------------
  // Auto-schedule
  // ---------------------------------------------------------------------------

  const autoPopulateSchedule = (djList: CreatedDJ[], templates: ClockTemplateOption[]) => {
    const newSchedule = emptySchedule();
    const weekdayDjs = djList.filter((d) => !d.isWeekend);
    const weekendDjs = djList.filter((d) => d.isWeekend);
    const liveBlocks = TIME_BLOCKS.slice(0, 4); // 6am-6pm

    const getTemplateForBlock = (blockIdx: number) => {
      if (templates.length === 0) return "";
      if (blockIdx === 0) return templates.find((t) => t.clockType === "morning_drive")?.id || templates[0].id;
      if (blockIdx === 1 || blockIdx === 2) return templates.find((t) => t.clockType === "midday")?.id || templates[0].id;
      if (blockIdx === 3) return templates.find((t) => t.clockType === "evening")?.id || templates[0].id;
      return templates[0].id;
    };

    for (const slot of newSchedule) {
      const blockIdx = TIME_BLOCKS.findIndex((tb) => tb.start === slot.timeSlotStart);
      if (blockIdx < 0 || blockIdx >= 4) continue; // only fill live hours

      if (slot.dayType === "weekday" && weekdayDjs.length > 0) {
        const dj = weekdayDjs[blockIdx % weekdayDjs.length];
        slot.djId = dj.id;
        slot.clockTemplateId = getTemplateForBlock(blockIdx);
      } else if (slot.dayType === "saturday" && weekendDjs.length > 0) {
        const dj = weekendDjs[blockIdx % weekendDjs.length];
        slot.djId = dj.id;
        slot.clockTemplateId = templates.find((t) => t.clockType === "weekend")?.id || getTemplateForBlock(blockIdx);
      } else if (slot.dayType === "sunday" && weekendDjs.length > 0) {
        const dj = weekendDjs[blockIdx % weekendDjs.length];
        slot.djId = dj.id;
        slot.clockTemplateId = templates.find((t) => t.clockType === "weekend")?.id || getTemplateForBlock(blockIdx);
      }
    }

    setSchedule(newSchedule);
  };

  // ---------------------------------------------------------------------------
  // Save step
  // ---------------------------------------------------------------------------

  const saveStep = async () => {
    setSaving(true);
    try {
      // ---- Step 0: Identity ----
      if (step === 0) {
        if (!validateIdentity()) { setSaving(false); return; }
        const payload = {
          ...identity,
          callSign: identity.callSign.trim().toUpperCase() || undefined,
          stationCode: identity.callSign.trim().toLowerCase() || identity.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          setupStep: 1,
        };
        if (!stationId) {
          const res = await fetch("/api/stations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.station) setStationId(data.station.id);
        } else {
          await fetch(`/api/stations/${stationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      }

      // ---- Step 1: Music Library ----
      else if (step === 1 && stationId) {
        if (musicChoice === "starter" && !starterImported) {
          const res = await fetch("/api/station-songs/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stationId, songs: STARTER_SONGS }),
          });
          const data = await res.json();
          setSongCount(data.results?.imported || 0);
          setStarterImported(true);
        } else if (musicChoice === "import" && importPreview.length > 0 && !importResult) {
          let songs: any[];
          if (importMode === "json") {
            songs = JSON.parse(rawImportInput);
            if (!Array.isArray(songs)) songs = [];
          } else {
            songs = parseCSV(rawImportInput);
          }
          const res = await fetch("/api/station-songs/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stationId, songs }),
          });
          const data = await res.json();
          setImportResult(data.results || { imported: 0, skipped: 0, errors: [] });
          setSongCount(data.results?.imported || 0);
        }
        await fetch(`/api/stations/${stationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setupStep: 2 }),
        });
      }

      // ---- Step 2: DJs ----
      else if (step === 2 && stationId) {
        if (!djsSaved) {
          const newIds: string[] = [];
          const newDjOptions: CreatedDJ[] = [];
          for (const dj of djs) {
            if (dj.name && dj.bio) {
              const res = await fetch("/api/station-djs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  stationId,
                  name: dj.name,
                  bio: dj.bio,
                  tagline: dj.tagline,
                  personalityTraits: dj.traits,
                  voiceDescription: dj.voiceDescription,
                  colorPrimary: dj.colorPrimary,
                  vibe: dj.vibe,
                  age: dj.age,
                  isWeekend: dj.isWeekend,
                }),
              });
              const data = await res.json();
              if (data.dj) {
                newIds.push(data.dj.id);
                newDjOptions.push({ id: data.dj.id, name: data.dj.name, colorPrimary: data.dj.colorPrimary, isWeekend: data.dj.isWeekend });
              }
            }
          }
          setCreatedDjIds(newIds);
          setCreatedDjOptions(newDjOptions);
          setDjsSaved(true);

          // Auto-create clock templates
          const templateRes = await fetch(`/api/clock-templates?stationId=${stationId}`);
          const templateData = await templateRes.json();
          let templates: ClockTemplateOption[] = (templateData.templates || []).map((t: any) => ({ id: t.id, name: t.name, clockType: t.clockType }));

          if (templates.length === 0) {
            for (const tpl of DEFAULT_CLOCK_TEMPLATES) {
              const res = await fetch("/api/clock-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stationId, ...tpl }),
              });
              const data = await res.json();
              if (data.template) templates.push({ id: data.template.id, name: data.template.name, clockType: data.template.clockType });
            }
          }
          setClockTemplates(templates);

          // Auto-populate schedule
          autoPopulateSchedule(newDjOptions, templates);
        }
        await fetch(`/api/stations/${stationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setupStep: 3 }),
        });
      }

      // ---- Step 3: Schedule ----
      else if (step === 3 && stationId) {
        const validSlots = schedule.filter((s) => s.djId && s.clockTemplateId);
        if (validSlots.length > 0) {
          await fetch("/api/station-schedule", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stationId, schedule: validSlots }),
          });
        }
        await fetch(`/api/stations/${stationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setupStep: 4 }),
        });
      }

      // ---- Step 4: Launch ----
      else if (step === 4 && stationId) {
        await fetch(`/api/stations/${stationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setupStep: 5, setupComplete: true, isActive: true, launchDate: new Date().toISOString() }),
        });
        router.push("/station-admin");
        return;
      }

      setStep(step + 1);
    } catch {
      // handle errors silently for now
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Schedule helpers
  // ---------------------------------------------------------------------------

  const updateSlot = (dayType: string, timeSlotStart: string, field: string, value: string) => {
    setSchedule(schedule.map((s) =>
      s.dayType === dayType && s.timeSlotStart === timeSlotStart ? { ...s, [field]: value } : s
    ));
  };

  const liveHours = schedule.filter((s) => s.djId).length * 3;
  const automationHours = (24 * 3 - liveHours);

  const canContinue = () => {
    if (step === 0) return identity.name.trim().length >= 2 && identity.genre.trim().length > 0;
    if (step === 1) {
      if (musicChoice === "import") return importPreview.length > 0 || !!importResult;
      return true;
    }
    if (step === 2) return djs.some((d) => d.name.trim() && d.bio.trim());
    return true;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Station</h1>
        <p className="text-gray-600 mb-8">Set up your radio station in 5 easy steps</p>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                    ? "bg-amber-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <div className="hidden sm:block ml-2 mr-4">
                <div className={`text-xs font-medium ${i === step ? "text-amber-700" : "text-gray-500"}`}>
                  {s.title}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`hidden sm:block w-12 h-0.5 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl p-8 shadow-sm border min-h-[400px]">

          {/* ================================================================ */}
          {/* STEP 0 — Station Identity                                        */}
          {/* ================================================================ */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold mb-4">Station Identity</h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form fields */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Station Name *</label>
                      <input
                        type="text"
                        value={identity.name}
                        onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${identityErrors.name ? "border-red-400" : ""}`}
                        placeholder="North Country Radio"
                      />
                      {identityErrors.name && <p className="text-xs text-red-500 mt-1">{identityErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Call Sign</label>
                      <input
                        type="text"
                        value={identity.callSign}
                        onChange={(e) => setIdentity({ ...identity, callSign: e.target.value.toUpperCase() })}
                        className={`w-full border rounded-lg px-3 py-2 text-sm uppercase ${identityErrors.callSign ? "border-red-400" : ""}`}
                        placeholder="NCR"
                        maxLength={5}
                      />
                      {identityErrors.callSign && <p className="text-xs text-red-500 mt-1">{identityErrors.callSign}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                    <input
                      type="text"
                      value={identity.tagline}
                      onChange={(e) => setIdentity({ ...identity, tagline: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Where the music finds you"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={identity.description}
                      onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      rows={3}
                      placeholder="A brief description of your station..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
                      <input
                        type="text"
                        value={identity.genre}
                        onChange={(e) => setIdentity({ ...identity, genre: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${identityErrors.genre ? "border-red-400" : ""}`}
                        placeholder="Americana, Country"
                      />
                      {identityErrors.genre && <p className="text-xs text-red-500 mt-1">{identityErrors.genre}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                      <select
                        value={identity.formatType}
                        onChange={(e) => setIdentity({ ...identity, formatType: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        {FORMAT_OPTIONS.map((f) => (
                          <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Music Era</label>
                      <select
                        value={identity.musicEra}
                        onChange={(e) => setIdentity({ ...identity, musicEra: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        {ERA_OPTIONS.map((e) => (
                          <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={identity.primaryColor}
                          onChange={(e) => setIdentity({ ...identity, primaryColor: e.target.value })}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={identity.primaryColor}
                          onChange={(e) => setIdentity({ ...identity, primaryColor: e.target.value })}
                          className={`flex-1 border rounded-lg px-3 py-2 text-sm ${identityErrors.primaryColor ? "border-red-400" : ""}`}
                        />
                      </div>
                      {identityErrors.primaryColor && <p className="text-xs text-red-500 mt-1">{identityErrors.primaryColor}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={identity.secondaryColor}
                          onChange={(e) => setIdentity({ ...identity, secondaryColor: e.target.value })}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={identity.secondaryColor}
                          onChange={(e) => setIdentity({ ...identity, secondaryColor: e.target.value })}
                          className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input
                      type="text"
                      value={identity.logoUrl}
                      onChange={(e) => setIdentity({ ...identity, logoUrl: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-sm ${identityErrors.logoUrl ? "border-red-400" : ""}`}
                      placeholder="https://..."
                    />
                    {identityErrors.logoUrl && <p className="text-xs text-red-500 mt-1">{identityErrors.logoUrl}</p>}
                  </div>
                </div>

                {/* Mini preview card */}
                <div className="lg:col-span-1">
                  <div className="sticky top-8">
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Preview</p>
                    <div className="rounded-xl overflow-hidden border shadow-sm">
                      <div className="h-20 flex items-end p-3" style={{ backgroundColor: identity.primaryColor || "#b45309" }}>
                        <div className="flex items-center gap-2">
                          {identity.callSign && (
                            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded">{identity.callSign.toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <h3 className="font-bold text-gray-900 text-sm">{identity.name || "Station Name"}</h3>
                        {identity.tagline && <p className="text-xs text-gray-500 mt-0.5">{identity.tagline}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{identity.genre || "Genre"}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{identity.formatType}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-3">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: identity.primaryColor }} />
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: identity.secondaryColor }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 1 — Music Library                                           */}
          {/* ================================================================ */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Music Library</h2>
                {songCount > 0 && (
                  <span className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                    {songCount} songs imported
                  </span>
                )}
              </div>
              <p className="text-gray-600">How would you like to set up your music library?</p>

              {/* Mode cards */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setMusicChoice("empty")}
                  className={`p-5 rounded-xl border-2 text-left transition-colors ${
                    musicChoice === "empty" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Music className="w-7 h-7 text-gray-400 mb-2" />
                  <h3 className="font-semibold text-sm">Start Empty</h3>
                  <p className="text-xs text-gray-500 mt-1">Add songs later via Music Library</p>
                </button>
                <button
                  onClick={() => setMusicChoice("starter")}
                  className={`p-5 rounded-xl border-2 text-left transition-colors ${
                    musicChoice === "starter" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Music className="w-7 h-7 text-green-600 mb-2" />
                  <h3 className="font-semibold text-sm">Starter Pack</h3>
                  <p className="text-xs text-gray-500 mt-1">{STARTER_SONGS.length} curated Americana tracks</p>
                </button>
                <button
                  onClick={() => setMusicChoice("import")}
                  className={`p-5 rounded-xl border-2 text-left transition-colors ${
                    musicChoice === "import" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <FileText className="w-7 h-7 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-sm">Import Your Own</h3>
                  <p className="text-xs text-gray-500 mt-1">CSV or JSON bulk import</p>
                </button>
              </div>

              {/* Empty info */}
              {musicChoice === "empty" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  You can import songs anytime from the Music Library after your station is set up.
                </div>
              )}

              {/* Starter pack preview */}
              {musicChoice === "starter" && (
                <div>
                  {starterImported ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Starter pack imported! {songCount} songs added to your library.
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border">
                      <div className="p-3 border-b bg-gray-50">
                        <h4 className="font-medium text-sm">Starter Pack Preview ({STARTER_SONGS.length} songs)</h4>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Artist</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Genre</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {STARTER_SONGS.map((song, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-3 py-1.5">{song.title}</td>
                                <td className="px-3 py-1.5 text-gray-600">{song.artistName}</td>
                                <td className="px-3 py-1.5">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                                    song.rotationCategory === "A" ? "bg-red-100 text-red-700" :
                                    song.rotationCategory === "B" ? "bg-blue-100 text-blue-700" :
                                    song.rotationCategory === "C" ? "bg-green-100 text-green-700" :
                                    song.rotationCategory === "D" ? "bg-purple-100 text-purple-700" :
                                    "bg-orange-100 text-orange-700"
                                  }`}>{song.rotationCategory}</span>
                                </td>
                                <td className="px-3 py-1.5 text-gray-600">{song.genre}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
                        Songs will be imported when you click Continue.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Import your own */}
              {musicChoice === "import" && (
                <div>
                  {importResult ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800 font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        Import complete: {importResult.imported} imported, {importResult.skipped} skipped
                      </div>
                      {importResult.errors.length > 0 && (
                        <div className="mt-2 max-h-24 overflow-y-auto">
                          {importResult.errors.slice(0, 5).map((e, i) => (
                            <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {e}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Mode toggle */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => setImportMode("csv")}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${importMode === "csv" ? "bg-gray-900 text-white" : "bg-white border"}`}
                        >
                          <FileText className="w-3 h-3 inline mr-1" /> CSV
                        </button>
                        <button
                          onClick={() => setImportMode("json")}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${importMode === "json" ? "bg-gray-900 text-white" : "bg-white border"}`}
                        >
                          {"{ }"} JSON
                        </button>
                      </div>

                      {/* Textarea */}
                      <textarea
                        value={rawImportInput}
                        onChange={(e) => setRawImportInput(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                        rows={8}
                        placeholder={
                          importMode === "csv"
                            ? "title,artist,album,duration,genre,bpm,category,vocal\nSunset Road,Jake Rivers,Highway Album,234,Alt-Country,120,A,male"
                            : '[{"title":"Sunset Road","artistName":"Jake Rivers","album":"Highway Album","duration":234}]'
                        }
                      />
                      <button onClick={parseImportInput} className="mt-2 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                        Preview
                      </button>

                      {/* Preview table */}
                      {importPreview.length > 0 && (
                        <div className="mt-4 bg-white rounded-lg border">
                          <div className="p-3 border-b bg-gray-50">
                            <h4 className="font-medium text-sm">Preview ({importPreview.length} rows shown)</h4>
                          </div>
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Artist</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Genre</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {importPreview.map((row, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2">{row.title || "--"}</td>
                                  <td className="px-3 py-2">{row.artistName || row.artist || "--"}</td>
                                  <td className="px-3 py-2">{row.rotationCategory || "C"}</td>
                                  <td className="px-3 py-2">{row.genre || "--"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
                            All rows will be imported when you click Continue.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 2 — DJ Configuration                                        */}
          {/* ================================================================ */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">DJ Configuration</h2>
                  <span className="text-sm bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                    {djs.filter((d) => d.name.trim()).length}/12 DJs
                  </span>
                </div>
                {!djsSaved && djs.length < 12 && (
                  <button
                    onClick={() => setDjs([...djs, emptyDJ()])}
                    className="text-sm bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200"
                  >
                    + Add DJ
                  </button>
                )}
              </div>

              {djsSaved ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {createdDjIds.length} DJs created successfully. Clock templates and schedule auto-populated.
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {createdDjOptions.map((dj) => (
                      <div key={dj.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: dj.colorPrimary || "#6b7280" }}
                        >
                          {dj.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{dj.name}</p>
                          {dj.isWeekend && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Weekend</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {djs.map((dj, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      {/* DJ header */}
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                        <span className="text-sm font-medium text-gray-500">DJ #{i + 1}</span>
                        {djs.length > 1 && (
                          <button onClick={() => setDjs(djs.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700">
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Row 1: name, tagline, color */}
                        <div className="grid grid-cols-6 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                            <input
                              type="text"
                              value={dj.name}
                              onChange={(e) => { const u = [...djs]; u[i] = { ...dj, name: e.target.value }; setDjs(u); }}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="DJ Name"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tagline</label>
                            <input
                              type="text"
                              value={dj.tagline}
                              onChange={(e) => { const u = [...djs]; u[i] = { ...dj, tagline: e.target.value }; setDjs(u); }}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="Short tagline"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="color"
                                value={dj.colorPrimary}
                                onChange={(e) => { const u = [...djs]; u[i] = { ...dj, colorPrimary: e.target.value }; setDjs(u); }}
                                className="w-8 h-8 rounded border cursor-pointer"
                              />
                              <input
                                type="text"
                                value={dj.colorPrimary}
                                onChange={(e) => { const u = [...djs]; u[i] = { ...dj, colorPrimary: e.target.value }; setDjs(u); }}
                                className="w-full border rounded-lg px-2 py-2 text-xs font-mono"
                              />
                            </div>
                          </div>
                          <div className="col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Weekend</label>
                            <label className="flex items-center gap-2 h-[38px]">
                              <input
                                type="checkbox"
                                checked={dj.isWeekend}
                                onChange={(e) => { const u = [...djs]; u[i] = { ...dj, isWeekend: e.target.checked }; setDjs(u); }}
                                className="rounded text-amber-600"
                              />
                              <span className="text-xs text-gray-600">Wknd</span>
                            </label>
                          </div>
                        </div>

                        {/* Row 2: bio */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Bio *</label>
                          <textarea
                            value={dj.bio}
                            onChange={(e) => { const u = [...djs]; u[i] = { ...dj, bio: e.target.value }; setDjs(u); }}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            rows={2}
                            placeholder="Brief bio of this DJ personality..."
                          />
                        </div>

                        {/* Row 3: traits, voice, vibe, age */}
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Traits</label>
                            <input
                              type="text"
                              value={dj.traits}
                              onChange={(e) => { const u = [...djs]; u[i] = { ...dj, traits: e.target.value }; setDjs(u); }}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="warm, witty"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Voice</label>
                            <input
                              type="text"
                              value={dj.voiceDescription}
                              onChange={(e) => { const u = [...djs]; u[i] = { ...dj, voiceDescription: e.target.value }; setDjs(u); }}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="Warm, deep tone"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Vibe</label>
                            <input
                              type="text"
                              value={dj.vibe}
                              onChange={(e) => { const u = [...djs]; u[i] = { ...dj, vibe: e.target.value }; setDjs(u); }}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="Blue-collar optimism"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Age</label>
                            <input
                              type="text"
                              value={dj.age}
                              onChange={(e) => { const u = [...djs]; u[i] = { ...dj, age: e.target.value }; setDjs(u); }}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="Late 40s"
                            />
                          </div>
                        </div>

                        {/* DJ card preview */}
                        {dj.name && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mt-2">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ backgroundColor: dj.colorPrimary || "#6b7280" }}
                            >
                              {dj.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{dj.name}</p>
                              {dj.tagline && <p className="text-xs text-gray-500 truncate">{dj.tagline}</p>}
                            </div>
                            {dj.isWeekend && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-auto">Weekend</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 3 — Schedule                                                */}
          {/* ================================================================ */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Schedule</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Live: {liveHours}h</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">Automation: {automationHours}h</span>
                  </div>
                  <button
                    onClick={() => autoPopulateSchedule(createdDjOptions, clockTemplates)}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset to Auto
                  </button>
                </div>
              </div>

              {createdDjOptions.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  No DJs configured yet. Go back to Step 3 to add DJs first.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {DAY_TYPES.map((dt) => (
                    <div key={dt.key}>
                      <h3 className="font-semibold text-gray-900 mb-2 text-center text-sm">{dt.label}</h3>
                      <div className="space-y-1.5">
                        {TIME_BLOCKS.map((tb) => {
                          const slot = schedule.find((s) => s.dayType === dt.key && s.timeSlotStart === tb.start);
                          const selectedDj = createdDjOptions.find((d) => d.id === slot?.djId);
                          const isLiveHour = TIME_BLOCKS.indexOf(tb) < 4;

                          return (
                            <div
                              key={`${dt.key}-${tb.start}`}
                              className={`rounded-lg p-2.5 border ${isLiveHour ? "bg-white" : "bg-gray-50"}`}
                            >
                              <span className="text-xs font-medium text-gray-400 block mb-1.5">{tb.label}</span>
                              <select
                                value={slot?.djId || ""}
                                onChange={(e) => updateSlot(dt.key, tb.start, "djId", e.target.value)}
                                className="w-full border rounded px-2 py-1 text-xs mb-1"
                                style={selectedDj?.colorPrimary ? { borderLeftColor: selectedDj.colorPrimary, borderLeftWidth: "3px" } : {}}
                              >
                                <option value="">-- DJ --</option>
                                {createdDjOptions.map((d) => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                              <select
                                value={slot?.clockTemplateId || ""}
                                onChange={(e) => updateSlot(dt.key, tb.start, "clockTemplateId", e.target.value)}
                                className="w-full border rounded px-2 py-1 text-xs text-gray-500"
                              >
                                <option value="">-- Clock --</option>
                                {clockTemplates.map((c) => (
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                You can always adjust the schedule later in the Schedule Editor.
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 4 — Review & Launch                                         */}
          {/* ================================================================ */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2">Review & Launch</h2>

              {/* Identity section */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setReviewExpanded({ ...reviewExpanded, identity: !reviewExpanded.identity })}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Station Identity</span>
                    <span className="text-sm text-gray-500">{identity.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setStep(0); }}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                    {reviewExpanded.identity ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {reviewExpanded.identity && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-3 text-sm">
                      <div><span className="text-gray-500">Name:</span> <span className="font-medium">{identity.name}</span></div>
                      <div><span className="text-gray-500">Call Sign:</span> <span className="font-medium">{identity.callSign || "—"}</span></div>
                      <div><span className="text-gray-500">Genre:</span> <span className="font-medium">{identity.genre}</span></div>
                      <div><span className="text-gray-500">Format:</span> <span className="font-medium">{identity.formatType}</span></div>
                      <div><span className="text-gray-500">Era:</span> <span className="font-medium">{identity.musicEra}</span></div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Colors:</span>
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: identity.primaryColor }} />
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: identity.secondaryColor }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Music section */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setReviewExpanded({ ...reviewExpanded, music: !reviewExpanded.music })}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    {songCount > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-medium">Music Library</span>
                    <span className="text-sm text-gray-500">{songCount > 0 ? `${songCount} songs` : "Empty"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setStep(1); }}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                    {reviewExpanded.music ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {reviewExpanded.music && (
                  <div className="px-4 pb-4 border-t bg-gray-50 pt-3 text-sm">
                    <p><span className="text-gray-500">Import method:</span> <span className="font-medium capitalize">{musicChoice}</span></p>
                    <p><span className="text-gray-500">Songs imported:</span> <span className="font-medium">{songCount}</span></p>
                  </div>
                )}
              </div>

              {/* DJs section */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setReviewExpanded({ ...reviewExpanded, djs: !reviewExpanded.djs })}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    {createdDjIds.length > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-medium">DJs</span>
                    <span className="text-sm text-gray-500">{createdDjIds.length} configured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setStep(2); }}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                    {reviewExpanded.djs ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {reviewExpanded.djs && createdDjOptions.length > 0 && (
                  <div className="px-4 pb-4 border-t bg-gray-50 pt-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {createdDjOptions.map((dj) => (
                        <div key={dj.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: dj.colorPrimary || "#6b7280" }}
                          >
                            {dj.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                          </div>
                          <span className="text-sm truncate">{dj.name}</span>
                          {dj.isWeekend && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded ml-auto">Wknd</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule section */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setReviewExpanded({ ...reviewExpanded, schedule: !reviewExpanded.schedule })}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Schedule</span>
                    <span className="text-sm text-gray-500">{liveHours}h live, {automationHours}h automation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setStep(3); }}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                    {reviewExpanded.schedule ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {reviewExpanded.schedule && (
                  <div className="px-4 pb-4 border-t bg-gray-50 pt-3">
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {DAY_TYPES.map((dt) => (
                        <div key={dt.key}>
                          <p className="font-medium text-gray-700 mb-1 text-center">{dt.label}</p>
                          {TIME_BLOCKS.slice(0, 4).map((tb) => {
                            const slot = schedule.find((s) => s.dayType === dt.key && s.timeSlotStart === tb.start);
                            const djName = createdDjOptions.find((d) => d.id === slot?.djId)?.name;
                            return (
                              <div key={tb.start} className="flex items-center gap-1.5 py-0.5">
                                <span className="text-gray-400 w-14">{tb.label}</span>
                                <span className={`truncate ${djName ? "text-gray-700 font-medium" : "text-gray-300"}`}>
                                  {djName || "—"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Warnings */}
              {(songCount === 0 || createdDjIds.length === 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Launching with incomplete setup</p>
                    <ul className="mt-1 space-y-0.5">
                      {songCount === 0 && <li>No songs in music library</li>}
                      {createdDjIds.length === 0 && <li>No DJs configured</li>}
                    </ul>
                    <p className="mt-1 text-xs">You can continue configuring everything after launch.</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                Clicking &quot;Launch Station&quot; will activate your station and redirect you to the Station Admin hub.
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={saveStep}
            disabled={saving || !canContinue()}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === 4 ? "Launch Station" : "Continue"}
            {step < 4 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
