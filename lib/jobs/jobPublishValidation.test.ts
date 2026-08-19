import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateDraftSave, validateJobForPublish } from "./jobPublishValidation.ts";

function matchingReady(over: Record<string, unknown> = {}) {
  return {
    title: "Nurse",
    location: "Tallinn",
    work_type: "on_site",
    job_type: "full_time",
    short_summary: "Looking for a clinic nurse with patient care experience.",
    description: "Full description of duties, team, and working environment for this role.",
    requirement_lines: ["Valid nursing licence", "Estonian language"],
    required_skills: ["Nursing"],
    keywords: ["healthcare"],
    experience_level_required: "mid",
    application_type: "in_app",
    application_url: null,
    ...over,
  };
}

function publishInput(over: Partial<Parameters<typeof validateJobForPublish>[0]> = {}) {
  return {
    employerProfileComplete: true,
    companyName: "Kliinik OÜ",
    title: "Nurse",
    location: "Tallinn",
    workType: "on_site",
    jobType: "full_time",
    summary: "Looking for a clinic nurse with patient care experience.",
    description: "Full description of duties, team, and working environment for this role.",
    requirementLines: ["Valid nursing licence", "Estonian language"],
    requiredSkills: ["Nursing"],
    keywords: ["healthcare"],
    experienceLevelRequired: "mid",
    applicationDeadline: "2026-12-31",
    professionRequired: false,
    professionId: "",
    salary: {
      mode: "fixed" as const,
      min: "2000",
      max: "2000",
      tax: "bruto" as const,
      period: "month" as const,
      currency: "EUR",
    },
    matching: matchingReady(),
    ...over,
  };
}

describe("job publish validation", () => {
  it("allows a complete listing to publish", () => {
    assert.deepEqual(validateJobForPublish(publishInput()), { ok: true });
  });

  it("requires title, company, description, location, salary, requirements, and deadline", () => {
    assert.equal(validateJobForPublish(publishInput({ title: "" })).ok, false);
    assert.equal(validateJobForPublish(publishInput({ companyName: "  " })).ok, false);
    assert.equal(validateJobForPublish(publishInput({ description: "too short" })).ok, false);
    assert.equal(validateJobForPublish(publishInput({ location: "" })).ok, false);
    assert.equal(
      validateJobForPublish(publishInput({ salary: { mode: "", min: "", max: "", tax: "bruto", period: "month" } })).ok,
      false,
    );
    assert.equal(validateJobForPublish(publishInput({ requirementLines: ["one"] })).ok, false);
    assert.equal(validateJobForPublish(publishInput({ applicationDeadline: "" })).ok, false);
  });

  it("does not require a complete listing to save a draft, only a title", () => {
    assert.deepEqual(validateDraftSave("Nurse"), { ok: true });
    assert.equal(validateDraftSave("").ok, false);
  });
});
