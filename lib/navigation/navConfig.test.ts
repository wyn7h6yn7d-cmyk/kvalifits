import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EMPLOYER_NAV } from "./navConfig.ts";

describe("employer primary navigation", () => {
  it("does not expose the unfinished messages stub", () => {
    assert.equal(
      EMPLOYER_NAV.some((item) => item.href === "/account/employer/messages" || item.key === "employerMessages"),
      false,
    );
  });

  it("has no duplicate hrefs", () => {
    const hrefs = EMPLOYER_NAV.map((item) => item.href);
    assert.deepEqual(hrefs, [...new Set(hrefs)]);
  });
});
