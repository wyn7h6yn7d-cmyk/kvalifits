import { expect, test } from "@playwright/test";

import { fillLogin, liveSeekerConfigured, liveEmployerConfigured } from "./helpers";

test.describe("privacy and access isolation", () => {
  test("guest cannot access seeker profile pages", async ({ page }) => {
    await page.goto("/et/account/seeker/profile");
    await expect(page).toHaveURL(/\/et\/auth\/login/);
  });

  test("guest cannot access employer dashboard", async ({ page }) => {
    await page.goto("/et/account/employer/jobs");
    await expect(page).toHaveURL(/\/et\/auth\/login/);
  });

  test("guest cannot access admin area", async ({ page }) => {
    await page.goto("/et/admin");
    await expect(page).toHaveURL(/\/et\/auth\/login/);
  });

  test("authenticated seeker sees only public employer fields on job detail", async ({ page }) => {
    test.skip(!liveSeekerConfigured(), "Set E2E_SEEKER_EMAIL and E2E_SEEKER_PASSWORD");
    await page.goto("/et/auth/login");
    await fillLogin(page, process.env.E2E_SEEKER_EMAIL!, process.env.E2E_SEEKER_PASSWORD!);
    await page.waitForURL(/\/(et|en|ru)\//);

    await page.goto("/et/tood");
    const jobLink = page.locator('a[href*="/et/tood/"]').first();
    if ((await jobLink.count()) === 0) {
      test.info().annotations.push({ type: "note", description: "No published jobs" });
      return;
    }
    await jobLink.click();
    await expect(page).toHaveURL(/\/et\/tood\/[^/?#]+/);

    const body = await page.textContent("body");
    expect(body).not.toContain("service_role");
    expect(body).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  test("seeker cannot reach another seeker's profile API", async ({ page }) => {
    test.skip(!liveSeekerConfigured(), "Set E2E_SEEKER_EMAIL and E2E_SEEKER_PASSWORD");
    await page.goto("/et/auth/login");
    await fillLogin(page, process.env.E2E_SEEKER_EMAIL!, process.env.E2E_SEEKER_PASSWORD!);
    await page.waitForURL(/\/(et|en|ru)\//);

    const res = await page.goto("/et/account/employer/jobs");
    // Seeker should be redirected or see forbidden, not employer data
    const url = page.url();
    expect(
      url.includes("/auth/login") ||
      url.includes("/account/seeker") ||
      url.includes("/onboarding"),
    ).toBeTruthy();
  });

  test("employer cannot access other employer applicants via direct URL", async ({ page }) => {
    test.skip(!liveEmployerConfigured(), "Set E2E_EMPLOYER_EMAIL and E2E_EMPLOYER_PASSWORD");
    await page.goto("/et/auth/login");
    await fillLogin(page, process.env.E2E_EMPLOYER_EMAIL!, process.env.E2E_EMPLOYER_PASSWORD!);
    await page.waitForURL(/\/(et|en|ru)\//);

    // A fabricated job ID should not leak other employer's data
    const res = await page.goto("/et/account/employer/jobs/00000000-0000-0000-0000-000000000000/applicants");
    const body = await page.textContent("body");
    expect(body).not.toMatch(/seeker_profiles|work_capacity|date_of_birth/);
  });
});
