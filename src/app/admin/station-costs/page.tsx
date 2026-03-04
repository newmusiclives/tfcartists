"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Zap,
  BarChart3,
  Settings,
  Users,
  Building2,
  ChevronRight,
  Mic,
  MessageSquare,
  Server,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

// --- Cost constants ---
const TTS_HD_RATE = 0.03; // per 1K chars
const TTS_STD_RATE = 0.015;
const CHAT_INPUT_RATE = 0.15 / 1_000_000; // per token
const CHAT_OUTPUT_RATE = 0.6 / 1_000_000;
const SMS_RATE = 0.02; // avg per text
const RAILWAY_COST = 5;
const INFRA_COST = 0;

const VOICE_TRACK_CHARS = 300;
const TRANSITION_CHARS = 500;
const FEATURE_CHARS = 400;
const IMAGING_CHARS = 200;
const SPONSOR_AD_CHARS = 400;

const TRANSITIONS_PER_DAY = 16;
const FEATURES_PER_DAY = 20;
const IMAGING_PER_DAY = 30;

const DJ_SCRIPT_TOKENS = 2000;
const FEATURE_CONTENT_TOKENS = 3000;
const OUTREACH_TOKENS = 2000;
const IMAGING_SCRIPT_TOKENS = 1500;

// --- Revenue tiers ---
const ARTIST_TIERS = [
  { name: "Free", price: 0 },
  { name: "Tier 5", price: 5 },
  { name: "Tier 20", price: 20 },
  { name: "Tier 50", price: 50 },
  { name: "Tier 120", price: 120 },
];

const SPONSOR_TIERS = [
  { name: "Bronze", price: 100 },
  { name: "Silver", price: 250 },
  { name: "Gold", price: 500 },
  { name: "Platinum", price: 1000 },
];

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-900 font-semibold">
          {value}{unit && ` ${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function Toggle({
  label,
  enabled,
  onToggle,
  savings,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  savings?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        {enabled ? (
          <ToggleRight className="w-6 h-6 text-green-600" />
        ) : (
          <ToggleLeft className="w-6 h-6 text-gray-400" />
        )}
        <span className={`text-sm font-medium ${enabled ? "text-gray-900" : "text-gray-500"}`}>
          {label}
        </span>
      </div>
      {savings && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {savings}
        </span>
      )}
    </button>
  );
}

function CostRow({ label, amount, icon }: { label: string; amount: number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900">${fmt(amount)}</span>
    </div>
  );
}

export default function StationCostsPage() {
  // --- Adjustable inputs ---
  const [numDJs, setNumDJs] = useState(4);
  const [tracksPerHour, setTracksPerHour] = useState(3);
  const [liveHours, setLiveHours] = useState(12);
  const [useHDTTS, setUseHDTTS] = useState(true);
  const [smsPerDay, setSmsPerDay] = useState(50);
  const [sponsorAdsPerDay, setSponsorAdsPerDay] = useState(5);

  // --- Optimization toggles ---
  const [optStdTTS, setOptStdTTS] = useState(false);
  const [optReduceTracks, setOptReduceTracks] = useState(false);
  const [optGeminiTTS, setOptGeminiTTS] = useState(false);
  const [optSkipFeatures, setOptSkipFeatures] = useState(false);

  // --- Calculate costs ---
  const costs = useMemo(() => {
    const ttsRate = optStdTTS || !useHDTTS ? TTS_STD_RATE : TTS_HD_RATE;
    const effectiveTracks = optReduceTracks ? Math.min(tracksPerHour, 2) : tracksPerHour;

    // TTS costs
    const voiceTracksPerDay = numDJs * effectiveTracks * liveHours;
    const voiceTrackMonthly = (voiceTracksPerDay * VOICE_TRACK_CHARS / 1000) * ttsRate * 30;

    const transitionMonthly = optGeminiTTS
      ? 0
      : (TRANSITIONS_PER_DAY * TRANSITION_CHARS / 1000) * ttsRate * 30;

    const featureMonthly = optSkipFeatures
      ? 0
      : (FEATURES_PER_DAY * FEATURE_CHARS / 1000) * ttsRate * 30;

    const imagingMonthly = optGeminiTTS
      ? 0
      : (IMAGING_PER_DAY * IMAGING_CHARS / 1000) * ttsRate * 30;

    const sponsorAdMonthly = (sponsorAdsPerDay * SPONSOR_AD_CHARS / 1000) * ttsRate * 30;

    const ttsTotal = voiceTrackMonthly + transitionMonthly + featureMonthly + imagingMonthly + sponsorAdMonthly;

    // Chat/AI costs
    const djScriptCalls = numDJs * effectiveTracks * liveHours;
    const djScriptMonthly = djScriptCalls * DJ_SCRIPT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;
    const featureContentMonthly = FEATURES_PER_DAY * FEATURE_CONTENT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;
    const outreachMonthly = 30 * OUTREACH_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;
    const imagingScriptMonthly = 10 * IMAGING_SCRIPT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;
    const chatTotal = djScriptMonthly + featureContentMonthly + outreachMonthly + imagingScriptMonthly;

    // GHL
    const smsMonthly = smsPerDay * SMS_RATE * 30;
    const emailMonthly = 0.50; // negligible
    const ghlTotal = smsMonthly + emailMonthly;

    const total = ttsTotal + chatTotal + ghlTotal + RAILWAY_COST + INFRA_COST;

    return {
      voiceTrackMonthly,
      transitionMonthly,
      featureMonthly,
      imagingMonthly,
      sponsorAdMonthly,
      ttsTotal,
      djScriptMonthly,
      featureContentMonthly,
      outreachMonthly,
      imagingScriptMonthly,
      chatTotal,
      smsMonthly,
      emailMonthly,
      ghlTotal,
      railway: RAILWAY_COST,
      infra: INFRA_COST,
      total,
    };
  }, [numDJs, tracksPerHour, liveHours, useHDTTS, smsPerDay, sponsorAdsPerDay, optStdTTS, optReduceTracks, optGeminiTTS, optSkipFeatures]);

  // --- Optimized vs full cost ---
  const fullCosts = useMemo(() => {
    const ttsRate = useHDTTS ? TTS_HD_RATE : TTS_STD_RATE;
    const voiceTracksPerDay = numDJs * tracksPerHour * liveHours;
    const ttsTotal =
      (voiceTracksPerDay * VOICE_TRACK_CHARS / 1000) * ttsRate * 30 +
      (TRANSITIONS_PER_DAY * TRANSITION_CHARS / 1000) * ttsRate * 30 +
      (FEATURES_PER_DAY * FEATURE_CHARS / 1000) * ttsRate * 30 +
      (IMAGING_PER_DAY * IMAGING_CHARS / 1000) * ttsRate * 30 +
      (sponsorAdsPerDay * SPONSOR_AD_CHARS / 1000) * ttsRate * 30;

    const djScriptCalls = numDJs * tracksPerHour * liveHours;
    const chatTotal =
      djScriptCalls * DJ_SCRIPT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30 +
      FEATURES_PER_DAY * FEATURE_CONTENT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30 +
      30 * OUTREACH_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30 +
      10 * IMAGING_SCRIPT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;

    const ghlTotal = smsPerDay * SMS_RATE * 30 + 0.50;
    return ttsTotal + chatTotal + ghlTotal + RAILWAY_COST;
  }, [numDJs, tracksPerHour, liveHours, useHDTTS, smsPerDay, sponsorAdsPerDay]);

  const savings = fullCosts - costs.total;
  const hasOptimizations = optStdTTS || optReduceTracks || optGeminiTTS || optSkipFeatures;

  // --- Pricing margins ---
  const pricePoints = [149, 199, 299];

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/admin" className="hover:text-indigo-600">Admin</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Station Costs</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Calculator className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Station Cost Calculator</h1>
            <p className="text-gray-500 text-sm">Interactive per-station operating cost estimator</p>
          </div>
        </div>

        {/* Main Grid: Inputs + Costs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left: Adjustable Inputs */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Station Configuration
            </h2>

            <Slider label="Number of DJs" value={numDJs} min={1} max={12} onChange={setNumDJs} />
            <Slider label="Voice Tracks per Hour" value={tracksPerHour} min={1} max={4} onChange={setTracksPerHour} />
            <Slider label="Live Hours per Day" value={liveHours} min={6} max={24} onChange={setLiveHours} unit="hrs" />
            <Slider label="SMS Messages per Day" value={smsPerDay} min={0} max={200} step={10} onChange={setSmsPerDay} />
            <Slider label="Sponsor Ads per Day" value={sponsorAdsPerDay} min={0} max={30} onChange={setSponsorAdsPerDay} />

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">TTS Model</span>
                <button
                  onClick={() => setUseHDTTS(!useHDTTS)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    useHDTTS
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {useHDTTS ? "tts-1-hd ($0.030/1K)" : "tts-1 ($0.015/1K)"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Cost Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              Monthly Cost Breakdown
            </h2>

            {/* TTS Section */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">TTS Audio</p>
              <CostRow label="Voice Tracks" amount={costs.voiceTrackMonthly} icon={<Mic className="w-4 h-4 text-indigo-400" />} />
              <CostRow label="Transitions / Handoffs" amount={costs.transitionMonthly} />
              <CostRow label="Features (trivia, weather)" amount={costs.featureMonthly} />
              <CostRow label="Station Imaging" amount={costs.imagingMonthly} />
              <CostRow label="Sponsor Ads" amount={costs.sponsorAdMonthly} />
            </div>

            {/* AI Chat Section */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">AI Chat (GPT-4o-mini)</p>
              <CostRow label="DJ Script Generation" amount={costs.djScriptMonthly} />
              <CostRow label="Feature Content" amount={costs.featureContentMonthly} />
              <CostRow label="Outreach Messages" amount={costs.outreachMonthly} />
              <CostRow label="Imaging Scripts" amount={costs.imagingScriptMonthly} />
            </div>

            {/* Other */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Other</p>
              <CostRow label="GHL SMS" amount={costs.smsMonthly} icon={<MessageSquare className="w-4 h-4 text-blue-400" />} />
              <CostRow label="GHL Email" amount={costs.emailMonthly} />
              <CostRow label="Railway Backend" amount={costs.railway} icon={<Server className="w-4 h-4 text-gray-400" />} />
              <CostRow label="Infrastructure (free tiers)" amount={costs.infra} />
            </div>

            {/* Total */}
            <div className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between">
              <span className="text-lg font-bold text-indigo-900">Monthly Total</span>
              <span className="text-2xl font-bold text-indigo-600">${fmt(costs.total)}</span>
            </div>

            {hasOptimizations && savings > 0 && (
              <div className="mt-2 bg-green-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Savings from optimizations</span>
                <span className="text-lg font-bold text-green-600">-${fmt(savings)}/mo</span>
              </div>
            )}
          </div>
        </div>

        {/* Breakeven Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            Breakeven Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Artist Subscriptions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Artist Subscriptions to Cover Costs
              </h3>
              <div className="space-y-2">
                {ARTIST_TIERS.filter((t) => t.price > 0).map((tier) => {
                  const needed = Math.ceil(costs.total / tier.price);
                  return (
                    <div key={tier.name} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <span className="text-sm text-gray-600">{tier.name} (${tier.price}/mo)</span>
                      <span className="text-sm font-semibold text-gray-900">{needed} artists</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sponsor Deals */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Sponsor Deals to Cover Costs
              </h3>
              <div className="space-y-2">
                {SPONSOR_TIERS.map((tier) => {
                  const needed = Math.ceil(costs.total / tier.price);
                  return (
                    <div key={tier.name} className="flex items-center justify-between p-2 rounded bg-gray-50">
                      <span className="text-sm text-gray-600">{tier.name} (${tier.price}/mo)</span>
                      <span className="text-sm font-semibold text-gray-900">{needed} sponsor{needed !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mixed Scenarios */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Mixed Revenue Scenarios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { desc: "2 Gold artists + 1 Bronze sponsor", rev: 2 * 50 + 100 },
                { desc: "1 Tier 120 artist + 1 Bronze sponsor", rev: 120 + 100 },
                { desc: "4 Tier 20 artists + 1 Silver sponsor", rev: 4 * 20 + 250 },
                { desc: "1 Gold sponsor only", rev: 500 },
                { desc: "10 Tier 5 artists + 1 Bronze sponsor", rev: 10 * 5 + 100 },
                { desc: "2 Tier 50 artists + 2 Bronze sponsors", rev: 2 * 50 + 2 * 100 },
              ].map((scenario) => {
                const surplus = scenario.rev - costs.total;
                const positive = surplus >= 0;
                return (
                  <div key={scenario.desc} className="p-3 rounded-lg border bg-gray-50">
                    <p className="text-xs text-gray-600 mb-1">{scenario.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">${scenario.rev}/mo</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {positive ? "+" : ""}{fmt(surplus)}
                      </span>
                    </div>
                    {/* Mini bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full ${positive ? "bg-green-500" : "bg-red-400"}`}
                        style={{ width: `${Math.min((scenario.rev / costs.total) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cost Optimization Toggles */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gray-400" />
            Cost Optimizations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Toggle
              label="Use standard TTS (tts-1)"
              enabled={optStdTTS}
              onToggle={() => setOptStdTTS(!optStdTTS)}
              savings="Saves ~$30/mo"
            />
            <Toggle
              label="Reduce voice tracks to 2/hr"
              enabled={optReduceTracks}
              onToggle={() => setOptReduceTracks(!optReduceTracks)}
              savings="Saves ~$20/mo"
            />
            <Toggle
              label="Use Gemini TTS for imaging"
              enabled={optGeminiTTS}
              onToggle={() => setOptGeminiTTS(!optGeminiTTS)}
              savings="Saves ~$12/mo"
            />
            <Toggle
              label="Skip feature audio (text only)"
              enabled={optSkipFeatures}
              onToggle={() => setOptSkipFeatures(!optSkipFeatures)}
              savings="Saves ~$7/mo"
            />
          </div>

          <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
            <div>
              <p className="text-xs text-gray-500">Full Cost</p>
              <p className="text-lg font-bold text-gray-400 line-through">${fmt(fullCosts)}/mo</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
            <div>
              <p className="text-xs text-gray-500">Optimized Cost</p>
              <p className="text-lg font-bold text-indigo-600">${fmt(costs.total)}/mo</p>
            </div>
            {hasOptimizations && savings > 0 && (
              <div className="ml-auto">
                <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                  Save ${fmt(savings)}/mo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing for Operators */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Operator Pricing & Margins
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pricePoints.map((price) => {
              const margin = price - costs.total;
              const marginPct = (margin / price) * 100;
              const positive = margin >= 0;
              return (
                <div
                  key={price}
                  className={`p-5 rounded-xl border-2 text-center ${
                    price === 199
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {price === 199 && (
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Recommended</span>
                  )}
                  <p className="text-3xl font-bold text-gray-900 mt-1">${price}</p>
                  <p className="text-xs text-gray-500 mb-3">per station / month</p>
                  <div className={`text-lg font-bold ${positive ? "text-green-600" : "text-red-600"}`}>
                    {positive ? "+" : ""}${fmt(margin)}
                  </div>
                  <p className="text-xs text-gray-500">
                    margin ({marginPct.toFixed(0)}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Financials", href: "/admin/financials", icon: <DollarSign className="w-5 h-5" /> },
            { label: "Settings", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
            { label: "Artists", href: "/admin/artists", icon: <Users className="w-5 h-5" /> },
            { label: "Stream Status", href: "/admin/stream-status", icon: <BarChart3 className="w-5 h-5" /> },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 p-4 bg-white rounded-xl shadow-sm border hover:border-indigo-300 transition-colors"
            >
              <span className="text-gray-400">{link.icon}</span>
              <span className="text-sm font-medium text-gray-700">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
