import { expect, test } from "@playwright/test";

test.describe("auth pages (no secrets)", () => {
  test("seeker and employer can open the login form", async ({ page }) => {
    await page.goto("/et/auth/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
    await expect(page.getByRole("link", { name: "Unustasid parooli?" })).toBeVisible();
  });

  test("forgot-password page renders", async ({ page }) => {
    const res = await page.goto("/et/auth/forgot-password");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByText("Parooli taastamine").first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("reset-password page renders", async ({ page }) => {
    const res = await page.goto("/et/auth/reset-password");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByText("Uus parool").first()).toBeVisible();
  });

  test("verification resend CTA appears when email is unconfirmed", async ({ page }) => {
    await page.goto("/et/auth/login?error=email_not_confirmed");
    await expect(page.getByText("Palun kinnita oma e-post ja proovi uuesti.").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Saada kinnitusmeil uuesti" }),
    ).toBeVisible();
  });

  test("blocked-account login error copy is shown", async ({ page }) => {
    await page.goto("/et/auth/login?error=account_blocked");
    await expect(page.getByText(/ligipääs on peatatud/i).first()).toBeVisible();
  });

  test("guest is redirected from seeker, employer, and admin account areas", async ({ page }) => {
    for (const path of [
      "/et/account",
      "/et/account/seeker",
      "/et/account/employer",
      "/et/admin",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/et\/auth\/login/);
    }
  });
});
