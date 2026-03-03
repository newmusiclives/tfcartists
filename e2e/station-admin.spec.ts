import { test, expect } from "@playwright/test";

test.describe("Station Admin Pages", () => {
  test("station admin hub loads", async ({ page }) => {
    await page.goto("/station-admin");
    await expect(page.locator("main")).toBeVisible();
  });

  test("music library page loads", async ({ page }) => {
    await page.goto("/station-admin/music");
    await expect(page.locator("main")).toBeVisible();
  });

  test("DJ editor page loads", async ({ page }) => {
    await page.goto("/station-admin/dj-editor");
    await expect(page.locator("main")).toBeVisible();
  });

  test("clocks page loads", async ({ page }) => {
    await page.goto("/station-admin/clocks");
    await expect(page.locator("main")).toBeVisible();
  });

  test("branding page loads", async ({ page }) => {
    await page.goto("/station-admin/branding");
    await expect(page.locator("main")).toBeVisible();
  });

  test("sponsor ads page loads", async ({ page }) => {
    await page.goto("/station-admin/sponsor-ads");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("API Data Endpoints", () => {
  test("station-songs API responds", async ({ request }) => {
    const res = await request.get("/api/station-songs");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("songs");
  });

  test("station-djs API responds", async ({ request }) => {
    const res = await request.get("/api/station-djs");
    expect(res.ok()).toBeTruthy();
  });

  test("clock-templates API responds", async ({ request }) => {
    const res = await request.get("/api/clock-templates");
    // May require auth, so accept 200 or 401
    expect([200, 401]).toContain(res.status());
  });

  test("sponsor inquiry form submits", async ({ request }) => {
    const res = await request.post("/api/sponsors/inquiry", {
      data: {
        businessName: "E2E Test Corp",
        contactName: "Test Contact",
        email: `e2e-${Date.now()}@test.com`,
        message: "Test inquiry from E2E",
      },
    });
    // Should succeed or require CSRF (both acceptable in E2E context)
    expect([200, 201, 403]).toContain(res.status());
  });
});
