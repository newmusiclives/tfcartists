"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Copy,
  Check,
  Code,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Palette,
  Settings2,
  Layout,
} from "lucide-react";
import Link from "next/link";

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";

type Size = "compact" | "standard" | "full";
type Theme = "dark" | "light" | "custom";
type Shape = "rounded" | "square";
type PreviewDevice = "desktop" | "tablet" | "mobile";
type Platform = "html" | "wordpress" | "shopify" | "javascript";

const SIZE_CONFIG: Record<Size, { width: number; height: number; label: string; description: string }> = {
  compact: { width: 350, height: 80, label: "Compact", description: "Play button + now playing text" },
  standard: { width: 350, height: 200, label: "Standard", description: "With album artwork and controls" },
  full: { width: 350, height: 440, label: "Full", description: "Artwork, playlist, and full controls" },
};

const DEVICE_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 800,
  tablet: 500,
  mobile: 350,
};

const COLOR_PRESETS = [
  { name: "Amber", primary: "#f59e0b", bg: "" },
  { name: "Blue", primary: "#3b82f6", bg: "" },
  { name: "Green", primary: "#10b981", bg: "" },
  { name: "Purple", primary: "#8b5cf6", bg: "" },
  { name: "Red", primary: "#ef4444", bg: "" },
  { name: "Pink", primary: "#ec4899", bg: "" },
  { name: "Teal", primary: "#14b8a6", bg: "" },
  { name: "Orange", primary: "#f97316", bg: "" },
];

function encodeColor(hex: string): string {
  return hex.replace("#", "");
}

export default function WidgetBuilderPage() {
  // Customization state
  const [theme, setTheme] = useState<Theme>("dark");
  const [size, setSize] = useState<Size>("standard");
  const [shape, setShape] = useState<Shape>("rounded");
  const [showArtwork, setShowArtwork] = useState(true);
  const [showNowPlaying, setShowNowPlaying] = useState(true);
  const [showListeners, setShowListeners] = useState(true);
  const [showStationName, setShowStationName] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#f59e0b");
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [customCss, setCustomCss] = useState("");
  const [refCode, setRefCode] = useState("");

  // UI state
  const [platform, setPlatform] = useState<Platform>("html");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "features" | "advanced">("design");

  useEffect(() => {
    const scoutRef = localStorage.getItem("scoutReferralCode");
    if (scoutRef) setRefCode(scoutRef);
  }, []);

  // Compute effective bg color based on theme
  const effectiveBg = theme === "light" ? "#ffffff" : theme === "custom" ? bgColor : "#1a1a2e";
  const effectiveTheme = theme === "custom" ? "dark" : theme;

  // Build embed URL with all parameters
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("theme", effectiveTheme);
    params.set("size", size);
    params.set("color", encodeColor(primaryColor));
    params.set("bg", encodeColor(effectiveBg));
    if (!showArtwork) params.set("artwork", "0");
    if (!showNowPlaying) params.set("nowplaying", "0");
    if (!showListeners) params.set("listeners", "0");
    if (!showStationName) params.set("station", "0");
    if (!showVolume) params.set("volume", "0");
    if (shape === "square") params.set("rounded", "0");
    if (autoplay) params.set("autoplay", "1");
    if (refCode) params.set("ref", refCode);
    if (customCss) params.set("css", encodeURIComponent(customCss));
    return `${BASE_URL}/embed/player?${params.toString()}`;
  }, [effectiveTheme, size, primaryColor, effectiveBg, showArtwork, showNowPlaying, showListeners, showStationName, showVolume, shape, autoplay, refCode, customCss]);

  const config = SIZE_CONFIG[size];
  const borderRadius = shape === "rounded" ? (size === "full" ? 20 : size === "standard" ? 16 : 14) : 0;

  // Generate embed code snippets
  const iframeHtml = `<iframe src="${embedUrl}" width="${config.width}" height="${config.height}" frameborder="0" allow="autoplay" style="border-radius:${borderRadius}px;border:none;overflow:hidden;" title="TrueFans RADIO Player"></iframe>`;
  const attribution = `<p style="font-size:11px;text-align:center;margin:4px 0;"><a href="${BASE_URL}" target="_blank" rel="noopener" style="color:#999;text-decoration:none;">Powered by TrueFans RADIO</a></p>`;

  const jsSnippetConfig = {
    theme: effectiveTheme,
    size,
    primaryColor,
    bgColor: effectiveBg,
    showArtwork,
    showNowPlaying,
    showListeners,
    showStationName,
    showVolume,
    rounded: shape === "rounded",
    autoplay,
    ...(refCode ? { ref: refCode } : {}),
    ...(customCss ? { customCss } : {}),
  };

  const snippets: Record<Platform, string> = {
    html: `${iframeHtml}\n${attribution}`,
    wordpress: `<!-- TrueFans RADIO Player Widget -->\n<div style="max-width:${config.width}px;margin:0 auto;">\n${iframeHtml}\n${attribution}\n</div>\n<!-- /TrueFans RADIO -->`,
    shopify: `<!-- Paste in a Custom Liquid block -->\n<div style="max-width:${config.width}px;margin:20px auto;">\n${iframeHtml}\n${attribution}\n</div>`,
    javascript: `<div id="truefans-player"></div>\n<script src="${BASE_URL}/api/embed/widget.js"></script>\n<script>\nTrueFansRadio.init({\n  container: '#truefans-player',\n  ${Object.entries(jsSnippetConfig)
      .map(([k, v]) => `${k}: ${typeof v === "string" ? `'${v}'` : v}`)
      .join(",\n  ")}\n});\n</script>`,
  };

  const snippet = snippets[platform];

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Iframe key to force re-render when URL changes
  const iframeKey = embedUrl;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center space-x-2 text-amber-500 hover:text-amber-400 transition-colors">
                <img src="/logos/ncr-logo.png" alt="NCR" className="h-7 w-auto object-contain" />
                <span className="font-bold text-sm">TrueFans RADIO</span>
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-sm text-gray-400 flex items-center gap-1.5">
                <Code className="w-4 h-4" />
                Widget Builder
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/station-admin"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Station Admin
              </Link>
              <Link
                href="/embed"
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
              >
                Simple Builder <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Left panel: Configuration */}
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-500" />
              Widget Builder
            </h1>
            <p className="text-sm text-gray-400">
              Customize your embeddable player and grab the code to put on any website.
            </p>

            {/* Tabs */}
            <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
              {([
                { key: "design" as const, label: "Design", icon: Palette },
                { key: "features" as const, label: "Features", icon: Settings2 },
                { key: "advanced" as const, label: "Advanced", icon: Code },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    activeTab === key
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Design Tab */}
            {activeTab === "design" && (
              <div className="space-y-5">
                {/* Theme */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["dark", "light", "custom"] as Theme[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium capitalize transition-all ${
                          theme === t
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-gray-700 text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Size</label>
                  <div className="space-y-2">
                    {(Object.entries(SIZE_CONFIG) as [Size, typeof config][]).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setSize(key)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                          size === key
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div className="font-medium text-xs text-gray-200">{val.label} <span className="text-gray-500">({val.width}x{val.height})</span></div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{val.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Corners</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["rounded", "square"] as Shape[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setShape(s)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium capitalize transition-all ${
                          shape === s
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-gray-700 text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Color */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Accent Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.primary}
                        onClick={() => setPrimaryColor(c.primary)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          primaryColor === c.primary
                            ? "border-white scale-110"
                            : "border-gray-600 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: c.primary }}
                        title={c.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-7 h-7 rounded-full cursor-pointer border border-gray-600 bg-transparent"
                      title="Custom color"
                    />
                  </div>
                </div>

                {/* Background Color (custom theme only) */}
                {theme === "custom" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Background Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border border-gray-600 bg-transparent"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono"
                        placeholder="#1a1a2e"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Features Tab */}
            {activeTab === "features" && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Show / Hide Elements</label>
                {[
                  { label: "Album Artwork", value: showArtwork, setter: setShowArtwork },
                  { label: "Now Playing Text", value: showNowPlaying, setter: setShowNowPlaying },
                  { label: "Listener Count", value: showListeners, setter: setShowListeners },
                  { label: "Station Name", value: showStationName, setter: setShowStationName },
                  { label: "Volume Control", value: showVolume, setter: setShowVolume },
                ].map((item) => (
                  <label
                    key={item.label}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                  >
                    <span className="text-sm text-gray-300">{item.label}</span>
                    <button
                      onClick={() => item.setter(!item.value)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        item.value ? "bg-amber-500" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          item.value ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </label>
                ))}

                <div className="pt-2">
                  <label className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
                    <div>
                      <span className="text-sm text-gray-300">Auto-play</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">May be blocked by browsers</p>
                    </div>
                    <button
                      onClick={() => setAutoplay(!autoplay)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        autoplay ? "bg-amber-500" : "bg-gray-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          autoplay ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </label>
                </div>

                {/* Referral code */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-wide">
                    Referral Code
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Earn rewards when listeners play through your embed
                  </p>
                  <input
                    type="text"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.trim())}
                    placeholder="e.g., SCOUT123"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === "advanced" && (
              <div className="space-y-4">
                {/* Custom CSS */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Custom CSS Override</label>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Injected into the embed iframe. Use with caution.
                  </p>
                  <textarea
                    value={customCss}
                    onChange={(e) => setCustomCss(e.target.value)}
                    placeholder={`.embed-player {\n  /* your styles */\n}`}
                    rows={5}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono outline-none focus:border-amber-500 resize-y transition-colors"
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Output Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ["html", "HTML"],
                      ["wordpress", "WordPress"],
                      ["shopify", "Shopify"],
                      ["javascript", "JavaScript"],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setPlatform(key)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          platform === key
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-gray-700 text-gray-400 hover:border-gray-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {platform === "javascript" && (
                    <p className="text-[11px] text-gray-500 mt-2">
                      The JS widget auto-creates an iframe with your settings. Supports TrueFansRadio.init() API.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Preview + Code */}
          <div className="space-y-4">
            {/* Device preview selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-400">Live Preview</span>
              </div>
              <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
                {([
                  { key: "desktop" as const, icon: Monitor },
                  { key: "tablet" as const, icon: Tablet },
                  { key: "mobile" as const, icon: Smartphone },
                ]).map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPreviewDevice(key)}
                    className={`p-2 rounded-md transition-all ${
                      previewDevice === key
                        ? "bg-gray-700 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                    title={key.charAt(0).toUpperCase() + key.slice(1)}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview area */}
            <div
              className="bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center transition-all"
              style={{ minHeight: Math.max(config.height + 80, 300), padding: 24 }}
            >
              <div
                className="transition-all duration-300"
                style={{
                  width: Math.min(DEVICE_WIDTHS[previewDevice], config.width),
                  maxWidth: "100%",
                }}
              >
                <iframe
                  key={iframeKey}
                  src={embedUrl}
                  width={config.width}
                  height={config.height}
                  frameBorder="0"
                  allow="autoplay"
                  style={{
                    borderRadius,
                    border: "none",
                    width: "100%",
                    maxWidth: config.width,
                    height: config.height,
                  }}
                  title="Player preview"
                />
              </div>
            </div>

            {/* Embed URL display */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Embed URL</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(embedUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Copy URL
                </button>
              </div>
              <p className="text-[11px] text-gray-500 font-mono break-all">{embedUrl}</p>
            </div>

            {/* Code output */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Embed Code ({platform === "javascript" ? "JS Widget" : platform.toUpperCase()})
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                {snippet}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
