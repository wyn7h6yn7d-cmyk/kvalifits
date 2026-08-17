import { ADMIN_AUDIT_ACTIONS, tryWriteAdminAuditLog } from "@/lib/admin/auditLog";
import { runAdminHardDeleteJob } from "@/lib/admin/hardDeleteUser";
import { adminApiJson, adminConfirmWordOk, requireAdminApiActor } from "@/lib/admin/requireAdminApi";
import { errorMessageFromUnknown } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  jobId?: string;
  confirmWord?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return adminApiJson({ error: "invalid_json" }, 400);
  }

  const jobId = (body.jobId ?? "").toString().trim();
  if (!jobId) return adminApiJson({ error: "missing_job_id" }, 400);
  if (!adminConfirmWordOk(body.confirmWord)) {
    return adminApiJson({ error: "confirm_word_required" }, 400);
  }

  const gate = await requireAdminApiActor();
  if (!gate.ok) return gate.response;

  try {
    const result = await runAdminHardDeleteJob({ admin: gate.admin, jobId });
    await tryWriteAdminAuditLog(gate.admin, {
      actorId: gate.user.id,
      action: ADMIN_AUDIT_ACTIONS.jobPostDelete,
      targetType: "job_post",
      targetId: jobId,
      details: { title: result.title, employerProfileId: result.employerProfileId },
    });
    return adminApiJson({ ok: true });
  } catch (err) {
    const message = errorMessageFromUnknown(err, "delete_failed");
    const code = message === "job_not_found" ? message : "delete_failed";
    return adminApiJson({ error: code, message }, code === "delete_failed" ? 500 : 400);
  }
}
