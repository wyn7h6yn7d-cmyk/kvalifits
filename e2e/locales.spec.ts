import { expect, test } from "@playwright/test";

test.describe("localization smoke", () => {
  test("Estonian login chrome", async ({ page }) => {
    const res = await page.goto("/et/auth/login");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("lang", "et");
    await expect(page.getByText("Logi sisse").first()).toBeVisible();
  });

  test("English login chrome", async ({ page }) => {
    const res = await page.goto("/en/auth/login");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Log in").first()).toBeVisible();
  });

  test("Russian login chrome", async ({ page }) => {
    const res = await page.goto("/ru/auth/login");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.getByText("Войти").first()).toBeVisible();
  });
});
