import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  JOB_CONTENT_LINES_MAX,
  parseJobContentLines,
  sanitizeJobContentLines,
  stripJobContentLineColumns,
  validateJobContentLines,
} from "./jobContentLines.ts";

describe("job content lines (duties / benefits)", () => {
  it("treats empty input as a valid optional list", () => {
    assert.deepEqual(parseJobContentLines(null), []);
    assert.deepEqual(parseJobContentLines([]), []);
    assert.deepEqual(validateJobContentLines([]), { ok: true, value: [] });
    assert.deepEqual(validateJobContentLines(["", "  "]), { ok: true, value: [] });
  });

  it("parses string arrays and { text } objects, dropping blanks and duplicates", () => {
    assert.deepEqual(
      parseJobContentLines(["  Patient care  ", "", "Patient care", { text: "Shift handover" }]),
      ["Patient care", "Shift handover"],
    );
  });

  it("rejects oversized lists and too-short or too-long lines", () => {
    const tooMany = Array.from({ length: JOB_CONTENT_LINES_MAX + 1 }, (_, i) => `Duty ${i + 1}`);
    const many = validateJobContentLines(tooMany);
    assert.equal(many.ok, false);
    if (!many.ok) assert.equal(many.error, "too_many");

    const short = validateJobContentLines(["A"]);
    assert.equal(short.ok, false);
    if (!short.ok) assert.equal(short.error, "line_too_short");

    const long = validateJobContentLines(["x".repeat(201)]);
    assert.equal(long.ok, false);
    if (!long.ok) assert.equal(long.error, "line_too_long");
  });

  it("does not put owner fields into sanitized display lines", () => {
    const sanitized = sanitizeJobContentLines([{ text: "Health insurance", secret: "nope" }]);
    assert.deepEqual(sanitized, ["Health insurance"]);
    const stripped = stripJobContentLineColumns({
      title: "Nurse",
      duty_lines: ["A"],
      benefit_lines: ["B"],
    });
    assert.equal("duty_lines" in stripped, false);
    assert.equal("benefit_lines" in stripped, false);
    assert.equal(stripped.title, "Nurse");
  });
});
