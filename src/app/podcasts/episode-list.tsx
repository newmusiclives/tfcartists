"use client";

import { useState, useRef, useCallback } from "react";
import { Play, Pause, Clock, Mic2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface Episode {
  id: string;
  title: string;
  description: string | null;
  audioFilePath: string | null;
  duration: number | null;
  publishedAt: string | null;
  episodeType: string;
  djName: string | null;
  airDate: string | null;
}

interface EpisodeListProps {
  episodes: Episode[];
  djNames: string[];
}

const EPISODE_TYPE_LABELS: Record<string, string> = {
  HOURLY_REPLAY: "Hourly Replay",
  WEEKLY_BEST_OF: "Best Of",
  CUSTOM: "Custom",
};

const EPISODE_TYPE_COLORS: Record<string, string> = {
  HOURLY_REPLAY: "bg-blue-600",
  WEEKLY_BEST_OF: "bg-amber-600",
  CUSTOM: "bg-purple-600",
};

const EPISODES_PER_PAGE = 20;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EpisodeList({ episodes, djNames }: EpisodeListProps) {
  const [djFilter, setDjFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter episodes
  const filtered = episodes.filter((ep) => {
    if (djFilter !== "all" && ep.djName !== djFilter) return false;
    if (typeFilter !== "all" && ep.episodeType !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / EPISODES_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * EPISODES_PER_PAGE,
    currentPage * EPISODES_PER_PAGE
  );

  const handleFilterChange = useCallback(() => {
    setPage(1);
  }, []);

  const togglePlay = useCallback(
    (episodeId: string, audioUrl: string) => {
      if (playingId === episodeId) {
        audioRef.current?.pause();
        setPlayingId(null);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audio.play();
      audio.addEventListener("ended", () => setPlayingId(null));
      audioRef.current = audio;
      setPlayingId(episodeId);
      setExpandedId(episodeId);
    },
    [playingId]
  );

  const toggleExpand = useCallback(
    (episodeId: string) => {
      setExpandedId(expandedId === episodeId ? null : episodeId);
    },
    [expandedId]
  );

  return (
    <div>
      {/* Filter Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
          {/* DJ Filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Host
            </label>
            <select
              value={djFilter}
              onChange={(e) => {
                setDjFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Hosts</option>
              {djNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Episode Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                handleFilterChange();
              }}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Types</option>
              <option value="HOURLY_REPLAY">Hourly Replay</option>
              <option value="WEEKLY_BEST_OF">Best Of</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Result count */}
          <div className="flex items-end">
            <span className="text-sm text-gray-400 pb-2">
              {filtered.length} episode{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Episode List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {paginated.length === 0 ? (
          <div className="text-center py-16">
            <Mic2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No episodes match your filters.</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((ep) => {
              const isExpanded = expandedId === ep.id;
              const isPlaying = playingId === ep.id;

              return (
                <div
                  key={ep.id}
                  className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl overflow-hidden hover:border-zinc-600 transition-colors"
                >
                  {/* Main row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => toggleExpand(ep.id)}
                  >
                    {/* Play button */}
                    <div className="flex-shrink-0">
                      {ep.audioFilePath ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay(ep.id, ep.audioFilePath!);
                          }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            isPlaying
                              ? "bg-amber-500 text-white"
                              : "bg-zinc-700 text-white hover:bg-amber-600"
                          }`}
                          aria-label={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-zinc-500" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                        {ep.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {ep.djName && (
                          <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                            <Mic2 className="w-3 h-3" />
                            {ep.djName}
                          </span>
                        )}
                        {(ep.airDate || ep.publishedAt) && (
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(ep.airDate || ep.publishedAt!)}
                          </span>
                        )}
                        {ep.duration && (
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(ep.duration)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span
                        className={`${
                          EPISODE_TYPE_COLORS[ep.episodeType] || "bg-zinc-600"
                        } text-white text-xs font-medium px-2.5 py-1 rounded-full hidden sm:inline-block`}
                      >
                        {EPISODE_TYPE_LABELS[ep.episodeType] || ep.episodeType}
                      </span>
                      {!ep.audioFilePath && (
                        <span className="text-xs text-zinc-500 italic">Coming Soon</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded: inline audio player + description */}
                  {isExpanded && (
                    <div className="border-t border-zinc-700/50 px-4 pb-4 pt-3">
                      {/* Mobile badge */}
                      <div className="sm:hidden mb-3">
                        <span
                          className={`${
                            EPISODE_TYPE_COLORS[ep.episodeType] || "bg-zinc-600"
                          } text-white text-xs font-medium px-2.5 py-1 rounded-full`}
                        >
                          {EPISODE_TYPE_LABELS[ep.episodeType] || ep.episodeType}
                        </span>
                      </div>

                      {ep.description && (
                        <p className="text-gray-400 text-sm leading-relaxed mb-3">
                          {ep.description}
                        </p>
                      )}

                      {ep.audioFilePath && (
                        <audio
                          controls
                          src={ep.audioFilePath}
                          className="w-full h-10 rounded-lg"
                          style={{ colorScheme: "dark" }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-gray-400 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
