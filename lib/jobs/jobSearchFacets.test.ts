import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Job } from "../../components/jobs/types.ts";
import { jobMatchesSelections } from "./jobSearchFacets.ts";

function job(partial: Partial<Job>): Job {
  return {
    id: "1",
    title: "Nurse",
    company: "Co",
    location: "Tallinn",
    type: "full_time",
    workType: "on_site",
    jobType: "full_time",
    tags: [],
    requiredCerts: [],
    skills: ["First aid"],
    ...partial,
  };
}

describe("job search filters", () => {
  it("matches location and work type selections", () => {
    const published = job({ location: "Tallinn", workType: "remote" });
    assert.equal(
      jobMatchesSelections(published, [
        { facet: "location", value: "Tallinn" },
        { facet: "workType", value: "remote" },
      ]),
      true,
    );
    assert.equal(
      jobMatchesSelections(published, [{ facet: "location", value: "Pärnu" }]),
      false,
    );
  });

  it("matches structured skill filters", () => {
    assert.equal(
      jobMatchesSelections(job({}), [{ facet: "skill", value: "First aid" }]),
      true,
    );
    assert.equal(
      jobMatchesSelections(job({}), [{ facet: "skill", value: "Welding" }]),
      false,
    );
  });
});
