import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { ACCOUNT_DELETE_CONFIRM_WORD } from "@/lib/account/privacyCategories";
import { getAdminMfaStatus } from "@/lib/auth/adminMfa";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ADMIN_API_NO_STORE = { "Cache-Control": "private, no-store" } as const;

export function adminApiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: ADMIN_API_NO_STORE });
}

export function adminConfirmWordOk(value: unknown) {
  return (value ?? "").toString().trim().toUpperCase() === ACCOUNT_DELETE_CONFIRM_WORD;
}

export async function requireAdminApiActor(): Promise<
  | { ok: true; supabase: SupabaseClient; user: User; admin: SupabaseClient }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: adminApiJson({ error: "not_authenticated" }, 401) };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role =
    ((profile as { role?: string | null } | null)?.role ??
      (user.user_metadata as { role?: string } | undefined)?.role ??
      null) ||
    null;
  if (role !== "admin") return { ok: false, response: adminApiJson({ error: "forbidden" }, 403) };

  const mfa = await getAdminMfaStatus(supabase);
  if (mfa.needsEnrollment || mfa.needsChallenge) {
    return { ok: false, response: adminApiJson({ error: "mfa_required" }, 403) };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false, response: adminApiJson({ error: "missing_service_role_key" }, 500) };

  return { ok: true, supabase, user, admin };
}
