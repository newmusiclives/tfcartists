import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the auth module before importing
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

import { requireAuth, requireRole, requireAdmin, pickFields } from "@/lib/api/auth";
import { auth } from "@/lib/auth/config";

const mockAuth = vi.mocked(auth);

describe("API Auth Helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Clear env vars
    delete process.env.DEMO_MODE;
  });

  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  describe("requireAuth", () => {
    it("throws when no session exists", async () => {
      mockAuth.mockResolvedValue(null as any);
      await expect(requireAuth()).rejects.toThrow("Authentication required");
    });

    it("returns session when user is authenticated", async () => {
      const session = { user: { id: "1", name: "Admin", role: "admin" } };
      mockAuth.mockResolvedValue(session as any);
      const result = await requireAuth();
      expect(result).toEqual(session);
    });

    it("does NOT bypass auth in production even with DEMO_MODE=true", async () => {
      const origEnv = process.env.NODE_ENV;
      // @ts-ignore
      process.env.NODE_ENV = "production";
      process.env.DEMO_MODE = "true";
      mockAuth.mockResolvedValue(null as any);

      await expect(requireAuth()).rejects.toThrow("Authentication required");

      // @ts-ignore
      process.env.NODE_ENV = origEnv;
    });

    it("bypasses auth in development when DEMO_MODE=true", async () => {
      process.env.DEMO_MODE = "true";
      // NODE_ENV defaults to "test" in vitest, not "production"
      const result = await requireAuth();
      expect(result).toBeTruthy();
      expect(result.user.role).toBe("admin");
    });

    it("does NOT bypass auth when DEMO_MODE is not set", async () => {
      mockAuth.mockResolvedValue(null as any);
      await expect(requireAuth()).rejects.toThrow("Authentication required");
      expect(mockAuth).toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("returns null when user lacks required role", async () => {
      const session = { user: { id: "1", name: "Riley", role: "riley" } };
      mockAuth.mockResolvedValue(session as any);
      const result = await requireRole("harper");
      expect(result).toBeNull();
    });

    it("returns session when user has the required role", async () => {
      const session = { user: { id: "1", name: "Riley", role: "riley" } };
      mockAuth.mockResolvedValue(session as any);
      const result = await requireRole("riley");
      expect(result).toEqual(session);
    });

    it("admin always has access to any role", async () => {
      const session = { user: { id: "1", name: "Admin", role: "admin" } };
      mockAuth.mockResolvedValue(session as any);
      const result = await requireRole("riley", "harper");
      expect(result).toEqual(session);
    });

    it("returns null when no session exists", async () => {
      mockAuth.mockResolvedValue(null as any);
      const result = await requireRole("admin");
      expect(result).toBeNull();
    });
  });

  describe("requireAdmin", () => {
    it("returns null for non-admin users", async () => {
      const session = { user: { id: "1", name: "Riley", role: "riley" } };
      mockAuth.mockResolvedValue(session as any);
      const result = await requireAdmin();
      expect(result).toBeNull();
    });

    it("returns session for admin users", async () => {
      const session = { user: { id: "1", name: "Admin", role: "admin" } };
      mockAuth.mockResolvedValue(session as any);
      const result = await requireAdmin();
      expect(result).toEqual(session);
    });
  });

  describe("pickFields", () => {
    it("picks only allowed fields", () => {
      const body = { name: "Test", email: "a@b.com", role: "admin", secret: "bad" };
      const result = pickFields(body, ["name", "email"]);
      expect(result).toEqual({ name: "Test", email: "a@b.com" });
    });

    it("ignores fields not present in body", () => {
      const body = { name: "Test" };
      const result = pickFields(body, ["name", "email"]);
      expect(result).toEqual({ name: "Test" });
    });

    it("returns empty object when no allowed fields match", () => {
      const body = { secret: "bad" };
      const result = pickFields(body, ["name", "email"]);
      expect(result).toEqual({});
    });
  });
});
