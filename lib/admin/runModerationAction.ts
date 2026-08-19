/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";

import { ADMIN_AUDIT_ACTIONS, writeAdminAuditLog } from "@/lib/admin/auditLog";
import type { AdminModerationAction, ModerationQueue } from "@/lib/admin/moderationTypes";
import { revokeUserSessions } from "@/lib/auth/revokeUserSessions";

export type { ModerationQueue } from "@/lib/admin/moderationTypes";

export type RunModerationInput = {
  supabase: SupabaseClient;
  adminUserId: string;
  queue: ModerationQueue;
  action: AdminModerationAction;
  targetId: string;
};

function nowIso() {
  return new Date().toISOString();
}

async function resolveEmployerOwnerId(
  supabase: SupabaseClient,
  employerProfileId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("employer_profiles")
    .select("owner_user_id")
    .eq("id", employerProfileId)
    .maybeSingle();
  return ((data as any)?.owner_user_id as string | null | undefined) ?? null;
}

async function resolveJobOwnerId(
  supabase: SupabaseClient,
  jobPostId: string
): Promise<{ ownerId: string | null; employerProfileId: string | null }> {
  const { data: job } = await supabase
    .from("job_posts")
    .select("employer_profile_id")
    .eq("id", jobPostId)
    .maybeSingle();
  const employerProfileId =
    ((job as any)?.employer_profile_id as string | null | undefined) ?? null;
  if (!employerProfileId) return { ownerId: null, employerProfileId: null };
  const ownerId = await resolveEmployerOwnerId(supabase, employerProfileId);
  return { ownerId, employerProfileId };
}

async function resolveCertificateOwnerId(
  supabase: SupabaseClient,
  certificateId: string
): Promise<string | null> {
  const { data: cert } = await supabase
    .from("seeker_certificates")
    .select("user_id")
    .eq("id", certificateId)
    .maybeSingle();
  return ((cert as any)?.user_id as string | null | undefined) ?? null;
}

async function setUserBlocked(
  supabase: SupabaseClient,
  userId: string,
  blocked: boolean
) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_blocked: blocked })
    .eq("id", userId);
  if (error) throw error;
  if (blocked) {
    await revokeUserSessions(userId);
  }
}

async function setJobStatus(
  supabase: SupabaseClient,
  jobPostId: string,
  status: "published" | "archived" | "draft"
) {
  const updates: Record<string, unknown> = { status };
  if (status === "published") updates.published_at = nowIso();
  const { error } = await supabase.from("job_posts").update(updates).eq("id", jobPostId);
  if (error) throw error;
}

async function updateReport(
  supabase: SupabaseClient,
  reportId: string,
  adminUserId: string,
  status: "open" | "reviewing" | "resolved" | "dismissed"
) {
  const { error } = await supabase
    .from("job_post_reports")
    .update({
      status,
      reviewed_at: nowIso(),
      reviewed_by: adminUserId,
      updated_at: nowIso(),
    })
    .eq("id", reportId);
  if (error) throw error;
}

const REPORT_ACTIONS = {
  approve: ADMIN_AUDIT_ACTIONS.reportApprove,
  reject: ADMIN_AUDIT_ACTIONS.reportReject,
  hide: ADMIN_AUDIT_ACTIONS.reportHide,
  block: ADMIN_AUDIT_ACTIONS.reportBlock,
  restore: ADMIN_AUDIT_ACTIONS.reportRestore,
} as const;

const CERT_ACTIONS = {
  approve: ADMIN_AUDIT_ACTIONS.certificateApprove,
  reject: ADMIN_AUDIT_ACTIONS.certificateReject,
  hide: ADMIN_AUDIT_ACTIONS.certificateHide,
  block: ADMIN_AUDIT_ACTIONS.userBlock,
  restore: ADMIN_AUDIT_ACTIONS.certificateRestore,
} as const;

const COMPANY_ACTIONS = {
  approve: ADMIN_AUDIT_ACTIONS.employerApprove,
  reject: ADMIN_AUDIT_ACTIONS.employerReject,
  hide: ADMIN_AUDIT_ACTIONS.employerHide,
  block: ADMIN_AUDIT_ACTIONS.userBlock,
  restore: ADMIN_AUDIT_ACTIONS.employerRestore,
} as const;

/**
 * Apply a moderation action and write audit log entries for important outcomes.
 */
export async function runModerationAction(input: RunModerationInput): Promise<{ ok: true }> {
  const { supabase, adminUserId, queue, action, targetId } = input;
  const details: Record<string, unknown> = { queue, action };
  const actorId = adminUserId;

  if (queue === "reports") {
    const { data: report, error: reportErr } = await supabase
      .from("job_post_reports")
      .select("id,job_post_id,status")
      .eq("id", targetId)
      .maybeSingle();
    if (reportErr) throw reportErr;
    if (!report) throw new Error("report_not_found");
    const jobPostId = (report as any).job_post_id as string;
    details.job_post_id = jobPostId;
    details.before_status = (report as any).status;

    if (action === "approve") {
      await updateReport(supabase, targetId, adminUserId, "resolved");
    } else if (action === "reject") {
      await updateReport(supabase, targetId, adminUserId, "dismissed");
    } else if (action === "hide") {
      await setJobStatus(supabase, jobPostId, "archived");
      await updateReport(supabase, targetId, adminUserId, "resolved");
      details.job_status = "archived";
      await writeAdminAuditLog(supabase, {
        actorId,
        action: ADMIN_AUDIT_ACTIONS.jobPostRemove,
        targetType: "job_post",
        targetId: jobPostId,
        details: { reason: "report_hide", report_id: targetId },
      });
    } else if (action === "block") {
      const { ownerId } = await resolveJobOwnerId(supabase, jobPostId);
      if (ownerId) {
        await setUserBlocked(supabase, ownerId, true);
        details.blocked_user_id = ownerId;
        await writeAdminAuditLog(supabase, {
          actorId,
          action: ADMIN_AUDIT_ACTIONS.userBlock,
          targetType: "user",
          targetId: ownerId,
          details: { reason: "report_block", report_id: targetId, job_post_id: jobPostId },
        });
      }
      await setJobStatus(supabase, jobPostId, "archived");
      await updateReport(supabase, targetId, adminUserId, "resolved");
      details.job_status = "archived";
      await writeAdminAuditLog(supabase, {
        actorId,
        action: ADMIN_AUDIT_ACTIONS.jobPostRemove,
        targetType: "job_post",
        targetId: jobPostId,
        details: { reason: "report_block", report_id: targetId },
      });
    } else if (action === "restore") {
      await setJobStatus(supabase, jobPostId, "published");
      await updateReport(supabase, targetId, adminUserId, "open");
      details.job_status = "published";
      await writeAdminAuditLog(supabase, {
        actorId,
        action: ADMIN_AUDIT_ACTIONS.jobPostRestore,
        targetType: "job_post",
        targetId: jobPostId,
        details: { reason: "report_restore", report_id: targetId },
      });
    }

    await writeAdminAuditLog(supabase, {
      actorId,
      action: REPORT_ACTIONS[action],
      targetType: "job_post_report",
      targetId,
      details,
    });
    return { ok: true };
  }

  if (queue === "certificates") {
    const ownerId = await resolveCertificateOwnerId(supabase, targetId);
    details.owner_user_id = ownerId;

    if (action === "approve") {
      const { error } = await supabase
        .from("seeker_certificates")
        .update({
          verification_status: "verified",
          verified_at: nowIso().slice(0, 10),
          verification_source: "manual",
          verified_by: adminUserId,
        })
        .eq("id", targetId);
      if (error) throw error;
    } else if (action === "reject") {
      const { error } = await supabase
        .from("seeker_certificates")
        .update({
          verification_status: "rejected",
          verified_at: null,
          verification_source: null,
          verified_by: null,
        })
        .eq("id", targetId);
      if (error) throw error;
    } else if (action === "hide") {
      const { error } = await supabase
        .from("seeker_certificates")
        .update({
          verification_status: "rejected",
          verified_at: null,
          verification_source: null,
          verified_by: null,
        })
        .eq("id", targetId);
      if (error) throw error;
    } else if (action === "block") {
      if (!ownerId) throw new Error("owner_not_found");
      await setUserBlocked(supabase, ownerId, true);
      details.blocked_user_id = ownerId;
      await writeAdminAuditLog(supabase, {
        actorId,
        action: ADMIN_AUDIT_ACTIONS.userBlock,
        targetType: "user",
        targetId: ownerId,
        details: { reason: "certificate_block", certificate_id: targetId },
      });
      return { ok: true };
    } else if (action === "restore") {
      const { error } = await supabase
        .from("seeker_certificates")
        .update({
          verification_status: "under_review",
          verified_at: null,
          verification_source: null,
          verified_by: null,
        })
        .eq("id", targetId);
      if (error) throw error;
    }

    await writeAdminAuditLog(supabase, {
      actorId,
      action: CERT_ACTIONS[action],
      targetType: "certificate",
      targetId,
      details,
    });
    return { ok: true };
  }

  if (queue === "companies") {
    const ownerId = await resolveEmployerOwnerId(supabase, targetId);
    details.owner_user_id = ownerId;

    if (action === "approve") {
      const { error } = await supabase
        .from("employer_profiles")
        .update({
          verification_status: "verified",
          company_verified: true,
          verification_source: "manual",
          verified_at: nowIso(),
        })
        .eq("id", targetId);
      if (error) throw error;
    } else if (action === "reject" || action === "hide") {
      const { error } = await supabase
        .from("employer_profiles")
        .update({
          verification_status: "unverified",
          company_verified: false,
          verification_source: null,
          verified_at: null,
        })
        .eq("id", targetId);
      if (error) throw error;
    } else if (action === "block") {
      if (!ownerId) throw new Error("owner_not_found");
      await setUserBlocked(supabase, ownerId, true);
      details.blocked_user_id = ownerId;
      const { error } = await supabase
        .from("employer_profiles")
        .update({
          verification_status: "unverified",
          company_verified: false,
          verification_source: null,
          verified_at: null,
        })
        .eq("id", targetId);
      if (error) throw error;
      await writeAdminAuditLog(supabase, {
        actorId,
        action: ADMIN_AUDIT_ACTIONS.userBlock,
        targetType: "user",
        targetId: ownerId,
        details: { reason: "employer_block", employer_id: targetId },
      });
      await writeAdminAuditLog(supabase, {
        actorId,
        action: ADMIN_AUDIT_ACTIONS.employerReject,
        targetType: "employer",
        targetId,
        details,
      });
      return { ok: true };
    } else if (action === "restore") {
      const { error } = await supabase
        .from("employer_profiles")
        .update({
          verification_status: "under_review",
          company_verified: false,
          verification_source: null,
          verified_at: null,
        })
        .eq("id", targetId);
      if (error) throw error;
      if (ownerId) {
        await setUserBlocked(supabase, ownerId, false);
        details.unblocked_user_id = ownerId;
        await writeAdminAuditLog(supabase, {
          actorId,
          action: ADMIN_AUDIT_ACTIONS.userUnblock,
          targetType: "user",
          targetId: ownerId,
          details: { reason: "employer_restore", employer_id: targetId },
        });
      }
    }

    await writeAdminAuditLog(supabase, {
      actorId,
      action: COMPANY_ACTIONS[action],
      targetType: "employer",
      targetId,
      details,
    });
    return { ok: true };
  }

  if (queue === "blocked_users") {
    if (action === "restore") {
      await setUserBlocked(supabase, targetId, false);
      await writeAdminAuditLog(supabase, {
        actorId,
        action: ADMIN_AUDIT_ACTIONS.userUnblock,
        targetType: "user",
        targetId,
        details,
      });
    } else if (action === "block") {
      await setUserBlocked(supabase, targetId, true);
      await writeAdminAuditLog(supabase, {
        actorId,
        action: ADMIN_AUDIT_ACTIONS.userBlock,
        targetType: "user",
        targetId,
        details,
      });
    } else {
      throw new Error("action_not_allowed");
    }
    return { ok: true };
  }

  throw new Error("unknown_queue");
}
