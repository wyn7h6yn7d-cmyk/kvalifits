import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { dismissCookieBanner } from "./helpers";

const PUBLIC_ROUTES = [
  { path: "/et", name: "homepage" },
  { path: "/et/tood", name: "jobs" },
  { path: "/et/auth/login", name: "login" },
  { path: "/et/auth/register?role=seeker", name: "register seeker" },
  { path: "/et/internal/e2e/quick-apply-sheet", name: "quick apply harness" },
] as const;

test.describe("accessibility public launch smoke", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} has no serious/critical axe violations`, async ({ page }) => {
      await page.goto(route.path);
      await dismissCookieBanner(page);
      await page.locator("main, body").first().waitFor({ state: "visible" });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .disableRules(["color-contrast"])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        blocking,
        blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join("\n"),
      ).toEqual([]);
    });
  }
});
