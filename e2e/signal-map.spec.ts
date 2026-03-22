import { test, expect } from "@playwright/test";

/**
 * Signal Map / Relationship Graph E2E tests.
 * Tests the force-directed graph interactions.
 *
 * Run selectively: npx playwright test --grep @graph
 */

test.describe("Signal Map @graph @auth-required", () => {
  test.skip(
    !process.env.E2E_AUTHENTICATED,
    "Skipped: requires authenticated session (set E2E_AUTHENTICATED=1)"
  );

  test("graph page loads with heading", async ({ page }) => {
    await page.goto("/graph");
    await expect(page.getByTestId("graph-page")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/relationship graph/i)).toBeVisible();
  });

  test("force graph container renders", async ({ page }) => {
    await page.goto("/graph");
    await expect(page.getByTestId("graph-page")).toBeVisible({ timeout: 15000 });

    // The graph container should be visible (either canvas or empty state)
    const graphContainer = page.getByTestId("force-graph-container");
    const emptyState = page.getByText(/no contacts in signal history/i);

    // One of these should be visible
    const hasGraph = await graphContainer.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasGraph || hasEmpty).toBeTruthy();
  });

  test("graph supports zoom via mouse wheel", async ({ page }) => {
    await page.goto("/graph");
    const container = page.getByTestId("force-graph-container");

    if (await container.isVisible().catch(() => false)) {
      const box = await container.boundingBox();
      if (box) {
        // Zoom in with mouse wheel
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -100);
        // No assertion on exact zoom level — we just verify no crash
        await expect(container).toBeVisible();
      }
    }
  });

  test("graph supports pan via mouse drag", async ({ page }) => {
    await page.goto("/graph");
    const container = page.getByTestId("force-graph-container");

    if (await container.isVisible().catch(() => false)) {
      const box = await container.boundingBox();
      if (box) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 50, cy + 30, { steps: 5 });
        await page.mouse.up();
        // Verify graph is still rendered
        await expect(container).toBeVisible();
      }
    }
  });

  test("contact table renders below graph", async ({ page }) => {
    await page.goto("/graph");
    await expect(page.getByTestId("graph-page")).toBeVisible({ timeout: 15000 });

    // If there are contacts, the fallback table should be visible
    const contactRow = page.getByText(/contact/i);
    if (await contactRow.isVisible().catch(() => false)) {
      await expect(page.getByText(/signals/i)).toBeVisible();
    }
  });
});

test.describe("Signal Map — network failure @graph @failure-path", () => {
  test("handles network error gracefully", async ({ page }) => {
    // Intercept Supabase API calls and simulate failure
    await page.route("**/rest/v1/signals*", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      })
    );

    await page.goto("/graph");
    // Should still render the page without crashing
    // Will show either empty state or error handling
    const pageContainer = page.getByTestId("graph-page");
    if (await pageContainer.isVisible({ timeout: 15000 }).catch(() => false)) {
      // Check that empty state shows (since API returned error)
      await expect(page.getByText(/no contacts in signal history/i)).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
