import { expect, test } from "@playwright/test";

import { dismissCookieBanner } from "./helpers";

test.describe("mobile seeker browse", () => {
  test("job seeker can open jobs search on a mobile viewport", async ({ page }) => {
    const res = await page.goto("/et/tood");
    expect(res?.ok()).toBeTruthy();
    await dismissCookieBanner(page);
    await expect(page.getByRole("heading", { name: "Tööpakkumised" })).toBeVisible();
    await expect(page.locator("#job-search-query")).toBeVisible();
    await page.locator("#job-search-query").fill("õde");
    await page.getByRole("button", { name: /Otsi/i }).click();
    await expect(page).toHaveURL(/query=/, { timeout: 12_000 });
  });
});

const VIEWPORTS = [
  { width: 320, height: 800, label: "320" },
  { width: 360, height: 800, label: "360" },
  { width: 375, height: 800, label: "375" },
  { width: 390, height: 800, label: "390" },
  { width: 430, height: 900, label: "430" },
  { width: 768, height: 900, label: "768" },
  { width: 1024, height: 900, label: "1024" },
] as const;

const ROUTES_ET = [
  { path: "/tood", label: "job search" },
  { path: "/ettevotted", label: "company directory" },
  { path: "/toootsijatele", label: "job seeker landing" },
  { path: "/tooandjatele", label: "employer landing" },
  { path: "/hinnakiri", label: "pricing" },
  { path: "/privaatsus", label: "privacy" },
  { path: "/tingimused", label: "terms" },
  { path: "/auth/login", label: "login" },
] as const;

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth > 2);
  expect(overflow, "horizontal overflow (scrollWidth > innerWidth)").toBe(false);
}

test.describe("mobile final QA (public routes, overflow + menu visibility)", () => {
  for (const vp of VIEWPORTS) {
    test(`ET public routes fit @${vp.label}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const r of ROUTES_ET) {
        await page.goto(`/et${r.path}`);
        await expect(page.locator("body")).toBeVisible();
        await expectNoHorizontalOverflow(page);

        if (r.path === "/tood") {
          // Filters: ensure the filter control and any resulting dialog stay within the viewport.
          const filterBtn = page.getByRole("button", { name: /Filtrid|Filter/i }).first();
          if (await filterBtn.isVisible().catch(() => false)) {
            await filterBtn.click();
            const dialog = page.getByRole("dialog");
            await expect(dialog).toBeVisible();
            await expectNoHorizontalOverflow(page);
            await page.keyboard.press("Escape");
          }

          // Job detail: if there are any job cards, open the first one and ensure it fits.
          const jobLink = page.locator(`a[href*="/et/tood/"]`).first();
          if ((await jobLink.count()) > 0) {
            await jobLink.click();
            await expect(page.locator("h1")).toBeVisible();
            await expectNoHorizontalOverflow(page);
            await page.goto("/et/tood");
            await expect(page.locator("body")).toBeVisible();
          }
        }

        if (r.path === "/ettevotted") {
          // Company detail: if there are any company cards, open the first one and ensure it fits.
          const companyLink = page.locator(`a[href*="/et/ettevotted/"]`).first();
          if ((await companyLink.count()) > 0) {
            await companyLink.click();
            await expect(page.locator("h1")).toBeVisible();
            await expectNoHorizontalOverflow(page);
            await page.goto("/et/ettevotted");
            await expect(page.locator("body")).toBeVisible();
          }
        }
      }

      // Language switcher: menu must not render outside the viewport.
      await page.goto("/et/tood");
      await dismissCookieBanner(page);
      const langBtn = page.getByRole("button", {
        name: /Choose language|Vali keel|Выбрать язык/i,
      }).first();
      await expect(langBtn).toBeVisible();
      await langBtn.click();

      const menu = page.getByRole("menu", { name: /Choose language|Vali keel|Выбрать язык/i });
      await expect(menu).toBeVisible();
      const box = await menu.boundingBox();
      expect(box, "language menu bounding box").not.toBeNull();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 2);
        expect(box.y).toBeGreaterThanOrEqual(-2);
        expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 2);
      }
      await page.keyboard.press("Escape");
    });
  }
});
