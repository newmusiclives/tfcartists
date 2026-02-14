"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import { Upload, FileText, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function MusicImportPage() {
  const [stationId, setStationId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"csv" | "json">("csv");
  const [rawInput, setRawInput] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        if (data.stations?.length > 0) setStationId(data.stations[0].id);
      })
      .catch(() => {});
  }, []);

  const parseInput = () => {
    try {
      if (inputMode === "json") {
        const parsed = JSON.parse(rawInput);
        setPreview(Array.isArray(parsed) ? parsed.slice(0, 10) : []);
      } else {
        // CSV parse
        const lines = rawInput.trim().split("\n");
        if (lines.length < 2) return;
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const rows = lines.slice(1).map((line) => {
          const vals = line.split(",").map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = vals[i] || "";
          });
          // Map common header names
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
        setPreview(rows.slice(0, 10));
      }
    } catch {
      setPreview([]);
    }
  };

  const doImport = async () => {
    if (!stationId || preview.length === 0) return;
    setImporting(true);
    try {
      let songs: any[];
      if (inputMode === "json") {
        songs = JSON.parse(rawInput);
        if (!Array.isArray(songs)) songs = [];
      } else {
        const lines = rawInput.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        songs = lines.slice(1).map((line) => {
          const vals = line.split(",").map((v) => v.trim());
          const obj: any = {};
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

      const res = await fetch("/api/station-songs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId, songs }),
      });
      const data = await res.json();
      setResult(data.results || { imported: 0, skipped: 0, errors: [] });
    } catch {
      setResult({ imported: 0, skipped: 0, errors: ["Import failed"] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/station-admin/music" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Music Library
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <Upload className="w-8 h-8 text-green-600" />
          Import Songs
        </h1>
        <p className="text-gray-600 mb-8">Bulk import songs from CSV or JSON</p>

        {result ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-semibold mb-2">Import Complete</h2>
            <p className="text-gray-600 mb-4">
              {result.imported} imported, {result.skipped} skipped
            </p>
            {result.errors.length > 0 && (
              <div className="text-left bg-red-50 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {e}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Link href="/station-admin/music" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                View Library
              </Link>
              <button onClick={() => { setResult(null); setRawInput(""); setPreview([]); }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">
                Import More
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode("csv")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${inputMode === "csv" ? "bg-gray-900 text-white" : "bg-white border"}`}
              >
                <FileText className="w-4 h-4 inline mr-1" /> CSV
              </button>
              <button
                onClick={() => setInputMode("json")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${inputMode === "json" ? "bg-gray-900 text-white" : "bg-white border"}`}
              >
                {"{ }"} JSON
              </button>
            </div>

            {/* Input area */}
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                {inputMode === "csv" ? "Paste CSV data (first row = headers)" : "Paste JSON array"}
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                rows={10}
                placeholder={
                  inputMode === "csv"
                    ? "title,artist,album,duration,genre,bpm,category,vocal\nSunset Road,Jake Rivers,Highway Album,234,Alt-Country,120,A,male"
                    : '[{"title":"Sunset Road","artistName":"Jake Rivers","album":"Highway Album","duration":234,"genre":"Alt-Country","bpm":120,"rotationCategory":"A","vocalGender":"male"}]'
                }
              />
              <button onClick={parseInput} className="mt-3 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Preview
              </button>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                <h3 className="font-semibold mb-3">Preview ({preview.length} rows shown)</h3>
                <div className="overflow-x-auto">
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
                      {preview.map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{row.title || row.track || "--"}</td>
                          <td className="px-3 py-2">{row.artistName || row.artist || "--"}</td>
                          <td className="px-3 py-2">{row.rotationCategory || row.category || "C"}</td>
                          <td className="px-3 py-2">{row.genre || "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={doImport}
                  disabled={importing}
                  className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Import All Songs
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
