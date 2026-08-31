import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ACCOUNT_MFA_ERRORS,
  assertAal2AfterVerify,
  canUnenrollFactor,
  factorIdsForFullDisable,
  getVerifiedTotpFactors,
  isAal2,
  isInvalidMfaCode,
  resolveVerificationFactor,
} from "./accountMfa.ts";

describe("account MFA disable helpers", () => {
  const userFactors = [
    { id: "factor-a", status: "verified", friendly_name: "Phone" },
    { id: "factor-b", status: "verified", friendly_name: "Authenticator" },
    { id: "factor-pending", status: "unverified" },
  ];

  it("lists only verified TOTP factors for the signed-in user", () => {
    const verified = getVerifiedTotpFactors({ totp: userFactors });
    assert.equal(verified.length, 2);
    assert.deepEqual(
      verified.map((factor) => factor.id),
      ["factor-a", "factor-b"],
    );
  });

  it("plans full disable by removing every verified factor", () => {
    const verified = getVerifiedTotpFactors({ totp: userFactors });
    assert.deepEqual(factorIdsForFullDisable(verified), ["factor-a", "factor-b"]);
  });

  it("resolves the preferred verification factor when multiple exist", () => {
    const verified = getVerifiedTotpFactors({ totp: userFactors });
    assert.equal(resolveVerificationFactor(verified, "factor-b")?.id, "factor-b");
    assert.equal(resolveVerificationFactor(verified, "missing")?.id, "factor-a");
  });

  it("rejects disabling when no verified factor exists", () => {
    const result = canUnenrollFactor({ verifiedFactors: [], factorId: "factor-a" });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, ACCOUNT_MFA_ERRORS.NO_FACTOR);
  });

  it("rejects removing a factor that is not owned by the current user", () => {
    const verified = getVerifiedTotpFactors({ totp: userFactors });
    const result = canUnenrollFactor({
      verifiedFactors: verified,
      factorId: "someone-elses-factor",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error, ACCOUNT_MFA_ERRORS.FACTOR_NOT_OWNED);
  });

  it("requires aal2 before unenroll can proceed", () => {
    assert.equal(isAal2({ currentLevel: "aal1", nextLevel: "aal2" }), false);
    const gate = assertAal2AfterVerify({ currentLevel: "aal1", nextLevel: "aal2" });
    assert.equal(gate.ok, false);
    if (gate.ok) return;
    assert.equal(gate.error, ACCOUNT_MFA_ERRORS.AAL2_REQUIRED);

    assert.equal(isAal2({ currentLevel: "aal2", nextLevel: "aal2" }), true);
    assert.equal(assertAal2AfterVerify({ currentLevel: "aal2", nextLevel: "aal2" }).ok, true);
  });

  it("allows unenroll for verified factors owned by the current user", () => {
    const verified = getVerifiedTotpFactors({ totp: userFactors });
    assert.equal(canUnenrollFactor({ verifiedFactors: verified, factorId: "factor-a" }).ok, true);
    assert.equal(canUnenrollFactor({ verifiedFactors: verified, factorId: "factor-b" }).ok, true);
  });
});
