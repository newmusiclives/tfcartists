"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Eye,
  Globe,
  Code,
  Copy,
  Upload,
  Palette,
  Type,
  Radio,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Monitor,
  Smartphone,
  Maximize2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImagingScript {
  label: string;
  text: string;
  musicBed: string;
}

interface BrandingSettings {
  accentColor?: string;
  backgroundStyle?: "dark" | "light" | "custom";
  customBgColor?: string;
  faviconUrl?: string;
  customDomain?: string;
  domainStatus?: "not_set" | "pending" | "configured";
  embedAccentColor?: string;
  fontFamily?: string;
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

type EmbedSize = "compact" | "card" | "full";

// ─── Constants ────────────────────────────────────────────────────────────────

const SCRIPT_CATEGORIES: CategoryConfig[] = [
  { key: "toh", label: "Top of Hour IDs", group: "Top of Hour IDs", defaultCount: 5 },
  { key: "sweeper_general", label: "General Sweepers", group: "Sweepers", defaultCount: 6 },
  { key: "sweeper_hank_westwood", label: "Hank Westwood Sweepers", group: "Sweepers", defaultCount: 4 },
  { key: "sweeper_loretta_merrick", label: "Loretta Merrick Sweepers", group: "Sweepers", defaultCount: 4 },
  { key: "sweeper_doc_holloway", label: "Doc Holloway Sweepers", group: "Sweepers", defaultCount: 4 },
  { key: "sweeper_cody_rampart", label: "Cody Rampart Sweepers", group: "Sweepers", defaultCount: 4 },
  { key: "promo_general", label: "General Promos", group: "Promos", defaultCount: 5 },
  { key: "promo_hank_westwood", label: "Hank Westwood Promos", group: "Promos", defaultCount: 3 },
  { key: "promo_loretta_merrick", label: "Loretta Merrick Promos", group: "Promos", defaultCount: 3 },
  { key: "promo_doc_holloway", label: "Doc Holloway Promos", group: "Promos", defaultCount: 3 },
  { key: "promo_cody_rampart", label: "Cody Rampart Promos", group: "Promos", defaultCount: 3 },
  { key: "overnight", label: "Moonshine", group: "Overnight Imaging", defaultCount: 5 },
];

const GROUP_COLORS: Record<string, { bg: string; border: string; tag: string; accent: string }> = {
  "Top of Hour IDs": { bg: "bg-amber-950/30", border: "border-amber-800/40", tag: "bg-amber-900/50 text-amber-300", accent: "text-amber-400" },
  "Sweepers": { bg: "bg-blue-950/30", border: "border-blue-800/40", tag: "bg-blue-900/50 text-blue-300", accent: "text-blue-400" },
  "Promos": { bg: "bg-purple-950/30", border: "border-purple-800/40", tag: "bg-purple-900/50 text-purple-300", accent: "text-purple-400" },
  "Overnight Imaging": { bg: "bg-green-950/30", border: "border-green-800/40", tag: "bg-green-900/50 text-green-300", accent: "text-green-400" },
};

const FORMAT_OPTIONS = ["americana", "country", "rock", "jazz", "blues", "folk", "pop", "electronic", "hip-hop", "classical", "indie"];

const GENRE_PRESETS = [
  "Americana", "Country", "Singer-Songwriter", "Rock", "Indie Rock", "Jazz",
  "Blues", "Folk", "Pop", "Electronic", "Hip-Hop", "Classical", "R&B/Soul",
  "World Music", "Reggae", "Latin", "Gospel", "Adult Contemporary",
];

const COLOR_PRESETS = [
  { name: "Amber", value: "#d97706" },
  { name: "Blue", value: "#2563eb" },
  { name: "Green", value: "#059669" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Red", value: "#dc2626" },
  { name: "Pink", value: "#db2777" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Teal", value: "#0d9488" },
  { name: "Orange", value: "#ea580c" },
  { name: "Cyan", value: "#0891b2" },
];

const EMBED_SIZES: { key: EmbedSize; label: string; icon: React.ElementType; width: number; height: number }[] = [
  { key: "compact", label: "Compact", icon: Smartphone, width: 300, height: 80 },
  { key: "card", label: "Card", icon: Monitor, width: 400, height: 94 },
  { key: "full", label: "Full", icon: Maximize2, width: 480, height: 120 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(120,53,15,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function lightenHex(hex: string, pct: number): string {
  const clean = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(clean.substring(0, 2), 16) + (255 - parseInt(clean.substring(0, 2), 16)) * pct));
  const g = Math.min(255, Math.round(parseInt(clean.substring(2, 4), 16) + (255 - parseInt(clean.substring(2, 4), 16)) * pct));
  const b = Math.min(255, Math.round(parseInt(clean.substring(4, 6), 16) + (255 - parseInt(clean.substring(4, 6), 16)) * pct));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function darkenHex(hex: string, pct: number): string {
  const clean = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(clean.substring(0, 2), 16) * (1 - pct)));
  const g = Math.max(0, Math.round(parseInt(clean.substring(2, 4), 16) * (1 - pct)));
  const b = Math.max(0, Math.round(parseInt(clean.substring(4, 6), 16) * (1 - pct)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

// ─── Section Components ───────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, collapsible = false, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <button
        onClick={() => collapsible && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-6 py-4 ${collapsible ? "cursor-pointer hover:bg-zinc-800/50" : "cursor-default"} transition-colors`}
      >
        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-amber-400" />
        </div>
        <h2 className="text-base font-semibold text-zinc-100 flex-1 text-left">{title}</h2>
        {collapsible && (
          open ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      {open && <div className="px-6 pb-6 border-t border-zinc-800/50">{children}</div>}
    </div>
  );
}

function ColorPickerField({ label, value, onChange, presets = true }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-400 block mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValidHex(value) ? value : "#d97706"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-zinc-700 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          placeholder="#d97706"
        />
      </div>
      {presets && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                value === c.value ? "border-white ring-1 ring-amber-400" : "border-zinc-600"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StationBrandingPage() {
  const [station, setStation] = useState<StationData | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>({
    accentColor: "#f59e0b",
    backgroundStyle: "dark",
    customBgColor: "#09090b",
    faviconUrl: "",
    customDomain: "",
    domainStatus: "not_set",
    embedAccentColor: "",
    fontFamily: "system",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"identity" | "visual" | "domain" | "embed" | "imaging">("identity");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [editingScript, setEditingScript] = useState<{ category: ScriptCategory; index: number } | null>(null);
  const [editDraft, setEditDraft] = useState<ImagingScript>({ label: "", text: "", musicBed: "" });
  const [genError, setGenError] = useState<string | null>(null);
  const [embedSize, setEmbedSize] = useState<EmbedSize>("card");
  const [embedCopied, setEmbedCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // ─── Data Loading ─────────────────────────────────────────────────────────

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
          // Load branding settings from metadata
          const meta = s.metadata as Record<string, unknown> | null;
          const brandingData = meta?.branding as BrandingSettings | undefined;
          if (brandingData) {
            setBranding((prev) => ({ ...prev, ...brandingData }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── Imaging Scripts ──────────────────────────────────────────────────────

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

  // ─── Update Helpers ───────────────────────────────────────────────────────

  const updateField = (field: keyof StationData, value: unknown) => {
    if (!station) return;
    setStation({ ...station, [field]: value });
    setSaved(false);
  };

  const updateBranding = (field: keyof BrandingSettings, value: unknown) => {
    setBranding((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!station) return;
    setSaving(true);
    try {
      const meta = (station.metadata || {}) as Record<string, unknown>;
      const updatedMetadata = { ...meta, branding };
      const { id, ...fields } = station;
      const res = await fetch(`/api/stations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, metadata: updatedMetadata }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Save failed: ${err.error || res.statusText}`);
        return;
      }
      // Update local metadata
      setStation({ ...station, metadata: updatedMetadata });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Save failed: network error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Script Generation ────────────────────────────────────────────────────

  const generateScripts = async (category: ScriptCategory) => {
    if (!station) return;
    setGenerating((prev) => ({ ...prev, [category]: true }));
    setGenError(null);
    try {
      const res = await fetch("/api/station-branding/generate-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: station.id, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || data?.error || `Error ${res.status}`;
        setGenError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }
      if (data.scripts) {
        setScripts(category, data.scripts);
        const meta = (station.metadata || {}) as Record<string, unknown>;
        const existing = (meta.imagingScripts || {}) as Record<string, ImagingScript[]>;
        const updatedMetadata = { ...meta, imagingScripts: { ...existing, [category]: data.scripts } };
        await fetch(`/api/stations/${station.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: updatedMetadata }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setGenError("Network error — could not reach the server.");
    } finally {
      setGenerating((prev) => ({ ...prev, [category]: false }));
    }
  };

  const addScript = (category: ScriptCategory) => {
    const scripts = getScripts(category);
    const newScript: ImagingScript = { label: `Script ${scripts.length + 1}`, text: "", musicBed: "" };
    setScripts(category, [...scripts, newScript]);
    setEditingScript({ category, index: scripts.length });
    setEditDraft(newScript);
  };

  const deleteScript = (category: ScriptCategory, index: number) => {
    const scripts = getScripts(category);
    setScripts(category, scripts.filter((_, i) => i !== index));
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

  // ─── Embed Code ───────────────────────────────────────────────────────────

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://truefans-radio.netlify.app";

  const embedAccent = branding.embedAccentColor || station?.primaryColor || "#f59e0b";
  const sizeConfig = EMBED_SIZES.find((s) => s.key === embedSize) || EMBED_SIZES[1];

  const embedParams = new URLSearchParams();
  embedParams.set("theme", branding.backgroundStyle === "light" ? "light" : "dark");
  if (embedAccent !== "#f59e0b") embedParams.set("color", embedAccent.replace("#", ""));

  const embedUrl = `${baseUrl}/embed/player?${embedParams.toString()}`;
  const embedCode = `<iframe
  src="${embedUrl}"
  width="${sizeConfig.width}"
  height="${sizeConfig.height}"
  frameborder="0"
  allow="autoplay"
  style="border:none;border-radius:12px;max-width:100%;"
  title="${station?.name || "Radio"} Player"
></iframe>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  // ─── Preview Derived Colors ───────────────────────────────────────────────

  const previewPrimary = station?.primaryColor || "#d97706";
  const previewSecondary = station?.secondaryColor || "#1e3a5f";
  const previewAccent = branding.accentColor || "#f59e0b";
  const previewBg = branding.backgroundStyle === "light" ? "#ffffff" :
    branding.backgroundStyle === "custom" ? (branding.customBgColor || "#09090b") : "#09090b";

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <SharedNav />
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <SharedNav />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-zinc-500">No station found. Create a station first.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "identity" as const, label: "Station Identity", icon: Type },
    { key: "visual" as const, label: "Visual Branding", icon: Palette },
    { key: "domain" as const, label: "Custom Domain", icon: Globe },
    { key: "embed" as const, label: "Embed Widget", icon: Code },
    { key: "imaging" as const, label: "Imaging Scripts", icon: Music },
  ];

  const domainStatus = branding.domainStatus || "not_set";

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Paintbrush className="w-5 h-5 text-amber-400" />
              </div>
              White-Label Branding
            </h1>
            <p className="text-zinc-500 mt-1 ml-[52px]">Customize your station&apos;s look, feel, and identity</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all text-sm ${
              saved
                ? "bg-green-600 text-white"
                : "bg-amber-500 text-zinc-950 hover:bg-amber-400"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved" : "Save All Changes"}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-zinc-900 rounded-xl p-1 border border-zinc-800 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-zinc-800 text-amber-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Settings (2 cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* ═══ TAB: Station Identity ═══ */}
            {activeTab === "identity" && (
              <SectionCard title="Station Identity" icon={Type}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Station Name</label>
                    <input
                      type="text"
                      value={station.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Call Sign</label>
                    <input
                      type="text"
                      value={station.callSign || ""}
                      onChange={(e) => updateField("callSign", e.target.value || null)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      placeholder="NCR"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Tagline</label>
                    <input
                      type="text"
                      value={station.tagline || ""}
                      onChange={(e) => updateField("tagline", e.target.value || null)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      placeholder="Where the music finds you"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Description</label>
                    <textarea
                      value={station.description || ""}
                      onChange={(e) => updateField("description", e.target.value || null)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      rows={3}
                      placeholder="Tell listeners what your station is about..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Genre</label>
                    <input
                      type="text"
                      value={station.genre}
                      onChange={(e) => updateField("genre", e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      placeholder="Americana, Country, Singer-Songwriter"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {GENRE_PRESETS.slice(0, 8).map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            const current = station.genre ? station.genre.split(",").map((s) => s.trim()) : [];
                            if (current.includes(g)) {
                              updateField("genre", current.filter((c) => c !== g).join(", "));
                            } else {
                              updateField("genre", [...current, g].join(", "));
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            station.genre?.includes(g)
                              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Format Type</label>
                    <select
                      value={station.formatType || ""}
                      onChange={(e) => updateField("formatType", e.target.value || null)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    >
                      <option value="">Select format...</option>
                      {FORMAT_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* ═══ TAB: Visual Branding ═══ */}
            {activeTab === "visual" && (
              <>
                <SectionCard title="Color Palette" icon={Palette}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <ColorPickerField
                      label="Primary Color"
                      value={station.primaryColor || "#d97706"}
                      onChange={(v) => updateField("primaryColor", v)}
                    />
                    <ColorPickerField
                      label="Secondary Color"
                      value={station.secondaryColor || "#1e3a5f"}
                      onChange={(v) => updateField("secondaryColor", v)}
                    />
                    <ColorPickerField
                      label="Accent Color"
                      value={branding.accentColor || "#f59e0b"}
                      onChange={(v) => updateBranding("accentColor", v)}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Background Style" icon={Paintbrush}>
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-3">
                      {(["dark", "light", "custom"] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => updateBranding("backgroundStyle", style)}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium capitalize ${
                            branding.backgroundStyle === style
                              ? "border-amber-500 bg-amber-500/10 text-amber-300"
                              : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                          }`}
                        >
                          <div className={`w-full h-8 rounded mb-2 ${
                            style === "dark" ? "bg-zinc-950" : style === "light" ? "bg-white" : "bg-gradient-to-r from-zinc-900 to-zinc-800"
                          }`} />
                          {style}
                        </button>
                      ))}
                    </div>
                    {branding.backgroundStyle === "custom" && (
                      <ColorPickerField
                        label="Custom Background Color"
                        value={branding.customBgColor || "#09090b"}
                        onChange={(v) => updateBranding("customBgColor", v)}
                        presets={false}
                      />
                    )}
                  </div>
                </SectionCard>

                <SectionCard title="Logo &amp; Favicon" icon={Upload}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="text-xs font-medium text-zinc-400 block mb-1.5">Station Logo</label>
                      <div className="flex items-start gap-3">
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-800/50 overflow-hidden shrink-0">
                          {station.logoUrl ? (
                            <Image
                              src={station.logoUrl}
                              alt="Logo"
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <Upload className="w-6 h-6 text-zinc-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={station.logoUrl || ""}
                            onChange={(e) => updateField("logoUrl", e.target.value || null)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                            placeholder="https://example.com/logo.png"
                          />
                          <p className="text-xs text-zinc-500 mt-1">Recommended: 512x512 PNG with transparency</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-400 block mb-1.5">Favicon</label>
                      <div className="flex items-start gap-3">
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-800/50 overflow-hidden shrink-0">
                          {branding.faviconUrl ? (
                            <Image
                              src={branding.faviconUrl}
                              alt="Favicon"
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <Globe className="w-6 h-6 text-zinc-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={branding.faviconUrl || ""}
                            onChange={(e) => updateBranding("faviconUrl", e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                            placeholder="https://example.com/favicon.ico"
                          />
                          <p className="text-xs text-zinc-500 mt-1">Recommended: 32x32 or 64x64 ICO/PNG</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ═══ TAB: Custom Domain ═══ */}
            {activeTab === "domain" && (
              <SectionCard title="Custom Domain" icon={Globe}>
                <div className="mt-4 space-y-6">
                  {/* Current Domain */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Current Domain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-amber-400 font-mono">truefans-radio.netlify.app</code>
                      <a href="https://truefans-radio.netlify.app" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Custom Domain Input */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Custom Domain</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={branding.customDomain || ""}
                        onChange={(e) => updateBranding("customDomain", e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                        placeholder="radio.yourbusiness.com"
                      />
                      <div className={`flex items-center gap-1.5 px-3 rounded-lg border text-xs font-medium ${
                        domainStatus === "configured"
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : domainStatus === "pending"
                          ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-500"
                      }`}>
                        {domainStatus === "configured" ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Active</>
                        ) : domainStatus === "pending" ? (
                          <><Clock className="w-3.5 h-3.5" /> Pending</>
                        ) : (
                          <><AlertCircle className="w-3.5 h-3.5" /> Not Set</>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DNS Instructions */}
                  <div className="bg-zinc-800/30 rounded-lg p-5 border border-zinc-700/50">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-3">DNS Configuration</h3>
                    <p className="text-xs text-zinc-400 mb-4">Add a CNAME record in your domain&apos;s DNS settings:</p>
                    <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs border border-zinc-800">
                      <div className="grid grid-cols-3 gap-4 text-zinc-500 mb-2">
                        <span>Type</span>
                        <span>Name</span>
                        <span>Value</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-zinc-200">
                        <span className="text-amber-400">CNAME</span>
                        <span>{branding.customDomain?.split(".")[0] || "radio"}</span>
                        <span className="text-green-400">truefans-radio.netlify.app</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-zinc-500 flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">1.</span>
                        Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
                      </p>
                      <p className="text-xs text-zinc-500 flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">2.</span>
                        Navigate to DNS settings for your domain
                      </p>
                      <p className="text-xs text-zinc-500 flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">3.</span>
                        Add the CNAME record shown above
                      </p>
                      <p className="text-xs text-zinc-500 flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">4.</span>
                        Wait 5-30 minutes for DNS propagation, then save here
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* ═══ TAB: Embed Widget ═══ */}
            {activeTab === "embed" && (
              <>
                <SectionCard title="Embed Player Customization" icon={Code}>
                  <div className="mt-4 space-y-6">
                    {/* Accent Color */}
                    <ColorPickerField
                      label="Embed Accent Color (inherits from primary if empty)"
                      value={branding.embedAccentColor || station.primaryColor || "#f59e0b"}
                      onChange={(v) => updateBranding("embedAccentColor", v)}
                    />

                    {/* Size Selector */}
                    <div>
                      <label className="text-xs font-medium text-zinc-400 block mb-2">Player Size</label>
                      <div className="grid grid-cols-3 gap-3">
                        {EMBED_SIZES.map((size) => (
                          <button
                            key={size.key}
                            onClick={() => setEmbedSize(size.key)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                              embedSize === size.key
                                ? "border-amber-500 bg-amber-500/10 text-amber-300"
                                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                            }`}
                          >
                            <size.icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{size.label}</span>
                            <span className="text-[10px] text-zinc-500">{size.width}x{size.height}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Embed Preview */}
                    <div>
                      <label className="text-xs font-medium text-zinc-400 block mb-2">Preview</label>
                      <div className="rounded-xl p-6 flex items-center justify-center bg-zinc-800/50 border border-zinc-700" style={{ minHeight: sizeConfig.height + 60 }}>
                        <iframe
                          src={embedUrl}
                          width={sizeConfig.width}
                          height={sizeConfig.height}
                          frameBorder="0"
                          allow="autoplay"
                          style={{ border: "none", borderRadius: 12, maxWidth: "100%" }}
                          title="Embed preview"
                        />
                      </div>
                    </div>

                    {/* Embed Code */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-zinc-400">Embed Code</label>
                        <button
                          onClick={copyEmbedCode}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                        >
                          {embedCopied ? (
                            <><Check className="w-3 h-3 text-green-400" /> Copied</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy Code</>
                          )}
                        </button>
                      </div>
                      <pre className="bg-zinc-950 text-zinc-400 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all leading-relaxed border border-zinc-800 font-mono">
                        {embedCode}
                      </pre>
                    </div>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ═══ TAB: Imaging Scripts ═══ */}
            {activeTab === "imaging" && (
              <SectionCard title="Imaging Script Library" icon={Music}>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-zinc-500">
                      {SCRIPT_CATEGORIES.reduce((sum, cat) => sum + getScripts(cat.key).length, 0)} scripts total
                    </span>
                  </div>

                  {genError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start justify-between gap-2">
                      <p className="text-sm text-red-400">{genError}</p>
                      <button onClick={() => setGenError(null)} className="text-red-400/50 hover:text-red-400 shrink-0 text-lg leading-none">&times;</button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {Object.entries(groupedCategories).map(([group, categories]) => {
                      const colors = GROUP_COLORS[group];
                      const groupScriptCount = categories.reduce((sum, cat) => sum + getScripts(cat.key).length, 0);

                      return (
                        <div key={group}>
                          <button
                            onClick={() => setExpanded((prev) => ({ ...prev, [group]: !prev[group] }))}
                            className="flex items-center gap-2 w-full text-left mb-2"
                          >
                            {expanded[group] ? (
                              <ChevronDown className={`w-4 h-4 ${colors.accent}`} />
                            ) : (
                              <ChevronRight className={`w-4 h-4 ${colors.accent}`} />
                            )}
                            <span className="font-semibold text-zinc-200">{group}</span>
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
                                  <div key={cat.key} className={`rounded-lg border p-4 ${colors.bg} ${colors.border}`}>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-zinc-200">{cat.label}</span>
                                        <span className="text-xs text-zinc-500">({scripts.length})</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => generateScripts(cat.key)}
                                          disabled={isGenerating}
                                          className="text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 font-medium text-zinc-300 hover:bg-zinc-700 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                                        >
                                          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                          Generate All
                                        </button>
                                        <button
                                          onClick={() => addScript(cat.key)}
                                          className="text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 font-medium text-zinc-300 hover:bg-zinc-700 flex items-center gap-1.5 transition-colors"
                                        >
                                          <Plus className="w-3 h-3" />
                                          Add
                                        </button>
                                      </div>
                                    </div>

                                    {scripts.length === 0 ? (
                                      <p className="text-xs text-zinc-500 italic">
                                        No scripts yet. Click &ldquo;Generate All&rdquo; or &ldquo;Add&rdquo; to get started.
                                      </p>
                                    ) : (
                                      <div className="space-y-2">
                                        {scripts.map((script, i) => {
                                          const isEditing = editingScript?.category === cat.key && editingScript.index === i;

                                          if (isEditing) {
                                            return (
                                              <div key={i} className="bg-zinc-900 rounded-lg border border-zinc-700 p-3 space-y-2">
                                                <input
                                                  type="text"
                                                  value={editDraft.label}
                                                  onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                                                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm font-medium text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                  placeholder="Label"
                                                />
                                                <textarea
                                                  value={editDraft.text}
                                                  onChange={(e) => setEditDraft({ ...editDraft, text: e.target.value })}
                                                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                  rows={2}
                                                  placeholder="Script text..."
                                                />
                                                <input
                                                  type="text"
                                                  value={editDraft.musicBed}
                                                  onChange={(e) => setEditDraft({ ...editDraft, musicBed: e.target.value })}
                                                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                  placeholder="Music bed description"
                                                />
                                                <div className="flex gap-2">
                                                  <button onClick={saveEdit} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Save</button>
                                                  <button onClick={() => setEditingScript(null)} className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg border border-zinc-700">Cancel</button>
                                                </div>
                                              </div>
                                            );
                                          }

                                          return (
                                            <div key={i} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3">
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <span className="text-xs font-medium text-zinc-500">{script.label}</span>
                                                  <p className="text-sm text-zinc-200 mt-0.5">&ldquo;{script.text}&rdquo;</p>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                  <button onClick={() => startEdit(cat.key, i)} className="p-1 text-zinc-500 hover:text-zinc-300">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button onClick={() => deleteScript(cat.key, i)} className="p-1 text-zinc-500 hover:text-red-400">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                              {script.musicBed && (
                                                <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-zinc-800">
                                                  <Music className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
                                                  <p className="text-xs text-zinc-500">{script.musicBed}</p>
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
              </SectionCard>
            )}
          </div>

          {/* Right: Live Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4" ref={previewRef}>
              {/* Live Preview Header */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Live Preview</h3>
                </div>

                {/* Mini Player Preview */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: previewBg,
                    border: branding.backgroundStyle === "light" ? "1px solid #e5e7eb" : "1px solid #27272a",
                  }}
                >
                  {/* Station Header */}
                  <div className="p-4" style={{ borderBottom: `2px solid ${previewPrimary}` }}>
                    <div className="flex items-center gap-3">
                      {station.logoUrl ? (
                        <Image
                          src={station.logoUrl}
                          alt="Logo"
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: `${previewPrimary}20` }}
                        >
                          <Radio className="w-5 h-5" style={{ color: previewPrimary }} />
                        </div>
                      )}
                      <div>
                        <h4
                          className="text-sm font-bold"
                          style={{ color: branding.backgroundStyle === "light" ? "#111827" : "#f4f4f5" }}
                        >
                          {station.name}
                        </h4>
                        {station.tagline && (
                          <p
                            className="text-[10px]"
                            style={{ color: branding.backgroundStyle === "light" ? "#6b7280" : "#a1a1aa" }}
                          >
                            {station.tagline}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Now Playing Mock */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${darkenHex(previewPrimary, 0.3)}, ${previewPrimary})` }}
                      >
                        <Music className="w-5 h-5 text-white/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="inline-flex items-center gap-1 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                            style={{ background: `${previewAccent}20`, color: previewAccent }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: previewAccent }} />
                            LIVE
                          </span>
                        </div>
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: branding.backgroundStyle === "light" ? "#111827" : "#f4f4f5" }}
                        >
                          Sample Song Title
                        </p>
                        <p
                          className="text-[10px] truncate"
                          style={{ color: branding.backgroundStyle === "light" ? "#6b7280" : "#a1a1aa" }}
                        >
                          Artist Name
                        </p>
                      </div>
                      {/* Play Button */}
                      <button
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: previewPrimary,
                          boxShadow: `0 2px 8px ${hexToRgba(previewPrimary, 0.4)}`,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 1 }}>
                          <polygon points="6,3 20,12 6,21" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Color Strip */}
                  <div className="flex h-1">
                    <div className="flex-1" style={{ background: previewPrimary }} />
                    <div className="flex-1" style={{ background: previewSecondary }} />
                    <div className="flex-1" style={{ background: previewAccent }} />
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 mt-2 text-center">Updates in real-time as you edit</p>
              </div>

              {/* Embed Player Preview */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Embed Preview</h3>
                </div>
                <div
                  className="rounded-xl p-3 flex items-center justify-center"
                  style={{
                    background: "repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 0 0 / 12px 12px",
                    minHeight: 100,
                  }}
                >
                  <iframe
                    src={embedUrl}
                    width={Math.min(sizeConfig.width, 320)}
                    height={sizeConfig.height}
                    frameBorder="0"
                    allow="autoplay"
                    style={{ border: "none", borderRadius: 12, maxWidth: "100%" }}
                    title="Embed preview"
                  />
                </div>
              </div>

              {/* Color Swatch Summary */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Active Palette</h3>
                <div className="space-y-2">
                  {[
                    { label: "Primary", color: station.primaryColor || "#d97706" },
                    { label: "Secondary", color: station.secondaryColor || "#1e3a5f" },
                    { label: "Accent", color: branding.accentColor || "#f59e0b" },
                    { label: "Background", color: previewBg },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded border border-zinc-700" style={{ background: item.color }} />
                      <span className="text-xs text-zinc-400 flex-1">{item.label}</span>
                      <code className="text-[10px] text-zinc-500 font-mono">{item.color}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
