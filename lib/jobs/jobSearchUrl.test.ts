import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildJobSearchUrl, parseJobSearchParams } from "./jobSearchUrl.ts";

describe("job search URL: published listing query / filters / pagination / sort", () => {
  it("empty params are the published jobs listing", () => {
    assert.equal(buildJobSearchUrl({}), "/tood");
    const parsed = parseJobSearchParams({});
    assert.equal(parsed.query, undefined);
    assert.equal(parsed.page, undefined);
    assert.deepEqual(parsed.filters, []);
  });

  it("keeps the text query", () => {
    const url = buildJobSearchUrl({ query: "  õde  " });
    assert.equal(url, "/tood?query=%C3%B5de");
    assert.equal(parseJobSearchParams(new URLSearchParams("query=%C3%B5de")).query, "õde");
  });

  it("encodes facet filters", () => {
    const url = buildJobSearchUrl({
      filters: [
        { facet: "location", value: "Tallinn" },
        { facet: "workType", value: "remote" },
        { facet: "jobType", value: "full_time" },
      ],
    });
    assert.match(url, /f=loc%3ATallinn/);
    assert.match(url, /f=workType%3Aremote/);
    assert.match(url, /f=jobType%3Afull_time/);
    const parsed = parseJobSearchParams(new URLSearchParams(url.split("?")[1] ?? ""));
    assert.deepEqual(parsed.filters, [
      { facet: "location", value: "Tallinn" },
      { facet: "workType", value: "remote" },
      { facet: "jobType", value: "full_time" },
    ]);
  });

  it("omits page 1 and keeps page 2+", () => {
    assert.equal(buildJobSearchUrl({ page: 1 }), "/tood");
    assert.equal(buildJobSearchUrl({ page: 2, query: "nurse" }), "/tood?query=nurse&page=2");
    const parsed = parseJobSearchParams({ query: "nurse", page: "3" });
    assert.equal(parsed.page, 3);
    assert.equal(parsed.query, "nurse");
  });

  it("omits default newest sort and keeps other sorts", () => {
    assert.equal(buildJobSearchUrl({ sort: "newest" }), "/tood");
    assert.equal(buildJobSearchUrl({ sort: "salary" }), "/tood?sort=salary");
    assert.equal(buildJobSearchUrl({ sort: "deadline" }), "/tood?sort=deadline");
    assert.equal(buildJobSearchUrl({ sort: "match" }), "/tood?sort=match");
  });
});
