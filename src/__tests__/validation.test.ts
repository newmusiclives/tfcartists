import { describe, it, expect } from "vitest";
import {
  createListenerSchema,
  embedListenSchema,
  embedListenPatchSchema,
  createArtistSchema,
  createSponsorSchema,
  sendMessageSchema,
  paginationSchema,
  formatValidationError,
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  describe("createListenerSchema", () => {
    it("accepts valid listener data", () => {
      const result = createListenerSchema.safeParse({
        email: "test@example.com",
        name: "Test User",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing email", () => {
      const result = createListenerSchema.safeParse({ name: "Test" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = createListenerSchema.safeParse({ email: "not-an-email" });
      expect(result.success).toBe(false);
    });

    it("accepts optional fields", () => {
      const result = createListenerSchema.safeParse({
        email: "test@example.com",
        discoverySource: "organic",
        referralCode: "REF123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects name over 200 chars", () => {
      const result = createListenerSchema.safeParse({
        email: "test@example.com",
        name: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("embedListenSchema", () => {
    it("accepts empty object with defaults", () => {
      const result = embedListenSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.device).toBe("embed");
      }
    });

    it("accepts valid device types", () => {
      for (const device of ["embed", "web", "mobile", "desktop"]) {
        const result = embedListenSchema.safeParse({ device });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid device type", () => {
      const result = embedListenSchema.safeParse({ device: "smartfridge" });
      expect(result.success).toBe(false);
    });

    it("rejects ref over 50 chars", () => {
      const result = embedListenSchema.safeParse({ ref: "a".repeat(51) });
      expect(result.success).toBe(false);
    });
  });

  describe("embedListenPatchSchema", () => {
    it("rejects missing sessionId", () => {
      const result = embedListenPatchSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects invalid CUID", () => {
      const result = embedListenPatchSchema.safeParse({ sessionId: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("createArtistSchema", () => {
    it("accepts valid artist data", () => {
      const result = createArtistSchema.safeParse({
        name: "Test Artist",
        email: "artist@example.com",
        genre: "Americana",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing name", () => {
      const result = createArtistSchema.safeParse({ email: "a@b.com" });
      expect(result.success).toBe(false);
    });

    it("validates E.164 phone format", () => {
      const valid = createArtistSchema.safeParse({
        name: "Test",
        phone: "+12025551234",
      });
      expect(valid.success).toBe(true);

      const invalid = createArtistSchema.safeParse({
        name: "Test",
        phone: "555-1234",
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe("createSponsorSchema", () => {
    it("accepts valid sponsor data", () => {
      const result = createSponsorSchema.safeParse({
        businessName: "Test Corp",
        contactName: "John Doe",
        email: "john@testcorp.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required fields", () => {
      const result = createSponsorSchema.safeParse({
        businessName: "Test Corp",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("sendMessageSchema", () => {
    it("rejects content over 1000 chars", () => {
      const result = sendMessageSchema.safeParse({
        artistId: "clxyz123abc",
        content: "a".repeat(1001),
        intent: "initial_outreach",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("formatValidationError", () => {
    it("formats Zod errors correctly", () => {
      const result = createListenerSchema.safeParse({ email: "bad" });
      if (!result.success) {
        const formatted = formatValidationError(result.error);
        expect(formatted.message).toBe("Validation failed");
        expect(formatted.errors).toBeInstanceOf(Array);
        expect(formatted.errors.length).toBeGreaterThan(0);
        expect(formatted.errors[0]).toHaveProperty("field");
        expect(formatted.errors[0]).toHaveProperty("message");
      }
    });
  });
});
