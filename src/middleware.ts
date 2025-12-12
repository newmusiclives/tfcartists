import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security Headers Configuration
 * Adds essential security headers to all responses
 */
function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

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
  const csp = isDev
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; font-src 'self' data:;"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;";

  response.headers.set("Content-Security-Policy", csp);

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
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

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
  const isAuthenticated = !!req.auth;

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    const response = NextResponse.json({}, { status: 200 });
    return addCorsHeaders(response, req);
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/api/auth", "/onboard"];

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    if (pathname.startsWith("/api")) {
      addCorsHeaders(response, req);
    }
    return response;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  const userRole = req.auth?.user?.role;

  // Admin can access everything
  if (userRole === "admin") {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    if (pathname.startsWith("/api")) {
      addCorsHeaders(response, req);
    }
    return response;
  }

  // Team-specific access
  if (pathname.startsWith("/riley") && userRole !== "riley") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/harper") && userRole !== "harper") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/elliot") && userRole !== "elliot") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // API routes require authentication but no role check
  if (pathname.startsWith("/api") && !isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
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
