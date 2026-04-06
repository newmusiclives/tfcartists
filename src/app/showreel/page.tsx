"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Radio,
  Play,
  Pause,
  Loader2,
  ChevronDown,
  Mic2,
  ArrowRight,
  Sparkles,
  User,
  MapPin,
  Clock,
  Volume2,
  CheckCircle2,
} from "lucide-react";

const GENRE_OPTIONS = [
  { value: "americana", label: "Americana / Country / Singer-Songwriter" },
  { value: "southern-soul", label: "Soul / R&B / Blues" },
  { value: "indie-rock", label: "Indie / Alternative / Surf Rock" },
  { value: "folk-roots", label: "Folk / Acoustic / Appalachian" },
  { value: "country-classic", label: "Classic Country / Honky-Tonk / Outlaw" },
  { value: "hip-hop-rnb", label: "Hip-Hop / R&B / Neo-Soul" },
  { value: "jazz-lounge", label: "Jazz / Lounge / Bossa Nova" },
  { value: "latin-tropical", label: "Latin / Reggaeton / Tropical" },
  { value: "community-radio", label: "Community / Local Radio" },
];

interface Segment {
  djName: string;
  slot: string;
  timeLabel: string;
  script: string;
  audioUrl: string;
  isPersonalized: boolean;
}

interface ShowReelResult {
  stationName: string;
  tagline: string;
  genre: string;
  venueName: string | null;
  prospectName: string | null;
  usedPersonalizedVoice: boolean;
  segments: Segment[];
}

const GENERATION_STEPS = [
  "Writing Hank's morning script...",
  "Recording Hank with that warm baritone...",
  "Writing Loretta Merrick's personalized segment...",
  "Recording Loretta with her cloned voice...",
  "Writing Doc's afternoon script...",
  "Recording Doc's professorial delivery...",
  "Writing Cody's drive-time segment...",
  "Recording Cody's youthful energy...",
  "Mixing music beds and finalizing...",
];

export default function ShowReelPage() {
  const [stationName, setStationName] = useState("");
  const [tagline, setTagline] = useState("");
  const [genre, setGenre] = useState("");
  const [venueName, setVenueName] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ShowReelResult | null>(null);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!stationName.trim() || !genre) return;
    setLoading(true);
    setError("");
    setResult(null);
    setPlayingIdx(null);
    setLoadingStep(0);

    const segments: Segment[] = [];
    const djNames = ["Hank", "Loretta Merrick", "Doc", "Cody"];

    try {
      // Generate each segment one at a time (avoids serverless timeout)
      for (let i = 0; i < 4; i++) {
        // Update loading step: each DJ has 2 steps (writing + recording)
        setLoadingStep(i * 2);

        const res = await fetch("/api/showreel/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stationName: stationName.trim(),
            tagline: tagline.trim() || undefined,
            genre,
            venueName: venueName.trim() || undefined,
            prospectName: prospectName.trim() || undefined,
            segmentIndex: i,
          }),
        });

        setLoadingStep(i * 2 + 1);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to generate ${djNames[i]}'s segment`);
        }

        const segment = await res.json();
        segments.push({
          djName: segment.djName,
          slot: segment.slot,
          timeLabel: segment.timeLabel,
          script: segment.script,
          audioUrl: segment.audioUrl,
          isPersonalized: segment.isPersonalized,
        });

        // Show partial results as they arrive
        setResult({
          stationName: stationName.trim(),
          tagline: tagline.trim() || genre,
          genre,
          venueName: venueName.trim() || null,
          prospectName: prospectName.trim() || null,
          usedPersonalizedVoice: segments.some((s) => s.isPersonalized),
          segments: [...segments],
        });

        if (i === 0) {
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 300);
        }
      }

      setLoadingStep(GENERATION_STEPS.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (idx: number) => {
    const audio = audioRefs.current[idx];
    if (!audio) return;

    // Stop any currently playing
    if (playingIdx !== null && playingIdx !== idx) {
      audioRefs.current[playingIdx]?.pause();
    }

    if (playingIdx === idx) {
      audio.pause();
      setPlayingIdx(null);
    } else {
      audio.play();
      setPlayingIdx(idx);
    }
  };

  const playAll = () => {
    if (!result || result.segments.length === 0) return;
    // Start with first segment
    const firstAudio = audioRefs.current[0];
    if (firstAudio) {
      firstAudio.play();
      setPlayingIdx(0);
    }
  };

  const handleSegmentEnded = (idx: number) => {
    if (result && idx < result.segments.length - 1) {
      // Auto-play next segment
      const nextAudio = audioRefs.current[idx + 1];
      if (nextAudio) {
        nextAudio.play();
        setPlayingIdx(idx + 1);
      }
    } else {
      setPlayingIdx(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-900/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-amber-900/15 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Radio className="w-5 h-5 text-amber-500" />
            <span>TrueFans Radio</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Quick Demo
            </Link>
            <Link
              href="/operator/signup"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Launch Your Station
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-16 pb-6 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Personalized Show Reel
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Hear Your Station
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
              Come to Life
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            4 AI DJs. Your station name. Your venue. Your name spoken by our AI-powered DJ.
            A personalized 20-minute show reel that sells itself.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="relative z-10 pb-12 px-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
            <div className="space-y-5">
              {/* Station Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Station Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="e.g. Nashville Nights Radio"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Tagline <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Auto-generated from genre if blank"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Genre / Format <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full appearance-none px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  >
                    <option value="" disabled>Select a genre...</option>
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-700/50 pt-4">
                <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-3">
                  Personalization (for the pitch)
                </p>
              </div>

              {/* Prospect Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <User className="w-4 h-4 inline mr-1 text-indigo-400" />
                  Prospect&apos;s Name
                </label>
                <input
                  type="text"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  placeholder="e.g. Sarah Mitchell"
                  maxLength={80}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
                <p className="text-xs text-zinc-500 mt-1">Loretta Merrick will mention them by name using her cloned voice</p>
              </div>

              {/* Venue / Location */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1 text-indigo-400" />
                  Venue, Event, or Location
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. The Bluebird Cafe, Nashville"
                  maxLength={120}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !stationName.trim() || !genre}
                className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Show Reel...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Mic2 className="w-5 h-5" />
                    Generate 20-Minute Show Reel
                  </span>
                )}
              </button>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Loading Progress */}
            {loading && (
              <div className="mt-8">
                <div className="space-y-2">
                  {GENERATION_STEPS.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                        i < loadingStep
                          ? "text-green-400"
                          : i === loadingStep
                          ? "text-indigo-400"
                          : "text-zinc-600"
                      }`}
                    >
                      {i < loadingStep ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : i === loadingStep ? (
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 shrink-0 rounded-full border border-zinc-700" />
                      )}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      {result && (
        <section ref={resultsRef} className="relative z-10 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{result.stationName}</h2>
              <p className="text-zinc-400">{result.tagline}</p>
              {result.usedPersonalizedVoice && (
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  Loretta&apos;s segment uses her personalized AI voice
                </div>
              )}
            </div>

            {/* Play All */}
            <button
              onClick={playAll}
              className="w-full mb-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 hover:border-indigo-400/50 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Play Full Show Reel
            </button>

            {/* Segments */}
            <div className="space-y-4">
              {result.segments.map((seg, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border overflow-hidden transition-colors ${
                    seg.isPersonalized
                      ? "border-indigo-500/40 bg-indigo-950/30"
                      : "border-zinc-800 bg-zinc-900/60"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePlay(idx)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                            seg.isPersonalized
                              ? "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-indigo-500/20"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20"
                          }`}
                        >
                          {playingIdx === idx ? (
                            <Pause className="w-4 h-4 text-white" />
                          ) : (
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          )}
                        </button>
                        <div>
                          <h3 className="font-bold text-white">{seg.djName}</h3>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Clock className="w-3 h-3" />
                            <span>{seg.timeLabel}</span>
                            <span className="text-zinc-600">|</span>
                            <span>{seg.slot}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {seg.isPersonalized && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            PERSONALIZED
                          </span>
                        )}
                        {playingIdx === idx && (
                          <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                        )}
                      </div>
                    </div>

                    <audio
                      ref={(el) => { audioRefs.current[idx] = el; }}
                      src={seg.audioUrl}
                      onEnded={() => handleSegmentEnded(idx)}
                      className="w-full h-8"
                      controls
                    />

                    {/* Script */}
                    <details className="mt-3 group">
                      <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
                        View script
                      </summary>
                      <div className="mt-2 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 text-sm text-zinc-400 leading-relaxed italic">
                        &ldquo;{seg.script}&rdquo;
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 text-center">
              <Link
                href="/operator/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-white text-black hover:bg-zinc-100 transition-colors active:scale-[0.98]"
              >
                Ready to Launch This Station?
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-zinc-500 mt-3">
                Go live in 48 hours. Plans from $200/mo.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="relative z-10 py-16 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How the Show Reel Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Hank", desc: "Warm morning opener with that front-porch baritone. Sets the tone for your station.", time: "6 AM Slot" },
              { step: "2", title: "Loretta Merrick", desc: "Your prospect hears their own name spoken by our cloned-voice DJ. The wow moment.", time: "10 AM Slot", highlight: true },
              { step: "3", title: "Doc", desc: "The music professor adds depth and credibility with thoughtful commentary.", time: "2 PM Slot" },
              { step: "4", title: "Cody", desc: "Young drive-time energy closes with excitement about what's next.", time: "5 PM Slot" },
            ].map((item) => (
              <div
                key={item.step}
                className={`p-5 rounded-xl border text-center ${
                  item.highlight
                    ? "border-indigo-500/40 bg-indigo-950/20"
                    : "border-zinc-800/50 bg-zinc-900/40"
                }`}
              >
                <div className={`w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold ${
                  item.highlight
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}>
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-500 mb-2">{item.time}</p>
                <p className="text-sm text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span>TrueFans Radio</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/demo" className="hover:text-zinc-300 transition-colors">60-Sec Demo</Link>
            <Link href="/operate" className="hover:text-zinc-300 transition-colors">Operate</Link>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
