import type { SupabaseClient } from "@supabase/supabase-js";

/** Important admin actions that must be audited. */
export const ADMIN_AUDIT_ACTIONS = {
  certificateApprove: "certificate.approve",
  certificateReject: "certificate.reject",
  certificateHide: "certificate.hide",
  certificateRestore: "certificate.restore",
  employerApprove: "employer.approve",
  employerReject: "employer.reject",
  employerHide: "employer.hide",
  employerRestore: "employer.restore",
  employerUpdate: "employer.update",
  jobPostRemove: "job_post.remove",
  jobPostHide: "job_post.hide",
  jobPostRestore: "job_post.restore",
  jobPostUnpublish: "job_post.unpublish",
  jobPostDelete: "job_post.delete",
  userBlock: "user.block",
  userUnblock: "user.unblock",
  reportUpdate: "job_post_report.update",
  reportApprove: "job_post_report.approve",
  reportReject: "job_post_report.reject",
  reportHide: "job_post_report.hide",
  reportBlock: "job_post_report.block",
  reportRestore: "job_post_report.restore",
  adminChange: "admin.change",
} as const;

export type AdminAuditAction =
  (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS] | string;

export const ADMIN_AUDIT_TARGET_TYPES = [
  "certificate",
  "employer",
  "job_post",
  "user",
  "job_post_report",
] as const;

export type AdminAuditTargetType = (typeof ADMIN_AUDIT_TARGET_TYPES)[number] | string;

export type AdminAuditEntry = {
  actorId: string;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId: string;
  /** Optional context; not required by the core schema. */
  details?: Record<string, unknown>;
  /** Defaults to now when omitted. */
  timestamp?: string;
};

/** Append-only audit row. Caller must be an authenticated admin (RLS). */
export async function writeAdminAuditLog(
  supabase: SupabaseClient,
  entry: AdminAuditEntry
): Promise<void> {
  const row: Record<string, unknown> = {
    actor_id: entry.actorId,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId,
    details: entry.details ?? {},
  };
  if (entry.timestamp) {
    row.timestamp = entry.timestamp;
  }

  const { error } = await supabase.from("admin_audit_log").insert(row);
  if (error) throw error;
}

/** Best-effort write — never fails the primary admin action if the log table is missing. */
export async function tryWriteAdminAuditLog(
  supabase: SupabaseClient,
  entry: {
    actorId: string | null | undefined;
    action: AdminAuditAction;
    targetType: AdminAuditTargetType;
    targetId: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  if (!entry.actorId) return;
  try {
    await writeAdminAuditLog(supabase, {
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      details: entry.details,
    });
  } catch {
    // Table / RLS may not be applied yet.
  }
}
