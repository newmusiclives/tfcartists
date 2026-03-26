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
  favicon: string | null;
  accentColor: string;
  backgroundColor: string;
  footerText: string;
  whiteLabel: boolean;
}

const DEFAULT_BRANDING: Branding = {
  orgId: null,
  name: "TrueFans RADIO",
  primaryColor: "#78350f",
  secondaryColor: "#f59e0b",
  logoUrl: null,
  favicon: null,
  accentColor: "#d97706",
  backgroundColor: "#fffbeb",
  footerText: "Powered by TrueFans",
  whiteLabel: false,
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

        const data = await res.json();
        if (cancelled) return;

        const resolved: Branding = {
          orgId: data.orgId ?? null,
          name: data.name || DEFAULT_BRANDING.name,
          primaryColor: data.primaryColor || DEFAULT_BRANDING.primaryColor,
          secondaryColor: data.secondaryColor || DEFAULT_BRANDING.secondaryColor,
          logoUrl: data.logoUrl || data.logo || null,
          favicon: data.favicon || null,
          accentColor: data.accentColor || data.colors?.accent || DEFAULT_BRANDING.accentColor,
          backgroundColor: data.backgroundColor || data.colors?.background || DEFAULT_BRANDING.backgroundColor,
          footerText: data.footerText || DEFAULT_BRANDING.footerText,
          whiteLabel: data.whiteLabel ?? false,
        };

        setBranding(resolved);

        // Inject CSS custom properties onto <html>
        const root = document.documentElement;
        root.style.setProperty("--brand-primary", resolved.primaryColor);
        root.style.setProperty("--brand-secondary", resolved.secondaryColor);
        root.style.setProperty("--brand-accent", resolved.accentColor);
        root.style.setProperty("--brand-background", resolved.backgroundColor);
        root.style.setProperty("--brand-name", `"${resolved.name}"`);

        // Dynamic favicon if provided
        if (resolved.favicon) {
          const existingFavicon = document.querySelector<HTMLLinkElement>(
            'link[rel="icon"]'
          );
          if (existingFavicon) {
            existingFavicon.href = resolved.favicon;
          } else {
            const link = document.createElement("link");
            link.rel = "icon";
            link.href = resolved.favicon;
            document.head.appendChild(link);
          }
        }

        // Dynamic theme-color meta tag
        const themeMeta = document.querySelector<HTMLMetaElement>(
          'meta[name="theme-color"]'
        );
        if (themeMeta) {
          themeMeta.content = resolved.primaryColor;
        }
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
