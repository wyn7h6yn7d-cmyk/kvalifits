import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isJobFeaturedActive, getEmployerFeaturedDisplayState } from "./jobFeatured.ts";

const base = {
  status: "published" as const,
  published_at: "2026-01-01T00:00:00.000Z",
  expires_at: null,
  application_deadline: null,
  is_featured: true,
  featured_from: "2026-08-01T00:00:00.000Z",
  featured_until: "2026-09-01T00:00:00.000Z",
};

describe("isJobFeaturedActive", () => {
  it("returns true inside window for published accepting job", () => {
    assert.equal(isJobFeaturedActive(base, new Date("2026-08-15T12:00:00.000Z")), true);
  });

  it("returns false before featured_from", () => {
    assert.equal(isJobFeaturedActive(base, new Date("2026-07-31T23:59:59.000Z")), false);
  });

  it("returns false at or after featured_until", () => {
    assert.equal(isJobFeaturedActive(base, new Date("2026-09-01T00:00:00.000Z")), false);
  });

  it("returns false when not featured", () => {
    assert.equal(
      isJobFeaturedActive({ ...base, is_featured: false }, new Date("2026-08-15T12:00:00.000Z")),
      false,
    );
  });

  it("returns false for draft even with featured fields", () => {
    assert.equal(
      isJobFeaturedActive({ ...base, status: "draft" }, new Date("2026-08-15T12:00:00.000Z")),
      false,
    );
  });

  it("returns false when application deadline passed", () => {
    assert.equal(
      isJobFeaturedActive(
        {
          ...base,
          application_deadline: "2026-08-01",
        },
        new Date("2026-08-15T12:00:00.000Z"),
      ),
      false,
    );
  });

  it("returns false when expires_at passed", () => {
    assert.equal(
      isJobFeaturedActive(
        {
          ...base,
          expires_at: "2026-08-10T00:00:00.000Z",
        },
        new Date("2026-08-15T12:00:00.000Z"),
      ),
      false,
    );
  });
});

describe("getEmployerFeaturedDisplayState", () => {
  it("returns inactive when not featured", () => {
    assert.deepEqual(
      getEmployerFeaturedDisplayState({ ...base, is_featured: false }, new Date("2026-08-15T12:00:00.000Z")),
      { kind: "inactive" },
    );
  });

  it("returns active with until while featured window not ended", () => {
    assert.deepEqual(getEmployerFeaturedDisplayState(base, new Date("2026-08-15T12:00:00.000Z")), {
      kind: "active",
      until: base.featured_until,
    });
  });

  it("returns inactive after featured_until", () => {
    assert.deepEqual(
      getEmployerFeaturedDisplayState(base, new Date("2026-09-02T12:00:00.000Z")),
      { kind: "inactive" },
    );
  });

  it("returns inactive for draft", () => {
    assert.deepEqual(
      getEmployerFeaturedDisplayState({ ...base, status: "draft" }, new Date("2026-08-15T12:00:00.000Z")),
      { kind: "inactive" },
    );
  });
});
