import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parsePaginationParams,
  paginationRange,
  buildPaginatedResult,
  paginationSearchParams,
} from "./serverPagination.ts";

describe("parsePaginationParams", () => {
  it("defaults to page 1", () => {
    const p = parsePaginationParams({});
    assert.equal(p.page, 1);
    assert.equal(p.pageSize, 25);
  });

  it("parses valid page", () => {
    assert.equal(parsePaginationParams({ page: "3" }).page, 3);
  });

  it("clamps invalid page to 1", () => {
    assert.equal(parsePaginationParams({ page: "0" }).page, 1);
    assert.equal(parsePaginationParams({ page: "-5" }).page, 1);
    assert.equal(parsePaginationParams({ page: "abc" }).page, 1);
  });
});

describe("paginationRange", () => {
  it("returns correct range for page 1", () => {
    const r = paginationRange({ page: 1, pageSize: 25 });
    assert.equal(r.from, 0);
    assert.equal(r.to, 24);
  });

  it("returns correct range for page 3", () => {
    const r = paginationRange({ page: 3, pageSize: 10 });
    assert.equal(r.from, 20);
    assert.equal(r.to, 29);
  });
});

describe("buildPaginatedResult", () => {
  it("calculates total pages correctly", () => {
    const r = buildPaginatedResult(["a", "b"], 50, { page: 1, pageSize: 25 });
    assert.equal(r.totalPages, 2);
    assert.equal(r.totalCount, 50);
    assert.equal(r.page, 1);
  });

  it("clamps page to totalPages", () => {
    const r = buildPaginatedResult([], 10, { page: 99, pageSize: 25 });
    assert.equal(r.page, 1);
  });
});

describe("paginationSearchParams", () => {
  it("preserves filters and adds page", () => {
    const qs = paginationSearchParams({ status: "active" }, 3);
    assert.ok(qs.includes("status=active"));
    assert.ok(qs.includes("page=3"));
  });

  it("omits page=1", () => {
    const qs = paginationSearchParams({}, 1);
    assert.ok(!qs.includes("page"));
  });
});
