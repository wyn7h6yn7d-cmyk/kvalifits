import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { seekerApplicationStatusLabelKey } from "./seekerFacingStatus.ts";

describe("seeker-facing application status labels", () => {
  it("maps new/submitted to sent", () => {
    assert.equal(seekerApplicationStatusLabelKey("new"), "seekerApplicationStatus_sent");
    assert.equal(seekerApplicationStatusLabelKey("submitted"), "seekerApplicationStatus_sent");
    assert.equal(seekerApplicationStatusLabelKey(null), "seekerApplicationStatus_sent");
    assert.equal(seekerApplicationStatusLabelKey(""), "seekerApplicationStatus_sent");
  });

  it("maps reviewing", () => {
    assert.equal(seekerApplicationStatusLabelKey("reviewing"), "seekerApplicationStatus_reviewing");
  });

  it("maps interview and interview_2", () => {
    assert.equal(seekerApplicationStatusLabelKey("interview"), "seekerApplicationStatus_interview");
    assert.equal(seekerApplicationStatusLabelKey("interview_2"), "seekerApplicationStatus_interview");
  });

  it("maps offer", () => {
    assert.equal(seekerApplicationStatusLabelKey("offer"), "seekerApplicationStatus_offer");
  });

  it("maps hired", () => {
    assert.equal(seekerApplicationStatusLabelKey("hired"), "seekerApplicationStatus_hired");
  });

  it("distinguishes withdrawn from rejected", () => {
    assert.equal(seekerApplicationStatusLabelKey("withdrawn"), "seekerApplicationStatus_withdrawn");
    assert.equal(seekerApplicationStatusLabelKey("rejected"), "seekerApplicationStatus_processEnded");
    assert.notEqual(
      seekerApplicationStatusLabelKey("withdrawn"),
      seekerApplicationStatusLabelKey("rejected"),
    );
  });

  it("never exposes employer internal notes", () => {
    const keys = [
      seekerApplicationStatusLabelKey("new"),
      seekerApplicationStatusLabelKey("reviewing"),
      seekerApplicationStatusLabelKey("interview"),
      seekerApplicationStatusLabelKey("offer"),
      seekerApplicationStatusLabelKey("hired"),
      seekerApplicationStatusLabelKey("rejected"),
      seekerApplicationStatusLabelKey("withdrawn"),
    ];
    for (const key of keys) {
      assert.ok(!key.includes("internal"), `${key} must not reference internal notes`);
      assert.ok(!key.includes("employer_note"), `${key} must not reference employer notes`);
    }
  });
});
