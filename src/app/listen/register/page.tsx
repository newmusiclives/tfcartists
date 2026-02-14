"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Radio, ArrowRight, ArrowLeft, Headphones, Music, Trophy, Users, Gift } from "lucide-react";
import { useStation } from "@/contexts/StationContext";

const DISCOVERY_SOURCES = [
  { value: "social_media", label: "Social Media" },
  { value: "friend_referral", label: "Friend / Word of Mouth" },
  { value: "artist_referral", label: "An Artist Told Me" },
  { value: "search", label: "Web Search" },
  { value: "podcast", label: "Podcast" },
  { value: "event", label: "Live Event" },
  { value: "organic", label: "Just Found It" },
];

export default function ListenerRegisterPage() {
  const router = useRouter();
  const { currentStation } = useStation();
  const formRef = useRef<HTMLDivElement>(null);
  const [refCode, setRefCode] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    discoverySource: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Read ref code from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setRefCode(ref);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email) {
      setError("Email is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/listeners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, referralCode: refCode || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Store listener ID for session tracking
      if (data.listener?.id) {
        localStorage.setItem("listenerId", data.listener.id);
      }

      // Track referral attribution if ref code was provided
      if (refCode && data.listener?.id && !data.existing) {
        fetch("/api/referrals/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listenerId: data.listener.id,
            referralCode: refCode,
          }),
        }).catch(() => {}); // Fire and forget
      }

      // Redirect to player
      router.push("/player");
    } catch {
      setError("Failed to register. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Radio className="w-5 h-5" />
              <span className="font-bold">{currentStation.name}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Headphones className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Discover Music That Moves You
          </h1>
          <p className="text-xl sm:text-2xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Real radio. Real DJs. Real community.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            {currentStation.name} plays the best independent music, curated by passionate DJs who know their stuff. Join our listener community and be part of something real.
          </p>
          <button
            onClick={scrollToForm}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Join Free
          </button>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 px-4 bg-white/60">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Why Listeners Love {currentStation.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: Music,
                title: "Curated Music",
                desc: "Hand-picked tracks from real DJs, not algorithms. Discover artists you won't find anywhere else.",
              },
              {
                icon: Trophy,
                title: "Earn XP & Rewards",
                desc: "Get points for listening, sharing, and engaging. Level up and unlock exclusive perks.",
              },
              {
                icon: Users,
                title: "Vibrant Community",
                desc: "Connect with fellow music lovers and the artists you support. Your taste matters here.",
              },
              {
                icon: Gift,
                title: "Always Free",
                desc: "No subscriptions, no paywalls. Just great music and a community that values your ears.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-4">
                  <item.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Sign Up", desc: "Enter your email and you're in. Takes 30 seconds." },
              { step: "2", title: "Tune In", desc: "Hit play and start discovering incredible music." },
              { step: "3", title: "Earn XP", desc: "Get rewarded for listening, sharing, and engaging." },
              { step: "4", title: "Unlock Rewards", desc: "Redeem points for merch, shoutouts, and exclusives." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transition */}
      <section className="py-10 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Community</h2>
        <p className="text-gray-600">Free forever. No credit card needed.</p>
      </section>

      {/* Form */}
      <div ref={formRef} className="max-w-lg mx-auto px-4 pb-16">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="discoverySource" className="block text-sm font-medium text-gray-700 mb-1">
              How did you find us? <span className="text-gray-400">(optional)</span>
            </label>
            <select
              id="discoverySource"
              value={form.discoverySource}
              onChange={(e) => setForm({ ...form, discoverySource: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            >
              <option value="">Select one...</option>
              {DISCOVERY_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {submitting ? (
              <span>Registering...</span>
            ) : (
              <>
                <span>Start Listening</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already registered?{" "}
            <Link href="/player" className="text-blue-600 hover:text-blue-700 font-medium">
              Go to player
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
