"use client";

import Link from "next/link";
import { ArrowLeft, Monitor, Copy, Check, ExternalLink } from "lucide-react";
import { useState, useCallback } from "react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";
const VISUALIZER_URL = `${SITE_URL}/visualizer`;

const STEPS = [
  {
    number: 1,
    title: "Open the Visualizer",
    description: `Navigate to ${VISUALIZER_URL} in any modern browser (Chrome recommended). Click anywhere on the page to start audio playback and activate the visualizer.`,
  },
  {
    number: 2,
    title: "Add a Source in OBS",
    description:
      'In OBS Studio or Streamlabs, click the "+" under Sources and choose either "Window Capture" (to capture the browser window) or "Browser Source" (to embed it directly).',
  },
  {
    number: 3,
    title: "Set Resolution to 1920x1080",
    description:
      "For Browser Source: set Width to 1920 and Height to 1080. For Window Capture: ensure your browser window is maximized on a 1080p display, or use the transform controls to fit.",
  },
  {
    number: 4,
    title: "Stream as Normal",
    description:
      "Configure your streaming output (YouTube, Twitch, etc.) in OBS Settings > Stream and go live. The visualizer will update track info automatically every 15 seconds.",
  },
];

export default function VisualizerSetupPage() {
  const [copied, setCopied] = useState(false);

  const browserSourceSnippet = `URL: ${VISUALIZER_URL}
Width: 1920
Height: 1080
FPS: 30
Custom CSS: (leave empty)
Shutdown source when not visible: OFF
Refresh when scene becomes active: ON`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(browserSourceSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [browserSourceSnippet]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/visualizer"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Visualizer Setup Guide</h1>
            <p className="text-sm text-zinc-500">
              Stream your station to YouTube, Twitch, or any RTMP service
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* Preview */}
        <section>
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Preview
          </h2>
          <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
            {/* Simulated visualizer preview */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
              {/* Fake frequency bars */}
              <div className="absolute bottom-[35%] left-[7.5%] right-[7.5%] flex items-end gap-[2px] h-[35%]">
                {Array.from({ length: 64 }).map((_, i) => {
                  const t = i / 64;
                  const height = `${
                    15 + Math.sin(i * 0.3) * 25 + Math.cos(i * 0.15) * 20
                  }%`;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height,
                        background: `linear-gradient(to top, rgba(120, 53, 15, 0.7), rgba(245, 158, 11, ${
                          0.3 + t * 0.4
                        }))`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Fake overlay */}
              <div className="absolute bottom-0 left-0 right-0">
                <div className="h-20 bg-gradient-to-t from-zinc-950/95 to-transparent" />
                <div className="bg-zinc-950/95 px-6 pb-4 -mt-px flex items-end justify-between">
                  <div>
                    <div className="h-4 w-48 bg-white/80 rounded mb-1.5" />
                    <div className="h-3 w-32 bg-amber-500/60 rounded" />
                  </div>
                  <div className="text-right">
                    <div className="h-2.5 w-24 bg-white/50 rounded mb-1" />
                    <div className="h-2 w-16 bg-zinc-500/40 rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Label */}
            <div className="absolute top-3 right-3 bg-zinc-900/80 text-zinc-400 text-xs px-2 py-1 rounded border border-zinc-700">
              1920 x 1080
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-3">
            The visualizer displays audio-reactive frequency bars with real-time
            now-playing information. Designed for 1080p screen capture.
          </p>
        </section>

        {/* Steps */}
        <section>
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-6">
            Setup Steps
          </h2>
          <div className="space-y-6">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex gap-4 p-5 rounded-xl bg-zinc-900/50 border border-zinc-800"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-600/20 text-amber-500 flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Browser Source config */}
        <section>
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
            OBS Browser Source Settings
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            For the best experience, use a{" "}
            <strong className="text-white">Browser Source</strong> in OBS
            instead of Window Capture. This avoids taskbar artifacts and allows
            auto-start. Copy the settings below:
          </p>
          <div className="relative rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
              <span className="text-xs text-zinc-500 font-mono">
                Browser Source Config
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-sm text-zinc-300 font-mono whitespace-pre leading-relaxed overflow-x-auto">
              {browserSourceSnippet}
            </pre>
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            Note: OBS Browser Source uses Chromium, so the Web Audio API
            visualizer works natively. Audio from the browser source will be
            captured by OBS automatically.
          </p>
        </section>

        {/* Tips */}
        <section>
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
            Tips
          </h2>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3">
              <Monitor className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
              <span>
                For Window Capture, press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">F11</kbd> to enter fullscreen in your browser first.
              </span>
            </li>
            <li className="flex gap-3">
              <Monitor className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
              <span>
                The visualizer uses <code className="text-zinc-300">requestAnimationFrame</code> and runs at 60fps. On lower-end hardware, consider setting OBS canvas FPS to 30.
              </span>
            </li>
            <li className="flex gap-3">
              <Monitor className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
              <span>
                Track info updates every 15 seconds with smooth fade transitions. No manual intervention needed once running.
              </span>
            </li>
            <li className="flex gap-3">
              <Monitor className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
              <span>
                The cursor is hidden and all UI controls are removed. The page is designed purely for capture — no interactive elements are visible.
              </span>
            </li>
          </ul>
        </section>

        {/* Open Visualizer CTA */}
        <div className="pt-4 pb-10">
          <Link
            href="/visualizer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
          >
            Open Visualizer
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
