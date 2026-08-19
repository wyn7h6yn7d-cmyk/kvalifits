import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPLOYER_OWNER_UNIQUE_SQLSTATE,
  employerProfilePlaceholderRow,
  isEmployerOwnerUniqueViolation,
  otherOwnerMayCreateOwnProfile,
  resultFromEmployerOwnerInsert,
} from "./employerOwnerUniqueness.ts";

describe("employer owner uniqueness", () => {
  it("first employer profile create works", () => {
    const row = employerProfilePlaceholderRow("owner-a", "a@example.com");
    assert.equal(row.owner_user_id, "owner-a");
    const result = resultFromEmployerOwnerInsert(null);
    assert.equal(result.kind, "created");
  });

  it("second concurrent create for the same owner does not create a duplicate", () => {
    const first = resultFromEmployerOwnerInsert(null);
    const second = resultFromEmployerOwnerInsert({
      code: EMPLOYER_OWNER_UNIQUE_SQLSTATE,
      message: 'duplicate key value violates unique constraint "employer_profiles_owner_user_id_key"',
    });
    assert.equal(first.kind, "created");
    assert.equal(second.kind, "already_exists");
    assert.equal(isEmployerOwnerUniqueViolation({ code: "23505" }), true);
  });

  it("other users can create their own profiles", () => {
    const ownerA = resultFromEmployerOwnerInsert(null);
    const ownerB = resultFromEmployerOwnerInsert(null);
    assert.equal(ownerA.kind, "created");
    assert.equal(ownerB.kind, "created");
    assert.equal(otherOwnerMayCreateOwnProfile(), true);
    assert.notEqual(
      employerProfilePlaceholderRow("owner-a", "a@example.com").owner_user_id,
      employerProfilePlaceholderRow("owner-b", "b@example.com").owner_user_id,
    );
  });

  it("non-unique failures stay failed", () => {
    const result = resultFromEmployerOwnerInsert({
      code: "42501",
      message: "permission denied",
    });
    assert.equal(result.kind, "failed");
  });
});
