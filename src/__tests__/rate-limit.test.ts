import { describe, it, expect, vi } from "vitest";
import { getRateLimitIdentifier } from "@/lib/rate-limit/limiter";

describe("Rate Limiting", () => {
  describe("getRateLimitIdentifier", () => {
    it("uses userId when provided", () => {
      const req = new Request("http://localhost/api/test");
      const id = getRateLimitIdentifier(req, "user-123");
      expect(id).toBe("user:user-123");
    });

    it("uses X-Forwarded-For header when no userId", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      });
      const id = getRateLimitIdentifier(req);
      expect(id).toBe("ip:1.2.3.4");
    });

    it("uses X-Real-IP when no X-Forwarded-For", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-real-ip": "10.0.0.1" },
      });
      const id = getRateLimitIdentifier(req);
      expect(id).toBe("ip:10.0.0.1");
    });

    it("uses Netlify IP header when no standard headers", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-nf-client-connection-ip": "192.168.1.1" },
      });
      const id = getRateLimitIdentifier(req);
      expect(id).toBe("ip:192.168.1.1");
    });

    it("falls back to path-scoped anonymous identifier", () => {
      const req = new Request("http://localhost/api/artists");
      const id = getRateLimitIdentifier(req);
      expect(id).toBe("anon:/api/artists");
    });

    it("different paths produce different anonymous identifiers", () => {
      const req1 = new Request("http://localhost/api/artists");
      const req2 = new Request("http://localhost/api/listeners");
      expect(getRateLimitIdentifier(req1)).not.toBe(getRateLimitIdentifier(req2));
    });

    it("prefers userId over IP headers", () => {
      const req = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "1.2.3.4" },
      });
      const id = getRateLimitIdentifier(req, "user-456");
      expect(id).toBe("user:user-456");
    });
  });
});
