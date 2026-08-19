import { expect, test } from "@playwright/test";

import {
  createE2eAdminClient,
  createEphemeralBlockedUser,
  deleteEphemeralUser,
  e2eTestFixturesAllowed,
  type EphemeralBlockedUser,
} from "./fixtures/blockedUserFixture";
import { fillLogin, liveBlockedConfigured } from "./helpers";

test.describe("blocked user login", () => {
  let fixtureUser: EphemeralBlockedUser | null = null;

  test.beforeAll(async () => {
    if (!e2eTestFixturesAllowed()) return;
    const admin = createE2eAdminClient();
    fixtureUser = await createEphemeralBlockedUser(admin);
  });

  test.afterAll(async () => {
    if (!fixtureUser || !e2eTestFixturesAllowed()) return;
    const admin = createE2eAdminClient();
    await deleteEphemeralUser(admin, fixtureUser.userId);
    fixtureUser = null;
  });

  test("ephemeral blocked user cannot keep a session", async ({ page }) => {
    test.skip(
      !e2eTestFixturesAllowed() || !fixtureUser,
      "Set E2E_TEST_FIXTURES=1, E2E_SUPABASE_PROJECT_REF, SUPABASE_SERVICE_ROLE_KEY, and live Supabase URL/anon key",
    );

    await page.goto("/et/auth/login");
    await fillLogin(page, fixtureUser!.email, fixtureUser!.password);
    await expect(page).toHaveURL(/\/(et|en|ru)\/(blocked|auth\/login)/);
    await expect(page.getByText(/peatatud|suspended|заблокир/i).first()).toBeVisible();
  });

  test("permanent blocked credentials still work when configured", async ({ page }) => {
    test.skip(!liveBlockedConfigured(), "Set E2E_BLOCKED_EMAIL and E2E_BLOCKED_PASSWORD");
    await page.goto("/et/auth/login");
    await fillLogin(page, process.env.E2E_BLOCKED_EMAIL!, process.env.E2E_BLOCKED_PASSWORD!);
    await expect(page).toHaveURL(/\/(et|en|ru)\/(blocked|auth\/login)/);
    await expect(page.getByText(/peatatud|suspended|заблокир/i).first()).toBeVisible();
  });
});
