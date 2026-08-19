import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { selectionsFromSearchParams, sortFromParams } from "./jobSearchState.ts";

const tJobs = (key: string) => key;

describe("job search params → filters and sort", () => {
  it("maps query string filters into facet selections", () => {
    const selections = selectionsFromSearchParams(
      {
        query: "õde",
        filters: [
          { facet: "location", value: "Tartu" },
          { facet: "workType", value: "remote" },
        ],
      },
      tJobs,
    );
    assert.deepEqual(
      selections.filter((s) => s.facet === "location" || s.facet === "workType"),
      [
        { facet: "location", value: "Tartu" },
        { facet: "workType", value: "remote" },
      ],
    );
  });

  it("falls back from match sort when ranking is unavailable", () => {
    assert.equal(sortFromParams({ sort: "match" }, false), "newest");
    assert.equal(sortFromParams({ sort: "match" }, true), "match");
    assert.equal(sortFromParams({ sort: "salary" }, false), "salary");
  });
});
