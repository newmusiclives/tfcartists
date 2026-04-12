"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Mail } from "lucide-react";

export function NewsletterSignupForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "already" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to subscribe");
      }

      const data = await res.json();
      setStatus(data.alreadySubscribed ? "already" : "success");
      if (!data.alreadySubscribed) {
        setEmail("");
        setName("");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-900">You&apos;re subscribed!</p>
          <p className="text-sm text-green-700">
            Watch your inbox for the next weekly digest.
          </p>
        </div>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <Mail className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-900">Already subscribed!</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            You&apos;re already on the list. No action needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-gray-900 placeholder-gray-400"
        />
        <input
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-gray-900 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="inline-flex items-center justify-center gap-2 bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-800 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          Subscribe
        </button>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <p className="text-xs text-gray-400">
        No spam, ever. Unsubscribe anytime with one click.
      </p>
    </form>
  );
}
