"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Radio, X, Loader2, Music, Users, Clock, Mic2, ArrowRight } from "lucide-react";
import { STATION_TEMPLATES, type StationTemplate } from "@/lib/station-templates";

export default function TemplatePickerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <TemplatePickerInner />
    </Suspense>
  );
}

function TemplatePickerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "growth";

  const [selected, setSelected] = useState<StationTemplate | null>(null);
  const [stationName, setStationName] = useState("");
  const [callSign, setCallSign] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/operator/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selected.id,
          stationName,
          callSign,
          plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Provisioning failed. Please try again.");
        return;
      }

      router.push("/station-admin/wizard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Radio className="w-8 h-8 text-amber-500" />
            <span className="text-2xl font-bold text-white">TrueFans RADIO</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Choose Your Station Template</h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Pick a format to get started. Each template comes with pre-configured AI DJs, genre settings, and station personality. You can customize everything later.
          </p>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {STATION_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                setSelected(template);
                setError(null);
              }}
              className="group relative bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-5 text-left transition-all hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-4 right-4 h-1 rounded-b-full"
                style={{ backgroundColor: template.primaryColor }}
              />

              <div className="mt-2">
                <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{template.tagline}</p>

                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>{template.genre}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="capitalize">{template.musicEra} era</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mic2 className="w-3.5 h-3.5" />
                    <span>
                      {template.djPresets.length} DJ{template.djPresets.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hover indicator */}
              <div
                className="absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: template.primaryColor }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
              setError(null);
            }
          }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal accent bar */}
            <div
              className="h-1.5 rounded-t-2xl"
              style={{
                background: `linear-gradient(to right, ${selected.primaryColor}, ${selected.secondaryColor})`,
              }}
            />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                  <p className="text-sm text-zinc-400 mt-0.5">{selected.genre}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setError(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-zinc-300 text-sm mb-6">{selected.description}</p>

              {/* DJ Preview */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  AI DJ Lineup
                </h3>
                <div className="space-y-2">
                  {selected.djPresets.map((dj) => (
                    <div
                      key={dj.name}
                      className="flex items-center gap-3 bg-zinc-800/60 rounded-lg p-3"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: dj.colorPrimary }}
                      >
                        {dj.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">{dj.name}</div>
                        <div className="text-xs text-zinc-400 truncate">{dj.vibe}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provision Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Station Details
                </h3>

                {error && (
                  <div className="bg-red-950/50 border border-red-800/50 rounded-lg p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="stationName"
                    className="block text-sm font-medium text-zinc-300 mb-1"
                  >
                    Station Name
                  </label>
                  <input
                    id="stationName"
                    type="text"
                    required
                    placeholder="e.g. Mountain Country Radio"
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="callSign"
                    className="block text-sm font-medium text-zinc-300 mb-1"
                  >
                    Call Sign
                  </label>
                  <input
                    id="callSign"
                    type="text"
                    required
                    placeholder="e.g. KMTN"
                    maxLength={8}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    value={callSign}
                    onChange={(e) => setCallSign(e.target.value.toUpperCase())}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !stationName || !callSign}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: selected.primaryColor,
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Launch Station</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
