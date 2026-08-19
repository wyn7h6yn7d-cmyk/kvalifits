/**
 * Who may do what on public.notifications.
 * Creation is service/trigger only. Owners may SELECT and set read_at.
 */

export const NOTIFICATION_COLUMNS = [
  "id",
  "user_id",
  "type",
  "entity_type",
  "entity_id",
  "payload",
  "created_at",
  "read_at",
] as const;

export type NotificationColumn = (typeof NOTIFICATION_COLUMNS)[number];

export type NotificationAccessAction = "select" | "insert" | "update" | "delete";

export function authenticatedMaySelectOwnNotifications(): boolean {
  return true;
}

export function authenticatedMaySelectOtherUsersNotifications(): boolean {
  return false;
}

export function anonMaySelectNotifications(): boolean {
  return false;
}

export function authenticatedMayInsertNotifications(): boolean {
  return false;
}

export function authenticatedMayDeleteNotifications(): boolean {
  return false;
}

export function authenticatedMayUpdateNotificationColumn(column: NotificationColumn): boolean {
  return column === "read_at";
}

export function ownerMayMarkOwnNotificationRead(): boolean {
  return authenticatedMayUpdateNotificationColumn("read_at");
}

export function ownerMayEditForeignNotification(): boolean {
  return false;
}

export function creationIsServerControlled(): boolean {
  return authenticatedMayInsertNotifications() === false;
}
