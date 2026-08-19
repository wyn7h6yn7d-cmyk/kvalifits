import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  notificationCopyKey,
  notificationHref,
  notificationMarkReadPatch,
  notificationPayloadOf,
  unreadNotificationCount,
} from "./types.ts";
import {
  authenticatedMayInsertNotifications,
  authenticatedMaySelectOtherUsersNotifications,
  authenticatedMaySelectOwnNotifications,
  authenticatedMayUpdateNotificationColumn,
  anonMaySelectNotifications,
  creationIsServerControlled,
  ownerMayEditForeignNotification,
} from "./access.ts";
import { isSavedJobNearDeadline, savedJobDeadlineDaysLeft } from "./savedJobDeadline.ts";

describe("in-app notification access", () => {
  it("lets a user select own rows and mark them read", () => {
    assert.equal(authenticatedMaySelectOwnNotifications(), true);
    assert.equal(authenticatedMayUpdateNotificationColumn("read_at"), true);
  });

  it("blocks selecting or editing another user's notifications", () => {
    assert.equal(authenticatedMaySelectOtherUsersNotifications(), false);
    assert.equal(ownerMayEditForeignNotification(), false);
    assert.equal(authenticatedMayUpdateNotificationColumn("user_id"), false);
    assert.equal(authenticatedMayUpdateNotificationColumn("type"), false);
    assert.equal(authenticatedMayUpdateNotificationColumn("payload"), false);
  });

  it("keeps creation server/system controlled", () => {
    assert.equal(authenticatedMayInsertNotifications(), false);
    assert.equal(anonMaySelectNotifications(), false);
    assert.equal(creationIsServerControlled(), true);
  });
});

describe("notification presentation", () => {
  it("sorts unread count and mark-read patch", () => {
    assert.equal(
      unreadNotificationCount([
        { read_at: null },
        { read_at: "2026-08-18T12:00:00Z" },
        { read_at: null },
      ]),
      2,
    );
    assert.equal(notificationMarkReadPatch(new Date("2026-08-19T09:00:00Z")).read_at, "2026-08-19T09:00:00.000Z");
  });

  it("navigates to the relevant entity", () => {
    assert.equal(
      notificationHref({ type: "application_status_changed", entity_id: "app-1" }),
      "/account/seeker/applications",
    );
    assert.equal(
      notificationHref({ type: "certificate_reviewed", entity_id: "cert-1" }),
      "/account/seeker/certificates",
    );
    assert.equal(
      notificationHref({ type: "saved_job_deadline", entity_id: "job-1" }),
      "/tood/job-1",
    );
    assert.equal(
      notificationHref({
        type: "new_application",
        entity_id: "app-9",
        payload: { job_post_id: "job-9" },
      }),
      "/account/employer/jobs/job-9/applicants/app-9",
    );
    assert.equal(
      notificationHref({ type: "job_moderation", entity_id: "job-2", payload: { action: "hidden" } }),
      "/account/employer/jobs/job-2/edit",
    );
    assert.equal(
      notificationHref({
        type: "saved_search_alert",
        entity_id: "search-1",
        payload: { count: 1, job_post_id: "job-new" },
      }),
      "/tood/job-new",
    );
    assert.equal(
      notificationHref({
        type: "saved_search_alert",
        entity_id: "search-1",
        payload: { count: 3, job_post_id: "job-new" },
      }),
      "/account/seeker/alerts",
    );
  });

  it("derives copy from type and small context keys", () => {
    const status = notificationCopyKey({
      type: "application_status_changed",
      payload: { status: "interview", essay: "ignore large text" },
    });
    assert.equal(status.titleKey, "type_application_status_changed");
    assert.equal(status.bodyKey, "body_status_interview");
    assert.equal(notificationPayloadOf({ status: "interview", essay: "nope" }).status, "interview");
    assert.equal("essay" in notificationPayloadOf({ essay: "nope" }), false);

    const alert = notificationCopyKey({
      type: "saved_search_alert",
      payload: { count: 2, threshold: 80, delivery_key: "secret" },
    });
    assert.equal(alert.titleKey, "type_saved_search_alert");
    assert.equal(alert.bodyKey, "body_saved_search_alert_threshold");
    assert.deepEqual(alert.bodyValues, { count: 2, threshold: 80 });
    assert.equal("delivery_key" in notificationPayloadOf({ delivery_key: "secret", count: 2 }), false);
  });
});

describe("saved job near deadline", () => {
  const asOf = new Date("2026-08-18T12:00:00Z");

  it("notifies for a published saved job within three days", () => {
    assert.equal(
      isSavedJobNearDeadline({ status: "published", application_deadline: "2026-08-20", asOf }),
      true,
    );
    assert.equal(savedJobDeadlineDaysLeft({ application_deadline: "2026-08-20", asOf }), 2);
  });

  it("does not notify drafts, expired listings, or far deadlines", () => {
    assert.equal(
      isSavedJobNearDeadline({ status: "draft", application_deadline: "2026-08-20", asOf }),
      false,
    );
    assert.equal(
      isSavedJobNearDeadline({ status: "published", application_deadline: "2026-08-01", asOf }),
      false,
    );
    assert.equal(
      isSavedJobNearDeadline({ status: "published", application_deadline: "2026-09-30", asOf }),
      false,
    );
  });
});
