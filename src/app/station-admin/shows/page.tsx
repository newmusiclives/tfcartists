"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Radio,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface PrerecordedShow {
  key: string;
  id: string;
  title: string;
  audioUrl: string;
  scheduledDate: string;
  scheduledHour: number;
  djId: string | null;
  description: string;
  status: string;
  createdAt: string;
}

export default function ShowsPage() {
  const [shows, setShows] = useState<PrerecordedShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledHour, setScheduledHour] = useState(12);
  const [description, setDescription] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shows/prerecorded");
      if (res.ok) {
        const data = await res.json();
        setShows(data.shows || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !audioUrl || !scheduledDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/shows/prerecorded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          audioUrl,
          scheduledDate,
          scheduledHour,
          description,
        }),
      });
      if (res.ok) {
        setTitle("");
        setAudioUrl("");
        setScheduledDate("");
        setScheduledHour(12);
        setDescription("");
        setShowForm(false);
        fetchData();
      }
    } catch {
      // ignore
    }
    setSubmitting(false);
  };

  const cancelShow = async (id: string) => {
    try {
      await fetch(`/api/shows/prerecorded?id=${id}`, { method: "DELETE" });
      setShows((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s))
      );
    } catch {
      // ignore
    }
  };

  const formatHour = (h: number) => {
    if (h === 0) return "12:00 AM";
    if (h === 12) return "12:00 PM";
    return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "text-blue-400 bg-blue-400/10";
      case "aired":
        return "text-green-400 bg-green-400/10";
      case "cancelled":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-zinc-400 bg-zinc-800";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Radio className="w-6 h-6 text-purple-400" />
              Pre-Recorded Shows
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Schedule pre-recorded audio to air at specific times
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-500"
            >
              <Plus className="w-4 h-4" />
              Schedule Show
            </button>
          </div>
        </div>

        {/* Schedule Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Friday Night Classics"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Audio URL</label>
                <input
                  type="url"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  required
                  placeholder="https://... or paste URL"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Hour</label>
                <select
                  value={scheduledHour}
                  onChange={(e) => setScheduledHour(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-purple-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {formatHour(i)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of the show content"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-zinc-400 bg-zinc-800 rounded-lg hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Schedule
              </button>
            </div>
          </form>
        )}

        {/* Shows List */}
        {loading ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : shows.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
            <Radio className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No pre-recorded shows scheduled.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shows.map((show) => (
              <div
                key={show.key}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-zinc-100">{show.title}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusColor(show.status)}`}
                      >
                        {show.status}
                      </span>
                    </div>
                    {show.description && (
                      <p className="text-sm text-zinc-500 mb-2">{show.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {show.scheduledDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatHour(show.scheduledHour)}
                      </span>
                    </div>
                  </div>
                  {show.status === "scheduled" && (
                    <button
                      onClick={() => cancelShow(show.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20"
                    >
                      <Trash2 className="w-3 h-3" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
