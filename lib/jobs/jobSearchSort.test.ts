import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Job } from "../../components/jobs/types.ts";
import { parseJobSearchSort, sortJobs } from "./jobSearchSort.ts";

function job(partial: Partial<Job> & Pick<Job, "id">): Job {
  return {
    title: partial.title ?? partial.id,
    company: "Co",
    location: "Tallinn",
    type: "full_time",
    tags: [],
    requiredCerts: [],
    ...partial,
  };
}

describe("job search sort", () => {
  it("parses known sorts and falls back to newest", () => {
    assert.equal(parseJobSearchSort("match"), "match");
    assert.equal(parseJobSearchSort("newest"), "newest");
    assert.equal(parseJobSearchSort("salary"), "salary");
    assert.equal(parseJobSearchSort("deadline"), "deadline");
    assert.equal(parseJobSearchSort("nope"), "newest");
    assert.equal(parseJobSearchSort(undefined), "newest");
  });

  it("sorts by match score descending", () => {
    const sorted = sortJobs(
      [job({ id: "a", matchScore: 10 }), job({ id: "b", matchScore: 90 }), job({ id: "c" })],
      "match",
    );
    assert.deepEqual(sorted.map((j) => j.id), ["b", "a", "c"]);
  });

  it("sorts by salary max descending", () => {
    const sorted = sortJobs(
      [
        job({ id: "low", salaryMax: 1200 }),
        job({ id: "high", salaryMax: 4000 }),
        job({ id: "mid", salaryMin: 2000 }),
      ],
      "salary",
    );
    assert.deepEqual(sorted.map((j) => j.id), ["high", "mid", "low"]);
  });

  it("sorts by application deadline soonest first", () => {
    const sorted = sortJobs(
      [
        job({ id: "later", applicationDeadline: "2026-12-01" }),
        job({ id: "soon", applicationDeadline: "2026-09-01" }),
        job({ id: "none" }),
      ],
      "deadline",
    );
    assert.deepEqual(sorted.map((j) => j.id), ["soon", "later", "none"]);
  });

  it("sorts newest by publishedAt then createdAt", () => {
    const sorted = sortJobs(
      [
        job({ id: "old", publishedAt: "2026-01-01T00:00:00Z" }),
        job({ id: "new", publishedAt: "2026-08-01T00:00:00Z" }),
      ],
      "newest",
    );
    assert.deepEqual(sorted.map((j) => j.id), ["new", "old"]);
  });
});
