import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { unreadNotificationCount } from "./types";
import { sortNotificationsByCreatedAtDesc, upsertNotificationsById } from "./mergeNotifications";
import type { NotificationRow } from "./types";

function row(partial: Partial<NotificationRow> & { id: string; read_at: string | null; created_at: string }): NotificationRow {
  return {
    id: partial.id,
    user_id: partial.user_id ?? "user-1",
    type: partial.type ?? "new_application",
    entity_type: partial.entity_type ?? null,
    entity_id: partial.entity_id ?? null,
    payload: partial.payload ?? {},
    created_at: partial.created_at,
    read_at: partial.read_at,
  };
}

describe("notification row merge", () => {
  it("realtime INSERT increases unread count and includes the new row", () => {
    const existing: NotificationRow[] = [
      row({ id: "n1", created_at: "2026-08-19T09:00:00Z", read_at: null }),
    ];
    const insert: NotificationRow = row({ id: "n2", created_at: "2026-08-19T10:00:00Z", read_at: null });

    const merged = upsertNotificationsById(existing, [insert]);
    assert.equal(merged.length, 2);
    assert.equal(unreadNotificationCount(merged), 2);

    const sorted = sortNotificationsByCreatedAtDesc(merged);
    assert.equal(sorted[0].id, "n2");
  });

  it("duplicate INSERT events are ignored (same id wins)", () => {
    const existing: NotificationRow[] = [
      row({ id: "n1", created_at: "2026-08-19T09:00:00Z", read_at: null }),
    ];

    // Same id, different created_at doesn't create duplicates.
    const dup: NotificationRow = row({ id: "n1", created_at: "2026-08-19T11:00:00Z", read_at: null });
    const merged = upsertNotificationsById(existing, [dup]);

    assert.equal(merged.length, 1);
    assert.equal(merged[0].created_at, "2026-08-19T11:00:00Z");
  });

  it("mark READ updates a row and reduces unread count", () => {
    const existing: NotificationRow[] = [
      row({ id: "n1", created_at: "2026-08-19T09:00:00Z", read_at: null }),
    ];
    const update: NotificationRow = row({ id: "n1", created_at: "2026-08-19T09:00:00Z", read_at: "2026-08-19T12:00:00Z" });

    const merged = upsertNotificationsById(existing, [update]);
    assert.equal(unreadNotificationCount(merged), 0);
    assert.equal(merged[0].read_at, "2026-08-19T12:00:00Z");
  });

  it("mark ALL read updates many rows", () => {
    const existing: NotificationRow[] = [
      row({ id: "n1", created_at: "2026-08-19T09:00:00Z", read_at: null }),
      row({ id: "n2", created_at: "2026-08-19T10:00:00Z", read_at: null }),
    ];
    assert.equal(unreadNotificationCount(existing), 2);

    const updated = [
      row({ id: "n1", created_at: "2026-08-19T09:00:00Z", read_at: "2026-08-19T12:00:00Z" }),
      row({ id: "n2", created_at: "2026-08-19T10:00:00Z", read_at: "2026-08-19T12:00:00Z" }),
    ];

    const merged = upsertNotificationsById(existing, updated);
    assert.equal(unreadNotificationCount(merged), 0);
  });
});

