import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CLIENT_INSERT_FORGE_COLUMNS,
  JOB_APPLICATION_COLUMN_CLASS,
  authenticatedMaySetOnInsert,
  clientInsertForgeIsBlocked,
  type JobApplicationColumn,
} from "./jobApplicationFieldLock.ts";

describe("job_applications INSERT field classification", () => {
  it("classifies candidate input columns as A", () => {
    assert.equal(JOB_APPLICATION_COLUMN_CLASS.job_post_id, "A");
    assert.equal(JOB_APPLICATION_COLUMN_CLASS.cover_letter, "A");
    assert.equal(JOB_APPLICATION_COLUMN_CLASS.application_answers, "A");
  });

  it("classifies match, snapshot, consent, and timestamps as server-controlled", () => {
    for (const col of [
      "match_score",
      "match_breakdown",
      "match_details",
      "shared_profile",
      "consent_to_share",
      "seeker_user_id",
      "status",
      "created_at",
      "updated_at",
      "status_updated_at",
      "employer_notified_at",
    ] as const) {
      assert.equal(JOB_APPLICATION_COLUMN_CLASS[col], "B");
    }
  });

  it("classifies employer pipeline fields as C", () => {
    assert.equal(JOB_APPLICATION_COLUMN_CLASS.employer_status, "C");
    assert.equal(JOB_APPLICATION_COLUMN_CLASS.employer_notes, "C");
  });

  it("classifies id and review fields as admin/audit", () => {
    assert.equal(JOB_APPLICATION_COLUMN_CLASS.id, "D");
    assert.equal(JOB_APPLICATION_COLUMN_CLASS.reviewed_at, "D");
    assert.equal(JOB_APPLICATION_COLUMN_CLASS.reviewed_by, "D");
  });

  it("does not allow authenticated PostgREST INSERT of any column", () => {
    for (const col of Object.keys(JOB_APPLICATION_COLUMN_CLASS) as JobApplicationColumn[]) {
      assert.equal(authenticatedMaySetOnInsert(col), false);
    }
  });
});

describe("job_applications INSERT forge attacks (negative)", () => {
  it("blocks seeker inserting match_score=100", () => {
    assert.equal(clientInsertForgeIsBlocked("match_score"), true);
  });

  it("blocks seeker inserting status=hired", () => {
    assert.equal(clientInsertForgeIsBlocked("status"), true);
  });

  it("blocks seeker inserting another user's seeker_user_id", () => {
    assert.equal(clientInsertForgeIsBlocked("seeker_user_id"), true);
  });

  it("blocks seeker forging employer/admin fields", () => {
    assert.equal(clientInsertForgeIsBlocked("employer_status"), true);
    assert.equal(clientInsertForgeIsBlocked("employer_notes"), true);
    assert.equal(clientInsertForgeIsBlocked("reviewed_at"), true);
    assert.equal(clientInsertForgeIsBlocked("reviewed_by"), true);
  });

  it("blocks seeker forging consent metadata and snapshots", () => {
    assert.equal(clientInsertForgeIsBlocked("consent_to_share"), true);
    assert.equal(clientInsertForgeIsBlocked("shared_profile"), true);
    assert.equal(clientInsertForgeIsBlocked("match_breakdown"), true);
    assert.equal(clientInsertForgeIsBlocked("match_details"), true);
  });

  it("covers the documented forge column set", () => {
    assert.deepEqual(CLIENT_INSERT_FORGE_COLUMNS, [
      "match_score",
      "status",
      "seeker_user_id",
      "employer_status",
      "employer_notes",
      "reviewed_at",
      "reviewed_by",
      "consent_to_share",
      "shared_profile",
      "match_breakdown",
      "match_details",
    ]);
    for (const col of CLIENT_INSERT_FORGE_COLUMNS) {
      assert.equal(clientInsertForgeIsBlocked(col), true);
    }
  });
});
