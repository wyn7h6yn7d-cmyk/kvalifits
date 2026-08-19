import { test } from "@playwright/test";

export function liveSeekerConfigured() {
  return Boolean(process.env.E2E_SEEKER_EMAIL && process.env.E2E_SEEKER_PASSWORD);
}

export function liveEmployerConfigured() {
  return Boolean(process.env.E2E_EMPLOYER_EMAIL && process.env.E2E_EMPLOYER_PASSWORD);
}

export function liveBlockedConfigured() {
  return Boolean(process.env.E2E_BLOCKED_EMAIL && process.env.E2E_BLOCKED_PASSWORD);
}

export async function fillLogin(page: import("@playwright/test").Page, email: string, password: string) {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
}

export async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: /Nõustun|Accept|Принять/i }).first();
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}
