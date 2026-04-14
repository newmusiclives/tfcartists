"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Megaphone,
  Loader2,
  Send,
  CheckCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";

interface DJ {
  slug: string;
  name: string;
}

interface Shoutout {
  id: string;
  listenerName: string;
  message: string;
  djName: string | null;
  status: string;
  createdAt: string;
}

export default function ShoutoutsPage() {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [airedShoutouts, setAiredShoutouts] = useState<Shoutout[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [djSlug, setDjSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch DJs for dropdown
      const djRes = await fetch("/api/station-djs");
      if (djRes.ok) {
        const data = await djRes.json();
        setDjs(
          (data.djs || data || []).map((d: any) => ({
            slug: d.slug,
            name: d.name,
          }))
        );
      }
    } catch {
      // ignore
    }

    try {
      // Fetch aired shoutouts
      const shRes = await fetch("/api/shoutouts");
      if (shRes.ok) {
        const data = await shRes.json();
        setAiredShoutouts(
          (data.shoutouts || []).filter((s: Shoutout) => s.status === "aired")
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/shoutouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listenerName: name, message, djSlug: djSlug || undefined }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // ignore
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <SharedNav />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Shoutout Submitted!</h1>
          <p className="text-zinc-400 mb-6">
            Your DJ will read your shoutout on air soon. Stay tuned!
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setName("");
              setMessage("");
              setDjSlug("");
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <Megaphone className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-2">
            Get a DJ Shoutout
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600/10 text-green-400 rounded-full text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Free During Launch!
          </div>
          <p className="text-zinc-400 max-w-md mx-auto">
            Send a shoutout to a friend, dedicate a song, or just say hi.
            Our DJs will read your message on air!
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5 mb-10"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Sarah from Denver"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={500}
              rows={4}
              placeholder="e.g., Happy birthday to my buddy Mike! Play something upbeat for him!"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500 resize-none"
            />
            <div className="text-xs text-zinc-600 text-right mt-1">
              {message.length}/500
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Preferred DJ (optional)
            </label>
            <select
              value={djSlug}
              onChange={(e) => setDjSlug(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-yellow-500"
            >
              <option value="">Any DJ</option>
              {djs.map((dj) => (
                <option key={dj.slug} value={dj.slug}>
                  {dj.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting || !name || !message}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-zinc-900 rounded-lg hover:bg-yellow-400 disabled:opacity-50 font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Shoutout
              </>
            )}
          </button>
        </form>

        {/* Recent Aired Shoutouts */}
        {airedShoutouts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              Recently Aired
            </h2>
            <div className="space-y-3">
              {airedShoutouts.slice(0, 10).map((s) => (
                <div
                  key={s.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-200">
                      {s.listenerName}
                    </span>
                    {s.djName && (
                      <span className="text-xs text-zinc-500">
                        read by {s.djName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 italic">
                    &ldquo;{s.message}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
