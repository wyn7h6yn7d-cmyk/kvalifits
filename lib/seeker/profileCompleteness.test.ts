import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeSeekerProfileCompleteness,
  computeSeekerProfileCompletenessFromProfile,
  emptySeekerProfileCompletenessPersistence,
  namedCertificateCountFromRows,
  seekerCoreComplete,
  seekerProfileCompletenessPersistence,
  type SeekerCompletenessInput,
} from "./profileCompleteness.ts";

const STORAGE_AVATAR = "https://example.supabase.co/storage/v1/object/public/avatars/user.png";
const OAUTH_AVATAR = "https://lh3.googleusercontent.com/a/oauth-photo";

function yearsAgoIso(years: number): string {
  const asOf = new Date();
  const y = asOf.getFullYear() - years;
  const m = String(asOf.getMonth() + 1).padStart(2, "0");
  const d = String(asOf.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function coreInput(overrides: Partial<SeekerCompletenessInput> = {}): SeekerCompletenessInput {
  return {
    avatarUrl: STORAGE_AVATAR,
    fullName: "Mari Mets",
    profileTitle: "Electrician",
    phone: "+372 5555 0000",
    location: "Tallinn",
    about: "I install and maintain electrical systems for residential and commercial sites.",
    skills: ["wiring", "safety"],
    experienceLevel: "mid",
    preferredJobTypes: ["full_time"],
    preferredLocations: ["Tallinn"],
    dateOfBirth: "1990-01-15",
    learningObligationStatus: null,
    hasBCategoryDriversLicense: false,
    namedCertificateCount: 0,
    ...overrides,
  };
}

describe("seeker profile completeness source of truth", () => {
  it("treats an empty profile as 0%, not core-complete, with core gaps", () => {
    const result = computeSeekerProfileCompleteness({});
    assert.equal(result.percent, 0);
    assert.equal(result.coreComplete, false);
    assert.equal(result.filled, 0);
    assert.equal(result.total, 12);
    assert.ok(result.missing.includes("avatar"));
    assert.ok(result.missing.includes("name"));
    assert.ok(result.missing.includes("skills"));
    assert.ok(result.missing.includes("certificate"));
    assert.deepEqual(result.gaps, result.missing);
    assert.deepEqual(result.completed, []);
    assert.deepEqual(emptySeekerProfileCompletenessPersistence(), {
      is_complete: false,
      completion_percent: 0,
    });
  });

  it("marks core complete without a certificate, while keeping percent below 100", () => {
    const result = computeSeekerProfileCompleteness(coreInput());
    assert.equal(result.coreComplete, true);
    assert.equal(result.percent, 92);
    assert.deepEqual(result.missing, ["certificate"]);
    assert.ok(result.completed.includes("name"));
    assert.ok(!result.completed.includes("certificate"));
    assert.deepEqual(seekerProfileCompletenessPersistence(result), {
      is_complete: true,
      completion_percent: 92,
    });
  });

  it("reaches 100% with a named certificate or a B-license, still without requiring certificates for core", () => {
    const withCert = computeSeekerProfileCompleteness(coreInput({ namedCertificateCount: 1 }));
    assert.equal(withCert.coreComplete, true);
    assert.equal(withCert.percent, 100);
    assert.deepEqual(withCert.missing, []);

    const withLicense = computeSeekerProfileCompleteness(
      coreInput({ namedCertificateCount: 0, hasBCategoryDriversLicense: true }),
    );
    assert.equal(withLicense.coreComplete, true);
    assert.equal(withLicense.percent, 100);
    assert.deepEqual(withLicense.missing, []);
  });

  it("never requires certificates for seekerCoreComplete, including the unused cert count param", () => {
    const seeker = {
      full_name: "Mari Mets",
      profile_title: "Electrician",
      phone: "+372 5555 0000",
      location: "Tallinn",
      about: "I install and maintain electrical systems for residential and commercial sites.",
      skills: ["wiring", "safety"],
      experience_level: "mid",
      preferred_job_types: ["full_time"],
      preferred_locations: ["Tallinn"],
      date_of_birth: "1990-01-15",
      learning_obligation_status: null,
    };
    assert.equal(seekerCoreComplete({ avatarOk: true, seeker, certRowsWithImage: 0 }), true);
    assert.equal(seekerCoreComplete({ avatarOk: true, seeker, certRowsWithImage: 99 }), true);
    assert.equal(seekerCoreComplete({ avatarOk: true, seeker }), true);
    assert.equal(
      computeSeekerProfileCompletenessFromProfile({ avatarOk: true, seeker }).coreComplete,
      true,
    );
  });

  it("requires a storage-uploaded avatar, not an empty or OAuth URL", () => {
    assert.equal(computeSeekerProfileCompleteness(coreInput({ avatarUrl: "" })).coreComplete, false);
    assert.equal(
      computeSeekerProfileCompleteness(coreInput({ avatarUrl: OAUTH_AVATAR })).coreComplete,
      false,
    );
    assert.equal(
      computeSeekerProfileCompleteness(coreInput({ avatarUrl: OAUTH_AVATAR, avatarOk: true })).coreComplete,
      true,
    );
    assert.ok(
      computeSeekerProfileCompleteness(coreInput({ avatarUrl: OAUTH_AVATAR })).missing.includes("avatar"),
    );
  });

  it("requires learning-obligation status only for ages 16–17", () => {
    const age16 = yearsAgoIso(16);
    const withoutStatus = computeSeekerProfileCompleteness(coreInput({ dateOfBirth: age16 }));
    assert.equal(withoutStatus.coreComplete, false);
    assert.ok(withoutStatus.missing.includes("dob"));

    const withStatus = computeSeekerProfileCompleteness(
      coreInput({ dateOfBirth: age16, learningObligationStatus: "not_subject_to" }),
    );
    assert.equal(withStatus.coreComplete, true);
    assert.ok(!withStatus.missing.includes("dob"));

    const adult = computeSeekerProfileCompleteness(
      coreInput({ dateOfBirth: yearsAgoIso(30), learningObligationStatus: "" }),
    );
    assert.equal(adult.coreComplete, true);
  });

  it("does not introduce extra mandatory fields such as CV or LinkedIn", () => {
    const result = computeSeekerProfileCompleteness(coreInput());
    assert.equal(result.coreComplete, true);
    assert.ok(!result.missing.some((key) => key !== "certificate"));
  });

  it("counts named certificates from rows the same way the dashboard does", () => {
    assert.equal(namedCertificateCountFromRows([{ certificate_name: "  First aid  " }, { certificate_name: "" }]), 1);
    assert.equal(namedCertificateCountFromRows(null), 0);
  });
});
