import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { processEmployerCarouselLogo } from "@/lib/employer/processEmployerCarouselLogo";
import { authGateJson, requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { reportException } from "@/lib/monitoring/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const gate = await requireAuthenticatedUser();
  if (!gate.ok) return authGateJson(gate);

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return Response.json({ ok: false, reason: "missing_service_role_key" }, { status: 503 });
  }

  const { data: employer, error } = await gate.supabase
    .from("employer_profiles")
    .select("id,owner_user_id,logo_url")
    .eq("owner_user_id", gate.user.id)
    .maybeSingle();

  if (error) {
    reportException(error, { area: "api", code: "carousel_logo_process_load" });
    return Response.json({ ok: false, reason: "load_failed" }, { status: 500 });
  }
  if (!employer?.id || !employer.owner_user_id) {
    return Response.json({ ok: false, reason: "employer_not_found" }, { status: 404 });
  }

  try {
    const result = await processEmployerCarouselLogo(admin, {
      id: employer.id,
      owner_user_id: employer.owner_user_id,
      logo_url: employer.logo_url,
    });
    return Response.json(result, { status: 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    reportException(err, { area: "api", code: "carousel_logo_process" });
    return Response.json({ ok: false, reason: "process_failed" }, { status: 500 });
  }
}
