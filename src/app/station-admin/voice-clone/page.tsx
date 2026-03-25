"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  Mic,
  Upload,
  Loader2,
  Trash2,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  AudioLines,
  Wand2,
} from "lucide-react";

interface DJVoiceInfo {
  id: string;
  name: string;
  slug: string;
  voiceProfileId: string | null;
  ttsVoice: string | null;
  ttsProvider: string;
  photoUrl: string | null;
  isActive: boolean;
}

export default function VoiceClonePage() {
  // Data
  const [djs, setDjs] = useState<DJVoiceInfo[]>([]);
  const [elevenlabsConfigured, setElevenlabsConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  // Selection & status
  const [selectedDjId, setSelectedDjId] = useState<string>("");
  const [voiceStatus, setVoiceStatus] = useState<{
    hasClonedVoice: boolean;
    voiceProfileId: string | null;
    ttsProvider: string;
    ttsVoice: string | null;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Upload form
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Preview
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Delete
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedDj = djs.find((d) => d.id === selectedDjId);

  // Load DJs
  useEffect(() => {
    fetch("/api/voice-clone")
      .then((r) => r.json())
      .then((data) => {
        setDjs(data.djs || []);
        setElevenlabsConfigured(data.elevenlabsConfigured !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load voice status when DJ selected
  const loadVoiceStatus = useCallback(async (djId: string) => {
    if (!djId) {
      setVoiceStatus(null);
      return;
    }
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/voice-clone/${djId}`);
      if (res.ok) {
        const data = await res.json();
        setVoiceStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDjId) {
      loadVoiceStatus(selectedDjId);
      setUploadError(null);
      setUploadSuccess(null);
      setPreviewAudio(null);
    }
  }, [selectedDjId, loadVoiceStatus]);

  // Pre-fill voice name from DJ name
  useEffect(() => {
    if (selectedDj && !voiceName) {
      setVoiceName(`${selectedDj.name} Voice`);
    }
  }, [selectedDj, voiceName]);

  // File handling
  const handleFileSelect = (file: File) => {
    const validTypes = ["audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a WAV or MP3 file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 10MB.");
      return;
    }
    setAudioFile(file);
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // Upload & clone
  const handleClone = async () => {
    if (!selectedDjId || !audioFile || !voiceName.trim()) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const form = new FormData();
      form.append("djId", selectedDjId);
      form.append("audioFile", audioFile);
      form.append("voiceName", voiceName.trim());
      form.append("description", description.trim());

      const res = await fetch("/api/voice-clone", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadSuccess(data.message || "Voice cloned successfully!");
        setAudioFile(null);
        setVoiceName("");
        setDescription("");
        // Refresh status and DJ list
        loadVoiceStatus(selectedDjId);
        const listRes = await fetch("/api/voice-clone");
        const listData = await listRes.json();
        setDjs(listData.djs || []);
      } else {
        setUploadError(data.error || "Something went wrong.");
      }
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Preview voice
  const handlePreview = async () => {
    if (!selectedDjId) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/voice-clone/${selectedDjId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.audio) {
        setPreviewAudio(data.audio);
        // Auto-play
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }, 100);
      } else {
        setUploadError(data.error || "Preview failed.");
      }
    } catch {
      setUploadError("Failed to generate preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Delete voice
  const handleDelete = async () => {
    if (!selectedDjId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/voice-clone/${selectedDjId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setUploadSuccess(data.message || "Voice removed.");
        setShowDeleteConfirm(false);
        setPreviewAudio(null);
        loadVoiceStatus(selectedDjId);
        const listRes = await fetch("/api/voice-clone");
        const listData = await listRes.json();
        setDjs(listData.djs || []);
      } else {
        setUploadError(data.error || "Failed to remove voice.");
      }
    } catch {
      setUploadError("Network error.");
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <AudioLines className="w-8 h-8 text-violet-400" />
            Voice Cloning
          </h1>
          <p className="text-zinc-400 mt-1">
            Give your AI DJs a unique voice by cloning from audio samples
          </p>
        </div>

        {/* ElevenLabs not configured banner */}
        {!elevenlabsConfigured && (
          <div className="bg-amber-950/50 border border-amber-800/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-200 font-medium">
                ElevenLabs API key required
              </p>
              <p className="text-amber-300/70 text-sm mt-0.5">
                Voice cloning requires an ElevenLabs API key. Add your{" "}
                <code className="bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-200 text-xs">
                  ELEVENLABS_API_KEY
                </code>{" "}
                in Admin &gt; Settings to get started.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — Setup */}
            <div className="lg:col-span-2 space-y-6">
              {/* DJ Selector */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Select a DJ
                </label>
                <div className="relative">
                  <select
                    value={selectedDjId}
                    onChange={(e) => {
                      setSelectedDjId(e.target.value);
                      setVoiceName("");
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 appearance-none cursor-pointer focus:ring-2 focus:ring-violet-500 focus:border-violet-500 pr-10"
                  >
                    <option value="">Choose a DJ to set up voice cloning...</option>
                    {djs.map((dj) => (
                      <option key={dj.id} value={dj.id}>
                        {dj.name}
                        {dj.voiceProfileId ? " (cloned)" : ""}
                        {!dj.isActive ? " (inactive)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Current Voice Status */}
              {selectedDjId && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-zinc-100 mb-3">
                    Voice Status
                  </h2>
                  {statusLoading ? (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </div>
                  ) : voiceStatus?.hasClonedVoice ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">
                          Cloned voice active
                        </span>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Voice ID</span>
                          <code className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded text-xs font-mono">
                            {voiceStatus.voiceProfileId}
                          </code>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Provider</span>
                          <span className="text-zinc-300">ElevenLabs</span>
                        </div>
                      </div>

                      {/* Preview + Delete */}
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={handlePreview}
                          disabled={previewLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {previewLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Test Voice
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-300 border border-zinc-700 hover:border-red-800/50 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove Voice
                        </button>
                      </div>

                      {/* Audio player */}
                      {previewAudio && (
                        <div className="bg-zinc-800/50 rounded-lg p-3 mt-2">
                          <p className="text-xs text-zinc-400 mb-2">
                            Voice Preview
                          </p>
                          <audio
                            ref={audioRef}
                            src={previewAudio}
                            controls
                            className="w-full h-10"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                          />
                        </div>
                      )}

                      {/* Delete confirmation */}
                      {showDeleteConfirm && (
                        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 mt-2">
                          <p className="text-red-200 text-sm mb-3">
                            This will permanently delete the cloned voice from
                            ElevenLabs and revert {selectedDj?.name} to default
                            TTS. Are you sure?
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleDelete}
                              disabled={deleting}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {deleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mic className="w-5 h-5 text-zinc-500" />
                      <span>
                        Using default TTS
                        {voiceStatus?.ttsProvider
                          ? ` (${voiceStatus.ttsProvider}${voiceStatus.ttsVoice ? `: ${voiceStatus.ttsVoice}` : ""})`
                          : ""}
                        . Upload an audio sample below to clone a custom voice.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Section */}
              {selectedDjId && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-zinc-100 mb-1">
                    {voiceStatus?.hasClonedVoice
                      ? "Replace Voice"
                      : "Clone a Voice"}
                  </h2>
                  <p className="text-zinc-400 text-sm mb-5">
                    Upload a clean audio sample to create a unique voice for{" "}
                    {selectedDj?.name}.
                  </p>

                  {/* Requirements */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 mb-5 text-sm text-zinc-300 space-y-1">
                    <p className="font-medium text-zinc-200 mb-1.5">
                      Audio requirements
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                      <li>Upload 30+ seconds of clean speech</li>
                      <li>WAV or MP3 format, up to 10MB</li>
                      <li>No music or background noise</li>
                      <li>
                        Consistent tone and pace works best
                      </li>
                    </ul>
                  </div>

                  {/* Drop zone */}
                  <div
                    ref={dropRef}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? "border-violet-500 bg-violet-500/10"
                        : audioFile
                          ? "border-emerald-600/50 bg-emerald-950/20"
                          : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/30 hover:bg-zinc-800/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".wav,.mp3,audio/wav,audio/mpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                    {audioFile ? (
                      <div className="space-y-2">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                        <p className="text-zinc-200 font-medium">
                          {audioFile.name}
                        </p>
                        <p className="text-zinc-400 text-sm">
                          {formatFileSize(audioFile.size)} &mdash; Click or drop
                          to replace
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-zinc-500 mx-auto" />
                        <p className="text-zinc-300 font-medium">
                          Drop an audio file here, or click to browse
                        </p>
                        <p className="text-zinc-500 text-sm">
                          WAV or MP3, up to 10MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Voice name & description */}
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Voice Name
                      </label>
                      <input
                        type="text"
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                        placeholder="e.g., Hank Westwood Voice"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Description{" "}
                        <span className="text-zinc-500 font-normal">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Warm baritone with a slight Southern drawl..."
                        rows={2}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Errors / Success */}
                  {uploadError && (
                    <div className="mt-4 bg-red-950/30 border border-red-900/50 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-red-300 text-sm">{uploadError}</p>
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="mt-4 bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <p className="text-emerald-300 text-sm">
                        {uploadSuccess}
                      </p>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleClone}
                    disabled={
                      uploading ||
                      !audioFile ||
                      !voiceName.trim() ||
                      !elevenlabsConfigured
                    }
                    className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Cloning voice...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Clone Voice
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right column — Voice Library */}
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-zinc-100 mb-4">
                  Voice Library
                </h2>
                {djs.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No DJs found.</p>
                ) : (
                  <div className="space-y-2">
                    {djs.map((dj) => (
                      <button
                        key={dj.id}
                        onClick={() => {
                          setSelectedDjId(dj.id);
                          setVoiceName("");
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          selectedDjId === dj.id
                            ? "bg-violet-600/20 border border-violet-500/30"
                            : "bg-zinc-800/50 border border-zinc-800 hover:bg-zinc-800"
                        }`}
                      >
                        {/* Avatar */}
                        {dj.photoUrl ? (
                          <img
                            src={dj.photoUrl}
                            alt={dj.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-semibold text-sm flex-shrink-0">
                            {dj.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-200 text-sm font-medium truncate">
                            {dj.name}
                          </p>
                          <p className="text-xs mt-0.5">
                            {dj.voiceProfileId ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Cloned
                              </span>
                            ) : (
                              <span className="text-zinc-500">
                                Default ({dj.ttsProvider}
                                {dj.ttsVoice ? `: ${dj.ttsVoice}` : ""})
                              </span>
                            )}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-zinc-400 space-y-2">
                    <p>
                      <strong className="text-zinc-300">
                        How voice cloning works
                      </strong>
                    </p>
                    <p>
                      Upload a short audio sample of someone speaking. ElevenLabs
                      will analyze the voice characteristics and create a
                      synthetic voice that sounds like the original speaker.
                    </p>
                    <p>
                      Your cloned voice will be used for all AI-generated voice
                      tracks, intros, and personality segments for this DJ.
                    </p>
                    <p className="text-zinc-500">
                      Voice cloning requires an ElevenLabs API key. Add it in
                      Admin &gt; Settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
