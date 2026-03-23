import { describe, it, expect } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextConfig = require("../../next.config.js");

describe("Next.js redirects", () => {
  it("redirects /auth/signin to /login", async () => {
    const redirects = await nextConfig.redirects();
    const authRedirect = redirects.find(
      (r: any) => r.source === "/auth/signin"
    );
    expect(authRedirect).toBeDefined();
    expect(authRedirect.destination).toBe("/login");
    expect(authRedirect.permanent).toBe(true);
  });

  it("redirects /auth/sign-in to /login", async () => {
    const redirects = await nextConfig.redirects();
    const authRedirect = redirects.find(
      (r: any) => r.source === "/auth/sign-in"
    );
    expect(authRedirect).toBeDefined();
    expect(authRedirect.destination).toBe("/login");
    expect(authRedirect.permanent).toBe(true);
  });

  it("redirects /legal/privacy to /privacy", async () => {
    const redirects = await nextConfig.redirects();
    const legalPrivacy = redirects.find(
      (r: any) => r.source === "/legal/privacy"
    );
    expect(legalPrivacy).toBeDefined();
    expect(legalPrivacy.destination).toBe("/privacy");
    expect(legalPrivacy.permanent).toBe(true);
  });

  it("redirects /legal/terms to /terms", async () => {
    const redirects = await nextConfig.redirects();
    const legalTerms = redirects.find(
      (r: any) => r.source === "/legal/terms"
    );
    expect(legalTerms).toBeDefined();
    expect(legalTerms.destination).toBe("/terms");
    expect(legalTerms.permanent).toBe(true);
  });

  it("redirects /legal/cookies to /cookies", async () => {
    const redirects = await nextConfig.redirects();
    const legalCookies = redirects.find(
      (r: any) => r.source === "/legal/cookies"
    );
    expect(legalCookies).toBeDefined();
    expect(legalCookies.destination).toBe("/cookies");
    expect(legalCookies.permanent).toBe(true);
  });

  it("has exactly 5 redirect rules", async () => {
    const redirects = await nextConfig.redirects();
    expect(redirects).toHaveLength(5);
  });

  it("all redirects are permanent", async () => {
    const redirects = await nextConfig.redirects();
    for (const redirect of redirects) {
      expect(redirect.permanent).toBe(true);
    }
  });
});
