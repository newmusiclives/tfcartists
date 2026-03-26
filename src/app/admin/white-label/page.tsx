"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Palette,
  Image,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface WhiteLabelSettings {
  id?: string;
  name?: string;
  customDomain: string | null;
  customLogo: string | null;
  customFavicon: string | null;
  customColors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
  } | null;
  customFooterText: string | null;
  whiteLabel: boolean;
}

const DEFAULT_COLORS = {
  primary: "#78350f",
  secondary: "#f59e0b",
  accent: "#d97706",
  background: "#fffbeb",
};

const NETLIFY_DOMAIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ||
  "truefans-radio.netlify.app";

export default function WhiteLabelPage() {
  const [settings, setSettings] = useState<WhiteLabelSettings>({
    customDomain: null,
    customLogo: null,
    customFavicon: null,
    customColors: null,
    customFooterText: null,
    whiteLabel: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedDns, setCopiedDns] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/white-label");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load white-label settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/white-label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDomain: settings.customDomain || "",
          customLogo: settings.customLogo,
          customFavicon: settings.customFavicon,
          customColors: settings.customColors,
          customFooterText: settings.customFooterText,
          whiteLabel: settings.whiteLabel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess("White-label settings saved successfully!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateColor = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      customColors: {
        ...DEFAULT_COLORS,
        ...prev.customColors,
        [key]: value,
      },
    }));
  };

  const copyDnsInstructions = () => {
    const text = `CNAME ${settings.customDomain || "radio.yourbrand.com"} -> ${NETLIFY_DOMAIN}`;
    navigator.clipboard.writeText(text);
    setCopiedDns(true);
    setTimeout(() => setCopiedDns(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <SharedNav />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      </div>
    );
  }

  const colors = {
    ...DEFAULT_COLORS,
    ...settings.customColors,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <SharedNav />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/admin"
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-amber-800" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-amber-900">
              White-Label Settings
            </h1>
            <p className="text-amber-700 text-sm">
              Customize your station&apos;s branding and use your own domain
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Custom Domain Section */}
          <section className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Custom Domain
                </h2>
                <p className="text-sm text-gray-500">
                  Use your own domain for your radio station
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain
                </label>
                <input
                  type="text"
                  placeholder="radio.yourbrand.com"
                  value={settings.customDomain || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      customDomain: e.target.value || null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Leave empty to use the default platform domain
                </p>
              </div>

              {/* DNS Instructions */}
              {settings.customDomain && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    DNS Setup Instructions
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Add the following CNAME record in your domain&apos;s DNS
                    settings:
                  </p>
                  <div className="bg-white rounded-md p-3 font-mono text-sm border border-blue-100 flex items-center justify-between">
                    <div>
                      <div className="text-gray-500">
                        <span className="text-blue-600 font-semibold">
                          Type:
                        </span>{" "}
                        CNAME
                      </div>
                      <div className="text-gray-500">
                        <span className="text-blue-600 font-semibold">
                          Name:
                        </span>{" "}
                        {settings.customDomain}
                      </div>
                      <div className="text-gray-500">
                        <span className="text-blue-600 font-semibold">
                          Value:
                        </span>{" "}
                        {NETLIFY_DOMAIN}
                      </div>
                    </div>
                    <button
                      onClick={copyDnsInstructions}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Copy DNS record"
                    >
                      {copiedDns ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-blue-500" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-blue-600">
                      1. Log in to your domain registrar (GoDaddy, Cloudflare,
                      Namecheap, etc.)
                    </p>
                    <p className="text-xs text-blue-600">
                      2. Go to DNS settings for your domain
                    </p>
                    <p className="text-xs text-blue-600">
                      3. Add a CNAME record pointing to{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        {NETLIFY_DOMAIN}
                      </code>
                    </p>
                    <p className="text-xs text-blue-600">
                      4. Wait for DNS propagation (usually 5-30 minutes, up to 48
                      hours)
                    </p>
                    <p className="text-xs text-blue-600">
                      5. SSL certificate will be automatically provisioned by
                      Netlify
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Logo & Favicon Section */}
          <section className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Image className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Logo & Favicon
                </h2>
                <p className="text-sm text-gray-500">
                  Upload your brand assets
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  placeholder="https://cdn.yourbrand.com/logo.png"
                  value={settings.customLogo || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      customLogo: e.target.value || null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Recommended: 400x100px PNG or SVG with transparent background
                </p>
                {settings.customLogo && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <img
                      src={settings.customLogo}
                      alt="Logo preview"
                      className="max-h-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Favicon URL
                </label>
                <input
                  type="url"
                  placeholder="https://cdn.yourbrand.com/favicon.ico"
                  value={settings.customFavicon || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      customFavicon: e.target.value || null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Recommended: 32x32px or 64x64px ICO/PNG
                </p>
                {settings.customFavicon && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                    <img
                      src={settings.customFavicon}
                      alt="Favicon preview"
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span className="text-xs text-gray-500">Preview</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Brand Colors Section */}
          <section className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Palette className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Brand Colors
                </h2>
                <p className="text-sm text-gray-500">
                  Customize the color palette for your station
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  key: "primary",
                  label: "Primary",
                  desc: "Buttons, links, headers",
                },
                {
                  key: "secondary",
                  label: "Secondary",
                  desc: "Accents, highlights",
                },
                { key: "accent", label: "Accent", desc: "Hover states, badges" },
                {
                  key: "background",
                  label: "Background",
                  desc: "Page background tint",
                },
              ].map(({ key, label, desc }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors[key as keyof typeof colors] || DEFAULT_COLORS[key as keyof typeof DEFAULT_COLORS]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colors[key as keyof typeof colors] || ""}
                      onChange={(e) => updateColor(key, e.target.value)}
                      placeholder={DEFAULT_COLORS[key as keyof typeof DEFAULT_COLORS]}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{desc}</p>
                </div>
              ))}
            </div>

            {/* Color Preview */}
            <div className="mt-6 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Preview
              </h3>
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: colors.background }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <span
                    className="font-bold"
                    style={{ color: colors.primary }}
                  >
                    {settings.name || "Your Station Name"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-1.5 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-1.5 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    Secondary
                  </button>
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: colors.accent }}
                  >
                    Badge
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer & White-Label Toggle */}
          <section className="bg-white rounded-xl shadow-sm border border-amber-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                {settings.whiteLabel ? (
                  <EyeOff className="w-5 h-5 text-green-600" />
                ) : (
                  <Eye className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  White-Label Mode
                </h2>
                <p className="text-sm text-gray-500">
                  Control platform branding visibility
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Hide &quot;Powered by TrueFans&quot;
                  </p>
                  <p className="text-sm text-gray-500">
                    When enabled, all TrueFans platform branding is removed from
                    your station
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      whiteLabel: !prev.whiteLabel,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.whiteLabel ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.whiteLabel ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Custom footer text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Footer Text
                </label>
                <input
                  type="text"
                  placeholder="Powered by Your Brand"
                  value={settings.customFooterText || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      customFooterText: e.target.value || null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {settings.whiteLabel
                    ? "This text replaces the default footer attribution"
                    : 'Enable white-label mode above to customize the footer text'}
                </p>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={loadSettings}
              disabled={saving}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
