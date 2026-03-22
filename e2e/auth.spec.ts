import { test, expect, type Page } from "@playwright/test";

/**
 * Authentication E2E tests.
 * These test the login/signup flow with real Supabase auth.
 *
 * For CI: Google OAuth is not tested via browser automation.
 * OAuth is tested via API-level mocking in integration tests.
 *
 * Run selectively: npx playwright test --grep @auth
 */

test.describe("Authentication @auth", () => {
  test("login form validates required fields", async ({ page }) => {
    await page.goto("/login");
    const submit = page.getByTestId("auth-submit");

    // HTML5 validation should prevent empty submit
    await submit.click();

    // We should still be on the login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("signup requires minimum password length", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /create account/i }).click();

    await page.getByTestId("email-input").fill("test@example.com");
    await page.getByTestId("password-input").fill("short");
    await page.getByTestId("auth-submit").click();

    // Should show validation error
    await expect(page.getByTestId("auth-error")).toContainText(/8 characters/i, {
      timeout: 5000,
    });
  });

  test("can switch between login, signup, and forgot modes", async ({ page }) => {
    await page.goto("/login");

    // Start on login
    await expect(page.getByTestId("auth-submit")).toContainText(/sign in/i);

    // Switch to signup
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByTestId("auth-submit")).toContainText(/create account/i);

    // Switch back to login
    await page.getByRole("button", { name: /back to sign in/i }).click();
    await expect(page.getByTestId("auth-submit")).toContainText(/sign in/i);

    // Switch to forgot
    await page.getByRole("button", { name: /forgot password/i }).click();
    await expect(page.getByTestId("auth-submit")).toContainText(/send reset link/i);
  });

  test("protected routes redirect to login when unauthenticated", async ({ page }) => {
    const protectedRoutes = ["/", "/signals", "/graph", "/contacts", "/settings"];
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL("**/login", { timeout: 5000 });
    }
  });
});
