"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { SharedNav } from "@/components/shared-nav";
import {
  FileText,
  Loader2,
  RefreshCw,
  Copy,
  Printer,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DJOption {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  colorPrimary: string | null;
  isActive: boolean;
}

interface PrepSheet {
  djId: string;
  djName: string;
  date: string;
  content: string;
  generatedAt: string;
  sections?: {
    weatherAvailable: boolean;
    topPlayedCount: number;
    eventsCount: number;
    requestsCount: number;
    sponsorsCount: number;
  };
}

interface HistoryEntry {
  key: string;
  djId: string | null;
  djName: string | null;
  date: string | null;
  generatedAt: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayString(): string {
  const now = new Date();
  return now.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function friendlyDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** Parse markdown-ish sections from the prep content */
function parseSections(content: string): { title: string; body: string }[] {
  const lines = content.split("\n");
  const sections: { title: string; body: string }[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      if (currentTitle || currentBody.length > 0) {
        sections.push({
          title: currentTitle,
          body: currentBody.join("\n").trim(),
        });
      }
      currentTitle = headerMatch[1];
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentTitle || currentBody.length > 0) {
    sections.push({
      title: currentTitle,
      body: currentBody.join("\n").trim(),
    });
  }

  return sections.filter((s) => s.title);
}

function sectionIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("weather") || lower.includes("greeting"))
    return <Sparkles className="w-4 h-4 text-amber-400" />;
  if (lower.includes("music") || lower.includes("history"))
    return <Calendar className="w-4 h-4 text-purple-400" />;
  if (lower.includes("hot") || lower.includes("track"))
    return <FileText className="w-4 h-4 text-red-400" />;
  if (lower.includes("request") || lower.includes("listener"))
    return <User className="w-4 h-4 text-blue-400" />;
  if (lower.includes("community") || lower.includes("event"))
    return <Calendar className="w-4 h-4 text-green-400" />;
  if (lower.includes("sponsor"))
    return <CheckCircle className="w-4 h-4 text-yellow-400" />;
  if (lower.includes("conversation") || lower.includes("starter"))
    return <Sparkles className="w-4 h-4 text-pink-400" />;
  return <FileText className="w-4 h-4 text-zinc-400" />;
}

function sectionBorderColor(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("weather")) return "border-l-amber-500";
  if (lower.includes("music") || lower.includes("history"))
    return "border-l-purple-500";
  if (lower.includes("hot") || lower.includes("track"))
    return "border-l-red-500";
  if (lower.includes("request")) return "border-l-blue-500";
  if (lower.includes("community") || lower.includes("event"))
    return "border-l-green-500";
  if (lower.includes("sponsor")) return "border-l-yellow-500";
  if (lower.includes("conversation")) return "border-l-pink-500";
  return "border-l-zinc-600";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShowPrepPage() {
  const [djs, setDjs] = useState<DJOption[]>([]);
  const [selectedDjId, setSelectedDjId] = useState<string>("");
  const [date, setDate] = useState(todayString);
  const [prepSheet, setPrepSheet] = useState<PrepSheet | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingDjs, setLoadingDjs] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Load DJs with clock assignments
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function loadDjs() {
      try {
        // First get station
        const stRes = await fetch("/api/stations");
        const stData = await stRes.json();
        const stations = stData.stations || [];
        const stationId = stations[0]?.id;

        if (!stationId) {
          setLoadingDjs(false);
          return;
        }

        // Get DJs
        const djRes = await fetch(`/api/station-djs?stationId=${stationId}`);
        const djData = await djRes.json();
        const allDjs: DJOption[] = (djData.djs || []).filter(
          (d: DJOption & { _count?: { clockAssignments: number } }) =>
            d.isActive && (d._count?.clockAssignments ?? 0) > 0
        );

        // Fallback: if no DJs with clock assignments, show all active DJs
        if (allDjs.length === 0) {
          const activeDjs = (djData.djs || []).filter(
            (d: DJOption) => d.isActive
          );
          setDjs(activeDjs);
          if (activeDjs.length > 0) setSelectedDjId(activeDjs[0].id);
        } else {
          setDjs(allDjs);
          setSelectedDjId(allDjs[0].id);
        }
      } catch {
        // Silently handle
      }
      setLoadingDjs(false);
    }
    loadDjs();
  }, []);

  // -------------------------------------------------------------------------
  // Load existing prep sheet when DJ/date changes
  // -------------------------------------------------------------------------
  const loadPrepSheet = useCallback(async () => {
    if (!selectedDjId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/show-prep/generate?djId=${selectedDjId}&date=${date}`
      );
      if (res.ok) {
        const data = await res.json();
        setPrepSheet(data.prepSheet || null);
      }
    } catch {
      // No existing prep — that's fine
    }
    setLoading(false);
  }, [selectedDjId, date]);

  useEffect(() => {
    loadPrepSheet();
  }, [loadPrepSheet]);

  // -------------------------------------------------------------------------
  // Load history
  // -------------------------------------------------------------------------
  const loadHistory = useCallback(async () => {
    try {
      const url = selectedDjId
        ? `/api/show-prep/generate?djId=${selectedDjId}`
        : `/api/show-prep/generate`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {
      // silently handle
    }
  }, [selectedDjId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // -------------------------------------------------------------------------
  // Generate prep sheet
  // -------------------------------------------------------------------------
  const handleGenerate = async () => {
    if (!selectedDjId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/show-prep/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ djId: selectedDjId, date }),
      });
      const data = await res.json();
      if (res.ok && data.prepSheet) {
        setPrepSheet(data.prepSheet);
        loadHistory();
      } else {
        setError(data.error || "Generation failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setGenerating(false);
  };

  // -------------------------------------------------------------------------
  // Copy to clipboard
  // -------------------------------------------------------------------------
  const handleCopy = async () => {
    if (!prepSheet) return;
    try {
      await navigator.clipboard.writeText(prepSheet.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = prepSheet.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // -------------------------------------------------------------------------
  // Print
  // -------------------------------------------------------------------------
  const handlePrint = () => {
    if (!prepSheet) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const selectedDj = djs.find((d) => d.id === selectedDjId);
    win.document.write(`
      <html>
        <head>
          <title>Show Prep - ${selectedDj?.name || "DJ"} - ${date}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #1a1a1a; line-height: 1.6; }
            h1 { font-size: 22px; margin-bottom: 4px; color: #111; }
            .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
            h2 { font-size: 16px; color: #333; border-bottom: 2px solid #e5e5e5; padding-bottom: 4px; margin-top: 24px; }
            p, li { font-size: 14px; }
            ul { padding-left: 20px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>Show Prep: ${selectedDj?.name || "DJ"}</h1>
          <div class="meta">${friendlyDate(date)} | Generated ${new Date(prepSheet.generatedAt).toLocaleString()}</div>
          ${prepSheet.content
            .replace(/## (.+)/g, "<h2>$1</h2>")
            .replace(/\n- /g, "\n<li>")
            .replace(/\n\d+\. /g, (m) => `\n<li>${m.trim().replace(/^\d+\.\s*/, "")}`)
            .replace(/\n\n/g, "</p><p>")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // -------------------------------------------------------------------------
  // Load history entry
  // -------------------------------------------------------------------------
  const loadHistoryEntry = (entry: HistoryEntry) => {
    if (entry.djId) setSelectedDjId(entry.djId);
    if (entry.date) setDate(entry.date);
  };

  const selectedDj = djs.find((d) => d.id === selectedDjId);
  const sections = prepSheet ? parseSections(prepSheet.content) : [];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-400" />
            AI Show Prep
          </h1>
          <p className="text-zinc-400 mt-1">
            Generate daily show prep sheets tailored to each DJ&apos;s personality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ----------------------------------------------------------------- */}
          {/* Left sidebar: Controls + History */}
          {/* ----------------------------------------------------------------- */}
          <div className="lg:col-span-1 space-y-5">
            {/* DJ Selector */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                DJ
              </label>
              {loadingDjs ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                </div>
              ) : djs.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No active DJs with assignments found.
                </p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedDjId}
                    onChange={(e) => setSelectedDjId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 appearance-none pr-8"
                  >
                    {djs.map((dj) => (
                      <option key={dj.id} value={dj.id}>
                        {dj.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Date Picker */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 [color-scheme:dark]"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedDjId}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Prep Sheet
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* History */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                History
              </h3>
              {history.length === 0 ? (
                <p className="text-sm text-zinc-600">No prep sheets yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {history.map((entry) => (
                    <button
                      key={entry.key}
                      onClick={() => loadHistoryEntry(entry)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        entry.djId === selectedDjId && entry.date === date
                          ? "bg-amber-900/30 border border-amber-800 text-amber-200"
                          : "bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <div className="font-medium truncate">
                        {entry.djName || "Unknown DJ"}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span>{entry.date}</span>
                        {entry.generatedAt && (
                          <span>{timeAgo(entry.generatedAt)}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* Main content: Prep sheet display */}
          {/* ----------------------------------------------------------------- */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : prepSheet ? (
              <div ref={printRef}>
                {/* Prep sheet header */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 mb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {selectedDj?.photoUrl ? (
                        <img
                          src={selectedDj.photoUrl}
                          alt={selectedDj.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/30"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-amber-500/30"
                          style={{
                            backgroundColor:
                              selectedDj?.colorPrimary || "#71717a",
                          }}
                        >
                          {(selectedDj?.name || "DJ")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-zinc-100">
                          {prepSheet.djName}&apos;s Show Prep
                        </h2>
                        <p className="text-sm text-zinc-400">
                          {friendlyDate(prepSheet.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors border border-zinc-700"
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors border border-zinc-700"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors border border-zinc-700 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`}
                        />
                        Regenerate
                      </button>
                    </div>
                  </div>

                  {/* Stats badges */}
                  {prepSheet.sections && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {prepSheet.sections.weatherAvailable
                          ? "Weather included"
                          : "No weather data"}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {prepSheet.sections.topPlayedCount} top tracks
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {prepSheet.sections.eventsCount} events
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {prepSheet.sections.requestsCount} requests
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {prepSheet.sections.sponsorsCount} sponsors
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-zinc-600 mt-3">
                    Generated {new Date(prepSheet.generatedAt).toLocaleString()}
                  </p>
                </div>

                {/* Sections */}
                <div className="space-y-3">
                  {sections.map((section, idx) => (
                    <div
                      key={idx}
                      className={`bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden border-l-4 ${sectionBorderColor(section.title)}`}
                    >
                      <div className="px-5 py-3 border-b border-zinc-800/50 flex items-center gap-2">
                        {sectionIcon(section.title)}
                        <h3 className="font-semibold text-zinc-100">
                          {section.title}
                        </h3>
                      </div>
                      <div className="px-5 py-4">
                        <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {section.body
                            .split("\n")
                            .map((line, lineIdx) => {
                              // Bold
                              const formatted = line
                                .replace(
                                  /\*\*(.+?)\*\*/g,
                                  '<strong class="text-zinc-100">$1</strong>'
                                )
                                .replace(/\*(.+?)\*/g, "<em>$1</em>");

                              // List items
                              if (line.match(/^[-*]\s/)) {
                                return (
                                  <div
                                    key={lineIdx}
                                    className="flex gap-2 ml-1 mb-1"
                                  >
                                    <span className="text-zinc-600 mt-0.5">
                                      &bull;
                                    </span>
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeHtml(formatted.replace(
                                          /^[-*]\s/,
                                          ""
                                        )),
                                      }}
                                    />
                                  </div>
                                );
                              }

                              // Numbered items
                              const numMatch = line.match(/^(\d+)\.\s(.+)/);
                              if (numMatch) {
                                return (
                                  <div
                                    key={lineIdx}
                                    className="flex gap-2 ml-1 mb-1"
                                  >
                                    <span className="text-amber-500 font-semibold min-w-[1.2rem]">
                                      {numMatch[1]}.
                                    </span>
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeHtml(formatted.replace(
                                          /^\d+\.\s/,
                                          ""
                                        )),
                                      }}
                                    />
                                  </div>
                                );
                              }

                              // Empty line
                              if (!line.trim()) {
                                return <div key={lineIdx} className="h-2" />;
                              }

                              return (
                                <p
                                  key={lineIdx}
                                  className="mb-1"
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizeHtml(formatted),
                                  }}
                                />
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-300 mb-1">
                  No prep sheet yet
                </h3>
                <p className="text-sm text-zinc-500 max-w-sm">
                  Select a DJ and date, then click &ldquo;Generate Prep
                  Sheet&rdquo; to create an AI-powered show prep document
                  tailored to their personality.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
