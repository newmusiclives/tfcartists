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
  Info,
} from "lucide-react";

// --- TTS Provider Pricing ---
// OpenAI
const OPENAI_HD_RATE = 0.03; // per 1K chars
const OPENAI_STD_RATE = 0.015;
// Gemini
const GEMINI_RATE = 0.004; // per generation (flat)

// AI Chat costs
const CHAT_INPUT_RATE = 0.15 / 1_000_000; // per token
const CHAT_OUTPUT_RATE = 0.6 / 1_000_000;

// Other costs
const SMS_RATE = 0.02; // avg per text
const RAILWAY_COST = 5;
const INFRA_COST = 0;

// Character counts per audio type
const VOICE_TRACK_CHARS = 300;
const TRANSITION_CHARS = 500;
const FEATURE_CHARS = 400;
const IMAGING_CHARS = 200;
const SPONSOR_AD_CHARS = 400;

// Daily generation counts
const TRANSITIONS_PER_DAY = 16;
const FEATURES_PER_DAY = 20;
const IMAGING_PER_DAY = 30;

// Chat token counts per type
const DJ_SCRIPT_TOKENS = 2000;
const FEATURE_CONTENT_TOKENS = 3000;
const OUTREACH_TOKENS = 2000;
const IMAGING_SCRIPT_TOKENS = 1500;

// --- Revenue tiers ---
const ARTIST_TIERS = [
  { name: "Free", price: 0 },
  { name: "Bronze", price: 5 },
  { name: "Silver", price: 15 },
  { name: "Gold", price: 40 },
  { name: "Platinum", price: 100 },
];

const SPONSOR_TIERS = [
  { name: "Local Hero", price: 30 },
  { name: "Tier 1", price: 80 },
  { name: "Tier 2", price: 150 },
  { name: "Tier 3", price: 300 },
];

type TTSProvider = "openai-hd" | "openai-std" | "gemini";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
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

function CostRow({ label, amount, icon, highlight }: { label: string; amount: number; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 ${highlight ? "bg-amber-50 -mx-2 px-2 rounded" : ""}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${highlight ? "text-amber-700" : "text-gray-900"}`}>${fmt(amount)}</span>
    </div>
  );
}

export default function StationCostsPage() {
  // --- Adjustable inputs ---
  const [numDJs, setNumDJs] = useState(4);
  const [tracksPerHour, setTracksPerHour] = useState(3);
  const [liveHours, setLiveHours] = useState(12);
  const [ttsProvider, setTTSProvider] = useState<TTSProvider>("gemini");
  const [smsPerDay, setSmsPerDay] = useState(50);
  const [sponsorAdsPerDay, setSponsorAdsPerDay] = useState(5);

  // --- Optimization toggles ---
  const [optReduceTracks, setOptReduceTracks] = useState(false);
  const [optSkipFeatures, setOptSkipFeatures] = useState(false);
  const [optGeminiImaging, setOptGeminiImaging] = useState(false);

  // --- Calculate costs ---
  const costs = useMemo(() => {
    const effectiveTracks = optReduceTracks ? Math.min(tracksPerHour, 2) : tracksPerHour;

    // Calculate total character usage per month
    const voiceTracksPerDay = numDJs * effectiveTracks * liveHours;
    const voiceTrackCharsMonth = voiceTracksPerDay * VOICE_TRACK_CHARS * 30;
    const transitionCharsMonth = TRANSITIONS_PER_DAY * TRANSITION_CHARS * 30;
    const featureCharsMonth = optSkipFeatures ? 0 : FEATURES_PER_DAY * FEATURE_CHARS * 30;
    const imagingCharsMonth = optGeminiImaging ? 0 : IMAGING_PER_DAY * IMAGING_CHARS * 30;
    const sponsorAdCharsMonth = sponsorAdsPerDay * SPONSOR_AD_CHARS * 30;

    const totalCharsMonth = voiceTrackCharsMonth + transitionCharsMonth + featureCharsMonth + imagingCharsMonth + sponsorAdCharsMonth;

    // TTS costs depend on provider
    let voiceTrackMonthly = 0;
    let transitionMonthly = 0;
    let featureMonthly = 0;
    let imagingMonthly = 0;
    let sponsorAdMonthly = 0;
    if (ttsProvider === "gemini") {
      // Gemini charges per generation, not per character
      voiceTrackMonthly = voiceTracksPerDay * GEMINI_RATE * 30;
      transitionMonthly = TRANSITIONS_PER_DAY * GEMINI_RATE * 30;
      featureMonthly = optSkipFeatures ? 0 : FEATURES_PER_DAY * GEMINI_RATE * 30;
      imagingMonthly = IMAGING_PER_DAY * GEMINI_RATE * 30;
      sponsorAdMonthly = sponsorAdsPerDay * GEMINI_RATE * 30;
    } else {
      const ttsRate = ttsProvider === "openai-hd" ? OPENAI_HD_RATE : OPENAI_STD_RATE;
      voiceTrackMonthly = (voiceTrackCharsMonth / 1000) * ttsRate;
      transitionMonthly = (transitionCharsMonth / 1000) * ttsRate;
      featureMonthly = optSkipFeatures ? 0 : (featureCharsMonth / 1000) * ttsRate;
      imagingMonthly = optGeminiImaging ? 0 : (imagingCharsMonth / 1000) * ttsRate;
      sponsorAdMonthly = (sponsorAdCharsMonth / 1000) * ttsRate;
    }

    // For imaging with Gemini override (when using non-Gemini primary)
    if (optGeminiImaging && ttsProvider !== "gemini") {
      imagingMonthly = IMAGING_PER_DAY * GEMINI_RATE * 30;
    }

    const ttsTotal = voiceTrackMonthly + transitionMonthly + featureMonthly + imagingMonthly + sponsorAdMonthly;

    // Chat/AI costs (same regardless of TTS provider)
    const djScriptCalls = numDJs * effectiveTracks * liveHours;
    const djScriptMonthly = djScriptCalls * DJ_SCRIPT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;
    const featureContentMonthly = FEATURES_PER_DAY * FEATURE_CONTENT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;
    const outreachMonthly = 30 * OUTREACH_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;
    const imagingScriptMonthly = 10 * IMAGING_SCRIPT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;
    const chatTotal = djScriptMonthly + featureContentMonthly + outreachMonthly + imagingScriptMonthly;

    // GHL
    const smsMonthly = smsPerDay * SMS_RATE * 30;
    const emailMonthly = 0.50;
    const ghlTotal = smsMonthly + emailMonthly;

    const total = ttsTotal + chatTotal + ghlTotal + RAILWAY_COST + INFRA_COST;

    return {
      voiceTrackMonthly,
      transitionMonthly,
      featureMonthly,
      imagingMonthly,
      sponsorAdMonthly,
      ttsTotal,
      totalCharsMonth,
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
  }, [numDJs, tracksPerHour, liveHours, ttsProvider, smsPerDay, sponsorAdsPerDay, optReduceTracks, optSkipFeatures, optGeminiImaging]);

  // --- Compare against OpenAI baseline for savings display ---
  const baselineCost = useMemo(() => {
    const voiceTracksPerDay = numDJs * tracksPerHour * liveHours;
    const totalChars =
      (voiceTracksPerDay * VOICE_TRACK_CHARS +
        TRANSITIONS_PER_DAY * TRANSITION_CHARS +
        FEATURES_PER_DAY * FEATURE_CHARS +
        IMAGING_PER_DAY * IMAGING_CHARS +
        sponsorAdsPerDay * SPONSOR_AD_CHARS) * 30;
    const ttsTotal = (totalChars / 1000) * OPENAI_HD_RATE;

    const djScriptCalls = numDJs * tracksPerHour * liveHours;
    const chatTotal =
      djScriptCalls * DJ_SCRIPT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30 +
      FEATURES_PER_DAY * FEATURE_CONTENT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30 +
      30 * OUTREACH_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30 +
      10 * IMAGING_SCRIPT_TOKENS * (CHAT_INPUT_RATE + CHAT_OUTPUT_RATE) * 30;

    const ghlTotal = smsPerDay * SMS_RATE * 30 + 0.50;
    return ttsTotal + chatTotal + ghlTotal + RAILWAY_COST;
  }, [numDJs, tracksPerHour, liveHours, smsPerDay, sponsorAdsPerDay]);

  const costDiff = costs.total - baselineCost;

  // --- Operator plan pricing (Gemini TTS @ $0.004/gen keeps costs low) ---
  const operatorPlans = [
    { name: "Launch", price: 199, fee: 15, setup: 500 },
    { name: "Growth", price: 299, fee: 10, setup: 500, recommended: true },
    { name: "Scale", price: 449, fee: 7, setup: 1000 },
    { name: "Network", price: 899, fee: 5, setup: 0 },
  ];

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

        {/* TTS Provider Selector */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mic className="w-5 h-5 text-gray-400" />
            TTS Provider
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {([
              { id: "gemini" as TTSProvider, label: "Gemini", sub: "$0.004/gen", badge: "Active" },
              { id: "openai-hd" as TTSProvider, label: "OpenAI HD", sub: "$0.030/1K chars" },
              { id: "openai-std" as TTSProvider, label: "OpenAI Std", sub: "$0.015/1K chars" },
            ]).map((p) => (
              <button
                key={p.id}
                onClick={() => setTTSProvider(p.id)}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  ttsProvider === p.id
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">{p.label}</p>
                  {p.badge && ttsProvider === p.id && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">{p.badge}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{p.sub}</p>
              </button>
            ))}
          </div>

          {/* Gemini flat rate info */}
          {ttsProvider === "gemini" && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">Gemini TTS charges a flat <strong>$0.004 per generation</strong>, regardless of text length. No subscription or character quota required.</p>
            </div>
          )}
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

            {/* Quick stats */}
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Daily voice tracks</p>
                <p className="text-lg font-bold text-gray-900">{numDJs * (optReduceTracks ? Math.min(tracksPerHour, 2) : tracksPerHour) * liveHours}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Monthly chars (TTS)</p>
                <p className="text-lg font-bold text-gray-900">{fmtK(costs.totalCharsMonth)}</p>
              </div>
            </div>
          </div>

          {/* Right: Cost Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              Monthly Cost Breakdown
            </h2>

            {/* TTS Audio Breakdown */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                TTS Audio
              </p>
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

            {/* Cost comparison vs OpenAI HD baseline */}
            {ttsProvider === "gemini" && (
              <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-green-800">
                    <p className="font-semibold">
                      {costDiff > 0 ? `+$${fmt(costDiff)}/mo` : `-$${fmt(Math.abs(costDiff))}/mo`} vs OpenAI HD baseline
                    </p>
                    <p className="mt-0.5">
                      Gemini TTS provides high-quality AI voices at a flat $0.004/generation rate with no subscription required.
                    </p>
                  </div>
                </div>
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
                { desc: "3 Gold artists + 2 Tier 1 sponsors", rev: 3 * 40 + 2 * 80 },
                { desc: "2 Platinum artists + 1 Tier 2 sponsor", rev: 2 * 100 + 150 },
                { desc: "5 Silver artists + 1 Tier 3 sponsor", rev: 5 * 15 + 300 },
                { desc: "1 Tier 3 + 1 Tier 2 sponsors", rev: 300 + 150 },
                { desc: "10 Gold artists + 2 Local Hero sponsors", rev: 10 * 40 + 2 * 30 },
                { desc: "3 Platinum artists + 1 Tier 3 sponsor", rev: 3 * 100 + 300 },
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Toggle
              label="Reduce voice tracks to 2/hr"
              enabled={optReduceTracks}
              onToggle={() => setOptReduceTracks(!optReduceTracks)}
              savings="Fewer chars"
            />
            <Toggle
              label="Use Gemini for station imaging"
              enabled={optGeminiImaging}
              onToggle={() => setOptGeminiImaging(!optGeminiImaging)}
              savings="$0.004/gen"
            />
            <Toggle
              label="Skip feature audio (text only)"
              enabled={optSkipFeatures}
              onToggle={() => setOptSkipFeatures(!optSkipFeatures)}
              savings="Fewer chars"
            />
          </div>

          {ttsProvider === "gemini" && (
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
              <p className="text-sm font-medium text-indigo-900 mb-1">Gemini cost tip</p>
              <p className="text-xs text-indigo-700">
                Gemini charges $0.004 per generation regardless of text length. Reducing the number of
                generations (fewer voice tracks, skipping features) directly lowers your monthly cost.
              </p>
            </div>
          )}
        </div>

        {/* Pricing for Operators */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Operator Pricing & Margins
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Pricing reflects Gemini TTS at $0.004/generation flat rate, with no subscription overhead.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {operatorPlans.map((plan) => {
              const margin = plan.price - costs.total;
              const positive = margin >= 0;
              // Example: operator earns from artist subs + sponsor deals
              const exampleRevenue = 8000;
              const platformFee = exampleRevenue * (plan.fee / 100);
              const totalTfRevenue = plan.price + platformFee;
              return (
                <div
                  key={plan.name}
                  className={`p-5 rounded-xl border-2 text-center ${
                    plan.recommended
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {plan.recommended && (
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Recommended</span>
                  )}
                  <p className="text-xl font-bold text-gray-900 mt-1">{plan.name}</p>
                  <p className="text-3xl font-bold text-gray-900">${plan.price}</p>
                  <p className="text-xs text-gray-500 mb-2">per station / month</p>
                  <p className="text-xs text-gray-500">+ {plan.fee}% platform fee</p>
                  {plan.setup > 0 && (
                    <p className="text-xs text-gray-400">${plan.setup} one-time setup</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">TrueFans revenue at capacity</p>
                    <div className="text-lg font-bold text-green-600">
                      ${fmt(totalTfRevenue)}/mo
                    </div>
                    <p className="text-xs text-gray-400">
                      ${plan.price} sub + ${fmt(platformFee)} fee
                    </p>
                  </div>
                  <div className={`mt-2 text-sm font-semibold ${positive ? "text-green-600" : "text-red-600"}`}>
                    SaaS margin: {positive ? "+" : ""}${fmt(margin)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Margin analysis table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Plan</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Price</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Op. Cost</th>
                  <th className="text-right py-2 text-gray-500 font-medium">SaaS Margin</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Margin %</th>
                  <th className="text-right py-2 text-gray-500 font-medium">+ Platform Fee</th>
                </tr>
              </thead>
              <tbody>
                {operatorPlans.map((plan) => {
                  const margin = plan.price - costs.total;
                  const marginPct = (margin / plan.price) * 100;
                  const exFee = 8000 * (plan.fee / 100);
                  return (
                    <tr key={plan.name} className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-900">{plan.name}</td>
                      <td className="py-2 text-right text-gray-700">${plan.price}</td>
                      <td className="py-2 text-right text-gray-700">${fmt(costs.total)}</td>
                      <td className={`py-2 text-right font-semibold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {margin >= 0 ? "+" : ""}${fmt(margin)}
                      </td>
                      <td className={`py-2 text-right ${marginPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {marginPct.toFixed(0)}%
                      </td>
                      <td className="py-2 text-right text-gray-500">${fmt(exFee)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-1">Platform fee column assumes $8,000/mo operator revenue at capacity</p>
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
