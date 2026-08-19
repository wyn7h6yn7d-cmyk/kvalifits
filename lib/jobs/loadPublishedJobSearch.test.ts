import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterPublishedJobsAcceptingApplicationsForSearch } from "./loadPublishedJobSearch";

describe("loadPublishedJobSearch fallback filtering", () => {
  const asOf = new Date("2026-08-18T12:00:00Z");

  it("excludes expired listings and keeps only jobs that accept applications", () => {
    const rows = [
      {
        id: "active-1",
        status: "published",
        published_at: "2026-08-01T00:00:00Z",
        application_deadline: "2026-12-31",
        expires_at: "2026-12-31T21:59:59Z",
      },
      {
        id: "expired-1",
        status: "published",
        published_at: "2026-08-01T00:00:00Z",
        application_deadline: "2026-01-01",
        expires_at: "2026-01-01T00:00:00Z",
      },
    ] as never;

    const filtered = filterPublishedJobsAcceptingApplicationsForSearch(rows, asOf);
    assert.deepEqual(filtered.map((r) => r.id), ["active-1"]);
  });

  it("excludes non-published listings (e.g. manually closed) even if date fields exist", () => {
    const rows = [
      {
        id: "closed-1",
        status: "archived",
        published_at: "2026-08-01T00:00:00Z",
        application_deadline: "2099-12-31",
        expires_at: "2099-12-31T21:59:59Z",
      },
    ] as never;

    const filtered = filterPublishedJobsAcceptingApplicationsForSearch(rows, asOf);
    assert.deepEqual(filtered.map((r) => r.id), []);
  });
});

