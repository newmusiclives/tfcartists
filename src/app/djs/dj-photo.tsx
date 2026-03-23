"use client";

import { useState } from "react";

interface DJPhotoProps {
  name: string;
  photoUrl: string | null;
  colorPrimary: string | null;
  size?: number;
}

export function DJPhoto({ name, photoUrl, colorPrimary, size = 80 }: DJPhotoProps) {
  const [imgError, setImgError] = useState(false);

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: colored initials circle
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        backgroundColor: colorPrimary || "#6b7280",
      }}
    >
      {initials}
    </div>
  );
}
