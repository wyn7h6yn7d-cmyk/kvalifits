import type { NotificationRow } from "./types";

function dedupeByIdKeepExisting(rows: NotificationRow[]): NotificationRow[] {
  const seen = new Set<string>();
  const out: NotificationRow[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

/**
 * Merge rows by `id` without duplicating IDs.
 * If an incoming row shares an ID with an existing row, the incoming row wins.
 */
export function upsertNotificationsById(existing: NotificationRow[], incoming: NotificationRow[]): NotificationRow[] {
  const byId = new Map<string, NotificationRow>();
  for (const row of existing) byId.set(row.id, row);
  for (const row of incoming) byId.set(row.id, row);
  return Array.from(byId.values());
}

/** Dedupe only; keeps first occurrence order. */
export function dedupeNotificationsById(rows: NotificationRow[]): NotificationRow[] {
  return dedupeByIdKeepExisting(rows);
}

export function sortNotificationsByCreatedAtDesc(rows: NotificationRow[]): NotificationRow[] {
  return rows
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

