/**
 * In-app notification types and owner-only access rules.
 * UI copy is derived from type + small context keys — not stored prose.
 */

export const NOTIFICATION_TYPES = [
  "application_status_changed",
  "certificate_reviewed",
  "saved_job_deadline",
  "new_application",
  "job_moderation",
  "interview_invite",
  "strong_match",
  "saved_search_alert",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_ENTITY_TYPES = [
  "job_application",
  "job_post",
  "seeker_certificate",
  "job_post_report",
  "saved_job_search",
] as const;

export type NotificationEntityType = (typeof NOTIFICATION_ENTITY_TYPES)[number];

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
};

export function isNotificationType(v: unknown): v is NotificationType {
  return typeof v === "string" && (NOTIFICATION_TYPES as readonly string[]).includes(v);
}

export function isNotificationEntityType(v: unknown): v is NotificationEntityType {
  return typeof v === "string" && (NOTIFICATION_ENTITY_TYPES as readonly string[]).includes(v);
}

export function isNotificationUnread(row: Pick<NotificationRow, "read_at">): boolean {
  return !row.read_at;
}

export function unreadNotificationCount(rows: Pick<NotificationRow, "read_at">[]): number {
  return rows.filter(isNotificationUnread).length;
}

export function notificationMarkReadPatch(asOf: Date = new Date()): { read_at: string } {
  return { read_at: asOf.toISOString() };
}

/** Payload keys the UI may read. Anything else is ignored. */
export type NotificationPayload = {
  status?: string;
  verification_status?: string;
  job_post_id?: string;
  days_left?: number;
  action?: string;
  count?: number;
  threshold?: number;
};

export function notificationPayloadOf(raw: unknown): NotificationPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const out: NotificationPayload = {};
  if (typeof o.status === "string" && o.status.trim()) out.status = o.status.trim();
  if (typeof o.verification_status === "string" && o.verification_status.trim()) {
    out.verification_status = o.verification_status.trim();
  }
  if (typeof o.job_post_id === "string" && o.job_post_id.trim()) out.job_post_id = o.job_post_id.trim();
  if (typeof o.days_left === "number" && Number.isFinite(o.days_left)) out.days_left = o.days_left;
  if (typeof o.action === "string" && o.action.trim()) out.action = o.action.trim();
  if (typeof o.count === "number" && Number.isFinite(o.count)) out.count = Math.max(0, Math.floor(o.count));
  if (typeof o.threshold === "number" && Number.isFinite(o.threshold)) {
    out.threshold = Math.max(0, Math.min(100, Math.floor(o.threshold)));
  }
  return out;
}

export function notificationHref(row: {
  type: string;
  entity_type?: string | null;
  entity_id?: string | null;
  payload?: unknown;
}): string | null {
  const type = isNotificationType(row.type) ? row.type : null;
  if (!type) return null;
  const entityId = (row.entity_id ?? "").toString().trim();
  const payload = notificationPayloadOf(row.payload);
  const jobPostId = (payload.job_post_id ?? "").toString().trim();

  switch (type) {
    case "application_status_changed":
    case "interview_invite":
      return "/account/seeker/applications";
    case "certificate_reviewed":
      return "/account/seeker/certificates";
    case "saved_job_deadline":
    case "strong_match":
      return entityId ? `/tood/${entityId}` : "/tood";
    case "new_application":
      if (jobPostId && entityId) return `/account/employer/jobs/${jobPostId}/applicants/${entityId}`;
      if (jobPostId) return `/account/employer/jobs/${jobPostId}/applicants`;
      return "/account/employer/candidates";
    case "job_moderation":
      return entityId ? `/account/employer/jobs/${entityId}/edit` : "/account/employer/jobs";
    case "saved_search_alert":
      if (payload.count === 1 && jobPostId) return `/tood/${jobPostId}`;
      return "/account/seeker/alerts";
    default:
      return "/account/notifications";
  }
}

export function notificationCopyKey(row: { type: string; payload?: unknown }): {
  titleKey: string;
  bodyKey: string | null;
  bodyValues: Record<string, string | number>;
} {
  const type = isNotificationType(row.type) ? row.type : "unknown";
  const payload = notificationPayloadOf(row.payload);
  if (type === "application_status_changed") {
    const status = (payload.status ?? "").toLowerCase();
    const bodyKey =
      status === "reviewing"
        ? "body_status_reviewing"
        : status === "interview" || status === "interview_2"
          ? "body_status_interview"
          : status === "offer"
            ? "body_status_offer"
            : status === "hired"
              ? "body_status_hired"
              : status === "rejected"
                ? "body_status_rejected"
                : "body_application_status";
    return {
      titleKey: "type_application_status_changed",
      bodyKey,
      bodyValues: {},
    };
  }
  if (type === "certificate_reviewed") {
    const vs = payload.verification_status === "verified" ? "verified" : "rejected";
    return {
      titleKey: "type_certificate_reviewed",
      bodyKey: vs === "verified" ? "body_certificate_verified" : "body_certificate_rejected",
      bodyValues: {},
    };
  }
  if (type === "saved_job_deadline") {
    const days = payload.days_left ?? 0;
    return {
      titleKey: "type_saved_job_deadline",
      bodyKey: days <= 0 ? "body_saved_job_deadline_today" : "body_saved_job_deadline",
      bodyValues: { days },
    };
  }
  if (type === "new_application") {
    return { titleKey: "type_new_application", bodyKey: "body_new_application", bodyValues: {} };
  }
  if (type === "job_moderation") {
    const action = payload.action ?? "updated";
    const bodyKey =
      action === "report_received"
        ? "body_job_report_received"
        : action === "restored"
          ? "body_job_restored"
          : action === "hidden"
            ? "body_job_hidden"
            : "body_job_moderation";
    return { titleKey: "type_job_moderation", bodyKey, bodyValues: {} };
  }
  if (type === "interview_invite") {
    return { titleKey: "type_interview_invite", bodyKey: null, bodyValues: {} };
  }
  if (type === "strong_match") {
    return { titleKey: "type_strong_match", bodyKey: null, bodyValues: {} };
  }
  if (type === "saved_search_alert") {
    const count = payload.count ?? 0;
    const threshold = payload.threshold;
    if (threshold != null) {
      return {
        titleKey: "type_saved_search_alert",
        bodyKey: "body_saved_search_alert_threshold",
        bodyValues: { count, threshold },
      };
    }
    return {
      titleKey: "type_saved_search_alert",
      bodyKey: "body_saved_search_alert",
      bodyValues: { count },
    };
  }
  return { titleKey: "type_unknown", bodyKey: null, bodyValues: {} };
}
