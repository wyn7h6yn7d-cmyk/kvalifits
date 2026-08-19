import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inferListingPackageDays, jobAcceptsApplications } from "./jobLifecycle.ts";

describe("published jobs are the only ones that accept applications", () => {
  const asOf = new Date("2026-08-18T12:00:00Z");

  it("published listing with future dates accepts applications", () => {
    assert.equal(
      jobAcceptsApplications(
        {
          status: "published",
          published_at: "2026-08-01T00:00:00Z",
          application_deadline: "2026-12-31",
          expires_at: "2026-12-31T21:59:59Z",
        },
        asOf,
      ),
      true,
    );
  });

  it("draft, archived, and expired listings do not accept applications", () => {
    assert.equal(jobAcceptsApplications({ status: "draft" }, asOf), false);
    assert.equal(jobAcceptsApplications({ status: "archived" }, asOf), false);
    assert.equal(
      jobAcceptsApplications(
        {
          status: "published",
          expires_at: "2026-01-01T00:00:00Z",
        },
        asOf,
      ),
      false,
    );
  });

  it("infers a 90-day package when the deadline is beyond 30 days", () => {
    assert.equal(inferListingPackageDays("2026-09-10", asOf), 30);
    assert.equal(inferListingPackageDays("2026-12-31", asOf), 90);
    assert.equal(inferListingPackageDays(null, asOf), 30);
  });
});
