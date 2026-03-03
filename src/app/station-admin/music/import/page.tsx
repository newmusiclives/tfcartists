"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import {
  Upload, FileText, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Music, X, GripVertical, FolderUp,
} from "lucide-react";

interface FileEntry {
  file: File;
  title: string;
  artistName: string;
  album: string;
  category: string;
  vocalGender: string;
  duration: number | null;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const CATEGORIES = [
  { value: "A", label: "A — Power Rotation", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "B", label: "B — Heavy Rotation", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "C", label: "C — Medium Rotation", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "D", label: "D — Light Rotation", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "E", label: "E — Indie/Discovery", color: "bg-orange-100 text-orange-700 border-orange-200" },
];

const GENDERS = [
  { value: "unknown", label: "Unknown" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "mixed", label: "Mixed" },
  { value: "instrumental", label: "Instrumental" },
];

function parseFilename(filename: string): { artist: string; title: string } {
  // Remove extension
  const name = filename.replace(/\.(mp3|wav|m4a|flac|ogg)$/i, "");
  // Try "Artist - Title" pattern
  if (name.includes(" - ")) {
    const [artist, ...rest] = name.split(" - ");
    return { artist: artist.trim(), title: rest.join(" - ").trim() };
  }
  // Try "Artist_-_Title" pattern
  if (name.includes("_-_")) {
    const [artist, ...rest] = name.split("_-_");
    return { artist: artist.replace(/_/g, " ").trim(), title: rest.join(" - ").replace(/_/g, " ").trim() };
  }
  // Fallback: use filename as title
  return { artist: "", title: name.replace(/_/g, " ").trim() };
}

export default function MusicImportPage() {
  const [stationId, setStationId] = useState<string | null>(null);
  const [mode, setMode] = useState<"files" | "csv" | "json">("files");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [defaultCategory, setDefaultCategory] = useState("C");
  const [defaultGender, setDefaultGender] = useState("unknown");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV/JSON state (legacy mode)
  const [rawInput, setRawInput] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        if (data.stations?.length > 0) setStationId(data.stations[0].id);
      })
      .catch(() => {});
  }, []);

  // Prevent browser from opening dropped files (must be at window level)
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);
    return () => {
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
    };
  }, []);

  // ── Drag & Drop ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const audioFiles = Array.from(fileList).filter((f) =>
      /\.(mp3|wav|m4a|flac|ogg)$/i.test(f.name)
    );

    const entries: FileEntry[] = audioFiles.map((file) => {
      const { artist, title } = parseFilename(file.name);
      return {
        file,
        title,
        artistName: artist,
        album: "",
        category: defaultCategory,
        vocalGender: defaultGender,
        duration: null,
        status: "pending",
      };
    });

    setFiles((prev) => [...prev, ...entries]);
  }, [defaultCategory, defaultGender]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFile = (index: number, updates: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const applyDefaultCategory = () => {
    setFiles((prev) => prev.map((f) => ({ ...f, category: defaultCategory })));
  };

  // ── Upload ──
  const uploadFiles = async () => {
    if (!stationId || files.length === 0) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const entry = files[i];
      updateFile(i, { status: "uploading" });

      try {
        // Create the song record (no actual audio upload to server —
        // audio files live in the station's music library on Railway)
        const res = await fetch("/api/station-songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stationId,
            title: entry.title,
            artistName: entry.artistName,
            album: entry.album || null,
            rotationCategory: entry.category,
            vocalGender: entry.vocalGender,
            duration: entry.duration,
            isActive: true,
          }),
        });

        if (res.ok) {
          updateFile(i, { status: "done" });
          imported++;
        } else {
          const data = await res.json().catch(() => ({}));
          const errMsg = data.error || `HTTP ${res.status}`;
          updateFile(i, { status: "error", error: errMsg });
          errors.push(`${entry.artistName} - ${entry.title}: ${errMsg}`);
          skipped++;
        }
      } catch (err) {
        updateFile(i, { status: "error", error: "Network error" });
        errors.push(`${entry.artistName} - ${entry.title}: Network error`);
        skipped++;
      }

      setUploadProgress({ done: i + 1, total: files.length });
    }

    setUploading(false);
    setResult({ imported, skipped, errors });
  };

  // ── CSV/JSON Legacy ──
  const parseInput = () => {
    try {
      if (mode === "json") {
        const parsed = JSON.parse(rawInput);
        setPreview(Array.isArray(parsed) ? parsed.slice(0, 10) : []);
      } else {
        const lines = rawInput.trim().split("\n");
        if (lines.length < 2) return;
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const rows = lines.slice(1).map((line) => {
          const vals = line.split(",").map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
          return {
            title: obj.title || obj.track || "",
            artistName: obj.artistname || obj.artist || "",
            album: obj.album || "",
            rotationCategory: obj.rotationcategory || obj.category || "C",
            vocalGender: obj.vocalgender || obj.vocal || "unknown",
          };
        });
        setPreview(rows.slice(0, 10));
      }
    } catch { setPreview([]); }
  };

  const doImport = async () => {
    if (!stationId || preview.length === 0) return;
    setImporting(true);
    try {
      let songs: any[];
      if (mode === "json") {
        songs = JSON.parse(rawInput);
      } else {
        const lines = rawInput.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        songs = lines.slice(1).map((line) => {
          const vals = line.split(",").map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
          return {
            title: obj.title || obj.track || "",
            artistName: obj.artistname || obj.artist || "",
            album: obj.album || "",
            rotationCategory: obj.rotationcategory || obj.category || "C",
            vocalGender: obj.vocalgender || obj.vocal || "unknown",
          };
        });
      }
      const res = await fetch("/api/station-songs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId, songs }),
      });
      const data = await res.json();
      setResult(data.results || { imported: 0, skipped: 0, errors: [] });
    } catch {
      setResult({ imported: 0, skipped: 0, errors: ["Import failed"] });
    } finally { setImporting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/station-admin/music" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Music Library
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <Upload className="w-8 h-8 text-green-600" />
          Import Songs
        </h1>
        <p className="text-gray-600 mb-6">Add songs to your music library via file upload or CSV/JSON import</p>

        {result ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-semibold mb-2">Import Complete</h2>
            <p className="text-gray-600 mb-4">{result.imported} imported, {result.skipped} skipped</p>
            {result.errors.length > 0 && (
              <div className="text-left bg-red-50 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {e}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Link href="/station-admin/music" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">View Library</Link>
              <button onClick={() => { setResult(null); setFiles([]); setRawInput(""); setPreview([]); }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">Import More</button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode selector */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setMode("files")}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${mode === "files" ? "bg-green-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}>
                <FolderUp className="w-4 h-4" /> Drop Files
              </button>
              <button onClick={() => setMode("csv")}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${mode === "csv" ? "bg-gray-900 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}>
                <FileText className="w-4 h-4" /> CSV
              </button>
              <button onClick={() => setMode("json")}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${mode === "json" ? "bg-gray-900 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}>
                {"{ }"} JSON
              </button>
            </div>

            {mode === "files" ? (
              <>
                {/* Default category selector */}
                <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Default Category</label>
                      <div className="flex gap-1">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() => setDefaultCategory(cat.value)}
                            className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                              defaultCategory === cat.value ? cat.color + " ring-2 ring-offset-1 ring-gray-400" : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}
                          >
                            {cat.value}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Default Vocal</label>
                      <select
                        value={defaultGender}
                        onChange={(e) => setDefaultGender(e.target.value)}
                        className="border rounded-lg px-3 py-1.5 text-sm"
                      >
                        {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </div>
                    {files.length > 0 && (
                      <button onClick={applyDefaultCategory} className="text-xs text-green-700 hover:text-green-800 underline mt-4">
                        Apply to all files
                      </button>
                    )}
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors mb-6 ${
                    isDragging
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-white hover:border-green-400 hover:bg-green-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,.flac,.ogg"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <FolderUp className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-green-500" : "text-gray-400"}`} />
                  <p className="text-lg font-medium text-gray-700 mb-1">
                    {isDragging ? "Drop files here" : "Drag & drop audio files here"}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse. Supports MP3, WAV, M4A, FLAC, OGG
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Files named "Artist - Title.mp3" will auto-fill metadata
                  </p>
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
                    <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{files.length} file{files.length !== 1 ? "s" : ""} queued</span>
                      <button onClick={() => setFiles([])} className="text-xs text-red-600 hover:text-red-700">Clear all</button>
                    </div>
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                      {files.map((entry, i) => (
                        <div key={i} className={`px-4 py-3 flex items-center gap-3 ${
                          entry.status === "done" ? "bg-green-50" : entry.status === "error" ? "bg-red-50" : ""
                        }`}>
                          <Music className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-2 items-center mb-1">
                              <input
                                type="text"
                                value={entry.artistName}
                                onChange={(e) => updateFile(i, { artistName: e.target.value })}
                                placeholder="Artist"
                                className="text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-green-500 outline-none w-36 bg-transparent"
                              />
                              <span className="text-gray-400">—</span>
                              <input
                                type="text"
                                value={entry.title}
                                onChange={(e) => updateFile(i, { title: e.target.value })}
                                placeholder="Title"
                                className="text-sm border-b border-transparent hover:border-gray-300 focus:border-green-500 outline-none flex-1 bg-transparent"
                              />
                            </div>
                            <div className="text-xs text-gray-400">{entry.file.name} ({(entry.file.size / 1024 / 1024).toFixed(1)} MB)</div>
                          </div>

                          {/* Per-file category */}
                          <div className="flex gap-0.5 flex-shrink-0">
                            {CATEGORIES.map((cat) => (
                              <button
                                key={cat.value}
                                onClick={() => updateFile(i, { category: cat.value })}
                                className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                                  entry.category === cat.value ? cat.color : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {cat.value}
                              </button>
                            ))}
                          </div>

                          {/* Status */}
                          {entry.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-green-600" />}
                          {entry.status === "done" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          {entry.status === "error" && (
                            <span title={entry.error}><AlertCircle className="w-4 h-4 text-red-500" /></span>
                          )}

                          <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Upload button */}
                    <div className="px-4 py-4 border-t bg-gray-50">
                      {uploading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">{uploadProgress.done}/{uploadProgress.total}</span>
                        </div>
                      ) : (
                        <button
                          onClick={uploadFiles}
                          disabled={files.length === 0 || !stationId}
                          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Upload className="w-5 h-5" />
                          Add {files.length} Song{files.length !== 1 ? "s" : ""} to Library
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* CSV/JSON mode (legacy) */
              <>
                <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    {mode === "csv" ? "Paste CSV data (first row = headers)" : "Paste JSON array"}
                  </label>
                  <textarea
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                    rows={10}
                    placeholder={mode === "csv"
                      ? "title,artist,album,duration,genre,bpm,category,vocal\nSunset Road,Jake Rivers,Highway Album,234,Alt-Country,120,A,male"
                      : '[{"title":"Sunset Road","artistName":"Jake Rivers","rotationCategory":"A"}]'}
                  />
                  <button onClick={parseInput} className="mt-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">Preview</button>
                </div>
                {preview.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                    <h3 className="font-semibold mb-3">Preview ({preview.length} rows)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Artist</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {preview.map((row, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">{row.title || "--"}</td>
                              <td className="px-3 py-2">{row.artistName || row.artist || "--"}</td>
                              <td className="px-3 py-2">{row.rotationCategory || "C"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={doImport} disabled={importing}
                      className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                      {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                      Import All Songs
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
