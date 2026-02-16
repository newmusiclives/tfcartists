"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Sparkles,
  Loader2,
  Wand2,
  BarChart3,
  CalendarClock,
  LayoutGrid,
  MessageSquare,
  Phone,
  Share2,
} from "lucide-react";

interface FeatureType {
  id: string;
  name: string;
  description: string | null;
  category: string;
  trackPlacement: string | null; // "before" | "after" | null
  suggestedDuration: number;
  includesPoll: boolean;
  includesCallIn: boolean;
  socialMediaFriendly: boolean;
  gptPromptTemplate: string | null;
}

interface FeatureSchedule {
  id: string;
  featureTypeId: string;
  djId: string | null;
  djName: string;
  frequencyPerShow: number;
  minSongsBetween: number;
  priority: number;
  featureType: { name: string; category: string; trackPlacement: string | null };
}

interface DJ {
  id: string;
  name: string;
}

type Tab = "types" | "generate" | "content" | "schedules" | "analytics";

export default function ShowFeaturesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("types");
  const [featureTypes, setFeatureTypes] = useState<FeatureType[]>([]);
  const [schedules, setSchedules] = useState<FeatureSchedule[]>([]);
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationId, setStationId] = useState<string | null>(null);
  const [contentStats, setContentStats] = useState<Record<string, { total: number; available: number }>>({});

  // Generate form
  const [genForm, setGenForm] = useState({ featureTypeId: "", djId: "", artistName: "", songTitle: "", genre: "Americana" });
  const [genResult, setGenResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then(async (data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          const sid = stations[0].id;
          setStationId(sid);
          const [ftRes, djRes] = await Promise.all([
            fetch(`/api/show-features?stationId=${sid}`),
            fetch(`/api/station-djs?stationId=${sid}`),
          ]);
          const ftData = await ftRes.json();
          const djData = await djRes.json();
          setFeatureTypes(ftData.featureTypes || []);
          setContentStats(ftData.contentStats || {});
          setDjs(djData.djs || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (stationId && activeTab === "schedules") {
      fetch(`/api/show-features/schedules?stationId=${stationId}`)
        .then((r) => r.json())
        .then((data) => setSchedules(data.schedules || []))
        .catch(() => {});
    }
  }, [activeTab, stationId]);

  const handleGenerate = async () => {
    if (!stationId || !genForm.featureTypeId || !genForm.djId) return;
    setGenerating(true);
    setGenResult(null);

    const ft = featureTypes.find((f) => f.id === genForm.featureTypeId);
    const dj = djs.find((d) => d.id === genForm.djId);
    // Build content from template (local generation since no AI API key needed)
    let script = ft?.gptPromptTemplate || "Generated content for this feature.";
    script = script.replace(/\{artist\}/g, genForm.artistName || "the artist");
    script = script.replace(/\{artist_name\}/g, genForm.artistName || "the artist");
    script = script.replace(/\{song_title\}/g, genForm.songTitle || "the song");
    script = script.replace(/\{genre\}/g, genForm.genre || "Americana");
    script = script.replace(/\{genre1\}/g, genForm.genre || "Americana");
    script = script.replace(/\{genre2\}/g, "Country");
    script = script.replace(/\{dj_name\}/g, dj?.name || "the DJ");
    script = script.replace(/\{date\}/g, new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" }));
    script = script.replace(/\{original_artist\}/g, genForm.artistName || "the original artist");
    script = script.replace(/\{cover_artist\}/g, "a cover artist");
    script = script.replace(/\{album_title\}/g, "the album");
    script = script.replace(/\{songwriter\}/g, genForm.artistName || "the songwriter");
    script = script.replace(/\{listener_name\}/g, "a listener");
    script = script.replace(/\{producer\}/g, genForm.artistName || "the producer");
    script = script.replace(/\{instrument\}/g, "guitar");
    script = script.replace(/\{year\}/g, "2024");
    script = script.replace(/\{topic\}/g, "music and life");
    script = script.replace(/\{weather\}/g, "sunny and clear");
    script = script.replace(/\{theme\}/g, "feel-good classics");
    script = script.replace(/\{from_name\}/g, "a fan");
    script = script.replace(/\{to_name\}/g, "someone special");
    script = script.replace(/\{message\}/g, "thinking of you");

    try {
      const res = await fetch("/api/show-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          stationId,
          featureTypeId: genForm.featureTypeId,
          djPersonalityId: genForm.djId,
          title: `${ft?.name} — ${dj?.name}`,
          content: script,
          contextData: { artistName: genForm.artistName, songTitle: genForm.songTitle, genre: genForm.genre },
        }),
      });
      if (res.ok) {
        setGenResult(script);
        // Refresh stats
        const statsRes = await fetch(`/api/show-features?stationId=${stationId}`);
        const statsData = await statsRes.json();
        setContentStats(statsData.contentStats || {});
      }
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  const selectedFt = featureTypes.find((f) => f.id === genForm.featureTypeId);
  const allShows = featureTypes.filter((f) => f.category === "all_shows");
  const morningOnly = featureTypes.filter((f) => f.category === "morning_only");

  // Group schedules by DJ, ordered: weekday first, then Saturday, then Sunday
  const djDisplayOrder = [
    "Hank Westwood", "Loretta Merrick", "Marcus 'Doc' Holloway", "Cody Rampart",
    "Jo McAllister", "Paul Saunders", "Ezra Stone", "Levi Bridges",
    "Sam Turnbull", "Ruby Finch", "Mark Faulkner", "Iris Langley",
  ];
  const schedulesByDj = schedules.reduce(
    (acc, s) => {
      if (!acc[s.djName]) acc[s.djName] = [];
      acc[s.djName].push(s);
      return acc;
    },
    {} as Record<string, FeatureSchedule[]>
  );
  const orderedDjNames = [
    ...djDisplayOrder.filter((name) => schedulesByDj[name]),
    ...Object.keys(schedulesByDj).filter((name) => !djDisplayOrder.includes(name)),
  ];
  const weekdayDjs = ["Hank Westwood", "Loretta Merrick", "Marcus 'Doc' Holloway", "Cody Rampart"];
  const saturdayDjs = ["Jo McAllister", "Paul Saunders", "Ezra Stone", "Levi Bridges"];
  const sundayDjs = ["Sam Turnbull", "Ruby Finch", "Mark Faulkner", "Iris Langley"];
  const djSectionLabel = (name: string) =>
    weekdayDjs[0] === name ? "Weekday (Mon–Fri)" :
    saturdayDjs[0] === name ? "Saturday" :
    sundayDjs[0] === name ? "Sunday" : null;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "types", label: "Feature Types", icon: LayoutGrid, count: featureTypes.length },
    { id: "generate", label: "Generate Content", icon: Wand2 },
    { id: "content", label: "Content Library", icon: Sparkles },
    { id: "schedules", label: "Schedules", icon: CalendarClock, count: schedules.length },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-600" />
            Show Features
          </h1>
          <p className="text-gray-600 mt-1">
            AI-generated radio show features and segments
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-amber-600 text-amber-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Feature Types Tab */}
        {activeTab === "types" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                All Shows ({allShows.length})
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Can play anytime, any DJ
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allShows.map((ft) => (
                  <div
                    key={ft.id}
                    className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {ft.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {ft.trackPlacement === "before" && (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                            Song → Talk
                          </span>
                        )}
                        {ft.trackPlacement === "after" && (
                          <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">
                            Talk → Song
                          </span>
                        )}
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {ft.suggestedDuration}s
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {ft.description}
                    </p>
                    <div className="flex gap-1.5">
                      {ft.includesPoll && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" /> Poll
                        </span>
                      )}
                      {ft.includesCallIn && (
                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Phone className="w-3 h-3" /> Call-in
                        </span>
                      )}
                      {ft.socialMediaFriendly && (
                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Share2 className="w-3 h-3" /> Social
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Morning Shows Only ({morningOnly.length})
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                M-F 6am-2pm drive time
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {morningOnly.map((ft) => (
                  <div
                    key={ft.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-amber-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {ft.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {ft.trackPlacement === "before" && (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                            Song → Talk
                          </span>
                        )}
                        {ft.trackPlacement === "after" && (
                          <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">
                            Talk → Song
                          </span>
                        )}
                        <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
                          {ft.suggestedDuration}s
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {ft.description}
                    </p>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                        Morning Only
                      </span>
                      {ft.includesPoll && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" /> Poll
                        </span>
                      )}
                      {ft.includesCallIn && (
                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Phone className="w-3 h-3" /> Call-in
                        </span>
                      )}
                      {ft.socialMediaFriendly && (
                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Share2 className="w-3 h-3" /> Social
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {featureTypes.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="font-medium text-amber-800">
                  No feature types loaded yet
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  Feature types will be seeded automatically.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Generate Content Tab */}
        {activeTab === "generate" && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Generate Feature Content
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Create AI-generated content for any feature type
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Feature Type *
                    </label>
                    <select
                      value={genForm.featureTypeId}
                      onChange={(e) =>
                        setGenForm({ ...genForm, featureTypeId: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select feature...</option>
                      <optgroup label="All Shows">
                        {allShows.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Morning Only">
                        {morningOnly.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      DJ Personality *
                    </label>
                    <select
                      value={genForm.djId}
                      onChange={(e) =>
                        setGenForm({ ...genForm, djId: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select DJ...</option>
                      {djs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedFt && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-amber-800">
                      {selectedFt.name}
                    </h4>
                    <p className="text-xs text-amber-600 mt-1">
                      {selectedFt.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Artist Name
                    </label>
                    <input
                      type="text"
                      value={genForm.artistName}
                      onChange={(e) =>
                        setGenForm({ ...genForm, artistName: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g., Tyler Childers"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Song Title
                    </label>
                    <input
                      type="text"
                      value={genForm.songTitle}
                      onChange={(e) =>
                        setGenForm({ ...genForm, songTitle: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g., Feathered Indians"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={genForm.genre}
                    onChange={(e) =>
                      setGenForm({ ...genForm, genre: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Americana"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !genForm.featureTypeId || !genForm.djId}
                  className="w-full bg-amber-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {generating ? "Generating..." : "Generate Feature"}
                </button>

                {genResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">
                      Generated Content
                    </h4>
                    <p className="text-sm text-green-700 whitespace-pre-wrap">
                      {genResult}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                Generation Info
              </h3>
              <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                <li>
                  Features are generated using GPT-4 with your DJ&apos;s personality
                </li>
                <li>
                  Add OPENAI_API_KEY to .env for real AI content generation
                </li>
                <li>
                  Generated content is cached in database for instant playback
                </li>
                <li>Voice synthesis requires ELEVENLABS_API_KEY</li>
              </ul>
            </div>
          </div>
        )}

        {/* Content Library Tab */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Generated Content Library
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Pre-generated feature content ready for on-air playback
              </p>
            </div>

            {Object.keys(contentStats).length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No content generated yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Use the Generate tab to create feature content for your DJs
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {djs.map((dj) => {
                  const stats = contentStats[dj.id];
                  return (
                    <div
                      key={dj.id}
                      className="bg-white rounded-xl p-4 shadow-sm border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {dj.name}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            stats && stats.available > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {stats ? stats.available : 0} available
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {stats ? stats.total : 0} total generated
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">
                How Automated Generation Works
              </h3>
              <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                <li>Each feature type is pre-generated 3 times per DJ</li>
                <li>
                  During shows, the automation engine requests the next feature
                  via API
                </li>
                <li>
                  Used content is marked and fresh content is generated on
                  schedule
                </li>
                <li>Run batch generation daily to keep content fresh</li>
              </ul>
            </div>
          </div>
        )}

        {/* Schedules Tab */}
        {activeTab === "schedules" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Feature Schedules
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Configure which features play for each DJ
              </p>
            </div>

            {Object.keys(schedulesByDj).length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
                <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No schedules configured yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orderedDjNames.map((djName) => {
                  const djSchedules = schedulesByDj[djName];
                  const sectionLabel = djSectionLabel(djName);
                  return (
                  <div key={djName}>
                    {sectionLabel && (
                      <div className="flex items-center gap-3 mb-3 mt-2">
                        <h2 className="text-lg font-bold text-gray-800">{sectionLabel}</h2>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    )}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="font-semibold text-gray-900">
                        {djName}
                      </h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                            Feature
                          </th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">
                            Track
                          </th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">
                            Freq/Show
                          </th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">
                            Min Songs Between
                          </th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">
                            Priority
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {djSchedules
                          .sort((a, b) => b.priority - a.priority)
                          .map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {s.featureType.name}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {s.featureType.trackPlacement === "before" ? (
                                  <span className="text-[10px] font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                    Before
                                  </span>
                                ) : s.featureType.trackPlacement === "after" ? (
                                  <span className="text-[10px] font-medium bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                                    After
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 text-center">
                                {s.frequencyPerShow}x
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 text-center">
                                {s.minSongsBetween} songs
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    s.priority >= 8
                                      ? "bg-red-100 text-red-700"
                                      : s.priority >= 6
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {s.priority}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Feature Analytics
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Feature performance tracking
              </p>
            </div>
            <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No feature plays recorded yet
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Features will appear here once they start playing on-air
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
