"use client";

import { useState, useCallback } from "react";
import { Rss, Check } from "lucide-react";

export function CopyRssButton({ rssUrl }: { rssUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rssUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = rssUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [rssUrl]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-gray-300 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-700 transition-all"
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 text-green-400" />
          Copied!
        </>
      ) : (
        <>
          <Rss className="w-5 h-5 text-amber-400" />
          Copy RSS Feed
        </>
      )}
    </button>
  );
}
