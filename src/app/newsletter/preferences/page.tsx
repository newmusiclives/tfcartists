"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Radio, Loader2, Save } from "lucide-react";

function PreferencesForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [prefs, setPrefs] = useState({
    weeklyDigest: true,
    artistSpotlight: true,
    newMusicAlerts: true,
    stationUpdates: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, preferences: prefs }),
      });
      if (!res.ok) {
        setError("Failed to update preferences");
      } else {
        setSaved(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        window.location.href = "/newsletter/unsubscribed";
      }
    } catch {
      setError("Failed to unsubscribe");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center text-gray-600 dark:text-zinc-400">
        <p>Invalid link. Please use the link from your email.</p>
      </div>
    );
  }

  const options = [
    { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Top songs, new artists, and highlights" },
    { key: "artistSpotlight" as const, label: "Artist Spotlight", desc: "Featured artist profiles and stories" },
    { key: "newMusicAlerts" as const, label: "New Music Alerts", desc: "When new music enters rotation" },
    { key: "stationUpdates" as const, label: "Station Updates", desc: "Schedule changes and announcements" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Email Preferences</h2>
      <div className="space-y-4">
        {options.map((opt) => (
          <label key={opt.key} className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs[opt.key]}
              onChange={(e) => setPrefs({ ...prefs, [opt.key]: e.target.checked })}
              className="mt-1 rounded border-gray-300 text-amber-700 focus:ring-amber-500"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">{opt.label}</span>
              <p className="text-sm text-gray-500 dark:text-zinc-500">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-4 text-sm text-green-600">Preferences saved!</p>}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center space-x-2 bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-800 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Preferences</span>
        </button>

        <button
          onClick={handleUnsubscribeAll}
          disabled={saving}
          className="text-sm text-gray-500 hover:text-red-600"
        >
          Unsubscribe from all
        </button>
      </div>
    </div>
  );
}

export default function NewsletterPreferencesPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Radio className="w-8 h-8 text-amber-700 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter Preferences</h1>
          <p className="text-gray-600 dark:text-zinc-400">Choose which emails you'd like to receive</p>
        </div>

        <Suspense fallback={
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-700 mx-auto" />
          </div>
        }>
          <PreferencesForm />
        </Suspense>
      </div>
    </main>
  );
}
