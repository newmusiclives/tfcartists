"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CreditCard,
  Mail,
  Smartphone,
  Brain,
  Shield,
  Search,
  Clock,
  Database,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface SettingItem {
  key: string;
  category: string;
  label: string;
  encrypted: boolean;
  hasValue: boolean;
  source: "database" | "env" | "not_set";
  maskedValue: string;
  updatedAt: string | null;
}

interface CategoryConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  signupUrl?: string;
  signupLabel?: string;
  priority: "critical" | "high" | "medium" | "low";
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: "payments",
    name: "Manifest Financial",
    description: "Payment processing for artist subscriptions, sponsor billing, and artist payouts",
    icon: <CreditCard className="w-5 h-5" />,
    color: "green",
    priority: "critical",
  },
  {
    id: "database",
    name: "Database",
    description: "PostgreSQL connection for production data persistence",
    icon: <Database className="w-5 h-5" />,
    color: "amber",
    signupUrl: "https://neon.tech",
    signupLabel: "Get free PostgreSQL at Neon.tech",
    priority: "critical",
  },
  {
    id: "email",
    name: "Email (SendGrid)",
    description: "Transactional email for artist onboarding, earnings notifications, and sponsor communications",
    icon: <Mail className="w-5 h-5" />,
    color: "blue",
    signupUrl: "https://sendgrid.com",
    signupLabel: "Sign up at SendGrid (free tier: 100 emails/day)",
    priority: "high",
  },
  {
    id: "sms",
    name: "SMS (Twilio)",
    description: "Text messages for artist outreach, show reminders, and earnings alerts",
    icon: <Smartphone className="w-5 h-5" />,
    color: "purple",
    signupUrl: "https://twilio.com",
    signupLabel: "Sign up at Twilio (~$5/month)",
    priority: "high",
  },
  {
    id: "ai",
    name: "AI Providers",
    description: "OpenAI and/or Anthropic for Riley, Harper, Cassidy, and Elliot AI capabilities",
    icon: <Brain className="w-5 h-5" />,
    color: "indigo",
    priority: "high",
  },
  {
    id: "auth",
    name: "Authentication & Security",
    description: "Session secrets and team login passwords — change defaults before launch",
    icon: <Shield className="w-5 h-5" />,
    color: "red",
    priority: "critical",
  },
  {
    id: "automation",
    name: "Automation & Cron",
    description: "Automated daily outreach, follow-ups, and monthly revenue distribution",
    icon: <Clock className="w-5 h-5" />,
    color: "orange",
    priority: "medium",
  },
  {
    id: "discovery",
    name: "Discovery & Voice AI",
    description: "Social media APIs for artist discovery and Vapi for AI voice calls",
    icon: <Search className="w-5 h-5" />,
    color: "teal",
    priority: "low",
  },
  {
    id: "monitoring",
    name: "Monitoring & Performance",
    description: "Error tracking (Sentry) and rate limiting (Upstash Redis)",
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "gray",
    priority: "low",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700" },
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700" },
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  red:    { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  teal:   { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-700" },
  gray:   { bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-700" },
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showValues, setShowValues] = useState<Set<string>>(new Set());
  const [saveMessage, setSaveMessage] = useState<{ key: string; type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || []);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: editValue }),
      });
      if (res.ok) {
        setSaveMessage({ key, type: "success", text: "Saved" });
        setEditingKey(null);
        setEditValue("");
        await fetchSettings();
      } else {
        setSaveMessage({ key, type: "error", text: "Failed to save" });
      }
    } catch {
      setSaveMessage({ key, type: "error", text: "Network error" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValues((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const getSettingsForCategory = (categoryId: string) =>
    settings.filter((s) => s.category === categoryId);

  const getCategoryStatus = (categoryId: string) => {
    const catSettings = getSettingsForCategory(categoryId);
    if (catSettings.length === 0) return "empty";
    const configured = catSettings.filter((s) => s.hasValue).length;
    if (configured === catSettings.length) return "complete";
    if (configured > 0) return "partial";
    return "not_configured";
  };

  const totalConfigured = settings.filter((s) => s.hasValue).length;
  const totalSettings = settings.length;
  const overallPct = totalSettings > 0 ? Math.round((totalConfigured / totalSettings) * 100) : 0;

  const priorityLabel = (p: string) => {
    switch (p) {
      case "critical": return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">REQUIRED</span>;
      case "high": return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">RECOMMENDED</span>;
      case "medium": return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">HELPFUL</span>;
      case "low": return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">OPTIONAL</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/admin" className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Admin
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8 text-gray-300" />
                <h1 className="text-3xl font-bold">Service Connections</h1>
              </div>
              <p className="text-gray-400">
                Configure API keys and credentials for all platform services. Enter them when ready — the platform will use them automatically.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalConfigured}/{totalSettings}</div>
              <div className="text-gray-400 text-sm">configured</div>
              <div className="mt-2 w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Quick Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["critical", "high", "medium", "low"] as const).map((priority) => {
                const cats = CATEGORIES.filter((c) => c.priority === priority);
                const catIds = cats.map((c) => c.id);
                const catSettings = settings.filter((s) => catIds.includes(s.category));
                const configured = catSettings.filter((s) => s.hasValue).length;
                const total = catSettings.length;
                const allDone = total > 0 && configured === total;
                return (
                  <div key={priority} className={`rounded-xl p-4 border ${allDone ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-1">
                      {priorityLabel(priority)}
                      {allDone ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    </div>
                    <div className="text-xl font-bold text-gray-900 mt-2">{configured}/{total}</div>
                    <div className="text-xs text-gray-500">{cats.map((c) => c.name).join(", ")}</div>
                  </div>
                );
              })}
            </div>

            {/* Category Sections */}
            {CATEGORIES.map((cat) => {
              const catSettings = getSettingsForCategory(cat.id);
              const status = getCategoryStatus(cat.id);
              const colors = colorMap[cat.color];
              const configured = catSettings.filter((s) => s.hasValue).length;

              return (
                <section key={cat.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${status === "complete" ? "border-green-300" : colors.border}`}>
                  {/* Category Header */}
                  <div className={`px-6 py-4 ${colors.bg} border-b ${colors.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={colors.text}>{cat.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-900">{cat.name}</h2>
                            {priorityLabel(cat.priority)}
                            {status === "complete" && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Connected
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{cat.description}</p>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-700">{configured}/{catSettings.length}</div>
                    </div>
                    {cat.signupUrl && status !== "complete" && (
                      <a
                        href={cat.signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 text-sm mt-2 ${colors.text} hover:underline`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {cat.signupLabel}
                      </a>
                    )}
                  </div>

                  {/* Settings List */}
                  <div className="divide-y">
                    {catSettings.map((setting) => {
                      const isEditing = editingKey === setting.key;
                      const isShown = showValues.has(setting.key);
                      const msg = saveMessage?.key === setting.key ? saveMessage : null;

                      return (
                        <div key={setting.key} className="px-6 py-4">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 text-sm">{setting.label}</span>
                                {setting.hasValue ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                )}
                                {setting.source === "env" && setting.hasValue && (
                                  <span className="text-xs text-gray-400">(from .env)</span>
                                )}
                                {setting.source === "database" && (
                                  <span className="text-xs text-blue-500">(saved)</span>
                                )}
                                {msg && (
                                  <span className={`text-xs font-bold ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                                    {msg.text}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 font-mono mt-0.5">{setting.key}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              {setting.hasValue && !isEditing && (
                                <>
                                  {setting.encrypted && (
                                    <button onClick={() => toggleShowValue(setting.key)} className="text-gray-400 hover:text-gray-600 p-1">
                                      {isShown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                  )}
                                  <span className="text-sm text-gray-500 font-mono">
                                    {setting.encrypted && !isShown ? setting.maskedValue : setting.maskedValue}
                                  </span>
                                </>
                              )}

                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type={setting.encrypted ? "password" : "text"}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder={`Enter ${setting.label}`}
                                    className="border rounded-lg px-3 py-1.5 text-sm w-64 font-mono"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(setting.key); }}
                                  />
                                  <button
                                    onClick={() => handleSave(setting.key)}
                                    disabled={saving}
                                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save
                                  </button>
                                  <button
                                    onClick={() => { setEditingKey(null); setEditValue(""); }}
                                    className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1.5"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditingKey(setting.key); setEditValue(""); }}
                                  className={`text-sm px-3 py-1.5 rounded-lg font-medium ${
                                    setting.hasValue
                                      ? "text-gray-600 hover:bg-gray-100"
                                      : `${colors.text} ${colors.bg} hover:opacity-80`
                                  }`}
                                >
                                  {setting.hasValue ? "Update" : "Configure"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {/* Refresh */}
            <div className="text-center pt-4">
              <button
                onClick={() => { setLoading(true); fetchSettings(); }}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh connection status
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
