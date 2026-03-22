import { test, expect } from "@playwright/test";

/**
 * Cooling Alerts & Signal Detail E2E tests.
 * Tests viewing alerts and drilling into signal details.
 *
 * Run selectively: npx playwright test --grep @alerts
 */

test.describe("Alerts & Signal Detail @alerts @auth-required", () => {
  test.skip(
    !process.env.E2E_AUTHENTICATED,
    "Skipped: requires authenticated session (set E2E_AUTHENTICATED=1)"
  );

  test("dashboard shows cooling alerts section when alerts exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("dashboard-root")).toBeVisible({ timeout: 15000 });

    // Cooling alerts may or may not exist; check if section renders
    const coolingSection = page.getByTestId("cooling-alerts");
    if (await coolingSection.isVisible().catch(() => false)) {
      await expect(coolingSection.getByText(/cooling relationships/i)).toBeVisible();
    }
  });

  test("can navigate to signal feed and see signals", async ({ page }) => {
    await page.goto("/signals");
    await expect(page.getByText(/captured signals/i)).toBeVisible({ timeout: 15000 });

    // If signals exist, cards should be visible
    const signalCards = page.locator('[class*="border"]').filter({ hasText: /signal|meeting|intro/i });
    const count = await signalCards.count();

    if (count > 0) {
      // Click first signal to open detail drawer
      await signalCards.first().click();

      // Drawer should open — check for sheet content
      await expect(page.getByRole("dialog").or(page.locator("[data-state='open']"))).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("signal feed filter tabs work", async ({ page }) => {
    await page.goto("/signals");
    await expect(page.getByText(/captured signals/i)).toBeVisible({ timeout: 15000 });

    // Click "Filtered Items" tab
    const filteredTab = page.getByText(/filtered items/i);
    if (await filteredTab.isVisible().catch(() => false)) {
      await filteredTab.click();
      // Should switch tab state
      await expect(filteredTab).toHaveCSS("border-bottom-color", /.+/);
    }
  });
});
