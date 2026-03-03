import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCsrfToken, csrfHeaders } from "@/lib/csrf-client";

describe("CSRF Client Helpers", () => {
  beforeEach(() => {
    // Reset cookies
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  describe("getCsrfToken", () => {
    it("returns null when no cookie is set", () => {
      expect(getCsrfToken()).toBeNull();
    });

    it("reads the csrf-token cookie", () => {
      document.cookie = "csrf-token=abc123; other=value";
      expect(getCsrfToken()).toBe("abc123");
    });

    it("handles multiple cookies", () => {
      document.cookie = "session=xyz; csrf-token=mytoken; theme=dark";
      expect(getCsrfToken()).toBe("mytoken");
    });
  });

  describe("csrfHeaders", () => {
    it("includes Content-Type by default", () => {
      const headers = csrfHeaders();
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("includes CSRF token when cookie exists", () => {
      document.cookie = "csrf-token=testtoken123";
      const headers = csrfHeaders();
      expect(headers["x-csrf-token"]).toBe("testtoken123");
    });

    it("does not include CSRF header when no cookie", () => {
      const headers = csrfHeaders();
      expect(headers["x-csrf-token"]).toBeUndefined();
    });

    it("merges extra headers", () => {
      const headers = csrfHeaders({ "X-Custom": "value" });
      expect(headers["X-Custom"]).toBe("value");
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });
});
