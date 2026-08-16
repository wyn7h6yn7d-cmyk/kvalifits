import { NextResponse } from "next/server";

import { runDeleteAccountWorkflow } from "@/lib/account/deleteAccountWorkflow";
import { ACCOUNT_DELETE_CONFIRM_WORD } from "@/lib/account/privacyCategories";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  confirmWord?: string;
  acknowledged?: boolean;
};

/**
 * Permanently close the account via server-side erase / anonymise workflow.
 * Does not delete only a profile row from the client.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const confirmWord = (body.confirmWord ?? "").toString().trim().toUpperCase();
  if (confirmWord !== ACCOUNT_DELETE_CONFIRM_WORD) {
    return NextResponse.json({ error: "confirm_word_required" }, { status: 400 });
  }
  if (body.acknowledged !== true) {
    return NextResponse.json({ error: "acknowledgement_required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "missing_service_role_key" }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    ((profile as { role?: string | null } | null)?.role ??
      (user.user_metadata as { role?: string } | undefined)?.role ??
      null) ||
    null;

  if (role === "admin") {
    return NextResponse.json({ error: "admin_cannot_self_delete" }, { status: 403 });
  }

  try {
    const result = await runDeleteAccountWorkflow({ admin, user, role });
    // Clear this browser session cookie after auth user is gone.
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — user may already be invalid
    }
    return NextResponse.json({
      ok: true,
      erasedCategories: result.erasedCategories,
      retainedCategories: result.retainedCategories,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "delete_failed";
    const lower = message.toLowerCase();
    if (
      lower.includes("legal_retention") ||
      lower.includes("account_deletion_events") ||
      lower.includes("schema cache") ||
      lower.includes("does not exist")
    ) {
      return NextResponse.json({ error: "missing_privacy_tables", message }, { status: 500 });
    }
    return NextResponse.json({ error: "delete_failed", message }, { status: 500 });
  }
}
