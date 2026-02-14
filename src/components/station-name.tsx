"use client";

import { useStation } from "@/contexts/StationContext";

export function StationName({ className }: { className?: string }) {
  const { currentStation, isLoading } = useStation();

  if (isLoading) {
    return <span className={className}>Loading...</span>;
  }

  return <span className={className}>{currentStation.name}</span>;
}
