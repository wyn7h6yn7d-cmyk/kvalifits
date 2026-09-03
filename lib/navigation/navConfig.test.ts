import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPLOYER_NAV,
  GUEST_NAV,
  resolveDesktopNavItems,
  resolveMobileNavItems,
} from "./navConfig.ts";

describe("employer primary navigation", () => {
  it("has no duplicate hrefs", () => {
    const hrefs = EMPLOYER_NAV.map((item) => item.href);
    assert.deepEqual(hrefs, [...new Set(hrefs)]);
  });
});

describe("public guest navigation", () => {
  it("lists jobs first, then companies, audience pages, and FAQ", () => {
    assert.deepEqual(
      GUEST_NAV.map((item) => item.key),
      ["jobs", "companies", "forSeekers", "forEmployers", "faq"],
    );
    assert.deepEqual(
      GUEST_NAV.map((item) => item.href),
      ["/tood", "/ettevotted", "/toootsijatele", "/tooandjatele", "/kkk"],
    );
  });

  it("keeps the simple guest nav on public routes even when signed in", () => {
    assert.deepEqual(resolveDesktopNavItems("/tood", true, "seeker"), GUEST_NAV);
    assert.deepEqual(resolveDesktopNavItems("/", true, "employer"), GUEST_NAV);
    assert.deepEqual(resolveMobileNavItems("/toootsijatele", true, "seeker"), GUEST_NAV);
  });

  it("uses role nav only inside account and admin areas", () => {
    assert.notDeepEqual(resolveDesktopNavItems("/account/seeker", true, "seeker"), GUEST_NAV);
    assert.notDeepEqual(resolveDesktopNavItems("/account/employer", true, "employer"), GUEST_NAV);
    assert.notDeepEqual(resolveDesktopNavItems("/admin", true, "admin"), GUEST_NAV);
  });
});
