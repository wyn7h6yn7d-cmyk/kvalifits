import { test } from "@playwright/test";

const DUMMY_SUPABASE_ANON_KEY = "eyJhbGciOiJub25lIn0.e30.";

export { e2eTestFixturesAllowed } from "./fixtures/blockedUserFixture";

function liveSupabaseConfigured() {
  // “Live” tests require real Supabase connectivity and usable anon key.
  // If the anon key is the dummy value used for deterministic/UI tests, we
  // skip live scenarios explicitly (instead of failing in obscure ways).
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== DUMMY_SUPABASE_ANON_KEY,
  );
}

export function liveSeekerConfigured() {
  return (
    liveSupabaseConfigured() &&
    Boolean(process.env.E2E_SEEKER_EMAIL && process.env.E2E_SEEKER_PASSWORD)
  );
}

export function liveEmployerConfigured() {
  return (
    liveSupabaseConfigured() &&
    Boolean(process.env.E2E_EMPLOYER_EMAIL && process.env.E2E_EMPLOYER_PASSWORD)
  );
}

export function liveBlockedConfigured() {
  return (
    liveSupabaseConfigured() &&
    Boolean(process.env.E2E_BLOCKED_EMAIL && process.env.E2E_BLOCKED_PASSWORD)
  );
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
