import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EDUCATION_MAX_ROWS,
  canAddEducationRow,
  educationPeriodLabel,
  educationSnapshotForShare,
  parseEducationRows,
  validateSeekerEducationInput,
  type SeekerEducationRow,
} from "./education.ts";

const asOf = new Date("2026-08-19T00:00:00Z");

describe("seeker education validation", () => {
  it("accepts a complete optional record", () => {
    const result = validateSeekerEducationInput(
      {
        institution: "TalTech",
        field_of_study: "Electrical engineering",
        degree_or_level: "bachelor",
        start_year: 2018,
        end_year: 2022,
        currently_studying: false,
        description: "BSc",
      },
      asOf,
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.institution, "TalTech");
      assert.equal(result.value.start_year, 2018);
      assert.equal(result.value.end_year, 2022);
    }
  });

  it("does not require education at all — empty lists are valid", () => {
    assert.equal(canAddEducationRow(0), true);
    assert.deepEqual(parseEducationRows([]), []);
    assert.deepEqual(parseEducationRows(null), []);
  });

  it("accepts currently studying without an end year", () => {
    const result = validateSeekerEducationInput(
      {
        institution: "University of Tartu",
        degree_or_level: "master",
        start_year: 2024,
        currently_studying: true,
      },
      asOf,
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.currently_studying, true);
      assert.equal(result.value.end_year, null);
    }
  });

  it("requires institution and a known degree level", () => {
    assert.equal(
      validateSeekerEducationInput({ institution: "A", degree_or_level: "bachelor", start_year: 2020 }, asOf).ok,
      false,
    );
    assert.equal(
      validateSeekerEducationInput(
        { institution: "TalTech", degree_or_level: "wizard", start_year: 2020 },
        asOf,
      ).ok,
      false,
    );
  });

  it("rejects end before start and current study with an end year", () => {
    const order = validateSeekerEducationInput(
      {
        institution: "TalTech",
        degree_or_level: "master",
        start_year: 2024,
        end_year: 2020,
      },
      asOf,
    );
    assert.equal(order.ok, false);
    if (!order.ok) assert.equal(order.error, "year_order");

    const current = validateSeekerEducationInput(
      {
        institution: "TalTech",
        degree_or_level: "master",
        start_year: 2024,
        end_year: 2026,
        currently_studying: true,
      },
      asOf,
    );
    assert.equal(current.ok, false);
    if (!current.ok) assert.equal(current.error, "current_has_end");
  });

  it("rejects years outside the allowed range", () => {
    const old = validateSeekerEducationInput(
      { institution: "School", degree_or_level: "basic", start_year: 1900 },
      asOf,
    );
    assert.equal(old.ok, false);
    const future = validateSeekerEducationInput(
      { institution: "School", degree_or_level: "basic", start_year: 2099 },
      asOf,
    );
    assert.equal(future.ok, false);
  });

  it("caps how many rows a seeker can keep", () => {
    assert.equal(canAddEducationRow(EDUCATION_MAX_ROWS - 1), true);
    assert.equal(canAddEducationRow(EDUCATION_MAX_ROWS), false);
  });

  it("formats periods and snapshots without owner ids", () => {
    assert.equal(
      educationPeriodLabel({ start_year: 2019, end_year: 2023, currently_studying: false }),
      "2019–2023",
    );
    assert.equal(
      educationPeriodLabel({ start_year: 2024, end_year: null, currently_studying: true }),
      "2024–",
    );
    const row: SeekerEducationRow = {
      id: "edu-1",
      seeker_user_id: "user-1",
      institution: "UT",
      field_of_study: "Law",
      degree_or_level: "master",
      start_year: 2020,
      end_year: 2022,
      currently_studying: false,
      description: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    const snap = educationSnapshotForShare([row]);
    assert.equal("id" in snap[0], false);
    assert.equal("seeker_user_id" in snap[0], false);
    assert.equal(snap[0].institution, "UT");
  });

  it("drops invalid snapshot rows and sorts current study first", () => {
    const rows = parseEducationRows([
      { institution: "Old", degree_or_level: "bachelor", start_year: 2010, end_year: 2014 },
      { institution: "X", degree_or_level: "wizard", start_year: 2020 },
      {
        institution: "Current",
        degree_or_level: "master",
        start_year: 2024,
        currently_studying: true,
      },
    ]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.institution, "Current");
    assert.equal(rows[1]?.institution, "Old");
  });
});
