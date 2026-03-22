import { test, expect } from "@playwright/test";

/**
 * Workflow / Alert Rule E2E tests.
 * Tests creating and managing automation workflows.
 *
 * Run selectively: npx playwright test --grep @workflow
 */

test.describe("Workflow Builder @workflow @auth-required", () => {
  test.skip(
    !process.env.E2E_AUTHENTICATED,
    "Skipped: requires authenticated session (set E2E_AUTHENTICATED=1)"
  );

  test("workflow builder page loads on settings", async ({ page }) => {
    // WorkflowBuilder is rendered inside the settings or my-rules page
    await page.goto("/my-rules");
    await expect(page.getByTestId("workflow-builder")).toBeVisible({ timeout: 15000 });
  });

  test("can open new workflow form", async ({ page }) => {
    await page.goto("/my-rules");
    await expect(page.getByTestId("workflow-builder")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("new-workflow-btn").click();
    await expect(page.getByTestId("workflow-name-input")).toBeVisible();
  });

  test("create workflow button is disabled without name", async ({ page }) => {
    await page.goto("/my-rules");
    await expect(page.getByTestId("workflow-builder")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("new-workflow-btn").click();
    const submitBtn = page.getByTestId("create-workflow-submit");
    await expect(submitBtn).toBeDisabled();
  });

  test("can fill workflow form and submit", async ({ page }) => {
    await page.goto("/my-rules");
    await expect(page.getByTestId("workflow-builder")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("new-workflow-btn").click();
    await page.getByTestId("workflow-name-input").fill("E2E Test Workflow");

    // Fill trigger condition
    const triggerValueInput = page.locator('input[placeholder="Value…"]').first();
    await triggerValueInput.fill("INTRO");

    // Submit
    const submitBtn = page.getByTestId("create-workflow-submit");
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Should show success toast or the workflow in the list
    await expect(page.getByText("E2E Test Workflow")).toBeVisible({ timeout: 10000 });
  });
});
