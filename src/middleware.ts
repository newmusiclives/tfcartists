import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' https:; frame-ancestors *;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' https:; frame-ancestors *;";
    response.headers.set("Content-Security-Policy", embedCsp);
  } else {
    const csp = isDev
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; font-src 'self' data:;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' https:;";
    response.headers.set("Content-Security-Policy", csp);
  }

  // HSTS (only in production with HTTPS)
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
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

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    const response = NextResponse.json({}, { status: 200 });
    return addCorsHeaders(response, req);
  }

  // All pages are public — auth is optional for role-based UI
  const response = NextResponse.next();
  addSecurityHeaders(response, pathname);
  if (pathname.startsWith("/api")) {
    addCorsHeaders(response, req);
  }
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)",
  ],
};
