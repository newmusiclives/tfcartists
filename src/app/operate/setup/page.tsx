"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Radio,
  Palette,
  Music,
  Globe,
  CheckCircle2,
  Loader2,
  Mic,
  Clock,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Step = "basics" | "branding" | "programming" | "stream" | "review";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "basics", label: "Station Basics", icon: <Radio className="w-5 h-5" /> },
  { key: "branding", label: "Branding", icon: <Palette className="w-5 h-5" /> },
  { key: "programming", label: "Programming", icon: <Music className="w-5 h-5" /> },
  { key: "stream", label: "Stream Config", icon: <Globe className="w-5 h-5" /> },
  { key: "review", label: "Review & Launch", icon: <CheckCircle2 className="w-5 h-5" /> },
];

const GENRE_OPTIONS = [
  "Americana", "Country", "Rock", "Indie", "Pop", "Jazz", "Blues",
  "Folk", "R&B/Soul", "Hip Hop", "Electronic", "Classical", "World",
  "Reggae", "Latin", "Gospel", "Alternative", "Metal",
];

const TIMEZONE_OPTIONS = [
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Phoenix", "America/Anchorage",
  "Pacific/Honolulu", "Europe/London", "Europe/Berlin", "Asia/Tokyo",
];

const FORMAT_TEMPLATES = [
  { id: "music_forward", name: "Music-Forward", desc: "Minimal talk, maximum music. Great for background listening." },
  { id: "personality", name: "Personality Radio", desc: "AI DJs with personality, show segments, and listener interaction." },
  { id: "community", name: "Community Radio", desc: "Local focus with events, shoutouts, and community features." },
  { id: "curated", name: "Curated Discovery", desc: "Focus on new music discovery with deep artist intros." },
];

export default function OperatorSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("basics");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [stationName, setStationName] = useState("");
  const [callSign, setCallSign] = useState("");
  const [tagline, setTagline] = useState("");
  const [genre, setGenre] = useState("");
  const [timezone, setTimezone] = useState("America/Denver");
  const [description, setDescription] = useState("");

  const [primaryColor, setPrimaryColor] = useState("#78350f");
  const [secondaryColor, setSecondaryColor] = useState("#f59e0b");
  const [customDomain, setCustomDomain] = useState("");

  const [format, setFormat] = useState("personality");
  const [hoursPerDay, setHoursPerDay] = useState("24");
  const [djCount, setDjCount] = useState("4");

  const [streamUrl, setStreamUrl] = useState("");
  const [streamPort, setStreamPort] = useState("8000");
  const [mountPoint, setMountPoint] = useState("/stream");

  const currentIdx = STEPS.findIndex((s) => s.key === step);
  const canNext = currentIdx < STEPS.length - 1;
  const canPrev = currentIdx > 0;

  function nextStep() {
    if (canNext) setStep(STEPS[currentIdx + 1].key);
  }
  function prevStep() {
    if (canPrev) setStep(STEPS[currentIdx - 1].key);
  }

  async function handleLaunch() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/setup-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationName,
          callSign,
          tagline,
          genre,
          timezone,
          description,
          primaryColor,
          secondaryColor,
          customDomain: customDomain || null,
          format,
          hoursPerDay: parseInt(hoursPerDay),
          djCount: parseInt(djCount),
          streamUrl: streamUrl || null,
          streamPort: parseInt(streamPort),
          mountPoint,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Setup failed");
        return;
      }
      router.push("/operate/setup/success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <nav className="border-b bg-white/80 dark:bg-zinc-950/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/operate" className="flex items-center gap-2 text-amber-700 hover:text-amber-800 dark:text-amber-400">
            <ArrowLeft className="w-4 h-4" />
            <Radio className="w-5 h-5" />
            <span className="font-bold">Station Setup</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Progress steps */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => setStep(s.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  step === s.key
                    ? "bg-amber-100 text-amber-800"
                    : i < currentIdx
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {i < currentIdx ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  s.icon
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < currentIdx ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step: Basics */}
        {step === "basics" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Station Basics</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Station Name *</label>
                <input type="text" value={stationName} onChange={(e) => setStationName(e.target.value)}
                  placeholder="e.g., North Country Radio" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Call Sign</label>
                  <input type="text" value={callSign} onChange={(e) => setCallSign(e.target.value.toUpperCase())}
                    placeholder="e.g., KNCR" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Primary Genre *</label>
                  <select value={genre} onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none">
                    <option value="">Select genre...</option>
                    {GENRE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Tagline</label>
                <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g., Where the Music Finds You" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Timezone *</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none">
                  {TIMEZONE_OPTIONS.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} placeholder="Tell listeners what makes your station special..."
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* Step: Branding */}
        {step === "branding" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Station Branding</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border" />
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border" />
                    <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono" />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded-xl p-4">
                <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2">Preview</p>
                <div className="rounded-lg overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                  <div className="p-6 text-white">
                    <p className="font-bold text-lg">{stationName || "Your Station Name"}</p>
                    <p className="text-sm opacity-80">{tagline || "Your tagline here"}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Custom Domain (optional)</label>
                <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g., radio.yourbrand.com"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                  Point a CNAME record to truefans-radio.netlify.app. Configure in White Label settings after setup.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Programming */}
        {step === "programming" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Programming Format</h2>
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-3">
                {FORMAT_TEMPLATES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      format === f.id ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{f.name}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">{f.desc}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" /> Hours Per Day
                  </label>
                  <select value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                    <option value="24">24 hours (recommended)</option>
                    <option value="18">18 hours (6am-midnight)</option>
                    <option value="12">12 hours (9am-9pm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    <Mic className="w-4 h-4 inline mr-1" /> AI DJ Personalities
                  </label>
                  <select value={djCount} onChange={(e) => setDjCount(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                    <option value="2">2 DJs</option>
                    <option value="4">4 DJs (recommended)</option>
                    <option value="6">6 DJs</option>
                    <option value="8">8 DJs</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Stream */}
        {step === "stream" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Stream Configuration</h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
              If you already have a Liquidsoap/Icecast server, enter the details below.
              Otherwise, we can provision one for you after setup.
            </p>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Stream Server URL</label>
                <input type="text" value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="e.g., your-server.example.com"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Port</label>
                  <input type="text" value={streamPort} onChange={(e) => setStreamPort(e.target.value)}
                    placeholder="8000" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Mount Point</label>
                  <input type="text" value={mountPoint} onChange={(e) => setMountPoint(e.target.value)}
                    placeholder="/stream" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium">No server yet?</p>
                <p className="mt-1">Skip this step. After setup, go to Admin &gt; Settings to configure streaming, or contact us to provision a managed Liquidsoap/Icecast instance.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Review & Launch</h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Station</p>
                  <p className="font-semibold">{stationName || "(not set)"}</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">{callSign} | {genre} | {timezone}</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">{tagline}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Branding</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: primaryColor }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: secondaryColor }} />
                    <span className="text-sm text-gray-600 ml-2">{customDomain || "No custom domain"}</span>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Programming</p>
                  <p className="font-semibold text-sm">{FORMAT_TEMPLATES.find((f) => f.id === format)?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">{hoursPerDay}h/day, {djCount} AI DJs</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Stream</p>
                  <p className="text-sm">{streamUrl ? `${streamUrl}:${streamPort}${mountPoint}` : "To be configured"}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-medium text-green-800">Ready to launch!</p>
                <p className="text-sm text-green-700 mt-1">
                  This will create your station, generate AI DJ personalities, set up your schedule,
                  and configure your branding. You can customize everything further in the admin panel.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={!canPrev}
            className="inline-flex items-center gap-2 px-5 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step === "review" ? (
            <button
              onClick={handleLaunch}
              disabled={saving || !stationName || !genre}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Launch Station
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-30"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
