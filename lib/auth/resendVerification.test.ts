import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  RESEND_VERIFICATION_MAX_HITS,
  genericResendVerificationOk,
  invalidEmailResendResponse,
  normalizeResendVerificationEmail,
  publicResultAfterProviderResend,
  publicResultAfterRateLimit,
  resendHitAllowed,
  resendVerificationLimitOpts,
} from "./resendVerification.ts";

describe("email verification resend", () => {
  it("valid resend returns the generic success body", () => {
    const email = normalizeResendVerificationEmail("User@Example.ee");
    assert.equal(email, "user@example.ee");
    const result = publicResultAfterProviderResend(null);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { ok: true });
    assert.deepEqual(genericResendVerificationOk().body, { ok: true });
  });

  it("unknown email receives the same safe generic response", () => {
    const known = publicResultAfterProviderResend(null);
    const unknown = publicResultAfterProviderResend({ message: "User not found" });
    const alreadyConfirmed = publicResultAfterProviderResend({ message: "Email already confirmed" });
    assert.deepEqual(known.body, unknown.body);
    assert.deepEqual(known.body, alreadyConfirmed.body);
    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.deepEqual(known.body, { ok: true });
  });

  it("repeated spam is rate-limited", () => {
    const max = RESEND_VERIFICATION_MAX_HITS;
    assert.equal(max, 5);
    for (let hit = 1; hit <= max; hit++) {
      assert.equal(resendHitAllowed(hit, max), true, `hit ${hit}`);
    }
    assert.equal(resendHitAllowed(max + 1, max), false);

    const limited = publicResultAfterRateLimit({
      ok: false,
      retryAfterSeconds: 3600,
      hitCount: max + 1,
    });
    assert.ok(limited);
    assert.equal(limited.status, 429);
    assert.equal(limited.body.error, "rate_limited");
    assert.equal(limited.body.retryAfterSeconds, 3600);
    assert.equal(limited.headers?.["Retry-After"], "3600");
  });

  it("rejects malformed email without probing accounts", () => {
    assert.equal(normalizeResendVerificationEmail(""), null);
    assert.equal(normalizeResendVerificationEmail("not-an-email"), null);
    const result = invalidEmailResendResponse();
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "missing_email");
  });

  it("uses separate IP and IP+email rate-limit buckets", () => {
    const [ipOnly, ipEmail] = resendVerificationLimitOpts("1.2.3.4", "seeker@example.ee");
    const otherEmail = resendVerificationLimitOpts("1.2.3.4", "other@example.ee");
    assert.equal(ipOnly.action, "resend_verification");
    assert.equal(ipEmail.email, "seeker@example.ee");
    assert.equal("email" in ipOnly, false);
    assert.deepEqual(ipOnly, otherEmail[0]);
    assert.notEqual(ipEmail.email, otherEmail[1].email);
  });
});
