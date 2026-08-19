import { expect, test } from "@playwright/test";

test.describe("mobile seeker browse", () => {
  test("job seeker can open jobs search on a mobile viewport", async ({ page }) => {
    const res = await page.goto("/et/tood");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Tööpakkumised" })).toBeVisible();
    await expect(page.locator("#job-search-query")).toBeVisible();
    await page.locator("#job-search-query").fill("õde");
    await expect(page).toHaveURL(/query=/, { timeout: 8_000 });
  });
});
