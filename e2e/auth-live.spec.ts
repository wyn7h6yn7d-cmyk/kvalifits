import { expect, test } from "@playwright/test";

import {
  fillLogin,
  liveEmployerConfigured,
  liveSeekerConfigured,
} from "./helpers";

test.describe("authenticated auth flows", () => {
  test("seeker login and logout", async ({ page }) => {
    test.skip(!liveSeekerConfigured(), "Set E2E_SEEKER_EMAIL and E2E_SEEKER_PASSWORD");
    await page.goto("/et/auth/login");
    await fillLogin(page, process.env.E2E_SEEKER_EMAIL!, process.env.E2E_SEEKER_PASSWORD!);
    await page.waitForURL(/\/(et|en|ru)\/account\/seeker/);
    await page.goto("/et/account/seeker/profile");
    await expect(page).toHaveURL(/\/(et|en|ru)\/(account\/seeker\/profile|onboarding\/seeker)/);
    await page.locator('form[action$="/auth/logout"] button[type="submit"]').first().click();
    await page.waitForURL(/\/(et|en|ru)(\/|$)/);
    await expect(page.getByRole("link", { name: /Logi sisse|Log in|Войти/i }).first()).toBeVisible();
  });

  test("employer login and logout", async ({ page }) => {
    test.skip(!liveEmployerConfigured(), "Set E2E_EMPLOYER_EMAIL and E2E_EMPLOYER_PASSWORD");
    await page.goto("/et/auth/login");
    await fillLogin(page, process.env.E2E_EMPLOYER_EMAIL!, process.env.E2E_EMPLOYER_PASSWORD!);
    await page.waitForURL(/\/(et|en|ru)\/account\/employer/);
    await page.goto("/et/account/employer/jobs");
    await expect(page).toHaveURL(/\/(et|en|ru)\/account\/employer\/jobs/);
    await page.locator('form[action$="/auth/logout"] button[type="submit"]').first().click();
    await page.waitForURL(/\/(et|en|ru)(\/|$)/);
  });
});
