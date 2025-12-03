import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/api/auth"];

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
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
    return NextResponse.next();
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

  return NextResponse.next();
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
