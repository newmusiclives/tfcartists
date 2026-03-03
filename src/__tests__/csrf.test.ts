import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { validateCsrf, ensureCsrfCookie } from "@/lib/csrf";

function makeRequest(
  method: string,
  path: string,
  options?: { cookies?: Record<string, string>; headers?: Record<string, string> }
): NextRequest {
  const url = `http://localhost:3000${path}`;
  const headers = new Headers(options?.headers || {});
  // NextRequest reads cookies from cookie header
  if (options?.cookies) {
    const cookieStr = Object.entries(options.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    headers.set("cookie", cookieStr);
  }
  return new NextRequest(url, { method, headers });
}

describe("CSRF Protection", () => {
  describe("validateCsrf", () => {
    it("allows GET requests without token", () => {
      const req = makeRequest("GET", "/api/artists");
      const result = validateCsrf(req);
      expect(result).toBeNull();
    });

    it("allows OPTIONS requests without token", () => {
      const req = makeRequest("OPTIONS", "/api/artists");
      const result = validateCsrf(req);
      expect(result).toBeNull();
    });

    it("allows exempt routes without token", () => {
      const exemptPaths = [
        "/api/auth/callback",
        "/api/embed/listen",
        "/api/health",
        "/api/webhooks/manifest",
        "/api/cron/run-all-daily",
        "/api/now-playing",
      ];

      for (const path of exemptPaths) {
        const req = makeRequest("POST", path);
        const result = validateCsrf(req);
        expect(result).toBeNull();
      }
    });

    it("allows public POST endpoints without token", () => {
      const publicPosts = ["/api/listeners", "/api/sponsors/inquiry"];
      for (const path of publicPosts) {
        const req = makeRequest("POST", path);
        const result = validateCsrf(req);
        expect(result).toBeNull();
      }
    });

    it("blocks POST to protected route without token", async () => {
      const req = makeRequest("POST", "/api/artists");
      const result = validateCsrf(req);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.status).toBe(403);
        const body = await result.json();
        expect(body.error).toContain("CSRF");
      }
    });

    it("blocks POST when cookie and header don't match", async () => {
      const req = makeRequest("POST", "/api/artists", {
        cookies: { "csrf-token": "token-a" },
        headers: { "x-csrf-token": "token-b" },
      });
      const result = validateCsrf(req);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.status).toBe(403);
      }
    });

    it("allows POST when cookie and header match", () => {
      const token = "valid-token-12345678901234567890";
      const req = makeRequest("POST", "/api/artists", {
        cookies: { "csrf-token": token },
        headers: { "x-csrf-token": token },
      });
      const result = validateCsrf(req);
      expect(result).toBeNull();
    });

    it("blocks PATCH to protected route without token", async () => {
      const req = makeRequest("PATCH", "/api/station-songs/abc123");
      const result = validateCsrf(req);
      expect(result).not.toBeNull();
    });

    it("blocks DELETE to protected route without token", async () => {
      const req = makeRequest("DELETE", "/api/station-songs/abc123");
      const result = validateCsrf(req);
      expect(result).not.toBeNull();
    });

    it("skips non-API routes", () => {
      const req = makeRequest("POST", "/login");
      const result = validateCsrf(req);
      expect(result).toBeNull();
    });
  });

  describe("ensureCsrfCookie", () => {
    it("sets cookie when not present", () => {
      const req = makeRequest("GET", "/");
      const response = NextResponse.next();
      ensureCsrfCookie(req, response);

      const setCookie = response.headers.get("set-cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain("csrf-token=");
    });

    it("does not overwrite existing cookie", () => {
      const req = makeRequest("GET", "/", {
        cookies: { "csrf-token": "existing-token" },
      });
      const response = NextResponse.next();
      ensureCsrfCookie(req, response);

      // Should not set a new cookie
      const setCookie = response.headers.get("set-cookie");
      expect(setCookie).toBeNull();
    });
  });
});
