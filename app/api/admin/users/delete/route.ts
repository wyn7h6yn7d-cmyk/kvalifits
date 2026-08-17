import { ADMIN_AUDIT_ACTIONS, tryWriteAdminAuditLog } from "@/lib/admin/auditLog";
import { runAdminHardDeleteUser } from "@/lib/admin/hardDeleteUser";
import { adminApiJson, adminConfirmWordOk, requireAdminApiActor } from "@/lib/admin/requireAdminApi";
import { errorMessageFromUnknown } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  userId?: string;
  confirmWord?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return adminApiJson({ error: "invalid_json" }, 400);
  }

  const targetUserId = (body.userId ?? "").toString().trim();
  if (!targetUserId) return adminApiJson({ error: "missing_user_id" }, 400);
  if (!adminConfirmWordOk(body.confirmWord)) {
    return adminApiJson({ error: "confirm_word_required" }, 400);
  }

  const gate = await requireAdminApiActor();
  if (!gate.ok) return gate.response;
  if (targetUserId === gate.user.id) return adminApiJson({ error: "cannot_delete_self" }, 403);

  try {
    const result = await runAdminHardDeleteUser({ admin: gate.admin, targetUserId });
    await tryWriteAdminAuditLog(gate.admin, {
      actorId: gate.user.id,
      action: ADMIN_AUDIT_ACTIONS.userDelete,
      targetType: "user",
      targetId: targetUserId,
      details: { email: result.email, role: result.role, mode: "hard" },
    });
    return adminApiJson({ ok: true });
  } catch (err) {
    const message = errorMessageFromUnknown(err, "delete_failed");
    const code = message === "cannot_delete_admin" || message === "user_not_found" ? message : "delete_failed";
    return adminApiJson({ error: code, message }, code === "delete_failed" ? 500 : 400);
  }
}
