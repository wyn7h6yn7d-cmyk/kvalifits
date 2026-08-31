import { expect, test } from "@playwright/test";

import { dismissCookieBanner, liveSeekerConfigured } from "./helpers";

test.describe("Quick Apply sheet keyboard accessibility", () => {
  test("focus moves into the dialog, stays trapped, Escape returns to the trigger", async ({
    page,
  }) => {
    const res = await page.goto("/en/internal/e2e/quick-apply-sheet");
    expect(res?.ok()).toBeTruthy();
    await dismissCookieBanner(page);

    const trigger = page.getByTestId("quick-apply-open");
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await trigger.press("Enter");

    const dialog = page.getByRole("dialog", { name: "Apply" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog.getByText(/already on your profile/i)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close" })).toBeVisible();

    await expect
      .poll(async () => dialog.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);

    for (let i = 0; i < 16; i += 1) {
      await page.keyboard.press("Tab");
      const inside = await dialog.evaluate(
        (el) => el.contains(document.activeElement) || el === document.activeElement,
      );
      expect(inside, `tab ${i + 1} left the dialog`).toBe(true);
    }

    const field = dialog.getByRole("textbox");
    await field.focus();
    await expect(field).toBeVisible();

    const submit = dialog.getByRole("button", { name: "Send application" });
    await expect(submit).toBeVisible();
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("signed-in seeker can open Quick Apply from a published job", async ({ page }) => {
    test.skip(!liveSeekerConfigured(), "Set E2E_SEEKER_EMAIL and E2E_SEEKER_PASSWORD");
    await page.goto("/et/auth/login");
    await page.locator('input[type="email"]').fill(process.env.E2E_SEEKER_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.E2E_SEEKER_PASSWORD!);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/(et|en|ru)\/account\/seeker/);

    await page.goto("/et/tood");
    const jobLink = page.locator('a[href*="/et/tood/"]').first();
    if ((await jobLink.count()) === 0) {
      test.info().annotations.push({ type: "note", description: "No published jobs in this environment" });
      return;
    }
    await jobLink.click();
    await expect(page).toHaveURL(/\/et\/tood\/[^/?#]+/);

    const trigger = page.getByTestId("quick-apply-open").first();
    await expect(trigger).toBeVisible();
    await trigger.focus();
    await trigger.press("Enter");
    const dialog = page.getByTestId("quick-apply-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Sulge|Close|Закрыть/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
