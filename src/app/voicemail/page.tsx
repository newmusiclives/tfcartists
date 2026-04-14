"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import { Mic, Square, Play, Pause, RotateCcw, Send, Loader2, CheckCircle } from "lucide-react";

export default function VoicemailPage() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_SECONDS = 60;

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio level monitoring
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setLevel(avg / 128);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        cleanup();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);
      setAudioBlob(null);
      setAudioUrl(null);

      // Timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            recorder.stop();
            setRecording(false);
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      alert("Could not access microphone. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const reRecord = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setPlaying(false);
    setElapsed(0);
    setLevel(0);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const submit = async () => {
    if (!audioBlob) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voicemail.webm");
      if (name) formData.append("listenerName", name);
      if (message) formData.append("message", message);

      const res = await fetch("/api/voicemail", { method: "POST", body: formData });
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Failed to submit voicemail. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <SharedNav />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Voicemail Sent!</h1>
          <p className="text-zinc-400 mb-6">
            Thanks for your message. Our DJs will hear it soon!
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              reRecord();
              setName("");
              setMessage("");
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
          >
            Record Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SharedNav />
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Leave a Voicemail</h1>
          <p className="text-zinc-400">
            Record a message for our DJs — song requests, shoutouts, or just say hi!
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          {/* Record Button */}
          <div className="flex flex-col items-center gap-4">
            {!audioBlob ? (
              <>
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    recording
                      ? "bg-red-600 hover:bg-red-500 animate-pulse"
                      : "bg-red-600 hover:bg-red-500"
                  }`}
                  style={
                    recording
                      ? { boxShadow: `0 0 ${20 + level * 40}px ${level * 20}px rgba(239,68,68,0.4)` }
                      : {}
                  }
                >
                  {recording ? (
                    <Square className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </button>

                {/* Level Indicator */}
                {recording && (
                  <div className="w-full max-w-[200px]">
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-100"
                        style={{ width: `${Math.min(level * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-sm text-zinc-400">
                  {recording
                    ? `Recording... ${formatTime(elapsed)} / ${formatTime(MAX_SECONDS)}`
                    : "Tap to record (60s max)"}
                </div>

                {/* Progress bar */}
                {recording && (
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all"
                      style={{ width: `${(elapsed / MAX_SECONDS) * 100}%` }}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Playback Preview */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayback}
                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center"
                  >
                    {playing ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                  <span className="text-sm text-zinc-400">
                    {formatTime(elapsed)} recorded
                  </span>
                  <button
                    onClick={reRecord}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Re-record
                  </button>
                </div>
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setPlaying(false)}
                    className="hidden"
                  />
                )}
              </>
            )}
          </div>

          {/* Name & Message */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Your Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anonymous"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's this about? Song request, shoutout, feedback..."
                rows={3}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={submit}
            disabled={!audioBlob || submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Voicemail
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
