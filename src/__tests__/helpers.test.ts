import { describe, it, expect, vi } from "vitest";

// helpers.ts imports from auth/config -> next-auth which doesn't resolve in Vitest
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

import { withPagination, successResponse } from "@/lib/api/helpers";

describe("API Helpers", () => {
  describe("withPagination", () => {
    it("returns defaults when no params given", () => {
      const params = new URLSearchParams();
      const result = withPagination(params);
      expect(result).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
        sortBy: "createdAt",
        sortOrder: "desc",
        search: "",
      });
    });

    it("parses valid pagination params", () => {
      const params = new URLSearchParams({
        page: "3",
        limit: "50",
        sortBy: "name",
        sortOrder: "asc",
        search: "test",
      });
      const result = withPagination(params);
      expect(result).toEqual({
        page: 3,
        limit: 50,
        skip: 100,
        sortBy: "name",
        sortOrder: "asc",
        search: "test",
      });
    });

    it("clamps page to minimum of 1", () => {
      const params = new URLSearchParams({ page: "-5" });
      const result = withPagination(params);
      expect(result.page).toBe(1);
    });

    it("clamps limit to maximum of 100", () => {
      const params = new URLSearchParams({ limit: "999" });
      const result = withPagination(params);
      expect(result.limit).toBe(100);
    });

    it("clamps limit to minimum of 1", () => {
      const params = new URLSearchParams({ limit: "-5" });
      const result = withPagination(params);
      expect(result.limit).toBe(1);
    });

    it("rejects sortBy not in whitelist (falls back to createdAt)", () => {
      const params = new URLSearchParams({ sortBy: "password" });
      const result = withPagination(params);
      expect(result.sortBy).toBe("createdAt");
    });

    it("rejects sortBy SQL injection attempt", () => {
      const params = new URLSearchParams({ sortBy: "name; DROP TABLE artists" });
      const result = withPagination(params);
      expect(result.sortBy).toBe("createdAt");
    });

    it("allows valid sortBy fields", () => {
      for (const field of ["name", "email", "status", "createdAt", "updatedAt"]) {
        const params = new URLSearchParams({ sortBy: field });
        const result = withPagination(params);
        expect(result.sortBy).toBe(field);
      }
    });

    it("normalizes sortOrder to desc for invalid values", () => {
      const params = new URLSearchParams({ sortOrder: "invalid" });
      const result = withPagination(params);
      expect(result.sortOrder).toBe("desc");
    });

    it("accepts custom allowed sort fields", () => {
      const custom = new Set(["customField", "anotherField"]);
      const params = new URLSearchParams({ sortBy: "customField" });
      const result = withPagination(params, custom);
      expect(result.sortBy).toBe("customField");
    });

    it("rejects sort fields not in custom whitelist", () => {
      const custom = new Set(["customField"]);
      const params = new URLSearchParams({ sortBy: "name" });
      const result = withPagination(params, custom);
      expect(result.sortBy).toBe("createdAt");
    });
  });

  describe("successResponse", () => {
    it("returns JSON response with default 200 status", async () => {
      const res = successResponse({ data: "test" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ data: "test" });
    });

    it("returns JSON response with custom status", async () => {
      const res = successResponse({ created: true }, 201);
      expect(res.status).toBe(201);
    });
  });
});
