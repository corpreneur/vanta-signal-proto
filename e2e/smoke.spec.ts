import { test, expect } from "@playwright/test";

/**
 * Smoke tests — fast, critical-path checks.
 * Run selectively: npx playwright test --grep @smoke
 */

test.describe("Smoke Tests @smoke", () => {
  test("login page renders with auth form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("auth-form")).toBeVisible();
    await expect(page.getByTestId("email-input")).toBeVisible();
    await expect(page.getByTestId("password-input")).toBeVisible();
    await expect(page.getByTestId("auth-submit")).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login");
    await expect(page.getByTestId("auth-form")).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/this-does-not-exist");
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });

  test("login shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("email-input").fill("bad@example.com");
    await page.getByTestId("password-input").fill("wrongpassword");
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("auth-error")).toBeVisible({ timeout: 10000 });
  });

  test("signup mode toggles correctly", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByTestId("auth-submit")).toContainText(/create account/i);
  });

  test("forgot password mode shows reset link button", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /forgot password/i }).click();
    await expect(page.getByTestId("auth-submit")).toContainText(/send reset link/i);
    // Password field should be hidden in forgot mode
    await expect(page.getByTestId("password-input")).not.toBeVisible();
  });
});
