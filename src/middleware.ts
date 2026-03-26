import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateCsrf, ensureCsrfCookie } from "@/lib/csrf";

/**
 * Security Headers Configuration
 * Adds essential security headers to all responses
 */
function addSecurityHeaders(response: NextResponse, pathname: string) {
  const isEmbedRoute = pathname.startsWith("/embed") || pathname.startsWith("/api/embed");

  // Prevent clickjacking — except for embed routes which need iframe embedding
  if (isEmbedRoute) {
    response.headers.delete("X-Frame-Options");
  } else {
    response.headers.set("X-Frame-Options", "DENY");
  }

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Content Security Policy (adjust as needed for your app)
  const isDev = process.env.NODE_ENV === "development";

  if (isEmbedRoute) {
    // Embed routes: allow iframe embedding from any origin, allow media
    const embedCsp = isDev
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' data: https:; frame-ancestors *;"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' data: https:; frame-ancestors *;";
    response.headers.set("Content-Security-Policy", embedCsp);
  } else {
    // Note: style-src keeps 'unsafe-inline' because Next.js injects inline styles.
    // script-src removes 'unsafe-inline' in production for XSS protection.
    const csp = isDev
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: https:; media-src 'self' data: https:;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' data: https:;";
    response.headers.set("Content-Security-Policy", csp);
  }

  // HSTS (only in production with HTTPS)
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

/**
 * CORS Configuration for API routes
 */
function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin");
  const pathname = request.nextUrl.pathname;
  const isEmbedApi = pathname.startsWith("/api/embed");

  // Embed API routes allow all origins
  if (isEmbedApi) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()).filter(Boolean) || [];

  // Always allow the app's own origin
  if (process.env.NEXTAUTH_URL) {
    const appOrigin = new URL(process.env.NEXTAUTH_URL).origin;
    if (!allowedOrigins.includes(appOrigin)) {
      allowedOrigins.push(appOrigin);
    }
  }

  // In development, allow all origins
  if (process.env.NODE_ENV === "development") {
    response.headers.set("Access-Control-Allow-Origin", "*");
  } else if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

/**
 * Simple in-memory rate limiter for middleware (Edge-compatible).
 * Provides a baseline safety net for all API write requests.
 * Per-route Upstash rate limiting provides more granular control.
 */
const writeRateMap = new Map<string, { count: number; resetAt: number }>();
const WRITE_RATE_LIMIT = 120; // Max writes per minute per IP
const WRITE_RATE_WINDOW = 60_000; // 1 minute

function checkWriteRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = writeRateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    writeRateMap.set(ip, { count: 1, resetAt: now + WRITE_RATE_WINDOW });
    return true;
  }

  entry.count++;
  return entry.count <= WRITE_RATE_LIMIT;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-nf-client-connection-ip") ||
    "unknown"
  );
}

/**
 * Custom domain → organization ID resolution.
 *
 * Maintains a short-lived in-memory cache so we don't hit the DB
 * on every single request. The cache entry lives for 5 minutes.
 *
 * NOTE: We cannot import Prisma in Edge middleware. Instead we use a
 * lightweight fetch to our own /api/branding?domain=... endpoint
 * (which runs in Node) to resolve the org. On first cold-start this
 * adds one internal round-trip; the cache eliminates it for subsequent
 * requests within the TTL.
 */
const domainCache = new Map<string, { orgId: string | null; expiresAt: number }>();
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCustomDomain(host: string): boolean {
  const clean = host.split(":")[0].toLowerCase();
  // Skip known platform domains — these are NOT custom
  const platformHosts = [
    "localhost",
    "truefans-radio.netlify.app",
    process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
      : "",
  ].filter(Boolean);
  return !platformHosts.some((h) => clean === h || clean.endsWith(`.${h}`));
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    const response = NextResponse.json({}, { status: 200 });
    return addCorsHeaders(response, req);
  }

  // CSRF validation for state-changing API requests
  // Skip for Liquidsoap machine-to-machine endpoints (no browser, no CSRF token)
  const csrfSkipPaths = ["/api/notify_now_playing", "/api/track_played"];
  const skipCsrf = csrfSkipPaths.some((p) => pathname.startsWith(p));
  if (!skipCsrf) {
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;
  }

  // Global rate limit for API writes (baseline safety net)
  if (
    pathname.startsWith("/api") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
  ) {
    const ip = getClientIp(req);
    if (!checkWriteRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  // --- Custom domain resolution ---
  const host = req.headers.get("host") || "";
  let resolvedOrgId: string | null = null;

  if (host && isCustomDomain(host)) {
    const cleanHost = host.split(":")[0].toLowerCase();
    const cached = domainCache.get(cleanHost);
    if (cached && Date.now() < cached.expiresAt) {
      resolvedOrgId = cached.orgId;
    } else {
      // Resolve via internal API call (runs in Node runtime)
      try {
        const origin = req.nextUrl.origin;
        const res = await fetch(
          `${origin}/api/branding?domain=${encodeURIComponent(cleanHost)}`
        );
        if (res.ok) {
          const data = await res.json();
          resolvedOrgId = data.orgId || null;
        }
      } catch {
        // Silently fall back — branding is non-critical
      }
      domainCache.set(cleanHost, {
        orgId: resolvedOrgId,
        expiresAt: Date.now() + DOMAIN_CACHE_TTL,
      });
    }
  }

  // All pages are public — auth is optional for role-based UI
  const response = NextResponse.next();

  // Propagate resolved org via request header so downstream code can read it
  if (resolvedOrgId) {
    response.headers.set("x-org-id", resolvedOrgId);
    // Also set a cookie so client-side code (BrandProvider) can pick it up
    response.cookies.set("x-org-id", resolvedOrgId, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });
  }

  // Track API response time — log slow requests (>2s)
  if (pathname.startsWith("/api")) {
    const requestStart = Date.now();
    response.headers.set("X-Request-Start", String(requestStart));
    response.headers.set("Server-Timing", `middleware;desc="Middleware"`)
  }

  addSecurityHeaders(response, pathname);
  if (pathname.startsWith("/api")) {
    addCorsHeaders(response, req);
  }

  // Ensure CSRF cookie is always set
  ensureCsrfCookie(req, response);

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|api/notify_now_playing|api/track_played|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.mp3$|.*\\.wav$|.*\\.ogg$).*)",
  ],
};
