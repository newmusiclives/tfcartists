"use client";

import { useState, useEffect } from "react";

interface Props {
  variant?: "hero" | "demo";
}

export function RandomListenerCount({ variant = "hero" }: Props) {
  const [count, setCount] = useState(Math.floor(Math.random() * (99 - 11 + 1)) + 11);

  useEffect(() => {
    setCount(Math.floor(Math.random() * (99 - 11 + 1)) + 11);
  }, []);

  if (variant === "demo") {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-amber-400">{count}</div>
        <div className="text-gray-500 text-sm">Listening Now</div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-bold text-amber-400">{count}</div>
      <div className="text-sm text-gray-500 dark:text-zinc-500">Listening Now</div>
    </div>
  );
}
