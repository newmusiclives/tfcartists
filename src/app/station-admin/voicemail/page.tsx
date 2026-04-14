"use client";

import { useEffect, useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Mic,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  Flag,
  Radio,
  Archive,
  Inbox,
} from "lucide-react";

interface Voicemail {
  key: string;
  id: string;
  listenerName: string;
  message: string;
  audioUrl: string;
  status: string;
  createdAt: string;
}

const STATUS_TABS = [
  { key: "new", label: "New", icon: Inbox },
  { key: "reviewed", label: "Reviewed", icon: CheckCircle },
  { key: "flagged", label: "Flagged", icon: Flag },
  { key: "aired", label: "Aired", icon: Radio },
  { key: "archived", label: "Archived", icon: Archive },
] as const;

export default function AdminVoicemailPage() {
  const [voicemails, setVoicemails] = useState<Voicemail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/voicemail");
      if (res.ok) {
        const data = await res.json();
        setVoicemails(data.voicemails || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await fetch("/api/voicemail", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setVoicemails((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status } : v))
      );
    } catch {
      // ignore
    }
    setUpdatingId(null);
  };

  const filtered = voicemails.filter((v) => v.status === activeTab);

  const togglePlay = (id: string, audioUrl: string) => {
    const allAudio = document.querySelectorAll("audio");
    allAudio.forEach((a) => a.pause());

    if (playingId === id) {
      setPlayingId(null);
      return;
    }

    const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
    if (audio) {
      audio.play();
      setPlayingId(id);
      audio.onended = () => setPlayingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-zinc-100">
      <SharedNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mic className="w-6 h-6 text-red-400" />
              Listener Voicemails
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {voicemails.length} total voicemails
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {STATUS_TABS.map((tab) => {
            const count = voicemails.filter((v) => v.status === tab.key).length;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? "bg-zinc-700 text-zinc-100 font-medium"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
            <Mic className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No {activeTab} voicemails.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((vm) => (
              <div
                key={vm.key}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Play Button */}
                    <button
                      onClick={() => togglePlay(vm.id, vm.audioUrl)}
                      className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center flex-shrink-0"
                    >
                      {playingId === vm.id ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </button>
                    <audio
                      id={`audio-${vm.id}`}
                      src={vm.audioUrl}
                      className="hidden"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">
                          {vm.listenerName || "Anonymous"}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {new Date(vm.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {vm.message && (
                        <p className="text-sm text-zinc-400 mt-1 truncate">
                          {vm.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {activeTab !== "reviewed" && (
                      <button
                        onClick={() => updateStatus(vm.id, "reviewed")}
                        disabled={updatingId === vm.id}
                        className="px-3 py-1.5 text-xs bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Reviewed
                      </button>
                    )}
                    {activeTab !== "flagged" && (
                      <button
                        onClick={() => updateStatus(vm.id, "flagged")}
                        disabled={updatingId === vm.id}
                        className="px-3 py-1.5 text-xs bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 disabled:opacity-50"
                      >
                        <Flag className="w-3 h-3 inline mr-1" />
                        Flag
                      </button>
                    )}
                    {activeTab !== "aired" && (
                      <button
                        onClick={() => updateStatus(vm.id, "aired")}
                        disabled={updatingId === vm.id}
                        className="px-3 py-1.5 text-xs bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 disabled:opacity-50"
                      >
                        <Radio className="w-3 h-3 inline mr-1" />
                        Aired
                      </button>
                    )}
                    {activeTab !== "archived" && (
                      <button
                        onClick={() => updateStatus(vm.id, "archived")}
                        disabled={updatingId === vm.id}
                        className="px-3 py-1.5 text-xs bg-zinc-700/50 text-zinc-400 rounded-lg hover:bg-zinc-700 disabled:opacity-50"
                      >
                        <Archive className="w-3 h-3 inline mr-1" />
                        Archive
                      </button>
                    )}
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
