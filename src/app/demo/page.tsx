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
  Zap,
  Globe,
  ArrowRight,
  Sparkles,
  Music,
  Headphones,
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

const FAQ_ITEMS = [
  {
    q: "How does TrueFans Radio work?",
    a: "We pair your music library with AI-powered DJ personalities that host your station 24/7. They introduce songs, give weather and time checks, read listener dedications, and keep your station feeling live and personal — all fully automated.",
  },
  {
    q: "What's included in a station?",
    a: "Every station gets AI DJ personalities, automated scheduling, sponsor ad management, listener engagement tools, a public-facing website, an embeddable player, and a real Icecast audio stream you can list on TuneIn, iHeart, and more.",
  },
  {
    q: "How much does it cost?",
    a: "Plans start at $200/month with a one-time setup fee. You can earn back your costs through built-in sponsor management and revenue tools. Book a call to find the right plan for your station.",
  },
  {
    q: "Can I customize my DJ's voice and personality?",
    a: "Absolutely. You choose from preset DJ personalities or create your own. Set their name, voice style, personality traits, and the vibe they bring to your station. Each DJ is unique.",
  },
  {
    q: "How long does it take to launch?",
    a: "Most stations are live within 48 hours. Upload your music, pick your DJs, set your schedule, and we handle the rest — streaming infrastructure, DJ voice generation, and automated playout.",
  },
];

export default function DemoPage() {
  const [stationName, setStationName] = useState("");
  const [genre, setGenre] = useState("");
  const [djName, setDjName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    audioUrl: string;
    script: string;
    djName: string;
    template: { name: string; tagline: string };
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!stationName.trim() || !genre) return;
    setLoading(true);
    setError("");
    setResult(null);
    setIsPlaying(false);

    try {
      const res = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationName: stationName.trim(),
          genre,
          djName: djName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate demo");
      }

      const data = await res.json();
      setResult(data);

      // Scroll to player after a brief delay
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-900/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-amber-900/15 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Radio className="w-5 h-5 text-amber-500" />
            <span>TrueFans Radio</span>
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Pricing
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Radio in 60 Seconds
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Hear Your Station
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              in 60 Seconds
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Enter your station name and genre. Our AI DJ will record a personalized demo
            of what your station could sound like — instantly.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="relative z-10 pb-16 px-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
            <div className="space-y-5">
              {/* Station Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Station Name
                </label>
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="e.g. Sunset Radio, The Barn, Groove FM"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Genre / Format
                </label>
                <div className="relative">
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full appearance-none px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  >
                    <option value="" disabled>
                      Select a genre...
                    </option>
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* DJ Name (optional) */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  DJ Name{" "}
                  <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  placeholder="Leave blank for a preset DJ"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !stationName.trim() || !genre}
                className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Your Demo...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Mic2 className="w-5 h-5" />
                    Generate My Demo
                  </span>
                )}
              </button>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Loading Animation */}
            {loading && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-end gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-amber-500 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 32 + 8}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "0.8s",
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-zinc-500">
                  Our AI DJ is writing and recording your demo...
                </p>
              </div>
            )}

            {/* Audio Player */}
            {result && (
              <div ref={playerRef} className="mt-8 space-y-4">
                <div className="p-6 rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-800/40 border border-zinc-700/50">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={togglePlay}
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all active:scale-95"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-black" />
                      ) : (
                        <Play className="w-6 h-6 text-black ml-0.5" />
                      )}
                    </button>
                    <div>
                      <h3 className="font-bold text-lg">{stationName}</h3>
                      <p className="text-sm text-zinc-400">
                        DJ {result.djName} — {result.template.tagline}
                      </p>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={result.audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />
                </div>

                {/* Script preview */}
                <details className="group">
                  <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
                    View DJ script
                  </summary>
                  <div className="mt-3 p-4 rounded-xl bg-zinc-800/40 border border-zinc-700/30 text-sm text-zinc-400 leading-relaxed italic">
                    &ldquo;{result.script}&rdquo;
                  </div>
                </details>

                {/* CTA — Quick plan cards */}
                <div className="pt-6 space-y-4">
                  <h3 className="text-lg font-bold text-center mb-1">Ready to Launch?</h3>
                  <p className="text-sm text-zinc-400 text-center mb-4">Pick a plan and go live in 48 hours</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "launch", name: "Launch", price: 200, line: "1 station, 2 DJs, 12hr/day" },
                      { id: "growth", name: "Growth", price: 300, line: "1 station, 6 DJs, 24/7", popular: true },
                      { id: "scale", name: "Scale", price: 500, line: "3 stations, 12 DJs, 24/7" },
                    ].map((plan) => (
                      <Link
                        key={plan.id}
                        href={`/operator/signup?plan=${plan.id}`}
                        className={`block p-4 rounded-xl border text-center transition-all hover:scale-[1.02] ${
                          plan.popular
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-zinc-700/50 bg-zinc-800/40 hover:border-zinc-600"
                        }`}
                      >
                        {plan.popular && (
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Most Popular</span>
                        )}
                        <div className="text-xl font-bold">${plan.price}<span className="text-sm font-normal text-zinc-400">/mo</span></div>
                        <div className="text-xs text-zinc-400 mt-1">{plan.line}</div>
                      </Link>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <Link
                      href="/pricing"
                      className="text-sm text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      See full pricing &rarr;
                    </Link>
                    <Link
                      href="/showreel"
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Try 20-min showreel
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-4">
            Trusted by operators
          </p>
          <h2 className="text-3xl font-bold mb-12">
            Join 10+ stations already broadcasting with AI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "We went from idea to live station in two days. The AI DJs are shockingly good.",
                name: "Station Operator",
                station: "Americana Station",
              },
              {
                quote: "Our sponsors love the professional sound. They can't tell it's AI-powered.",
                name: "Station Operator",
                station: "Community Radio",
              },
              {
                quote: "Finally, a way to run a radio station without a full-time staff. This changes everything.",
                name: "Station Operator",
                station: "Jazz Lounge",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/50 text-left"
              >
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-black">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-zinc-500">{testimonial.station}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Go Live</h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              TrueFans Radio handles the heavy lifting so you can focus on your audience.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Mic2,
                title: "AI DJ Personalities",
                desc: "Unique voices with real personality that host your station 24/7.",
              },
              {
                icon: Music,
                title: "Smart Scheduling",
                desc: "Automated playout with clock-based rotation and dayparting.",
              },
              {
                icon: Zap,
                title: "Sponsor Management",
                desc: "Built-in tools to sell, schedule, and report on ad inventory.",
              },
              {
                icon: Globe,
                title: "Live Streaming",
                desc: "Icecast streaming ready for TuneIn, iHeart, and web embedding.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/30 group hover:border-amber-500/30 transition-colors"
              >
                <feature.icon className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800/50 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-900/40 transition-colors"
                >
                  <span className="font-medium pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-6 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <Headphones className="w-12 h-12 text-amber-500 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Ready to Launch Your Station?</h2>
          <p className="text-zinc-400 text-lg mb-8 max-w-md mx-auto">
            Go from zero to live in 48 hours. AI-powered radio that sounds
            human, runs itself, and pays for itself.
          </p>
          <Link
            href="/operator/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
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
            <Link href="/about" className="hover:text-zinc-300 transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
