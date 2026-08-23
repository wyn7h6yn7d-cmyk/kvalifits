import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EMPLOYER_PRIVATE_READ_COLUMNS,
  EMPLOYER_PROFILE_COLUMN_CLASS,
  EMPLOYER_PUBLIC_COLUMNS,
  EMPLOYER_SYSTEM_COLUMNS,
  adminMaySelectColumn,
  authenticatedNonOwnerMaySelectColumn,
  loginMustNotExposeColumn,
  ownerMaySelectColumn,
  publicSurfaceMaySelectColumn,
  type EmployerProfileColumn,
} from "./employerProfileFields.ts";

const ALL_COLUMNS = Object.keys(EMPLOYER_PROFILE_COLUMN_CLASS) as EmployerProfileColumn[];

describe("employer_profiles column classification", () => {
  it("treats company identity and public listing fields as PUBLIC", () => {
    for (const col of [
      "company_name",
      "public_slug",
      "logo_url",
      "company_description",
      "industry",
      "location",
      "website",
      "company_verified",
      "verification_status",
    ] as const) {
      assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS[col], "public");
    }
  });

  it("treats operational contacts and unpublished metadata as OWNER PRIVATE", () => {
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.contact_email, "owner_private");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.contact_phone, "owner_private");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.registry_code, "owner_private");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.owner_user_id, "owner_private");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.company_size, "owner_private");
  });

  it("treats verification admin metadata as ADMIN ONLY", () => {
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.verification_source, "admin_only");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.verified_at, "admin_only");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.show_on_homepage, "admin_only");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.homepage_logo_approved, "admin_only");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.carousel_logo_path, "admin_only");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.use_logo_plate, "admin_only");
  });

  it("treats search indexes as SYSTEM", () => {
    assert.deepEqual(EMPLOYER_SYSTEM_COLUMNS, ["search_text", "search_tsv"]);
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.search_text, "system");
    assert.equal(EMPLOYER_PROFILE_COLUMN_CLASS.search_tsv, "system");
  });
});

describe("employer_profiles read authorization", () => {
  it("gives anon and authenticated non-owners the same public columns", () => {
    for (const col of ALL_COLUMNS) {
      assert.equal(
        publicSurfaceMaySelectColumn(col),
        authenticatedNonOwnerMaySelectColumn(col),
        col,
      );
    }
    assert.ok(EMPLOYER_PUBLIC_COLUMNS.includes("company_name"));
    assert.equal(EMPLOYER_PUBLIC_COLUMNS.includes("contact_email"), false);
  });

  it("does not grant extra private employer fields by logging in", () => {
    for (const col of EMPLOYER_PRIVATE_READ_COLUMNS) {
      assert.equal(authenticatedNonOwnerMaySelectColumn(col), false, col);
      assert.equal(loginMustNotExposeColumn(col), true, col);
    }
    for (const col of EMPLOYER_SYSTEM_COLUMNS) {
      assert.equal(authenticatedNonOwnerMaySelectColumn(col), false, col);
      assert.equal(loginMustNotExposeColumn(col), true, col);
    }
  });

  it("allows the company owner to read owner fields but not search indexes", () => {
    assert.equal(ownerMaySelectColumn("contact_email"), true);
    assert.equal(ownerMaySelectColumn("registry_code"), true);
    assert.equal(ownerMaySelectColumn("company_name"), true);
    assert.equal(ownerMaySelectColumn("search_tsv"), false);
  });

  it("allows admin to read administrative fields but not search indexes", () => {
    assert.equal(adminMaySelectColumn("verification_source"), true);
    assert.equal(adminMaySelectColumn("contact_email"), true);
    assert.equal(adminMaySelectColumn("search_text"), false);
  });
});

describe("employer_profiles private-field probes (negative)", () => {
  it("blocks seeker and other-employer reads of contact_email", () => {
    assert.equal(authenticatedNonOwnerMaySelectColumn("contact_email"), false);
    assert.equal(authenticatedNonOwnerMaySelectColumn("contact_phone"), false);
  });

  it("blocks seeker reads of registry_code and owner_user_id", () => {
    assert.equal(authenticatedNonOwnerMaySelectColumn("registry_code"), false);
    assert.equal(authenticatedNonOwnerMaySelectColumn("owner_user_id"), false);
  });

  it("blocks seeker reads of verification admin metadata", () => {
    assert.equal(authenticatedNonOwnerMaySelectColumn("verification_source"), false);
    assert.equal(authenticatedNonOwnerMaySelectColumn("verified_at"), false);
  });

  it("blocks client reads of search_text / search_tsv", () => {
    assert.equal(publicSurfaceMaySelectColumn("search_tsv"), false);
    assert.equal(ownerMaySelectColumn("search_text"), false);
    assert.equal(adminMaySelectColumn("search_tsv"), false);
  });
});
