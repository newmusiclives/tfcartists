"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import { Package, Plus, Loader2, Download, Rocket, Music, Mic, Radio, Zap, Check, AlertCircle } from "lucide-react";

interface ImagingElement {
  id: string;
  elementType: string;
  variationNum: number;
  label: string | null;
  scriptText: string;
  djName: string | null;
  status: string;
  audioDuration: number | null;
}

interface ImagingPackage {
  id: string;
  tier: string;
  status: string;
  stationName: string | null;
  tagline: string | null;
  genre: string | null;
  djNames: string | null;
  totalElements: number;
  generatedCount: number;
  failedCount: number;
  priceMonthly: number | null;
  createdAt: string;
  elements?: ImagingElement[];
}

const TIER_INFO = {
  basic: { name: "Basic", price: 49, color: "amber", icon: Radio, features: ["8 TOH IDs", "8 Station IDs", "10 Sweepers", "5 Promos"] },
  pro: { name: "Pro", price: 149, color: "blue", icon: Mic, features: ["Everything in Basic", "15 Sweepers per DJ", "Show Intros & Outros", "8 Feature Bumpers"] },
  enterprise: { name: "Enterprise", price: 299, color: "purple", icon: Zap, features: ["Everything in Pro", "DJ Handoff Transitions", "Seasonal Refresh", "Custom Music Beds"] },
};

export default function ImagingPackagesPage() {
  const [packages, setPackages] = useState<ImagingPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<ImagingPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [deploying, setDeploying] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [formTier, setFormTier] = useState<string>("pro");
  const [formStation, setFormStation] = useState("North Country Radio");
  const [formTagline, setFormTagline] = useState("Where the Music Finds You");
  const [formGenre, setFormGenre] = useState("Americana / Country");
  const [formDJs, setFormDJs] = useState("Hank Westwood, Loretta Merrick, Marcus Doc Holloway, Cody Rampart");
  const [formSeason, setFormSeason] = useState("");

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      const res = await fetch("/api/imaging-packages?stationId=all");
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
      }
    } catch { /* */ }
    setLoading(false);
  }

  async function createPackage() {
    setCreating(true);
    try {
      const res = await fetch("/api/imaging-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: "default",
          tier: formTier,
          stationName: formStation,
          tagline: formTagline,
          genre: formGenre,
          djNames: formDJs.split(",").map((s) => s.trim()).filter(Boolean),
          seasonalTheme: formSeason || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        fetchPackages();
        // Auto-select new package
        if (data.packageId) {
          setTimeout(() => loadPackage(data.packageId), 500);
        }
      }
    } catch { /* */ }
    setCreating(false);
  }

  async function loadPackage(id: string) {
    try {
      const res = await fetch(`/api/imaging-packages/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPkg(data.package);
      }
    } catch { /* */ }
  }

  async function generatePackage(id: string, step?: string) {
    setGenerating(id);
    try {
      const url = step ? `/api/imaging-packages/${id}/generate?step=${step}` : `/api/imaging-packages/${id}/generate`;
      await fetch(url, { method: "POST" });
      await loadPackage(id);
      fetchPackages();
    } catch { /* */ }
    setGenerating(null);
  }

  async function deployPackage(id: string) {
    setDeploying(id);
    try {
      await fetch(`/api/imaging-packages/${id}/deploy`, { method: "POST" });
      await loadPackage(id);
    } catch { /* */ }
    setDeploying(null);
  }

  const tierColors: Record<string, string> = {
    basic: "border-amber-500/30 bg-amber-500/5",
    pro: "border-blue-500/30 bg-blue-500/5",
    enterprise: "border-purple-500/30 bg-purple-500/5",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-gray-500",
    generating: "bg-blue-500 animate-pulse",
    complete: "bg-green-500",
    failed: "bg-red-500",
  };

  return (
    <>
      <SharedNav />
      <main className="min-h-screen bg-gray-950 text-white pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Package className="w-8 h-8 text-amber-400" />
                Imaging Packages
              </h1>
              <p className="text-gray-400 mt-1">Generate complete station imaging in Basic, Pro, or Enterprise tiers</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Package
            </button>
          </div>

          {/* Tier Cards */}
          {showCreate && (
            <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Create Imaging Package</h2>

              {/* Tier Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(Object.entries(TIER_INFO) as [string, typeof TIER_INFO.basic][]).map(([key, info]) => {
                  const Icon = info.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setFormTier(key)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formTier === key
                          ? `border-${info.color}-500 bg-${info.color}-500/10 ring-2 ring-${info.color}-500/30`
                          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-bold">{info.name}</span>
                        <span className="ml-auto text-lg font-bold">${info.price}/mo</span>
                      </div>
                      <ul className="text-sm text-gray-400 space-y-1">
                        {info.features.map((f) => (
                          <li key={f} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-400" /> {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Station Name</label>
                  <input value={formStation} onChange={(e) => setFormStation(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tagline</label>
                  <input value={formTagline} onChange={(e) => setFormTagline(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Genre / Format</label>
                  <input value={formGenre} onChange={(e) => setFormGenre(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Seasonal Theme (optional)</label>
                  <input value={formSeason} onChange={(e) => setFormSeason(e.target.value)} placeholder="e.g. Summer, Holiday" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">DJ Names (comma separated)</label>
                <input value={formDJs} onChange={(e) => setFormDJs(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createPackage}
                  disabled={creating}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Package
                </button>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white px-4 py-2">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Package List */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Packages</h2>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
              ) : packages.length === 0 ? (
                <p className="text-gray-500 text-sm">No packages yet. Create one to get started.</p>
              ) : (
                packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => loadPackage(pkg.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedPkg?.id === pkg.id ? "border-amber-500 bg-amber-500/10" : tierColors[pkg.tier] || "border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold capitalize">{pkg.tier}</span>
                      <span className={`w-2 h-2 rounded-full ${statusColors[pkg.status]}`} />
                    </div>
                    <div className="text-sm text-gray-400">{pkg.stationName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {pkg.generatedCount}/{pkg.totalElements} elements &middot; {pkg.status}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Package Detail */}
            <div className="lg:col-span-2">
              {selectedPkg ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold capitalize">{selectedPkg.tier} Package — {selectedPkg.stationName}</h2>
                      <p className="text-gray-400 text-sm">{selectedPkg.genre} &middot; {selectedPkg.tagline}</p>
                    </div>
                    <div className="flex gap-2">
                      {selectedPkg.status === "pending" && (
                        <button
                          onClick={() => generatePackage(selectedPkg.id, "scripts")}
                          disabled={!!generating}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                          {generating === selectedPkg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                          Generate Scripts
                        </button>
                      )}
                      {(selectedPkg.status === "generating" || selectedPkg.elements?.some((e) => e.status === "script_ready")) && (
                        <button
                          onClick={() => generatePackage(selectedPkg.id, "audio")}
                          disabled={!!generating}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                          {generating === selectedPkg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                          Generate Audio
                        </button>
                      )}
                      {selectedPkg.status === "complete" && (
                        <>
                          <a
                            href={`/api/imaging-packages/${selectedPkg.id}/download`}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                          >
                            <Download className="w-4 h-4" /> Download ZIP
                          </a>
                          <button
                            onClick={() => deployPackage(selectedPkg.id)}
                            disabled={!!deploying}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                          >
                            {deploying === selectedPkg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                            Deploy to Station
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>{selectedPkg.generatedCount} of {selectedPkg.totalElements} elements</span>
                      <span>{selectedPkg.status}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all"
                        style={{ width: `${selectedPkg.totalElements > 0 ? (selectedPkg.generatedCount / selectedPkg.totalElements) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Elements Grid */}
                  {selectedPkg.elements && selectedPkg.elements.length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(
                        selectedPkg.elements.reduce<Record<string, ImagingElement[]>>((acc, el) => {
                          if (!acc[el.elementType]) acc[el.elementType] = [];
                          acc[el.elementType].push(el);
                          return acc;
                        }, {})
                      ).map(([type, elements]) => (
                        <div key={type}>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {type.replace(/_/g, " ")} ({elements.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {elements.map((el) => (
                              <div key={el.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`w-2 h-2 rounded-full ${
                                    el.status === "audio_ready" ? "bg-green-500" :
                                    el.status === "script_ready" ? "bg-blue-500" :
                                    el.status === "failed" ? "bg-red-500" : "bg-gray-500"
                                  }`} />
                                  <span className="text-sm font-medium">{el.label || `${type} #${el.variationNum}`}</span>
                                  {el.djName && <span className="text-xs text-amber-400">{el.djName}</span>}
                                  {el.audioDuration && <span className="text-xs text-gray-500 ml-auto">{el.audioDuration}s</span>}
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2">{el.scriptText}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No elements yet. Click &quot;Generate Scripts&quot; to start.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Select a package or create a new one</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
