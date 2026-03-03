"use client";

import { useEffect } from "react";
import { getCsrfToken } from "@/lib/csrf-client";

/**
 * CSRF Provider — patches the global fetch to auto-inject the CSRF token
 * on same-origin state-changing requests (POST, PUT, PATCH, DELETE).
 *
 * This ensures ALL fetch calls in the app automatically include CSRF protection
 * without requiring each component to import csrfFetch individually.
 *
 * Mount this once in the root layout.
 */
export function CsrfProvider() {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const method = (init?.method || "GET").toUpperCase();
      const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

      if (!needsCsrf) {
        return originalFetch(input, init);
      }

      // Only patch same-origin /api/* requests
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
      const isSameOriginApi =
        url.startsWith("/api/") ||
        url.startsWith(`${window.location.origin}/api/`);

      if (!isSameOriginApi) {
        return originalFetch(input, init);
      }

      const token = getCsrfToken();
      if (!token) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers);
      if (!headers.has("x-csrf-token")) {
        headers.set("x-csrf-token", token);
      }

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
