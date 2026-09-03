import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getApprovedTestimonialsForLocale,
  isApprovedTestimonial,
  isHomeTestimonialsEnabled,
  shouldRenderHomeTestimonials,
} from "./loadApprovedTestimonials.ts";
import type { TestimonialEntry } from "./types.ts";

const baseValid: TestimonialEntry = {
  id: "t1",
  firstName: "Mari",
  role: "Elektrik",
  quote: "Leidsin tööpakkumise, kus nägin kohe, millised nõuded mul täidetud olid.",
  photoPath: "/marketing/testimonials/example.jpg",
  approved: true,
  locales: ["et", "en"],
};

describe("isHomeTestimonialsEnabled", () => {
  it("defaults to enabled", () => {
    assert.equal(isHomeTestimonialsEnabled({}), true);
  });

  it("respects explicit off values", () => {
    assert.equal(isHomeTestimonialsEnabled({ HOME_TESTIMONIALS_ENABLED: "0" }), false);
    assert.equal(isHomeTestimonialsEnabled({ HOME_TESTIMONIALS_ENABLED: "false" }), false);
    assert.equal(isHomeTestimonialsEnabled({ HOME_TESTIMONIALS_ENABLED: "off" }), false);
  });
});

describe("isApprovedTestimonial", () => {
  it("rejects unapproved or incomplete entries", () => {
    assert.equal(isApprovedTestimonial({ ...baseValid, approved: false }, { requirePhotoFile: false }), false);
    assert.equal(isApprovedTestimonial({ ...baseValid, firstName: "  " }, { requirePhotoFile: false }), false);
    assert.equal(isApprovedTestimonial({ ...baseValid, quote: "" }, { requirePhotoFile: false }), false);
    assert.equal(isApprovedTestimonial({ ...baseValid, company: "   " }, { requirePhotoFile: false }), false);
  });

  it("accepts complete approved entries when photo check is skipped", () => {
    assert.equal(isApprovedTestimonial(baseValid, { requirePhotoFile: false }), true);
  });

  it("rejects when photo file is required but missing", () => {
    assert.equal(isApprovedTestimonial(baseValid, { requirePhotoFile: true }), false);
  });
});

describe("getApprovedTestimonialsForLocale", () => {
  it("returns empty for production catalog (no fake stories)", () => {
    assert.deepEqual(getApprovedTestimonialsForLocale("et", { requirePhotoFile: false }), []);
  });

  it("filters by locale and feature flag", () => {
    const entries: TestimonialEntry[] = [
      baseValid,
      { ...baseValid, id: "t2", locales: ["ru"], firstName: "Anna" },
      { ...baseValid, id: "t3", approved: false, firstName: "Draft" },
    ];

    assert.equal(
      getApprovedTestimonialsForLocale("et", { entries, requirePhotoFile: false }).length,
      1,
    );
    assert.equal(
      getApprovedTestimonialsForLocale("ru", { entries, requirePhotoFile: false })[0]?.firstName,
      "Anna",
    );
    assert.deepEqual(
      getApprovedTestimonialsForLocale("et", {
        entries,
        requirePhotoFile: false,
        env: { HOME_TESTIMONIALS_ENABLED: "0" },
      }),
      [],
    );
  });

  it("shouldRenderHomeTestimonials mirrors non-empty approved list", () => {
    assert.equal(shouldRenderHomeTestimonials("et", { requirePhotoFile: false }), false);
    assert.equal(
      shouldRenderHomeTestimonials("et", {
        entries: [baseValid],
        requirePhotoFile: false,
      }),
      true,
    );
  });
});
