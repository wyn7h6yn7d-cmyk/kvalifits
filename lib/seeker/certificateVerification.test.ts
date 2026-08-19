import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  defaultSubmittedVerification,
  parseCertificateVerificationStatus,
} from "./certificateVerification.ts";

describe("candidate cannot self-verify a certificate", () => {
  it("new uploads start as submitted, never verified", () => {
    const fields = defaultSubmittedVerification();
    assert.equal(fields.verification_status, "submitted");
    assert.equal(fields.verified_at, null);
    assert.equal(fields.verified_by, null);
    assert.notEqual(fields.verification_status, "verified");
  });

  it("unknown client-supplied status does not become verified", () => {
    assert.equal(parseCertificateVerificationStatus("verified_by_me"), "submitted");
    assert.equal(parseCertificateVerificationStatus("verified"), "verified");
  });
});
