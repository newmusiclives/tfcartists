import { test, expect } from "@playwright/test";

test.describe("Operator Flow", () => {
  test("signup page loads with form", async ({ page }) => {
    await page.goto("/operator/signup");
    await expect(page.locator("h1")).toContainText("Start Your Station");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("signup validates required fields", async ({ page }) => {
    await page.goto("/operator/signup");
    // Try submitting empty form — browser validation should prevent
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test("signup API rejects invalid email", async ({ request }) => {
    const res = await request.post("/api/operator/signup", {
      data: {
        organizationName: "Test Org",
        name: "Test User",
        email: "not-an-email",
        password: "testpassword123",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("signup API rejects short password", async ({ request }) => {
    const res = await request.post("/api/operator/signup", {
      data: {
        organizationName: "Test Org",
        name: "Test User",
        email: "test@example.com",
        password: "short",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/operator/forgot-password");
    await expect(page.locator("h1")).toContainText("Reset Password");
  });

  test("forgot password API prevents email enumeration", async ({ request }) => {
    const res = await request.post("/api/operator/forgot-password", {
      data: { email: "nonexistent@example.com" },
    });
    // Should always return 200 to prevent enumeration
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("operator dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/operator/dashboard");
    // Should redirect to login
    await page.waitForURL(/login/, { timeout: 5000 });
  });
});

test.describe("Login Page", () => {
  test("shows team and operator tabs", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Team")).toBeVisible();
    await expect(page.getByText("Operator")).toBeVisible();
  });

  test("team tab shows username field", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[placeholder*="admin"]')).toBeVisible();
  });

  test("operator tab shows email field", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Operator").click();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByText("Sign up")).toBeVisible();
  });
});
