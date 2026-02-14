"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Code, Radio, ExternalLink } from "lucide-react";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://truefans-radio.netlify.app";

type Size = "compact" | "card" | "full";

const SIZE_CONFIG: Record<Size, { width: number; height: number; label: string; description: string }> = {
  compact: { width: 320, height: 80, label: "Compact", description: "Horizontal bar with artwork - sidebars & footers" },
  card: { width: 320, height: 200, label: "Card", description: "Album art + track info + controls - blog posts & articles" },
  full: { width: 320, height: 440, label: "Full", description: "Full player matching the live station look - landing pages" },
};

export default function EmbedCodeGeneratorPage() {
  const [size, setSize] = useState<Size>("card");
  const [refCode, setRefCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-load ref code from localStorage if available
  useEffect(() => {
    const scoutRef = localStorage.getItem("scoutReferralCode");
    if (scoutRef) setRefCode(scoutRef);
  }, []);

  const config = SIZE_CONFIG[size];
  const embedUrl = `${BASE_URL}/embed/player?size=${size}${refCode ? `&ref=${refCode}` : ""}`;
  const snippet = `<iframe src="${embedUrl}" width="${config.width}" height="${config.height}" frameborder="0" allow="autoplay" style="border-radius:${size === "full" ? 20 : size === "card" ? 16 : 14}px;border:none;overflow:hidden;"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center space-x-2 text-amber-700 hover:text-amber-800 transition-colors">
              <Radio className="w-5 h-5" />
              <span className="font-bold">TrueFans RADIO</span>
            </a>
            <a href="/listen/register" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
              Listen Now <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-4">
            <Code className="w-7 h-7 text-amber-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Embed Player Widget</h1>
          <p className="mt-2 text-gray-600 max-w-lg mx-auto">
            Add a TrueFans RADIO player to your website. It shows live cover art, track details,
            DJ info, and listener count — just like the real player.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Configuration */}
          <div className="space-y-6">
            {/* Size selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Player Size</label>
              <div className="space-y-2">
                {(Object.entries(SIZE_CONFIG) as [Size, typeof config][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setSize(key)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      size === key
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-sm text-gray-900">{val.label} ({val.width} x {val.height})</div>
                    <div className="text-xs text-gray-500">{val.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Referral code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Referral Code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Include your scout/artist/sponsor referral code to earn rewards when people listen through your embed.
              </p>
              <input
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value.trim())}
                placeholder="e.g., SCOUT123"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
              />
            </div>

            {/* Embed code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Embed Code</label>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-300 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap break-all">
                  {snippet}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 mt-1 font-medium">Copied to clipboard!</p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Live Preview</label>
            <div className="bg-gray-800 rounded-2xl p-6 flex items-center justify-center" style={{ minHeight: Math.max(config.height + 48, 280) }}>
              <iframe
                key={size}
                src={embedUrl}
                width={config.width}
                height={config.height}
                frameBorder="0"
                allow="autoplay"
                style={{ borderRadius: size === "full" ? 20 : size === "card" ? 16 : 14, border: "none" }}
                title="Player preview"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Live preview — click play to test the audio stream with real cover art and track info.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
