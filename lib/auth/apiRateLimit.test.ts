import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildApiRateLimitBucketKey } from "./apiRateLimit";

describe("buildApiRateLimitBucketKey", () => {
  it("includes action and ip", () => {
    const a = buildApiRateLimitBucketKey({ action: "job_report", ip: "1.2.3.4" });
    const b = buildApiRateLimitBucketKey({ action: "job_application", ip: "1.2.3.4" });
    assert.notEqual(a, b);
    assert.match(a, /^api:job_report:/);
  });

  it("scopes by user id when provided", () => {
    const a = buildApiRateLimitBucketKey({
      action: "job_application",
      ip: "1.2.3.4",
      userId: "user-a",
    });
    const b = buildApiRateLimitBucketKey({
      action: "job_application",
      ip: "1.2.3.4",
      userId: "user-b",
    });
    assert.notEqual(a, b);
  });
});
