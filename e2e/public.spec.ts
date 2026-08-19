import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("homepage renders", async ({ page }) => {
    const res = await page.goto("/et");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("link", { name: /Tööpakkumised|Jobs|Вакансии/i }).first()).toBeVisible();
  });

  test("published jobs listing renders", async ({ page }) => {
    const res = await page.goto("/et/tood");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Tööpakkumised" })).toBeVisible();
    await expect(page.locator("#job-search-query")).toBeVisible();
  });

  test("job detail opens from a listing when a published job exists", async ({ page }) => {
    await page.goto("/et/tood");
    const jobLink = page.locator('a[href*="/et/tood/"]').first();
    if ((await jobLink.count()) === 0) {
      test.info().annotations.push({ type: "note", description: "No published jobs in this environment" });
      return;
    }
    await jobLink.click();
    await expect(page).toHaveURL(/\/et\/tood\/[^/?#]+/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
