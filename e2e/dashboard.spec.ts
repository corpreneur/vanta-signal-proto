import { test, expect, type Page } from "@playwright/test";

/**
 * Dashboard E2E tests.
 * These require an authenticated session.
 *
 * For CI without real auth, these tests verify the redirect behavior
 * and basic page structure. With real credentials, they test full flows.
 *
 * Run selectively: npx playwright test --grep @dashboard
 */

test.describe("Dashboard @dashboard", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login");
    await expect(page.getByTestId("auth-form")).toBeVisible();
  });

  test("login page has VANTA branding", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("VANTA")).toBeVisible();
    await expect(page.getByText("Less noise, more progress")).toBeVisible();
  });
});

test.describe("Dashboard — authenticated @dashboard @auth-required", () => {
  // These tests assume session is established.
  // In CI, they will be skipped unless E2E_SESSION_TOKEN is provided.
  // Locally, log in via the preview first.

  test.skip(
    !process.env.E2E_AUTHENTICATED,
    "Skipped: requires authenticated session (set E2E_AUTHENTICATED=1)"
  );

  test("dashboard loads with greeting", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("dashboard-root")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("dashboard-greeting")).toBeVisible();
    // Greeting should be time-appropriate
    const greetingText = await page.getByTestId("dashboard-greeting").textContent();
    expect(greetingText).toMatch(/good (morning|afternoon|evening)/i);
  });

  test("navigation sidebar is accessible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("dashboard-root")).toBeVisible({ timeout: 15000 });
    // Check that key nav links exist
    await expect(page.getByRole("link", { name: /signal/i })).toBeVisible();
  });

  test("can navigate to signals page", async ({ page }) => {
    await page.goto("/signals");
    await expect(page.getByText(/captured signals/i)).toBeVisible({ timeout: 15000 });
  });

  test("can navigate to contacts page", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.getByText(/contact/i)).toBeVisible({ timeout: 15000 });
  });
});
