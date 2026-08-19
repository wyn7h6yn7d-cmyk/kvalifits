import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fingerprintSavedSearch } from "./savedJobSearches.ts";
import {
  CLIENT_DELIVERY_CURSOR_FORGE_COLUMNS,
  authenticatedMayInsertSavedSearchColumn,
  authenticatedMayUpdateSavedSearchColumn,
  clientDeliveryCursorForgeIsBlocked,
} from "./savedJobSearchFieldLock.ts";
import {
  cronBearerAuthorized,
  effectiveSavedSearchMinMatch,
  parseSavedSearchLocale,
  planSavedSearchAlert,
  savedSearchAlertDeliveryKey,
  savedSearchAlertIsDue,
  savedSearchAlertsEmailEnabled,
  selectJobsForSavedSearchAlert,
  type SavedSearchAlertJob,
} from "./savedSearchAlertDelivery.ts";
import { savedSearchAlertMessageKey, savedSearchAlertMessageValues } from "./savedSearchAlertCopy.ts";

function job(overrides: Partial<SavedSearchAlertJob> = {}): SavedSearchAlertJob {
  return {
    id: "job-1",
    title: "Nurse",
    company: "Clinic",
    location: "Tallinn",
    type: "—",
    tags: [],
    requiredCerts: [],
    status: "published",
    publishedAt: "2026-08-18T12:00:00Z",
    createdAt: "2026-08-18T12:00:00Z",
    published_at: "2026-08-18T12:00:00Z",
    application_deadline: "2026-09-30",
    expires_at: "2026-09-30T20:59:59Z",
    ...overrides,
  };
}

const snapshot = { query: "", requirePublicSalary: false, filters: [] as const };
const asOf = new Date("2026-08-19T12:00:00Z");

describe("saved search fingerprint", () => {
  it("is stable for the same query, filters, salary flag, and threshold", () => {
    const a = fingerprintSavedSearch(
      { query: " Nurse ", requirePublicSalary: true, filters: [{ facet: "location", value: "Tallinn" }] },
      80,
    );
    const b = fingerprintSavedSearch(
      { query: "nurse", requirePublicSalary: true, filters: [{ facet: "location", value: "Tallinn" }] },
      80,
    );
    assert.equal(a, b);
  });

  it("changes when the min match threshold changes", () => {
    const snap = { query: "nurse", requirePublicSalary: false, filters: [] };
    assert.notEqual(fingerprintSavedSearch(snap, 80), fingerprintSavedSearch(snap, 70));
    assert.notEqual(fingerprintSavedSearch(snap, 80), fingerprintSavedSearch(snap, null));
  });
});

describe("saved search locale", () => {
  it("accepts et, en, and ru and falls back to et", () => {
    assert.equal(parseSavedSearchLocale("en"), "en");
    assert.equal(parseSavedSearchLocale("ru"), "ru");
    assert.equal(parseSavedSearchLocale("et"), "et");
    assert.equal(parseSavedSearchLocale("de"), "et");
    assert.equal(parseSavedSearchLocale(""), "et");
  });
});

describe("saved search delivery cursors are not seeker-controlled", () => {
  it("classifies last_notified_at and notify_after as worker-owned", () => {
    assert.equal(authenticatedMayUpdateSavedSearchColumn("last_notified_at"), false);
    assert.equal(authenticatedMayUpdateSavedSearchColumn("notify_after"), false);
    assert.equal(authenticatedMayInsertSavedSearchColumn("last_notified_at"), false);
    assert.equal(authenticatedMayInsertSavedSearchColumn("notify_after"), false);
    assert.equal(clientDeliveryCursorForgeIsBlocked("last_notified_at"), true);
    assert.equal(clientDeliveryCursorForgeIsBlocked("notify_after"), true);
  });

  it("lets the seeker update alert preferences", () => {
    assert.equal(authenticatedMayUpdateSavedSearchColumn("enabled"), true);
    assert.equal(authenticatedMayUpdateSavedSearchColumn("frequency"), true);
    assert.equal(authenticatedMayUpdateSavedSearchColumn("locale"), true);
    assert.equal(authenticatedMayUpdateSavedSearchColumn("min_match_percent"), true);
    assert.equal(authenticatedMayInsertSavedSearchColumn("query"), true);
  });

  it("covers the forge column set", () => {
    assert.deepEqual(CLIENT_DELIVERY_CURSOR_FORGE_COLUMNS, ["last_notified_at", "notify_after"]);
  });
});

describe("saved search alert frequency", () => {
  it("skips disabled searches", () => {
    assert.equal(
      savedSearchAlertIsDue({
        enabled: false,
        frequency: "immediate",
        lastNotifiedAt: null,
        asOf,
      }),
      false,
    );
  });

  it("treats immediate as due on every worker tick", () => {
    assert.equal(
      savedSearchAlertIsDue({
        enabled: true,
        frequency: "immediate",
        lastNotifiedAt: "2026-08-19T11:50:00Z",
        asOf,
      }),
      true,
    );
  });

  it("holds daily until 24 hours have passed", () => {
    assert.equal(
      savedSearchAlertIsDue({
        enabled: true,
        frequency: "daily",
        lastNotifiedAt: "2026-08-18T13:00:00Z",
        asOf,
      }),
      false,
    );
    assert.equal(
      savedSearchAlertIsDue({
        enabled: true,
        frequency: "daily",
        lastNotifiedAt: "2026-08-18T11:00:00Z",
        asOf,
      }),
      true,
    );
    assert.equal(
      savedSearchAlertIsDue({
        enabled: true,
        frequency: "daily",
        lastNotifiedAt: null,
        asOf,
      }),
      true,
    );
  });

  it("holds weekly until 7 days have passed", () => {
    assert.equal(
      savedSearchAlertIsDue({
        enabled: true,
        frequency: "weekly",
        lastNotifiedAt: "2026-08-13T12:00:00Z",
        asOf,
      }),
      false,
    );
    assert.equal(
      savedSearchAlertIsDue({
        enabled: true,
        frequency: "weekly",
        lastNotifiedAt: "2026-08-12T11:00:00Z",
        asOf,
      }),
      true,
    );
  });
});

describe("saved search alert job selection", () => {
  const baseInput = {
    enabled: true,
    frequency: "immediate" as const,
    last_notified_at: null,
    notify_after: "2026-08-17T00:00:00Z",
    locale: "en",
    min_match_percent: 80 as number | null,
    matchingAvailable: false,
    alreadyNotifiedJobIds: new Set<string>(),
    asOf,
  };

  it("skips unpublished, expired, and already-notified jobs", () => {
    const selected = selectJobsForSavedSearchAlert({
      jobs: [
        job({ id: "draft", status: "draft" }),
        job({ id: "expired", application_deadline: "2026-08-01", expires_at: "2026-08-01T00:00:00Z" }),
        job({ id: "old", publishedAt: "2026-08-16T00:00:00Z", published_at: "2026-08-16T00:00:00Z" }),
        job({ id: "done" }),
        job({ id: "fresh", title: "Nurse in Tartu" }),
      ],
      snapshot,
      minMatchPercent: null,
      matchingAvailable: false,
      notifyAfterIso: "2026-08-17T00:00:00Z",
      alreadyNotifiedJobIds: new Set(["done"]),
      asOf,
    });
    assert.deepEqual(
      selected.map((j) => j.id),
      ["fresh"],
    );
  });

  it("ignores min match when seeker matching is not available", () => {
    const selected = selectJobsForSavedSearchAlert({
      jobs: [job({ matchScore: undefined })],
      snapshot,
      minMatchPercent: 80,
      matchingAvailable: false,
      notifyAfterIso: "2026-08-17T00:00:00Z",
      alreadyNotifiedJobIds: new Set(),
      asOf,
    });
    assert.equal(selected.length, 1);
    assert.equal(effectiveSavedSearchMinMatch({ minMatchPercent: 80, matchingAvailable: false }), null);
  });

  it("applies min match only when a real score is present", () => {
    const low = selectJobsForSavedSearchAlert({
      jobs: [job({ matchScore: 70 })],
      snapshot,
      minMatchPercent: 80,
      matchingAvailable: true,
      notifyAfterIso: "2026-08-17T00:00:00Z",
      alreadyNotifiedJobIds: new Set(),
      asOf,
    });
    const high = selectJobsForSavedSearchAlert({
      jobs: [job({ matchScore: 90 })],
      snapshot,
      minMatchPercent: 80,
      matchingAvailable: true,
      notifyAfterIso: "2026-08-17T00:00:00Z",
      alreadyNotifiedJobIds: new Set(),
      asOf,
    });
    const missing = selectJobsForSavedSearchAlert({
      jobs: [job({ matchScore: undefined })],
      snapshot,
      minMatchPercent: 80,
      matchingAvailable: true,
      notifyAfterIso: "2026-08-17T00:00:00Z",
      alreadyNotifiedJobIds: new Set(),
      asOf,
    });
    assert.equal(low.length, 0);
    assert.equal(high.length, 1);
    assert.equal(missing.length, 0);
  });

  it("plans a delivery with a stable idempotency key and locale", () => {
    const first = planSavedSearchAlert(baseInput, [job({ id: "a" }), job({ id: "b" })], snapshot);
    const retry = planSavedSearchAlert(baseInput, [job({ id: "b" }), job({ id: "a" })], snapshot);
    assert.equal(first.kind, "deliver");
    assert.equal(retry.kind, "deliver");
    if (first.kind !== "deliver" || retry.kind !== "deliver") return;
    assert.equal(first.deliveryKey, retry.deliveryKey);
    assert.equal(first.deliveryKey, savedSearchAlertDeliveryKey(["b", "a"]));
    assert.equal(first.locale, "en");
    assert.equal(first.minMatchApplied, null);
    assert.equal(savedSearchAlertMessageKey(first.minMatchApplied), "alertNewJobsNoThreshold");
    assert.deepEqual(savedSearchAlertMessageValues(first.jobs.length, first.minMatchApplied), { count: 2 });
  });

  it("does not duplicate jobs that were already delivered on a cron retry", () => {
    const plan = planSavedSearchAlert(
      { ...baseInput, alreadyNotifiedJobIds: new Set(["a", "b"]) },
      [job({ id: "a" }), job({ id: "b" })],
      snapshot,
    );
    assert.deepEqual(plan, { kind: "skip", reason: "no_new_jobs" });
  });

  it("skips disabled searches even if matching jobs exist", () => {
    const plan = planSavedSearchAlert({ ...baseInput, enabled: false }, [job()], snapshot);
    assert.deepEqual(plan, { kind: "skip", reason: "disabled" });
  });

  it("skips daily searches that are not due yet", () => {
    const plan = planSavedSearchAlert(
      {
        ...baseInput,
        frequency: "daily",
        last_notified_at: "2026-08-19T06:00:00Z",
      },
      [job()],
      snapshot,
    );
    assert.deepEqual(plan, { kind: "skip", reason: "not_due" });
  });
});

describe("saved search alert email product gate", () => {
  it("stays off unless Resend is configured and the product flag is on", () => {
    assert.equal(savedSearchAlertsEmailEnabled({}), false);
    assert.equal(savedSearchAlertsEmailEnabled({ RESEND_API_KEY: "re_test" }), false);
    assert.equal(savedSearchAlertsEmailEnabled({ SAVED_SEARCH_ALERTS_EMAIL: "1" }), false);
    assert.equal(
      savedSearchAlertsEmailEnabled({ RESEND_API_KEY: "re_test", SAVED_SEARCH_ALERTS_EMAIL: "1" }),
      true,
    );
  });
});

describe("saved search alert cron auth", () => {
  it("requires a matching bearer secret", () => {
    assert.equal(cronBearerAuthorized("Bearer secret", "secret"), true);
    assert.equal(cronBearerAuthorized("Bearer nope", "secret"), false);
    assert.equal(cronBearerAuthorized("Bearer secret", ""), false);
    assert.equal(cronBearerAuthorized(null, "secret"), false);
  });
});
