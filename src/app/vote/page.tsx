"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Trophy,
  Music,
  Loader2,
  ThumbsUp,
  CheckCircle,
  Calendar,
  RefreshCw,
} from "lucide-react";

interface Candidate {
  id: string;
  title: string;
  artistName: string;
  genre: string | null;
  artworkUrl: string | null;
}

interface Winner {
  date: string;
  song: Candidate;
  voteCount: number;
}

interface VoteData {
  date: string;
  candidates: Candidate[];
  votes: Record<string, number>;
  hasVoted: boolean;
  previousWinners: Winner[];
}

export default function VotePage() {
  const [data, setData] = useState<VoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vote/song-of-day");
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setVoted(d.hasVoted);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const castVote = async (songId: string) => {
    if (voted || voting) return;
    setVoting(songId);
    try {
      const res = await fetch("/api/vote/song-of-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      if (res.ok) {
        const result = await res.json();
        setVoted(true);
        setData((prev) =>
          prev ? { ...prev, votes: result.votes, hasVoted: true } : prev
        );
      }
    } catch {
      // ignore
    }
    setVoting(null);
  };

  const totalVotes = data
    ? Object.values(data.votes).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-zinc-100">
      <SharedNav />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-2">Song of the Day</h1>
          <p className="text-zinc-400">
            Vote for your favorite! Results update live.
          </p>
          {data && (
            <p className="text-xs text-zinc-600 mt-2">
              {new Date(data.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {loading && !data ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : !data || data.candidates.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
            <Music className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No songs available for voting today.</p>
          </div>
        ) : (
          <>
            {/* Candidate Cards */}
            <div className="space-y-4 mb-10">
              {data.candidates.map((song) => {
                const voteCount = data.votes[song.id] || 0;
                const pct = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                return (
                  <div
                    key={song.id}
                    className={`relative bg-zinc-900 border rounded-xl p-5 transition-all ${
                      voted
                        ? "border-zinc-800"
                        : "border-zinc-700 hover:border-blue-500/50 cursor-pointer"
                    }`}
                    onClick={() => !voted && castVote(song.id)}
                  >
                    <div className="flex items-center gap-4">
                      {song.artworkUrl ? (
                        <img
                          src={song.artworkUrl}
                          alt={song.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                          <Music className="w-7 h-7 text-white" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-100 text-lg">
                          {song.title}
                        </h3>
                        <p className="text-sm text-zinc-400">{song.artistName}</p>
                        {song.genre && (
                          <span className="text-xs text-zinc-600">{song.genre}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {voted ? (
                          <span className="text-sm font-bold text-zinc-300">
                            {voteCount} {voteCount === 1 ? "vote" : "votes"}
                          </span>
                        ) : (
                          <button
                            disabled={voting !== null}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 text-sm font-medium"
                          >
                            {voting === song.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ThumbsUp className="w-4 h-4" />
                            )}
                            Vote
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {voted && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>{Math.round(pct)}%</span>
                          <span>{voteCount} votes</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {voted && (
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/10 text-green-400 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Thanks for voting! Results auto-refresh every 30s.
                </div>
              </div>
            )}

            {/* Previous Winners */}
            {data.previousWinners.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    Previous Winners
                  </h2>
                </div>
                <div className="divide-y divide-zinc-800">
                  {data.previousWinners.map((w) => (
                    <div
                      key={w.date}
                      className="px-6 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-zinc-600" />
                        <span className="text-xs text-zinc-500">{w.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-zinc-200">
                          {w.song.title}
                        </span>
                        <span className="text-xs text-zinc-500 ml-2">
                          by {w.song.artistName}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {w.voteCount} votes
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
