"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * BrandProvider
 *
 * Client-side context that:
 *   1. Fetches /api/branding on mount (using the current domain)
 *   2. Stores the resolved branding in React context
 *   3. Injects CSS custom properties on <html> so any component
 *      can use `var(--brand-primary)` etc. without importing anything.
 *
 * Usage:
 *   Wrap your layout with <BrandProvider> and consume via useBranding().
 */

export interface Branding {
  orgId: string | null;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

const DEFAULT_BRANDING: Branding = {
  orgId: null,
  name: "TrueFans RADIO",
  primaryColor: "#78350f",
  secondaryColor: "#f59e0b",
  logoUrl: null,
};

const BrandContext = createContext<Branding>(DEFAULT_BRANDING);

export function useBranding(): Branding {
  return useContext(BrandContext);
}

interface BrandProviderProps {
  children: ReactNode;
  /** Optional: pre-supply an orgId to fetch branding for (e.g. from a cookie). */
  orgId?: string;
}

export function BrandProvider({ children, orgId }: BrandProviderProps) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    let cancelled = false;

    async function loadBranding() {
      try {
        const params = new URLSearchParams();
        if (orgId) {
          params.set("orgId", orgId);
        }
        const qs = params.toString();
        const url = `/api/branding${qs ? `?${qs}` : ""}`;

        const res = await fetch(url);
        if (!res.ok) return;

        const data: Branding = await res.json();
        if (cancelled) return;

        setBranding(data);

        // Inject CSS custom properties onto <html>
        const root = document.documentElement;
        root.style.setProperty("--brand-primary", data.primaryColor);
        root.style.setProperty("--brand-secondary", data.secondaryColor);
        root.style.setProperty("--brand-name", `"${data.name}"`);
      } catch {
        // Silently fall back to defaults — branding is non-critical
      }
    }

    loadBranding();

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return <BrandContext.Provider value={branding}>{children}</BrandContext.Provider>;
}
