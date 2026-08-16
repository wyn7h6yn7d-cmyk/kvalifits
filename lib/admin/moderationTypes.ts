export const ADMIN_MODERATION_ACTIONS = [
  "approve",
  "reject",
  "hide",
  "block",
  "restore",
] as const;

export type AdminModerationAction = (typeof ADMIN_MODERATION_ACTIONS)[number];

export function isAdminModerationAction(v: unknown): v is AdminModerationAction {
  return typeof v === "string" && (ADMIN_MODERATION_ACTIONS as readonly string[]).includes(v);
}

export type ModerationQueue = "reports" | "certificates" | "companies" | "blocked_users";
