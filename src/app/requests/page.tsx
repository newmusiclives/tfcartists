"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Music,
  ThumbsUp,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  User,
  MessageSquare,
} from "lucide-react";

interface SongResult {
  id: string;
  title: string;
  artistName: string;
}

interface SongRequestItem {
  id: string;
  songTitle: string;
  artistName: string;
  listenerName: string | null;
  message: string | null;
  status: string;
  votes: number;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function getVotedIds(): Set<string> {
  // Read from cookie
  const match = document.cookie.match(/(?:^|;\s*)voted_requests=([^;]*)/);
  const cookieIds = match ? match[1].split(",").filter(Boolean) : [];
  // Also read from localStorage as backup
  try {
    const stored = localStorage.getItem("voted_requests");
    const localIds = stored ? JSON.parse(stored) : [];
    return new Set([...cookieIds, ...localIds]);
  } catch {
    return new Set(cookieIds);
  }
}

function markVoted(requestId: string) {
  try {
    const stored = localStorage.getItem("voted_requests");
    const ids: string[] = stored ? JSON.parse(stored) : [];
    ids.push(requestId);
    // Keep last 200
    localStorage.setItem(
      "voted_requests",
      JSON.stringify(ids.slice(-200))
    );
  } catch {
    // localStorage unavailable
  }
}

export default function SongRequestPage() {
  // Station ID — for now use first station found
  const [stationId, setStationId] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SongResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [songTitle, setSongTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [listenerName, setListenerName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Queue state
  const [requests, setRequests] = useState<SongRequestItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [votingId, setVotingId] = useState<string | null>(null);

  // Fetch station ID on mount
  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || data;
        if (Array.isArray(stations) && stations.length > 0) {
          setStationId(stations[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Load voted IDs from cookie/localStorage
  useEffect(() => {
    setVotedIds(getVotedIds());
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!searchQuery || searchQuery.trim().length < 2 || !stationId) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/requests/search?q=${encodeURIComponent(searchQuery)}&stationId=${stationId}`
        );
        const data = await res.json();
        setSearchResults(data.songs || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, stationId]);

  // Select a song from search
  const selectSong = useCallback((song: SongResult) => {
    setSongTitle(song.title);
    setArtistName(song.artistName);
    setSelectedSongId(song.id);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  // Submit request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !artistName.trim() || !stationId) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId,
          songTitle: songTitle.trim(),
          artistName: artistName.trim(),
          songId: selectedSongId || undefined,
          listenerName: listenerName.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        const data = await res.json();
        setSubmitError(data.error || "This song was already requested recently.");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || "Failed to submit request.");
        return;
      }

      setSubmitSuccess(true);
      setSongTitle("");
      setArtistName("");
      setSelectedSongId(null);
      setMessage("");
      // Keep listener name for repeat requests

      // Refresh queue
      fetchQueue();

      // Clear success after 4s
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch request queue
  const fetchQueue = useCallback(async () => {
    if (!stationId) return;
    try {
      const res = await fetch(
        `/api/requests/queue?stationId=${stationId}`
      );
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      // silent
    } finally {
      setLoadingQueue(false);
    }
  }, [stationId]);

  // Auto-refresh queue every 30s
  useEffect(() => {
    if (!stationId) return;
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [stationId, fetchQueue]);

  // Vote handler
  const handleVote = async (requestId: string) => {
    if (votedIds.has(requestId) || votingId) return;

    setVotingId(requestId);
    try {
      const res = await fetch("/api/requests/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setRequests((prev) =>
          prev
            .map((r) =>
              r.id === requestId ? { ...r, votes: data.votes } : r
            )
            .sort((a, b) => b.votes - a.votes)
        );
        setVotedIds((prev) => new Set([...prev, requestId]));
        markVoted(requestId);
      }
    } catch {
      // silent
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-600/20 text-violet-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Music className="w-4 h-4" />
            Song Requests
          </div>
          <h1 className="text-3xl font-bold mb-2">Request a Song</h1>
          <p className="text-zinc-400">
            Search our library or enter any song. Vote to bump requests up the queue!
          </p>
        </div>

        {/* ── Make a Request ── */}
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-10"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-violet-400" />
            Make a Request
          </h2>

          {/* Song search */}
          <div className="relative mb-4">
            <label className="block text-sm text-zinc-400 mb-1">
              Search our library
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a song or artist name..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
              )}
            </div>

            {/* Search dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {searchResults.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => selectSong(song)}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-700 transition-colors border-b border-zinc-700/50 last:border-0"
                  >
                    <div className="font-medium text-sm">{song.title}</div>
                    <div className="text-xs text-zinc-400">
                      {song.artistName}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              or enter manually
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Song title + artist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Song Title *
              </label>
              <input
                type="text"
                value={songTitle}
                onChange={(e) => {
                  setSongTitle(e.target.value);
                  setSelectedSongId(null);
                }}
                required
                maxLength={200}
                placeholder="Song title"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Artist *
              </label>
              <input
                type="text"
                value={artistName}
                onChange={(e) => {
                  setArtistName(e.target.value);
                  setSelectedSongId(null);
                }}
                required
                maxLength={200}
                placeholder="Artist name"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                <User className="inline w-3.5 h-3.5 mr-1" />
                Your Name (optional)
              </label>
              <input
                type="text"
                value={listenerName}
                onChange={(e) => setListenerName(e.target.value)}
                maxLength={100}
                placeholder="Your name"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                <MessageSquare className="inline w-3.5 h-3.5 mr-1" />
                Dedication (optional)
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                placeholder="Shoutout or dedication"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !songTitle.trim() || !artistName.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>

          {/* Feedback */}
          {submitSuccess && (
            <div className="mt-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Your request has been submitted! Vote for it below.
            </div>
          )}
          {submitError && (
            <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {submitError}
            </div>
          )}
        </form>

        {/* ── Request Queue ── */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            Request Queue
          </h2>

          {loadingQueue ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Music className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No requests yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const isQueued = req.status === "queued";
                const hasVoted = votedIds.has(req.id);
                const isVoting = votingId === req.id;

                return (
                  <div
                    key={req.id}
                    className={`flex items-start gap-3 bg-zinc-900 border rounded-xl p-4 transition-colors ${
                      isQueued
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-zinc-800"
                    }`}
                  >
                    {/* Vote button */}
                    <button
                      onClick={() => handleVote(req.id)}
                      disabled={hasVoted || isVoting}
                      className={`flex flex-col items-center min-w-[48px] pt-0.5 transition-colors ${
                        hasVoted
                          ? "text-violet-400"
                          : "text-zinc-500 hover:text-violet-400"
                      } disabled:cursor-default`}
                      title={hasVoted ? "Already voted" : "Upvote this request"}
                    >
                      {isVoting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ThumbsUp
                          className={`w-5 h-5 ${hasVoted ? "fill-violet-400" : ""}`}
                        />
                      )}
                      <span className="text-xs font-bold mt-0.5">
                        {req.votes}
                      </span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {req.songTitle}
                          </div>
                          <div className="text-xs text-zinc-400 truncate">
                            {req.artistName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isQueued && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                              Up Next
                            </span>
                          )}
                          {req.status === "pending" && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Meta line */}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                        {req.listenerName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {req.listenerName}
                          </span>
                        )}
                        <span>{timeAgo(req.createdAt)}</span>
                      </div>

                      {/* Dedication message */}
                      {req.message && (
                        <div className="mt-2 text-xs text-zinc-400 italic bg-zinc-800/50 rounded-lg px-3 py-1.5">
                          &ldquo;{req.message}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
