import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  deliverEmployerApplicationEmail,
  employerNotifyIdempotencyKey,
  jsonForApplicationSubmit,
  resultFromApplicationInsert,
  safeEmployerNotifyFailLog,
  shouldSendEmployerApplicationEmail,
} from "./applicationSubmitOutcome.ts";

describe("application submit vs email delivery", () => {
  it("DB insert failure => submission fails", () => {
    const result = resultFromApplicationInsert({
      error: { code: "40001", message: "could not insert" },
      row: null,
    });
    assert.equal(result.kind, "insert_failed");
    const json = jsonForApplicationSubmit(result);
    assert.equal(json.status, 500);
    assert.equal(json.body.error, "server_error");
  });

  it("DB success / email success => submission succeeds", async () => {
    const result = resultFromApplicationInsert({
      error: null,
      row: { id: "app-1", created_at: "2026-08-18T00:00:00Z", match_score: 42 },
    });
    assert.equal(result.kind, "created");
    const json = jsonForApplicationSubmit(result);
    assert.equal(json.status, 200);
    assert.equal(json.body.ok, true);
    assert.equal(json.body.id, "app-1");

    let sent = 0;
    const delivery = await deliverEmployerApplicationEmail({
      applicationId: "app-1",
      notifiedAt: null,
      send: async () => {
        sent += 1;
        return { ok: true };
      },
      markNotified: async () => {},
    });
    assert.equal(delivery, "sent");
    assert.equal(sent, 1);
  });

  it("DB success / email fail => submission still succeeds", async () => {
    const result = resultFromApplicationInsert({
      error: null,
      row: { id: "app-2", created_at: "2026-08-18T00:00:00Z", match_score: 10 },
    });
    assert.equal(result.kind, "created");
    assert.equal(jsonForApplicationSubmit(result).status, 200);

    const delivery = await deliverEmployerApplicationEmail({
      applicationId: "app-2",
      notifiedAt: null,
      send: async () => ({ ok: false, reason: "provider_error" }),
      markNotified: async () => {
        throw new Error("must not mark notified after send failure");
      },
    });
    assert.equal(delivery, "failed");
  });

  it("retry does not duplicate application (unique collision is already_applied)", () => {
    const result = resultFromApplicationInsert({
      error: { code: "23505", message: "duplicate key" },
      row: null,
    });
    assert.equal(result.kind, "already_applied");
    const json = jsonForApplicationSubmit({ kind: "already_applied", id: "app-1" });
    assert.equal(json.status, 409);
    assert.equal(json.body.error, "duplicate_application");
    assert.equal(json.body.alreadyApplied, true);
    assert.equal(json.body.id, "app-1");
  });

  it("retry does not duplicate employer email once notified_at is set", async () => {
    assert.equal(shouldSendEmployerApplicationEmail("2026-08-18T12:00:00Z"), false);
    let sent = 0;
    const delivery = await deliverEmployerApplicationEmail({
      applicationId: "app-1",
      notifiedAt: "2026-08-18T12:00:00Z",
      send: async () => {
        sent += 1;
        return { ok: true };
      },
      markNotified: async () => {},
    });
    assert.equal(delivery, "skipped");
    assert.equal(sent, 0);
  });

  it("uses a stable Resend idempotency key per application", () => {
    assert.equal(employerNotifyIdempotencyKey("app-9"), "kvalifits-app-notify:app-9");
  });

  it("notify failure logs do not include provider response or recipients", () => {
    const log = safeEmployerNotifyFailLog("app-3");
    assert.deepEqual(Object.keys(log).sort(), ["applicationId", "event"]);
    assert.equal(log.event, "employer_application_notify_failed");
    assert.equal(log.applicationId, "app-3");
    assert.equal(JSON.stringify(log).includes("Resend"), false);
  });
});
