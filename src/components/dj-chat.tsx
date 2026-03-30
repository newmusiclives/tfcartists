"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChatMessage {
  id: string;
  role: "dj" | "listener";
  text: string;
}

interface NowPlayingData {
  dj_name?: string;
  djSlug?: string;
}

const MAX_MESSAGES = 50;

// ---------------------------------------------------------------------------
// DJChat — floating chat widget
// ---------------------------------------------------------------------------
export default function DJChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [djName, setDjName] = useState<string | null>(null);
  const [djSlug, setDjSlug] = useState<string | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ---- Fetch current DJ from now-playing -----------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchDJ() {
      try {
        const res = await fetch("/api/now-playing");
        if (!res.ok) return;
        const data: NowPlayingData = await res.json();
        if (!cancelled) {
          setDjName(data.dj_name || null);
          setDjSlug(data.djSlug || null);
        }
      } catch {
        // silent
      }
    }

    fetchDJ();
    const interval = setInterval(fetchDJ, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ---- Greeting when chat opens for the first time -------------------------
  useEffect(() => {
    if (open && djName && !hasGreeted) {
      setHasGreeted(true);
      setMessages([
        {
          id: "greeting",
          role: "dj",
          text: `Hey there! ${djName} here, live on the air. What's on your mind?`,
        },
      ]);
    }
  }, [open, djName, hasGreeted]);

  // ---- Auto-scroll ----------------------------------------------------------
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // ---- Focus input on open --------------------------------------------------
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // ---- Send message ---------------------------------------------------------
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !djSlug || sending) return;

    // Auto-reset if too many messages
    if (messages.length >= MAX_MESSAGES) {
      setMessages([
        {
          id: "reset",
          role: "dj",
          text: `Wow, we've been chatting a while! Let me get back to the music. Hit me up again anytime!`,
        },
      ]);
      setInput("");
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "listener",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/dj-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, djSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errText = data.error || "Something went wrong, try again.";
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: "dj", text: errText },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: `d-${Date.now()}`, role: "dj", text: data.reply },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "dj",
          text: "Looks like the signal dropped! Try again in a sec.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, djSlug, sending, messages.length]);

  // ---- Key handler ----------------------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Don't render if no DJ is on air
  if (!djName || !djSlug) return null;

  const djInitial = djName.charAt(0).toUpperCase();

  // ==========================================================================
  // Collapsed button
  // ==========================================================================
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-full bg-zinc-900/90 border border-zinc-700/50 px-4 py-3 shadow-lg backdrop-blur-md hover:bg-zinc-800/90 transition-colors"
        title={`Chat with ${djName}`}
      >
        {/* Chat icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-emerald-400"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-sm font-medium text-zinc-200">{djName}</span>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      </button>
    );
  }

  // ==========================================================================
  // Expanded chat panel
  // ==========================================================================
  return (
    <div className="fixed bottom-20 right-6 z-50 flex w-[350px] flex-col rounded-2xl border border-zinc-700/50 bg-zinc-950/90 shadow-2xl backdrop-blur-xl"
      style={{ height: 500 }}
    >
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
            {djInitial}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">{djName}</p>
            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] text-emerald-400">On Air</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ---- Messages ---- */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "listener" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "dj" && (
              <div className="mr-2 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600/80 text-[10px] font-bold text-white">
                {djInitial}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === "dj"
                  ? "bg-emerald-900/40 text-emerald-100 border border-emerald-800/30"
                  : "bg-zinc-800 text-zinc-200 border border-zinc-700/30"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="mr-2 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600/80 text-[10px] font-bold text-white">
              {djInitial}
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-emerald-900/40 border border-emerald-800/30 px-4 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* ---- Input ---- */}
      <div className="border-t border-zinc-800 px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something..."
            maxLength={500}
            disabled={sending}
            className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/50 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
