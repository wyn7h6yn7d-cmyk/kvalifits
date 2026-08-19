import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canAccessEmployerJobPreview,
  employerJobPreviewAccess,
  isDraftJob,
  isJobHiddenFromPublic,
  isPublicJobListing,
} from "./jobVisibility.ts";

describe("job draft visibility", () => {
  it("owner draft access is allowed for preview", () => {
    const job = { status: "draft", published_at: null };
    assert.equal(isDraftJob(job), true);
    assert.equal(
      employerJobPreviewAccess({
        job,
        viewerUserId: "employer-a",
        ownerUserId: "employer-a",
      }),
      "allow",
    );
    assert.equal(canAccessEmployerJobPreview({ viewerUserId: "employer-a", ownerUserId: "employer-a" }), true);
  });

  it("non-owner cannot preview", () => {
    const job = { status: "draft", published_at: null };
    assert.equal(
      employerJobPreviewAccess({
        job,
        viewerUserId: "employer-b",
        ownerUserId: "employer-a",
      }),
      "forbidden",
    );
    assert.equal(canAccessEmployerJobPreview({ viewerUserId: "employer-b", ownerUserId: "employer-a" }), false);
    assert.equal(
      employerJobPreviewAccess({
        job,
        viewerUserId: null,
        ownerUserId: "employer-a",
      }),
      "forbidden",
    );
  });

  it("draft is not public", () => {
    const draft = { status: "draft", published_at: null };
    assert.equal(isPublicJobListing(draft), false);
    assert.equal(isJobHiddenFromPublic(draft), true);
    assert.equal(isPublicJobListing({ status: "archived", published_at: null }), false);
  });

  it("publish makes it public", () => {
    const published = { status: "published", published_at: "2026-08-18T12:00:00Z" };
    assert.equal(isPublicJobListing(published), true);
    assert.equal(isJobHiddenFromPublic(published), false);
    assert.equal(isPublicJobListing({ status: "archived", published_at: "2026-08-01T00:00:00Z" }), true);
  });
});
