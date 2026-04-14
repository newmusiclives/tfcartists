"use client";

import { useState, useEffect, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Code,
  Copy,
  Check,
  Sun,
  Moon,
  Eye,
  Radio,
  Music,
} from "lucide-react";

type WidgetType = "player" | "now-playing";
type Theme = "dark" | "light";
type SnippetFormat = "html" | "wordpress" | "react";

const PLAYER_HEIGHT = 180;
const NOW_PLAYING_HEIGHT = 110;

const COLOR_PRESETS = [
  { name: "Amber", value: "#f59e0b" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
];

const BG_PRESETS: Record<Theme, Array<{ name: string; value: string }>> = {
  dark: [
    { name: "Navy", value: "#1a1a2e" },
    { name: "Charcoal", value: "#1f2937" },
    { name: "Dark Slate", value: "#0f172a" },
    { name: "Dark Purple", value: "#1e1b4b" },
    { name: "True Black", value: "#000000" },
  ],
  light: [
    { name: "White", value: "#ffffff" },
    { name: "Warm", value: "#fffbeb" },
    { name: "Cool", value: "#f0f9ff" },
    { name: "Gray", value: "#f9fafb" },
    { name: "Lavender", value: "#faf5ff" },
  ],
};

export default function StationAdminEmbedPage() {
  const [widgetType, setWidgetType] = useState<WidgetType>("player");
  const [theme, setTheme] = useState<Theme>("dark");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [snippetFormat, setSnippetFormat] = useState<SnippetFormat>("html");
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app");

  // Update bg color when theme changes
  useEffect(() => {
    setBgColor(theme === "dark" ? "#1a1a2e" : "#ffffff");
  }, [theme]);

  // Refresh preview on changes
  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(refreshPreview, 300);
    return () => clearTimeout(timer);
  }, [widgetType, theme, accentColor, bgColor, refreshPreview]);

  const widgetPath = widgetType === "player" ? "/embed/player" : "/embed/now-playing";
  const params = new URLSearchParams();
  params.set("theme", theme);
  if (accentColor !== "#f59e0b") params.set("color", accentColor.replace("#", ""));
  if ((theme === "dark" && bgColor !== "#1a1a2e") || (theme === "light" && bgColor !== "#ffffff")) {
    params.set("bg", bgColor.replace("#", ""));
  }

  const embedUrl = `${baseUrl}${widgetPath}?${params.toString()}`;
  const iframeWidth = 400;
  const iframeHeight = widgetType === "player" ? PLAYER_HEIGHT : NOW_PLAYING_HEIGHT;

  const snippets: Record<SnippetFormat, string> = {
    html: `<iframe
  src="${embedUrl}"
  width="${iframeWidth}"
  height="${iframeHeight}"
  frameborder="0"
  allow="autoplay"
  style="border:none;border-radius:12px;max-width:100%;"
  title="TrueFans Radio ${widgetType === "player" ? "Player" : "Now Playing"}"
></iframe>`,

    wordpress: `<!-- TrueFans Radio ${widgetType === "player" ? "Player" : "Now Playing"} Widget -->
<div style="max-width:${iframeWidth}px;margin:0 auto;">
  <iframe
    src="${embedUrl}"
    width="100%"
    height="${iframeHeight}"
    frameborder="0"
    allow="autoplay"
    style="border:none;border-radius:12px;"
    title="TrueFans Radio ${widgetType === "player" ? "Player" : "Now Playing"}"
  ></iframe>
</div>
<!-- /TrueFans Radio -->`,

    react: `// TrueFans Radio ${widgetType === "player" ? "Player" : "Now Playing"} Widget
export function TrueFansRadio${widgetType === "player" ? "Player" : "NowPlaying"}() {
  return (
    <iframe
      src="${embedUrl}"
      width={${iframeWidth}}
      height={${iframeHeight}}
      frameBorder="0"
      allow="autoplay"
      style={{
        border: "none",
        borderRadius: 12,
        maxWidth: "100%",
      }}
      title="TrueFans Radio ${widgetType === "player" ? "Player" : "Now Playing"}"
    />
  );
}`,
  };

  const snippet = snippets[snippetFormat];

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SharedNav />
      <main className="min-h-screen bg-zinc-950 pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">Embed Widget</h1>
                <p className="text-sm text-zinc-500">Add your radio player to any website</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Configuration (2 cols) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Widget Type */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <h2 className="text-sm font-semibold text-zinc-300 mb-4">Widget Type</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setWidgetType("player")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      widgetType === "player"
                        ? "border-amber-500 bg-amber-50"
                        : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <Radio className={`w-5 h-5 ${widgetType === "player" ? "text-amber-600" : "text-zinc-400"}`} />
                    <div>
                      <div className="font-semibold text-sm text-zinc-100">Player</div>
                      <div className="text-xs text-zinc-500">Play/pause, volume, now-playing</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setWidgetType("now-playing")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      widgetType === "now-playing"
                        ? "border-amber-500 bg-amber-50"
                        : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <Music className={`w-5 h-5 ${widgetType === "now-playing" ? "text-amber-600" : "text-zinc-400"}`} />
                    <div>
                      <div className="font-semibold text-sm text-zinc-100">Now Playing</div>
                      <div className="text-xs text-zinc-500">Song info only, no controls</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <h2 className="text-sm font-semibold text-zinc-300 mb-4">Theme</h2>
                <div className="flex gap-3 mb-5">
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                      theme === "dark"
                        ? "border-amber-500 bg-gray-900 text-white"
                        : "border-zinc-800 text-gray-600 hover:border-zinc-700"
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                      theme === "light"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-zinc-800 text-gray-600 hover:border-zinc-700"
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                </div>

                {/* Accent Color */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setAccentColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          accentColor === c.value ? "border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-300" : "border-zinc-800"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border border-zinc-800"
                      title="Custom color"
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {BG_PRESETS[theme].map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setBgColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          bgColor === c.value ? "border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-300" : "border-zinc-700"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border border-zinc-800"
                      title="Custom background"
                    />
                  </div>
                </div>
              </div>

              {/* Embed Code */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-zinc-300">Embed Code</h2>
                  <div className="flex gap-1">
                    {([["html", "HTML"], ["wordpress", "WordPress"], ["react", "React"]] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSnippetFormat(key)}
                        className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                          snippetFormat === key
                            ? "border-amber-500 bg-amber-50 text-amber-700 font-medium"
                            : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <pre className="bg-gray-900 text-gray-300 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                    {snippet}
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center gap-1.5"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 mt-2 font-medium">Embed code copied to clipboard!</p>
                )}
              </div>
            </div>

            {/* Right: Preview (3 cols) */}
            <div className="lg:col-span-3">
              <div className="sticky top-24 space-y-6">
                {/* Player Preview */}
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-300">
                      {widgetType === "player" ? "Player" : "Now Playing"} Preview
                    </h2>
                  </div>
                  <div
                    className="rounded-xl p-4 flex items-center justify-center"
                    style={{
                      background: theme === "dark" ? "repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 0 0 / 16px 16px" : "repeating-conic-gradient(#f3f3f3 0% 25%, #fff 0% 50%) 0 0 / 16px 16px",
                      minHeight: iframeHeight + 40,
                    }}
                  >
                    <iframe
                      key={previewKey}
                      src={embedUrl}
                      width={iframeWidth}
                      height={iframeHeight}
                      frameBorder="0"
                      allow="autoplay"
                      style={{ border: "none", borderRadius: 12, maxWidth: "100%" }}
                      title="Widget preview"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-3 text-center">
                    Live preview — {widgetType === "player" ? "click play to test audio" : "updates every 10 seconds"}
                  </p>
                </div>

                {/* Other widget preview */}
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-300">
                      {widgetType === "player" ? "Now Playing" : "Player"} Widget
                    </h2>
                    <span className="text-xs text-zinc-400">(alternate)</span>
                  </div>
                  <div
                    className="rounded-xl p-4 flex items-center justify-center"
                    style={{
                      background: theme === "dark" ? "repeating-conic-gradient(#1a1a1a 0% 25%, #222 0% 50%) 0 0 / 16px 16px" : "repeating-conic-gradient(#f3f3f3 0% 25%, #fff 0% 50%) 0 0 / 16px 16px",
                      minHeight: (widgetType === "player" ? NOW_PLAYING_HEIGHT : PLAYER_HEIGHT) + 40,
                    }}
                  >
                    <iframe
                      key={previewKey + 1000}
                      src={`${baseUrl}${widgetType === "player" ? "/embed/now-playing" : "/embed/player"}?${params.toString()}`}
                      width={iframeWidth}
                      height={widgetType === "player" ? NOW_PLAYING_HEIGHT : PLAYER_HEIGHT}
                      frameBorder="0"
                      allow="autoplay"
                      style={{ border: "none", borderRadius: 12, maxWidth: "100%" }}
                      title="Alternate widget preview"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-3 text-center">
                    Switch widget type above to get this embed code
                  </p>
                </div>

                {/* Quick Tips */}
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                  <h3 className="text-sm font-semibold text-amber-800 mb-3">Embedding Tips</h3>
                  <ul className="text-xs text-amber-700 space-y-2">
                    <li className="flex gap-2">
                      <span className="text-amber-400 mt-0.5">1.</span>
                      <span>The player widget includes audio controls. The now-playing widget is display-only.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400 mt-0.5">2.</span>
                      <span>Customize colors to match your website&apos;s brand. Use the color picker for exact hex values.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400 mt-0.5">3.</span>
                      <span>The widget auto-updates now-playing info every {widgetType === "player" ? "15" : "10"} seconds.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400 mt-0.5">4.</span>
                      <span>For WordPress, paste the code into a Custom HTML block. For Shopify, use a Custom Liquid section.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
