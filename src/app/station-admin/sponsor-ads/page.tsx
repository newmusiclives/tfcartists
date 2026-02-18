"use client";

import { useEffect, useState } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Megaphone,
  Plus,
  X,
  Loader2,
  Trash2,
  Play,
  Pause,
  ToggleLeft,
  ToggleRight,
  Music,
  Clock,
  BarChart3,
} from "lucide-react";

interface MusicBedOption {
  id: string;
  name: string;
  category: string;
}

interface SponsorAd {
  id: string;
  sponsorName: string;
  adTitle: string;
  scriptText: string | null;
  musicBedId: string | null;
  musicBed: MusicBedOption | null;
  audioFilePath: string | null;
  durationSeconds: number | null;
  tier: string;
  weight: number;
  isActive: boolean;
  playCount: number;
  lastPlayedAt: string | null;
}

const TIERS = ["bronze", "silver", "gold", "platinum"];

export default function SponsorAdsPage() {
  const [ads, setAds] = useState<SponsorAd[]>([]);
  const [musicBeds, setMusicBeds] = useState<MusicBedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [stationId, setStationId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioEl] = useState(() =>
    typeof Audio !== "undefined" ? new Audio() : null
  );

  const [form, setForm] = useState({
    sponsorName: "",
    adTitle: "",
    scriptText: "",
    musicBedId: "",
    durationSeconds: "",
    tier: "bronze",
    weight: "1",
  });

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          const sid = stations[0].id;
          setStationId(sid);
          return Promise.all([
            fetch(`/api/sponsor-ads?stationId=${sid}`).then((r) => r.json()),
            fetch(`/api/music-beds?stationId=${sid}`).then((r) => r.json()),
          ]).then(([adData, bedData]) => {
            setAds(adData.sponsorAds || []);
            setMusicBeds(bedData.musicBeds || []);
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({
      sponsorName: "",
      adTitle: "",
      scriptText: "",
      musicBedId: "",
      durationSeconds: "",
      tier: "bronze",
      weight: "1",
    });
    setShowCreate(false);
    setEditingId(null);
  };

  const createAd = async () => {
    if (!stationId || !form.sponsorName || !form.adTitle) return;
    setCreating(true);
    try {
      const res = await fetch("/api/sponsor-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId,
          sponsorName: form.sponsorName,
          adTitle: form.adTitle,
          scriptText: form.scriptText || null,
          musicBedId: form.musicBedId || null,
          durationSeconds: form.durationSeconds
            ? parseFloat(form.durationSeconds)
            : null,
          tier: form.tier,
          weight: parseInt(form.weight) || 1,
        }),
      });
      const data = await res.json();
      if (data.ad) {
        setAds([data.ad, ...ads]);
        resetForm();
      }
    } catch {}
    setCreating(false);
  };

  const updateAd = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/sponsor-ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.ad) {
      setAds(ads.map((a) => (a.id === id ? data.ad : a)));
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateAd(editingId, {
      sponsorName: form.sponsorName,
      adTitle: form.adTitle,
      scriptText: form.scriptText || null,
      musicBedId: form.musicBedId || null,
      durationSeconds: form.durationSeconds
        ? parseFloat(form.durationSeconds)
        : null,
      tier: form.tier,
      weight: parseInt(form.weight) || 1,
    });
    resetForm();
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Delete this sponsor ad?")) return;
    await fetch(`/api/sponsor-ads/${id}`, { method: "DELETE" });
    setAds(ads.filter((a) => a.id !== id));
  };

  const toggleActive = (ad: SponsorAd) => {
    updateAd(ad.id, { isActive: !ad.isActive });
  };

  const startEdit = (ad: SponsorAd) => {
    setEditingId(ad.id);
    setForm({
      sponsorName: ad.sponsorName,
      adTitle: ad.adTitle,
      scriptText: ad.scriptText || "",
      musicBedId: ad.musicBedId || "",
      durationSeconds: ad.durationSeconds?.toString() || "",
      tier: ad.tier,
      weight: ad.weight.toString(),
    });
    setShowCreate(true);
  };

  const togglePlayAd = (ad: SponsorAd) => {
    if (!audioEl || !ad.audioFilePath) return;
    if (playingId === ad.id) {
      audioEl.pause();
      setPlayingId(null);
    } else {
      audioEl.src = ad.audioFilePath;
      audioEl.play();
      setPlayingId(ad.id);
      audioEl.onended = () => setPlayingId(null);
    }
  };

  const generateAudio = async () => {
    if (!stationId) return;
    const res = await fetch("/api/sponsor-ads/generate-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId }),
    });
    const data = await res.json();
    alert(data.message || "Audio generation complete");
  };

  const tierColor: Record<string, string> = {
    bronze: "bg-orange-100 text-orange-700",
    silver: "bg-gray-100 text-gray-700",
    gold: "bg-yellow-100 text-yellow-700",
    platinum: "bg-purple-100 text-purple-700",
  };

  const activeAds = ads.filter((a) => a.isActive).length;
  const totalPlays = ads.reduce((s, a) => s + a.playCount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-green-600" />
              Sponsor Ads
            </h1>
            <p className="text-gray-600 mt-1">
              Manage sponsor ads and rotation scheduling
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateAudio}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2 text-sm"
            >
              <Music className="w-4 h-4" />
              Generate Audio
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Ad
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Total Ads</p>
            <p className="text-2xl font-bold text-gray-900">{ads.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{activeAds}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Total Plays</p>
            <p className="text-2xl font-bold text-blue-600">{totalPlays}</p>
          </div>
        </div>

        {/* Create / Edit form */}
        {showCreate && (
          <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {editingId ? "Edit Ad" : "New Sponsor Ad"}
              </h3>
              <button onClick={resetForm}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Sponsor Name
                </label>
                <input
                  type="text"
                  value={form.sponsorName}
                  onChange={(e) =>
                    setForm({ ...form, sponsorName: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Mountain Brew Coffee"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Ad Title
                </label>
                <input
                  type="text"
                  value={form.adTitle}
                  onChange={(e) =>
                    setForm({ ...form, adTitle: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Morning Coffee Special"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">
                Script Text
              </label>
              <textarea
                value={form.scriptText}
                onChange={(e) =>
                  setForm({ ...form, scriptText: e.target.value })
                }
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Start your morning with Mountain Brew Coffee..."
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Music Bed
                </label>
                <select
                  value={form.musicBedId}
                  onChange={(e) =>
                    setForm({ ...form, musicBedId: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {musicBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={form.durationSeconds}
                  onChange={(e) =>
                    setForm({ ...form, durationSeconds: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tier</label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Weight
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.weight}
                  onChange={(e) =>
                    setForm({ ...form, weight: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={editingId ? saveEdit : createAd}
              disabled={creating || !form.sponsorName || !form.adTitle}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create Ad"}
            </button>
          </div>
        )}

        {/* Ads list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No sponsor ads yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Create ads to start rotating them on air.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className={`bg-white rounded-xl p-5 shadow-sm border ${
                  !ad.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {ad.adTitle}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          tierColor[ad.tier] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ad.tier}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          ad.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {ad.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{ad.sponsorName}</p>
                    {ad.scriptText && (
                      <p className="text-sm text-gray-500 mt-1 italic line-clamp-2">
                        {ad.scriptText}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {ad.musicBed && (
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {ad.musicBed.name}
                        </span>
                      )}
                      {ad.durationSeconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ad.durationSeconds}s
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {ad.playCount} plays
                      </span>
                      {ad.lastPlayedAt && (
                        <span>
                          Last:{" "}
                          {new Date(ad.lastPlayedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4">
                    {ad.audioFilePath && (
                      <button
                        onClick={() => togglePlayAd(ad)}
                        className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200"
                      >
                        {playingId === ad.id ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => toggleActive(ad)}
                      className="p-1.5 rounded-lg hover:bg-gray-100"
                      title={ad.isActive ? "Deactivate" : "Activate"}
                    >
                      {ad.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(ad)}
                      className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAd(ad.id)}
                      className="text-red-500 p-1.5 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
