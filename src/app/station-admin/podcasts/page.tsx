"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Podcast,
  Plus,
  X,
  Loader2,
  Trash2,
  Play,
  Clock,
  Rss,
  Copy,
  Check,
} from "lucide-react";

interface PodcastEpisode {
  id: string;
  title: string;
  description: string | null;
  audioFilePath: string | null;
  duration: number | null;
  episodeType: string;
  publishedAt: string | null;
  createdAt: string;
}

const EPISODE_TYPES = [
  { value: "CUSTOM", label: "Custom" },
  { value: "HOURLY_REPLAY", label: "Hourly Replay" },
  { value: "WEEKLY_BEST_OF", label: "Weekly Best Of" },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PodcastsPage() {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationId, setStationId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAudioPath, setFormAudioPath] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formType, setFormType] = useState("CUSTOM");
  const [formPublish, setFormPublish] = useState(false);

  useEffect(() => {
    fetchStation();
  }, []);

  useEffect(() => {
    if (stationId) fetchEpisodes();
  }, [stationId]);

  async function fetchStation() {
    try {
      const res = await fetch("/api/stations");
      const data = await res.json();
      const stations = data.stations || data;
      if (Array.isArray(stations) && stations.length > 0) {
        setStationId(stations[0].id);
      }
    } catch {
      console.error("Failed to fetch station");
    }
  }

  async function fetchEpisodes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/podcast/episodes?stationId=${stationId}`);
      const data = await res.json();
      setEpisodes(data.episodes || []);
    } catch {
      console.error("Failed to fetch episodes");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formTitle.trim() || !stationId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/podcast/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId,
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          audioFilePath: formAudioPath.trim() || null,
          duration: formDuration ? parseInt(formDuration, 10) : null,
          episodeType: formType,
          publishedAt: formPublish ? new Date().toISOString() : null,
        }),
      });
      if (res.ok) {
        resetForm();
        setShowCreate(false);
        fetchEpisodes();
      }
    } catch {
      console.error("Failed to create episode");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this episode?")) return;
    try {
      await fetch(`/api/podcast/episodes?id=${id}`, { method: "DELETE" });
      fetchEpisodes();
    } catch {
      console.error("Failed to delete episode");
    }
  }

  async function handlePublish(episode: PodcastEpisode) {
    try {
      await fetch("/api/podcast/episodes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: episode.id,
          publishedAt: episode.publishedAt ? null : new Date().toISOString(),
        }),
      });
      fetchEpisodes();
    } catch {
      console.error("Failed to update episode");
    }
  }

  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormAudioPath("");
    setFormDuration("");
    setFormType("CUSTOM");
    setFormPublish(false);
  }

  function copyFeedUrl() {
    const url = `${window.location.origin}/api/podcast/feed?stationId=${stationId}`;
    navigator.clipboard.writeText(url);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2000);
  }

  const typeLabel = (type: string) =>
    EPISODE_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-stone-900 to-stone-950 text-amber-50">
      <SharedNav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Podcast className="w-7 h-7 text-amber-400" />
            <h1 className="text-2xl font-bold">Podcast Episodes</h1>
          </div>
          <div className="flex items-center gap-3">
            {stationId && (
              <button
                onClick={copyFeedUrl}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-sm border border-stone-700"
              >
                {copiedFeed ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Rss className="w-4 h-4 text-orange-400" />
                )}
                {copiedFeed ? "Copied!" : "Copy Feed URL"}
              </button>
            )}
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-sm font-medium"
            >
              {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showCreate ? "Cancel" : "New Episode"}
            </button>
          </div>
        </div>

        {/* RSS Feed Info */}
        {stationId && (
          <div className="mb-6 p-3 rounded-lg bg-stone-800/60 border border-stone-700 text-sm text-stone-400 flex items-start gap-2">
            <Rss className="w-4 h-4 mt-0.5 text-orange-400 shrink-0" />
            <span>
              Your podcast RSS feed is available for Apple Podcasts, Spotify, and other directories.
              Copy the feed URL and submit it to your preferred podcast platforms.
            </span>
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div className="mb-6 p-4 rounded-xl bg-stone-800/80 border border-stone-700">
            <h2 className="text-lg font-semibold mb-4">New Episode</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm text-stone-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Episode title"
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-600 text-amber-50 placeholder-stone-500"
                />
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Episode description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-600 text-amber-50 placeholder-stone-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-stone-400 mb-1">Audio File Path</label>
                  <input
                    type="text"
                    value={formAudioPath}
                    onChange={(e) => setFormAudioPath(e.target.value)}
                    placeholder="/audio/podcast/ep01.mp3"
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-600 text-amber-50 placeholder-stone-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1">Duration (seconds)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="3600"
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-600 text-amber-50 placeholder-stone-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1">Episode Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-600 text-amber-50"
                  >
                    {EPISODE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publish-now"
                  checked={formPublish}
                  onChange={(e) => setFormPublish(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="publish-now" className="text-sm text-stone-400">
                  Publish immediately
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCreate}
                  disabled={saving || !formTitle.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-sm font-medium"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Episode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Episodes List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-16 text-stone-500">
            <Podcast className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg">No podcast episodes yet</p>
            <p className="text-sm mt-1">Create your first episode to start building your podcast feed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="p-4 rounded-xl bg-stone-800/60 border border-stone-700 hover:border-stone-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{ep.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          ep.publishedAt
                            ? "bg-green-900/50 text-green-400"
                            : "bg-stone-700 text-stone-400"
                        }`}
                      >
                        {ep.publishedAt ? "Published" : "Draft"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-400 shrink-0">
                        {typeLabel(ep.episodeType)}
                      </span>
                    </div>
                    {ep.description && (
                      <p className="text-sm text-stone-400 line-clamp-2 mb-2">
                        {ep.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      {ep.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(ep.duration)}
                        </span>
                      )}
                      {ep.audioFilePath && (
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          Has audio
                        </span>
                      )}
                      <span>Created {formatDate(ep.createdAt)}</span>
                      {ep.publishedAt && (
                        <span>Published {formatDate(ep.publishedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handlePublish(ep)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        ep.publishedAt
                          ? "bg-stone-700 hover:bg-stone-600 text-stone-300"
                          : "bg-green-800 hover:bg-green-700 text-green-100"
                      }`}
                    >
                      {ep.publishedAt ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => handleDelete(ep.id)}
                      className="p-1.5 rounded-lg hover:bg-red-900/50 text-stone-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
