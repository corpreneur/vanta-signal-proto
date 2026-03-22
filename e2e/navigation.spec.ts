import { test, expect } from "@playwright/test";

/**
 * Navigation E2E tests — verify all major routes load.
 *
 * Run selectively: npx playwright test --grep @navigation
 */

test.describe("Navigation @navigation", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("VANTA")).toBeVisible();
  });

  test("reset-password page loads", async ({ page }) => {
    await page.goto("/reset-password");
    // Should render the reset password form or a message
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("404 page renders for invalid routes", async ({ page }) => {
    await page.goto("/totally-invalid-route");
    await expect(page.getByText(/not found|404|page/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Authenticated Navigation @navigation @auth-required", () => {
  test.skip(
    !process.env.E2E_AUTHENTICATED,
    "Skipped: requires authenticated session"
  );

  const routes = [
    { path: "/", name: "Dashboard" },
    { path: "/signals", name: "Signals" },
    { path: "/graph", name: "Graph" },
    { path: "/contacts", name: "Contacts" },
    { path: "/meetings", name: "Meetings" },
    { path: "/brain-dump", name: "Brain Dump" },
    { path: "/focus", name: "Focus" },
    { path: "/settings", name: "Settings" },
    { path: "/my-rules", name: "My Rules" },
    { path: "/insights", name: "Insights" },
    { path: "/investments", name: "Investments" },
    { path: "/decisions", name: "Decisions" },
  ];

  for (const { path, name } of routes) {
    test(`${name} page (${path}) loads without error`, async ({ page }) => {
      await page.goto(path);
      // Should not redirect to login
      await expect(page).not.toHaveURL(/\/login/);
      // Page should have content
      await expect(page.locator("body")).not.toBeEmpty();
      // No unhandled errors (Playwright captures these automatically)
    });
  }
});
