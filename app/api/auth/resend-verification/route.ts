import { NextResponse } from "next/server";

import { clientIpFromHeaders, consumeAuthRateLimit } from "@/lib/auth/rateLimit";
import {
  invalidEmailResendResponse,
  normalizeResendVerificationEmail,
  publicResultAfterProviderResend,
  publicResultAfterRateLimit,
  resendVerificationLimitOpts,
  resendVerificationRedirectLocale,
} from "@/lib/auth/resendVerification";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reportMessage } from "@/lib/monitoring/report";

export const runtime = "nodejs";

type Body = { email?: string; locale?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = normalizeResendVerificationEmail(body.email);
  if (!email) {
    const invalid = invalidEmailResendResponse();
    return NextResponse.json(invalid.body, { status: invalid.status });
  }

  const locale = resendVerificationRedirectLocale(body.locale);
  const ip = clientIpFromHeaders(req.headers);

  for (const opts of resendVerificationLimitOpts(ip, email)) {
    const limit = await consumeAuthRateLimit(opts);
    const blocked = publicResultAfterRateLimit(limit);
    if (blocked) {
      if ("error" in blocked.body && blocked.body.error === "missing_rate_limit_table") {
        reportMessage("missing_rate_limit_table", { area: "auth", code: "missing_rate_limit_table" });
      }
      return NextResponse.json(blocked.body, { status: blocked.status, headers: blocked.headers });
    }
  }

  const origin = new URL(req.url).origin;
  const redirectTo = `${origin}/${locale}/auth/callback`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: redirectTo },
  });

  const result = publicResultAfterProviderResend(error);
  return NextResponse.json(result.body, { status: result.status, headers: result.headers });
}
