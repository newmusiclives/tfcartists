/**
 * Coming-soon gate.
 *
 * Holds the whole site behind a launch placeholder. This runs in middleware,
 * before any page or route handler, so while the gate is up nothing of the real
 * site is produced: no markup, no player, no database query. That is the point —
 * a hold page rendered *by* the app would still have the app render around it.
 *
 * Edge-safe by necessity. We cannot import "@/lib/flags" here because it pulls
 * in Prisma, which does not run on the Edge runtime. So:
 *
 *   FLAG_COMING_SOON in the environment  -> read directly, authoritative
 *   otherwise                            -> the database-backed flag, fetched
 *                                           from /api/coming-soon (Node) and
 *                                           cached in-process
 *
 * The env path exists so the gate cannot fail open: if the database is
 * unreachable the flag library falls back to its default of false, which for an
 * ordinary feature means "stay off" but for this one would mean "publish the
 * site". Setting the env var takes the database out of the decision entirely.
 *
 * Toggling from /admin/flags takes up to ~60s to show everywhere: this cache
 * sits on top of the flag library's own 30s cache. Env changes need a redeploy.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { flagEnvKey } from "@/lib/flags/registry";
import { comingSoonHtml } from "./page";

/** Cookie holding a granted preview token. */
export const PREVIEW_COOKIE = "tfr-preview";

/** Query parameter used to grant or revoke preview access. */
export const PREVIEW_PARAM = "preview";

/**
 * Compile-time tie to the registry. The read below has to be a literal
 * `process.env.FLAG_COMING_SOON`: Next.js inlines literal process.env
 * references into the Edge bundle at build time and cannot inline a computed
 * key, so `process.env[flagEnvKey("coming_soon")]` reads undefined in
 * middleware and the override silently does nothing. This assignment fails the
 * build if the flag is ever renamed and the literal is not updated with it.
 */
const _envKey: ReturnType<typeof flagEnvKey<"coming_soon">> =
  "FLAG_COMING_SOON";

const CACHE_TTL = 30_000; // matches the flag library's own cache
const PREVIEW_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const MIN_TOKEN_LENGTH = 16;

/**
 * Paths that stay reachable while the gate is up.
 *
 * Each one is here for a reason, not for convenience: the gate is only as
 * strong as this list is short.
 */
const ALWAYS_ALLOWED = [
  "/api/coming-soon", // middleware asks this route for the flag — must not gate itself
  "/api/auth", // sign in, so an admin can get past the gate
  "/api/branding", // middleware's own custom-domain lookup
  "/api/newsletter/subscribe", // the hold page's one write
  "/api/health", // uptime checks should see a healthy site, not a 503
  "/api/cron", // scheduled jobs keep running while the site is hidden
  "/_next", // build assets — the hold page needs none, but 404s here are noisy
  "/icons",
  "/logos",
  "/images",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/manifest.json",
  "/sw.js",
  "/offline.html",
];

function parseBool(raw: string | null | undefined): boolean | undefined {
  if (raw === null || raw === undefined) return undefined;
  const v = raw.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(v)) return true;
  if (["false", "0", "no", "off"].includes(v)) return false;
  return undefined;
}

/** Extra prefixes an operator has opened up, comma-separated. */
function extraAllowed(): string[] {
  return (process.env.COMING_SOON_ALLOW_PATHS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Prefix match on path segments, so "/api" allows "/api/x" but not "/apidocs".
 */
export function isAllowedWhileHidden(pathname: string): boolean {
  return [...ALWAYS_ALLOWED, ...extraAllowed()].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * The configured preview token, or null if there isn't a usable one.
 *
 * A short token is worse than no token: it advertises that some URL unlocks the
 * unreleased site and invites guessing at it.
 */
function previewToken(): string | null {
  const token = process.env.COMING_SOON_BYPASS_TOKEN?.trim();
  return token && token.length >= MIN_TOKEN_LENGTH ? token : null;
}

let cached: { value: boolean; expiresAt: number } | null = null;

/** Is the gate up? Env wins; otherwise the database-backed flag, cached. */
async function isHidden(req: NextRequest): Promise<boolean> {
  const override = parseBool(process.env.FLAG_COMING_SOON);
  if (override !== undefined) return override;

  const now = Date.now();
  if (cached && now < cached.expiresAt) return cached.value;

  // On a blip, hold the last known answer rather than swinging to a default —
  // whichever way it swung would be wrong half the time.
  let value = cached?.value ?? false;
  try {
    const res = await fetch(`${req.nextUrl.origin}/api/coming-soon`);
    if (res.ok) {
      const data = await res.json();
      value = data.enabled === true;
    }
  } catch {
    // keep last known
  }

  cached = { value, expiresAt: now + CACHE_TTL };
  return value;
}

/** Drop the preview parameter and bounce, so the token leaves the address bar. */
function redirectWithoutParam(req: NextRequest): URL {
  const dest = new URL(req.url);
  dest.searchParams.delete(PREVIEW_PARAM);
  return dest;
}

/**
 * Decide what happens to this request.
 *
 * Returns a response when the request should not reach the app, or null to let
 * it continue as normal.
 */
export async function handleComingSoon(
  req: NextRequest,
  { isAdmin = false }: { isAdmin?: boolean } = {}
): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  const param = req.nextUrl.searchParams.get(PREVIEW_PARAM);
  const token = previewToken();

  // ?preview=<token> unlocks this browser; ?preview=off locks it again.
  // Handled whether or not the gate is currently up, so access can be granted
  // ahead of flipping the flag.
  if (param !== null && token) {
    if (param === token) {
      const res = NextResponse.redirect(redirectWithoutParam(req));
      res.cookies.set(PREVIEW_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: PREVIEW_MAX_AGE,
      });
      return res;
    }
    if (param === "off" || param === "exit") {
      const res = NextResponse.redirect(redirectWithoutParam(req));
      res.cookies.set(PREVIEW_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    }
  }

  // Admins are never gated — they are the people who need to see it.
  if (isAdmin) return null;
  if (token && req.cookies.get(PREVIEW_COOKIE)?.value === token) return null;

  // Checked before resolving the flag: keeps allowlisted paths off the lookup
  // path entirely, which is also what stops /api/coming-soon gating itself.
  if (isAllowedWhileHidden(pathname)) return null;

  if (!(await isHidden(req))) return null;

  // 503 rather than 200: this is a temporary hold, and it keeps search engines
  // from indexing the placeholder as if it were the site.
  const headers = {
    "Retry-After": "3600",
    "Cache-Control": "no-store, must-revalidate",
    "X-Robots-Tag": "noindex, nofollow",
  };

  if (pathname.startsWith("/api")) {
    return NextResponse.json(
      { error: "Unavailable", message: "This service has not launched yet." },
      { status: 503, headers }
    );
  }

  return new NextResponse(comingSoonHtml(), {
    status: 503,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}
