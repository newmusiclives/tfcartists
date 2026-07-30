"use client";

/**
 * Feature flags - client side.
 *
 * Values are resolved on the server and passed down, so a client component never
 * waits on a network round trip to decide whether to render something. That
 * matters: flags gate whole sections of UI, and fetching them client-side would
 * make gated features flash in and then disappear.
 *
 * Usage:
 *   // in a server component / layout
 *   const initial = await allFlags(stationId);
 *   <FlagProvider flags={initial}>{children}</FlagProvider>
 *
 *   // in any client component below it
 *   const canRequest = useFlag("live_requests");
 */

import { createContext, useContext, type ReactNode } from "react";
import { FLAGS, type FlagKey } from "./registry";

type FlagMap = Partial<Record<FlagKey, boolean>>;

const FlagContext = createContext<FlagMap | null>(null);

export function FlagProvider({
  flags,
  children,
}: {
  flags: FlagMap;
  children: ReactNode;
}) {
  return <FlagContext.Provider value={flags}>{children}</FlagContext.Provider>;
}

/**
 * Read one flag. Falls back to the registry default when no provider is present,
 * so a component used outside the provider degrades to the safe value rather
 * than crashing.
 */
export function useFlag(key: FlagKey): boolean {
  const ctx = useContext(FlagContext);
  if (!ctx) return FLAGS[key].defaultValue;
  return ctx[key] ?? FLAGS[key].defaultValue;
}

/** Read several flags at once. */
export function useFlags(): FlagMap {
  return useContext(FlagContext) ?? {};
}

/**
 * Render children only when a flag is on.
 *
 *   <IfFlag flag="podcast_replays"><PodcastTab /></IfFlag>
 */
export function IfFlag({
  flag,
  children,
  fallback = null,
}: {
  flag: FlagKey;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useFlag(flag) ? <>{children}</> : <>{fallback}</>;
}
