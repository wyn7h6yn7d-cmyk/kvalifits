import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { tracesSampleRateForEnv } from "./sentryOptions.ts";

describe("sentry sampling", () => {
  it("samples traces for hosted environments only", () => {
    assert.equal(tracesSampleRateForEnv("production"), 0.1);
    assert.equal(tracesSampleRateForEnv("preview"), 0.2);
    assert.equal(tracesSampleRateForEnv("development"), 0);
  });
});
