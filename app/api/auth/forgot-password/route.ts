import { NextResponse } from "next/server";

import { clientIpFromHeaders, consumeAuthRateLimit } from "@/lib/auth/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = { email?: string; locale?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = (body.email ?? "").toString().trim().toLowerCase();
  const locale = ((body.locale ?? "et").toString() || "et").slice(0, 5);
  if (!email) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  const ip = clientIpFromHeaders(req.headers);
  const limit = await consumeAuthRateLimit({ action: "password_reset", ip, email });
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: limit.error === "missing_rate_limit_table" ? "missing_rate_limit_table" : "rate_limited",
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const origin = new URL(req.url).origin;
  const redirectTo = `${origin}/${locale}/auth/callback?next=/${locale}/auth/reset-password`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  // Always return ok to avoid email enumeration; still rate-limited above.
  if (error) {
    const lower = (error.message ?? "").toLowerCase();
    if (lower.includes("rate") || lower.includes("too many")) {
      return NextResponse.json({ error: "rate_limited", retryAfterSeconds: 60 }, { status: 429 });
    }
  }

  return NextResponse.json({ ok: true });
}
