import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ACCOUNT_BLOCKED_ERROR,
  BLOCKED_WRITE_SQLSTATE,
  NOT_AUTHENTICATED_ERROR,
  authGateBody,
  blockedSessionMayMutate,
  evaluateAuthGate,
  isBlockedAccountWriteError,
  loginSessionAllowed,
  profileLookupFailed,
  profileSecurityFromRow,
} from "./accountBlocked.ts";

describe("blocked-user authorization gate", () => {
  it("active seeker can access own API", () => {
    const gate = evaluateAuthGate({
      user: { id: "seeker-1" },
      security: { role: "seeker", isBlocked: false },
    });
    assert.equal(gate.ok, true);
    if (!gate.ok) return;
    assert.equal(gate.userId, "seeker-1");
    assert.equal(gate.role, "seeker");
    assert.equal(blockedSessionMayMutate({ role: "seeker", isBlocked: false }), true);
  });

  it("active employer can access own API", () => {
    const gate = evaluateAuthGate({
      user: { id: "employer-1" },
      security: { role: "employer", isBlocked: false },
    });
    assert.equal(gate.ok, true);
    if (!gate.ok) return;
    assert.equal(gate.userId, "employer-1");
    assert.equal(gate.role, "employer");
    assert.equal(loginSessionAllowed({ role: "employer", isBlocked: false }), true);
    assert.equal(blockedSessionMayMutate({ role: "employer", isBlocked: false }), true);
  });

  it("blocked seeker login fails", () => {
    const security = profileSecurityFromRow({ role: "seeker", is_blocked: true });
    assert.equal(loginSessionAllowed(security), false);
    assert.equal(security.isBlocked, true);
    assert.equal("is_blocked" in security, false);
  });

  it("blocked employer login fails", () => {
    const security = profileSecurityFromRow({ role: "employer", is_blocked: true });
    assert.equal(loginSessionAllowed(security), false);
    assert.equal(security.role, "employer");
  });

  it("blocked existing session cannot mutate data", () => {
    const leftover = { role: "seeker" as const, isBlocked: true };
    assert.equal(blockedSessionMayMutate(leftover), false);

    const gate = evaluateAuthGate({
      user: { id: "seeker-session" },
      security: leftover,
    });
    assert.equal(gate.ok, false);
    if (gate.ok) return;
    assert.equal(gate.status, 403);
    assert.equal(gate.error, ACCOUNT_BLOCKED_ERROR);

    assert.equal(
      isBlockedAccountWriteError({ code: BLOCKED_WRITE_SQLSTATE, message: "account_blocked" }),
      true,
    );
    assert.equal(isBlockedAccountWriteError({ code: "23505", message: "duplicate" }), false);
  });

  it("blocked user cannot call protected APIs", () => {
    for (const role of ["seeker", "employer"] as const) {
      const gate = evaluateAuthGate({
        user: { id: `${role}-blocked` },
        security: { role, isBlocked: true },
      });
      assert.equal(gate.ok, false);
      if (gate.ok) return;
      assert.equal(gate.status, 403);
      assert.equal(gate.error, ACCOUNT_BLOCKED_ERROR);
      assert.equal("is_blocked" in gate, false);
    }
  });

  it("unblocked account works again", () => {
    const user = { id: "seeker-2" };
    const blocked = evaluateAuthGate({
      user,
      security: { role: "seeker", isBlocked: true },
    });
    assert.equal(blocked.ok, false);
    assert.equal(loginSessionAllowed({ role: "seeker", isBlocked: true }), false);
    assert.equal(blockedSessionMayMutate({ role: "seeker", isBlocked: true }), false);

    const unblocked = evaluateAuthGate({
      user,
      security: { role: "seeker", isBlocked: false },
    });
    assert.equal(unblocked.ok, true);
    if (!unblocked.ok) return;
    assert.equal(unblocked.role, "seeker");
    assert.equal(loginSessionAllowed({ role: "seeker", isBlocked: false }), true);
    assert.equal(blockedSessionMayMutate({ role: "seeker", isBlocked: false }), true);
  });

  it("unauthenticated is 401 without leaking profile fields", () => {
    const gate = evaluateAuthGate({ user: null, security: null });
    assert.equal(gate.ok, false);
    if (gate.ok) return;
    assert.equal(gate.status, 401);
    assert.equal(gate.error, NOT_AUTHENTICATED_ERROR);

    const body = authGateBody(gate);
    assert.deepEqual(body, { error: NOT_AUTHENTICATED_ERROR });
  });

  it("blocked JSON body is only a safe error code", () => {
    const gate = evaluateAuthGate({
      user: { id: "u" },
      security: { role: "seeker", isBlocked: true },
    });
    assert.equal(gate.ok, false);
    if (gate.ok) return;
    const body = authGateBody(gate);
    assert.deepEqual(Object.keys(body), ["error"]);
    assert.equal(body.error, ACCOUNT_BLOCKED_ERROR);
    assert.equal("is_blocked" in body, false);
    assert.equal("role" in body, false);
    assert.equal(gate.status, 403);
  });

  it("profile lookup failure does not grant a session", () => {
    assert.equal(loginSessionAllowed(profileLookupFailed()), false);
    const gate = evaluateAuthGate({
      user: { id: "u" },
      security: profileLookupFailed(),
    });
    assert.equal(gate.ok, false);
    if (gate.ok) return;
    assert.equal(gate.status, 403);
    assert.equal(gate.error, ACCOUNT_BLOCKED_ERROR);
  });
});
