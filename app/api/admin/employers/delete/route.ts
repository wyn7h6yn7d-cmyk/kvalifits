import { ADMIN_AUDIT_ACTIONS, tryWriteAdminAuditLog } from "@/lib/admin/auditLog";
import { runAdminHardDeleteEmployer } from "@/lib/admin/hardDeleteUser";
import { adminApiJson, adminConfirmWordOk, requireAdminApiActor } from "@/lib/admin/requireAdminApi";
import { errorMessageFromUnknown } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  employerId?: string;
  confirmWord?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return adminApiJson({ error: "invalid_json" }, 400);
  }

  const employerId = (body.employerId ?? "").toString().trim();
  if (!employerId) return adminApiJson({ error: "missing_employer_id" }, 400);
  if (!adminConfirmWordOk(body.confirmWord)) {
    return adminApiJson({ error: "confirm_word_required" }, 400);
  }

  const gate = await requireAdminApiActor();
  if (!gate.ok) return gate.response;

  try {
    const result = await runAdminHardDeleteEmployer({ admin: gate.admin, employerId });
    await tryWriteAdminAuditLog(gate.admin, {
      actorId: gate.user.id,
      action: ADMIN_AUDIT_ACTIONS.employerDelete,
      targetType: "employer",
      targetId: employerId,
      details: {
        companyName: result.companyName,
        ownerUserId: result.ownerUserId,
        jobCount: result.jobCount,
      },
    });
    return adminApiJson({ ok: true });
  } catch (err) {
    const message = errorMessageFromUnknown(err, "delete_failed");
    const code = message === "employer_not_found" ? message : "delete_failed";
    return adminApiJson({ error: code, message }, code === "delete_failed" ? 500 : 400);
  }
}
