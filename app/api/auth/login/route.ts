import { NextResponse } from "next/server";

import { ACCOUNT_BLOCKED_ERROR, loginSessionAllowed } from "@/lib/auth/accountBlocked";
import { emailVerificationBlockReason, isEmailVerified } from "@/lib/auth/emailVerification";
import { clientIpFromHeaders, consumeAuthRateLimit } from "@/lib/auth/rateLimit";
import { loadProfileSecurity } from "@/lib/auth/profileSecurity";
import { revokeUserSessions, signOutAuthSession } from "@/lib/auth/revokeUserSessions";
import { reportMessage } from "@/lib/monitoring/report";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = { email?: string; password?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = (body.email ?? "").toString().trim().toLowerCase();
  const password = (body.password ?? "").toString();
  if (!email || !password) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }

  const ip = clientIpFromHeaders(req.headers);
  const limit = await consumeAuthRateLimit({ action: "login", ip, email });
  if (!limit.ok) {
    if (limit.error === "missing_rate_limit_table") {
      reportMessage("missing_rate_limit_table", { area: "auth", code: "missing_rate_limit_table" });
    }
    return NextResponse.json(
      {
        error: limit.error === "missing_rate_limit_table" ? "missing_rate_limit_table" : "rate_limited",
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json(
      { error: "auth_failed", code: error.code ?? null },
      { status: 401 }
    );
  }

  const user = data.user;
  if (emailVerificationBlockReason(user) === "unverified") {
    await signOutAuthSession(supabase);
    return NextResponse.json({ error: "email_not_confirmed" }, { status: 403 });
  }

  if (user) {
    const db = createSupabaseAdminClient() ?? supabase;
    const security = await loadProfileSecurity(db, user.id);
    if (security.lookupFailed) {
      await signOutAuthSession(supabase);
      reportMessage("login_unavailable", { area: "auth", code: "login_unavailable" });
      return NextResponse.json({ error: "login_unavailable" }, { status: 500 });
    }
    if (!loginSessionAllowed(security)) {
      await signOutAuthSession(supabase);
      await revokeUserSessions(user.id);
      return NextResponse.json({ error: ACCOUNT_BLOCKED_ERROR }, { status: 403 });
    }
  }

  return NextResponse.json({
    ok: true,
    emailVerified: isEmailVerified(user),
  });
}
