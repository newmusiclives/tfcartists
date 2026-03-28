/**
 * CSRF Protection (Double-Submit Cookie Pattern)
 *
 * - Middleware sets a `csrf-token` cookie on every response if not present
 * - State-changing requests (POST/PUT/PATCH/DELETE) must include the token
 *   in the `X-CSRF-Token` header
 * - The header value is compared against the cookie value
 *
 * Exempt routes: public endpoints, webhooks, cron, embed, auth, health
 */

import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Routes exempt from CSRF validation.
 * These are public/webhook/cross-origin endpoints.
 */
const CSRF_EXEMPT_PREFIXES = [
  "/api/auth",           // NextAuth handles its own CSRF
  "/api/embed",          // Cross-origin embed endpoints
  "/api/health",         // Health check
  "/api/now-playing",    // Public read-only
  "/api/webhooks",       // Webhook endpoints use signature verification
  "/api/cron",           // Cron jobs use Bearer token auth
  "/api/playback",       // Public playback state
  "/api/referrals/track",// Public referral tracking
  "/api/stream",         // Audio stream
  "/api/notify_now_playing", // Liquidsoap pushes current track
  "/api/track_played",   // Liquidsoap reports track plays
  "/api/admin/station-onair", // Admin station control
];

/**
 * Public POST endpoints that don't require CSRF (called from external contexts).
 * These must still have rate limiting and input validation.
 */
const CSRF_EXEMPT_PUBLIC_POSTS = [
  "/api/listeners",        // Public registration
  "/api/sponsors/inquiry", // Public inquiry form
];

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function isExempt(pathname: string, method: string): boolean {
  // GET/HEAD/OPTIONS are safe methods — no CSRF needed
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;

  // Check prefix exemptions
  for (const prefix of CSRF_EXEMPT_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  // Check specific public POST exemptions
  for (const path of CSRF_EXEMPT_PUBLIC_POSTS) {
    if (pathname === path) return true;
  }

  return false;
}

/**
 * Validate CSRF token on state-changing requests.
 * Returns null if valid, or an error Response if invalid.
 */
export function validateCsrf(request: NextRequest): Response | null {
  const pathname = request.nextUrl.pathname;

  // Only validate API routes
  if (!pathname.startsWith("/api")) return null;

  // Skip exempt routes
  if (isExempt(pathname, request.method)) return null;

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return Response.json(
      { error: "CSRF token validation failed" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Ensure CSRF cookie is set on the response.
 */
export function ensureCsrfCookie(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!existing) {
    const token = generateToken();
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JS to send in header
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return response;
}
