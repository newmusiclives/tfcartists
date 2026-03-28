"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, Volume2, VolumeX, Radio, Music, Users, Mic, Headphones, ArrowRight, Sparkles } from "lucide-react";

const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || "https://89.167.23.152:8000/americana-hq.mp3";

interface NowPlaying {
  title: string;
  artist_name: string;
  artwork_url: string | null;
  dj_name: string | null;
  station: string;
  status: string;
}

export default function DemoStationPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchNowPlaying = useCallback(async () => {
    try {
      const res = await fetch("/api/now-playing", { cache: "no-store" });
      if (res.ok) setNowPlaying(await res.json());
    } catch { /* */ }
  }, []);

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  function handlePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    setStatus("loading");
    audio.src = `${STREAM_URL}?_t=${Date.now()}`;
    audio.play().catch(() => setStatus("idle"));
  }

  function handlePause() {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
    setIsPlaying(false);
    setStatus("idle");
  }

  const features = [
    { icon: Mic, title: "AI DJ Personalities", desc: "4 unique AI DJs with cloned ElevenLabs voices, each with their own show and personality" },
    { icon: Music, title: "Clock-Scheduled Programming", desc: "Professional radio clocks with A/B/C/D/E rotation categories, voice breaks, and imaging" },
    { icon: Radio, title: "Full Station Imaging", desc: "TOH IDs, sweepers, promos, show intros/outros, and DJ handoff transitions" },
    { icon: Users, title: "Artist Promotion", desc: "Independent artists get real airplay with DJ introductions alongside mainstream hits" },
    { icon: Headphones, title: "24/7 Live Streaming", desc: "Icecast streaming with adaptive bitrate, mobile support, and PWA listener app" },
    { icon: Sparkles, title: "5 AI Staff Teams", desc: "Artist relations, sponsor sales, listener growth, music curation, and station management" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-amber-950/20 to-gray-950 text-white">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        onPlaying={() => { setIsPlaying(true); setStatus("playing"); }}
        onError={() => setStatus("idle")}
        preload="none"
      />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-transparent to-orange-900/20" />
        <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-sm mb-6">
              <Radio className="w-4 h-4" />
              Live Demo Station
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-4">
              North Country Radio
            </h1>
            <p className="text-xl text-amber-200/80 italic mb-2">&ldquo;Where the Music Finds You&rdquo;</p>
            <p className="text-gray-400 max-w-2xl mx-auto">
              This is a fully operational AI-powered radio station. Every element you hear — the DJs, imaging,
              song selection, and scheduling — is created and managed by AI. Listen live to experience what
              your station could sound like.
            </p>
          </div>

          {/* Player Card */}
          <div className="max-w-lg mx-auto bg-gradient-to-br from-amber-900/60 to-orange-900/40 backdrop-blur-sm border border-amber-700/30 rounded-2xl p-6 shadow-2xl">
            {/* Now Playing */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-amber-800/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {nowPlaying?.artwork_url ? (
                  <Image src={nowPlaying.artwork_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <Music className="w-8 h-8 text-amber-400/50" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold truncate">{nowPlaying?.title || "North Country Radio"}</div>
                <div className="text-amber-300/70 truncate">{nowPlaying?.artist_name || "Press play to listen"}</div>
                {nowPlaying?.dj_name && (
                  <div className="text-xs text-amber-400/50 mt-0.5">
                    {nowPlaying.station} &middot; DJ {nowPlaying.dj_name}
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 ${
                  status === "playing" ? "bg-green-500" : status === "loading" ? "bg-blue-500 animate-pulse" : "bg-amber-500"
                }`}
              >
                {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
              </button>

              <div className="flex-1 flex items-center gap-2">
                <button onClick={() => setVolume(v => v > 0 ? 0 : 80)} className="text-amber-400">
                  {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range" min="0" max="100" value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-1.5 accent-amber-400 bg-amber-700/50 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                status === "playing" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                <span className={`w-2 h-2 rounded-full ${status === "playing" ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
                {status === "playing" ? "ON AIR" : status === "loading" ? "CONNECTING" : "LISTEN LIVE"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Hear */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">What Powers This Station</h2>
        <p className="text-gray-400 text-center mb-10">Every feature below is included when you launch your own station</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <f.icon className="w-8 h-8 text-amber-400 mb-3" />
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DJ Lineup */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Today&apos;s DJ Lineup</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Hank Westwood", time: "6AM - 9AM", show: "Sunrise & Steel", vibe: "Morning drive energy" },
            { name: "Loretta Merrick", time: "9AM - 12PM", show: "The Transatlantic Sessions", vibe: "Warm mid-morning" },
            { name: "Doc Holloway", time: "12PM - 3PM", show: "The Deep Cuts", vibe: "Afternoon groove" },
            { name: "Cody Rampart", time: "3PM - 6PM", show: "The Open Road", vibe: "Drive home" },
          ].map((dj) => (
            <div key={dj.name} className="bg-gradient-to-b from-amber-900/30 to-transparent border border-amber-800/20 rounded-xl p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-800/40 mx-auto mb-3 flex items-center justify-center">
                <Mic className="w-7 h-7 text-amber-400/60" />
              </div>
              <div className="font-bold">{dj.name}</div>
              <div className="text-amber-400 text-sm">{dj.time}</div>
              <div className="text-gray-500 text-xs mt-1">{dj.show}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Launch Your Own AI Radio Station</h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Everything you hear on North Country Radio can be yours. Custom DJs, cloned voices,
          professional imaging, and a complete station management platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/operate"
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
          >
            Launch a Station <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/showreel"
            className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-lg border border-gray-700 transition-colors"
          >
            <Sparkles className="w-5 h-5" /> Hear a Personalized Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
