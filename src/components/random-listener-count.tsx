"use client";

import { useState, useEffect } from "react";

interface Props {
  variant?: "hero" | "demo";
}

export function RandomListenerCount({ variant = "hero" }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setCount(Math.floor(Math.random() * (99 - 22 + 1)) + 22);
  }, []);

  if (count === null) return null;

  if (variant === "demo") {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
        <div className="text-2xl font-bold">{count}</div>
        <div className="text-amber-200 text-sm">Listening Now</div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-bold text-gray-900">{count}</div>
      <div className="text-sm text-gray-500">Listening Now</div>
    </div>
  );
}
