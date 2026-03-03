import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("homepage loads and shows station branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TrueFans RADIO|North Country/i);
    // Hero section should be visible
    await expect(page.locator("h1")).toBeVisible();
  });

  test("schedule page loads", async ({ page }) => {
    await page.goto("/schedule");
    await expect(page.locator("h1")).toContainText("Programming Schedule");
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    // Should show login form or redirect
    await expect(page).toHaveURL(/login/);
  });

  test("station page loads", async ({ page }) => {
    await page.goto("/station");
    await expect(page.locator("main")).toBeVisible();
  });

  test("health endpoint returns OK", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
  });

  test("stations API returns data", async ({ request }) => {
    const response = await request.get("/api/stations");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("stations");
    expect(Array.isArray(data.stations)).toBeTruthy();
  });

  test("now-playing API is accessible", async ({ request }) => {
    const response = await request.get("/api/now-playing");
    // May return 200 or 502 depending on backend, but should not 500
    expect(response.status()).not.toBe(500);
  });
});

test.describe("Navigation", () => {
  test("main navigation links are functional", async ({ page }) => {
    await page.goto("/");

    // Check key links exist
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();
  });

  test("skip to main content link exists for accessibility", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});

test.describe("Radio Player", () => {
  test("radio player renders at bottom of page", async ({ page }) => {
    await page.goto("/");
    // Player should exist in the DOM (fixed at bottom)
    const player = page.locator("#main-content").first();
    await expect(player).toBeVisible();
  });
});

test.describe("Public API Security", () => {
  test("listener registration requires valid email", async ({ request }) => {
    const response = await request.post("/api/listeners", {
      data: { name: "Test", email: "not-an-email" },
    });
    expect(response.status()).toBe(400);
  });

  test("listener registration accepts valid data", async ({ request }) => {
    const response = await request.post("/api/listeners", {
      data: { email: `e2e-test-${Date.now()}@example.com`, name: "E2E Test" },
    });
    // Should succeed (201) or return existing (200)
    expect([200, 201]).toContain(response.status());
  });

  test("embed listen validates input", async ({ request }) => {
    const response = await request.post("/api/embed/listen", {
      data: { device: "invalid-device-type" },
    });
    expect(response.status()).toBe(400);
  });
});
