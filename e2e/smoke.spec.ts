import { test, expect } from "@playwright/test";

test("homepage loads and shows navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Vanta/i);
});

test("login page renders form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
});
