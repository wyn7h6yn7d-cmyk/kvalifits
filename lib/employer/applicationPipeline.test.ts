import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  APPLICATION_PIPELINE_TERMINAL,
  isApplicationPipelineStatus,
  normalizeApplicationStatus,
} from "./applicationPipeline.ts";

describe("application withdrawal", () => {
  it("treats withdrawn as a terminal pipeline status", () => {
    assert.equal(isApplicationPipelineStatus("withdrawn"), true);
    assert.ok((APPLICATION_PIPELINE_TERMINAL as readonly string[]).includes("withdrawn"));
    assert.equal(normalizeApplicationStatus("withdrawn"), "withdrawn");
  });

  it("does not treat active hiring statuses as withdrawn", () => {
    assert.equal(normalizeApplicationStatus("new"), "new");
    assert.equal(normalizeApplicationStatus("reviewing"), "reviewing");
    assert.equal((APPLICATION_PIPELINE_TERMINAL as readonly string[]).includes("new"), false);
  });
});
