"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Radio,
  Waves,
  Volume2,
  Gauge,
  SlidersHorizontal,
  Mic,
  Loader2,
  Save,
  Check,
} from "lucide-react";

interface ProductionSettings {
  id: string;
  name: string;
  streamUrl: string | null;
  backupStreamUrl: string | null;
  streamBitrate: number;
  streamFormat: string;
  crossfadeEnabled: boolean;
  crossfadeDuration: number;
  crossfadeStartNext: number;
  crossfadeFadeIn: number;
  crossfadeFadeOut: number;
  crossfadeCurve: string;
  normalizationEnabled: boolean;
  normalizationTarget: number;
  normalizationWindow: number;
  normalizationGainMax: number;
  normalizationGainMin: number;
  compressionEnabled: boolean;
  compressionAttack: number;
  compressionRelease: number;
  compressionRatio: number;
  compressionThreshold: number;
  compressionKnee: number;
  eqEnabled: boolean;
  eqLowFreq: number;
  eqLowGain: number;
  eqMidFreq: number;
  eqMidGain: number;
  eqHighFreq: number;
  eqHighGain: number;
  duckingEnabled: boolean;
  duckingAmount: number;
  duckingAttack: number;
  duckingRelease: number;
}

function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-600">{label}</label>
        <span className="text-sm font-mono font-medium text-gray-900">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

function SectionToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? "bg-amber-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          enabled ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export default function StreamEngineeringPage() {
  const [settings, setSettings] = useState<ProductionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stationId, setStationId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          setStationId(stations[0].id);
          return fetch(
            `/api/station-production?stationId=${stations[0].id}`
          ).then((r) => r.json());
        }
        return null;
      })
      .then((data) => {
        if (data?.production) setSettings(data.production);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (field: keyof ProductionSettings, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setSaved(false);
  };

  const save = async () => {
    if (!settings || !stationId) return;
    setSaving(true);
    try {
      const { id: _id, name: _name, ...fields } = settings;
      await fetch("/api/station-production", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId, ...fields }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SharedNav />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">
            No station found. Create a station first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <SlidersHorizontal className="w-8 h-8 text-amber-600" />
              Stream Engineering
            </h1>
            <p className="text-gray-600 mt-1">
              Production controls for {settings.name}
            </p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              saved
                ? "bg-green-600 text-white"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved" : "Save All"}
          </button>
        </div>

        <div className="space-y-6">
          {/* Stream Config */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <Radio className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Stream Configuration
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Stream URL
                </label>
                <input
                  type="text"
                  value={settings.streamUrl || ""}
                  onChange={(e) => update("streamUrl", e.target.value || null)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Backup Stream URL
                </label>
                <input
                  type="text"
                  value={settings.backupStreamUrl || ""}
                  onChange={(e) =>
                    update("backupStreamUrl", e.target.value || null)
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Bitrate (kbps)
                </label>
                <select
                  value={settings.streamBitrate}
                  onChange={(e) =>
                    update("streamBitrate", parseInt(e.target.value))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {[64, 96, 128, 192, 256, 320].map((b) => (
                    <option key={b} value={b}>
                      {b} kbps
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Format
                </label>
                <select
                  value={settings.streamFormat}
                  onChange={(e) => update("streamFormat", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {["mp3", "aac", "ogg", "flac"].map((f) => (
                    <option key={f} value={f}>
                      {f.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Crossfade */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Waves className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Crossfade
                </h2>
              </div>
              <SectionToggle
                enabled={settings.crossfadeEnabled}
                onChange={(v) => update("crossfadeEnabled", v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <RangeSlider
                label="Duration"
                value={settings.crossfadeDuration}
                min={0.5}
                max={10}
                step={0.5}
                unit="s"
                onChange={(v) => update("crossfadeDuration", v)}
                disabled={!settings.crossfadeEnabled}
              />
              <RangeSlider
                label="Start Next Before End"
                value={settings.crossfadeStartNext}
                min={0}
                max={8}
                step={0.5}
                unit="s"
                onChange={(v) => update("crossfadeStartNext", v)}
                disabled={!settings.crossfadeEnabled}
              />
              <RangeSlider
                label="Fade In"
                value={settings.crossfadeFadeIn}
                min={0.1}
                max={5}
                step={0.1}
                unit="s"
                onChange={(v) => update("crossfadeFadeIn", v)}
                disabled={!settings.crossfadeEnabled}
              />
              <RangeSlider
                label="Fade Out"
                value={settings.crossfadeFadeOut}
                min={0.1}
                max={5}
                step={0.1}
                unit="s"
                onChange={(v) => update("crossfadeFadeOut", v)}
                disabled={!settings.crossfadeEnabled}
              />
              <div className={!settings.crossfadeEnabled ? "opacity-50" : ""}>
                <label className="text-sm text-gray-600 block mb-1">
                  Curve Type
                </label>
                <select
                  value={settings.crossfadeCurve}
                  onChange={(e) => update("crossfadeCurve", e.target.value)}
                  disabled={!settings.crossfadeEnabled}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:cursor-not-allowed"
                >
                  <option value="equal_power">Equal Power</option>
                  <option value="linear">Linear</option>
                  <option value="logarithmic">Logarithmic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Normalization */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Audio Normalization
                </h2>
              </div>
              <SectionToggle
                enabled={settings.normalizationEnabled}
                onChange={(v) => update("normalizationEnabled", v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <RangeSlider
                label="Target Loudness"
                value={settings.normalizationTarget}
                min={-24}
                max={-6}
                step={0.5}
                unit=" LUFS"
                onChange={(v) => update("normalizationTarget", v)}
                disabled={!settings.normalizationEnabled}
              />
              <RangeSlider
                label="Window"
                value={settings.normalizationWindow}
                min={0.01}
                max={1}
                step={0.01}
                unit="s"
                onChange={(v) => update("normalizationWindow", v)}
                disabled={!settings.normalizationEnabled}
              />
              <RangeSlider
                label="Max Gain"
                value={settings.normalizationGainMax}
                min={0}
                max={20}
                step={0.5}
                unit=" dB"
                onChange={(v) => update("normalizationGainMax", v)}
                disabled={!settings.normalizationEnabled}
              />
              <RangeSlider
                label="Min Gain"
                value={settings.normalizationGainMin}
                min={-20}
                max={0}
                step={0.5}
                unit=" dB"
                onChange={(v) => update("normalizationGainMin", v)}
                disabled={!settings.normalizationEnabled}
              />
            </div>
          </div>

          {/* Compression */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Compression
                </h2>
              </div>
              <SectionToggle
                enabled={settings.compressionEnabled}
                onChange={(v) => update("compressionEnabled", v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <RangeSlider
                label="Attack"
                value={settings.compressionAttack}
                min={1}
                max={200}
                step={1}
                unit=" ms"
                onChange={(v) => update("compressionAttack", v)}
                disabled={!settings.compressionEnabled}
              />
              <RangeSlider
                label="Release"
                value={settings.compressionRelease}
                min={50}
                max={1000}
                step={10}
                unit=" ms"
                onChange={(v) => update("compressionRelease", v)}
                disabled={!settings.compressionEnabled}
              />
              <RangeSlider
                label="Ratio"
                value={settings.compressionRatio}
                min={1}
                max={20}
                step={0.5}
                unit=":1"
                onChange={(v) => update("compressionRatio", v)}
                disabled={!settings.compressionEnabled}
              />
              <RangeSlider
                label="Threshold"
                value={settings.compressionThreshold}
                min={-40}
                max={0}
                step={1}
                unit=" dB"
                onChange={(v) => update("compressionThreshold", v)}
                disabled={!settings.compressionEnabled}
              />
              <RangeSlider
                label="Knee"
                value={settings.compressionKnee}
                min={0}
                max={10}
                step={0.5}
                unit=" dB"
                onChange={(v) => update("compressionKnee", v)}
                disabled={!settings.compressionEnabled}
              />
            </div>
          </div>

          {/* EQ */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  3-Band EQ
                </h2>
              </div>
              <SectionToggle
                enabled={settings.eqEnabled}
                onChange={(v) => update("eqEnabled", v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Low */}
              <div
                className={`space-y-3 ${!settings.eqEnabled ? "opacity-50" : ""}`}
              >
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
                  Low
                </h3>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Frequency (Hz)
                  </label>
                  <input
                    type="number"
                    value={settings.eqLowFreq}
                    onChange={(e) =>
                      update("eqLowFreq", parseInt(e.target.value) || 100)
                    }
                    disabled={!settings.eqEnabled}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm disabled:cursor-not-allowed"
                  />
                </div>
                <RangeSlider
                  label="Gain"
                  value={settings.eqLowGain}
                  min={-12}
                  max={12}
                  step={0.5}
                  unit=" dB"
                  onChange={(v) => update("eqLowGain", v)}
                  disabled={!settings.eqEnabled}
                />
              </div>
              {/* Mid */}
              <div
                className={`space-y-3 ${!settings.eqEnabled ? "opacity-50" : ""}`}
              >
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
                  Mid
                </h3>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Frequency (Hz)
                  </label>
                  <input
                    type="number"
                    value={settings.eqMidFreq}
                    onChange={(e) =>
                      update("eqMidFreq", parseInt(e.target.value) || 1000)
                    }
                    disabled={!settings.eqEnabled}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm disabled:cursor-not-allowed"
                  />
                </div>
                <RangeSlider
                  label="Gain"
                  value={settings.eqMidGain}
                  min={-12}
                  max={12}
                  step={0.5}
                  unit=" dB"
                  onChange={(v) => update("eqMidGain", v)}
                  disabled={!settings.eqEnabled}
                />
              </div>
              {/* High */}
              <div
                className={`space-y-3 ${!settings.eqEnabled ? "opacity-50" : ""}`}
              >
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
                  High
                </h3>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Frequency (Hz)
                  </label>
                  <input
                    type="number"
                    value={settings.eqHighFreq}
                    onChange={(e) =>
                      update("eqHighFreq", parseInt(e.target.value) || 8000)
                    }
                    disabled={!settings.eqEnabled}
                    className="w-full border rounded-lg px-3 py-1.5 text-sm disabled:cursor-not-allowed"
                  />
                </div>
                <RangeSlider
                  label="Gain"
                  value={settings.eqHighGain}
                  min={-12}
                  max={12}
                  step={0.5}
                  unit=" dB"
                  onChange={(v) => update("eqHighGain", v)}
                  disabled={!settings.eqEnabled}
                />
              </div>
            </div>
          </div>

          {/* DJ Voice Ducking */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-rose-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  DJ Voice Ducking
                </h2>
              </div>
              <SectionToggle
                enabled={settings.duckingEnabled}
                onChange={(v) => update("duckingEnabled", v)}
              />
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Automatically lower music volume when the DJ speaks.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <RangeSlider
                label="Ducking Amount"
                value={settings.duckingAmount}
                min={-20}
                max={0}
                step={1}
                unit=" dB"
                onChange={(v) => update("duckingAmount", v)}
                disabled={!settings.duckingEnabled}
              />
              <RangeSlider
                label="Attack"
                value={settings.duckingAttack}
                min={10}
                max={500}
                step={10}
                unit=" ms"
                onChange={(v) => update("duckingAttack", v)}
                disabled={!settings.duckingEnabled}
              />
              <RangeSlider
                label="Release"
                value={settings.duckingRelease}
                min={50}
                max={2000}
                step={50}
                unit=" ms"
                onChange={(v) => update("duckingRelease", v)}
                disabled={!settings.duckingEnabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
