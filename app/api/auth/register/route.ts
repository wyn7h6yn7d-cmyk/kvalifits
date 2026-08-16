import { NextResponse } from "next/server";

import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal/acceptanceVersions";
import { clientIpFromHeaders, consumeAuthRateLimit } from "@/lib/auth/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  email?: string;
  password?: string;
  role?: string;
  locale?: string;
  termsAccepted?: boolean;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = (body.email ?? "").toString().trim().toLowerCase();
  const password = (body.password ?? "").toString();
  const role = (body.role ?? "").toString();
  const locale = ((body.locale ?? "et").toString() || "et").slice(0, 5);
  const termsAccepted = body.termsAccepted === true;

  if (!termsAccepted) {
    return NextResponse.json({ error: "terms_required" }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 400 });
  }
  if (role !== "seeker" && role !== "employer") {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const ip = clientIpFromHeaders(req.headers);
  const limit = await consumeAuthRateLimit({ action: "register", ip, email });
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
  const redirectTo = `${origin}/${locale}/auth/callback`;
  const termsAcceptedAt = new Date().toISOString();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        role,
        terms_accepted_at: termsAcceptedAt,
        terms_version: CURRENT_TERMS_VERSION,
        privacy_version: CURRENT_PRIVACY_VERSION,
      },
    },
  });
  if (error) {
    return NextResponse.json(
      { error: "auth_failed", message: error.message, code: error.code ?? null },
      { status: 400 }
    );
  }

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "signup_no_user" }, { status: 500 });
  }

  const hasSession = Boolean(data.session);
  if (!hasSession) {
    // Email confirmation required — profile rows created on callback after verify.
    return NextResponse.json({ ok: true, needsEmailVerification: true });
  }

  const { error: profileErr } = await supabase.from("profiles").upsert({
    id: userId,
    role,
    email,
    terms_accepted_at: termsAcceptedAt,
    terms_version: CURRENT_TERMS_VERSION,
    privacy_version: CURRENT_PRIVACY_VERSION,
  });
  if (profileErr) {
    return NextResponse.json(
      { error: "profile_failed", message: profileErr.message },
      { status: 500 }
    );
  }

  if (role === "seeker") {
    const { error: seekerErr } = await supabase.from("seeker_profiles").insert({
      user_id: userId,
      full_name: "",
      phone: "",
      location: "",
      profile_title: "",
      about: "",
      skills: [],
      experience_level: "",
      preferred_job_types: [],
      preferred_locations: [],
      profile_visible: false,
      completion_percent: 0,
      is_complete: false,
    });
    if (seekerErr && seekerErr.code !== "23505") {
      return NextResponse.json({ error: "profile_failed", message: seekerErr.message }, { status: 500 });
    }
  } else {
    const { error: employerErr } = await supabase.from("employer_profiles").insert({
      owner_user_id: userId,
      company_name: "",
      contact_email: email,
      company_description: "",
      location: "",
    });
    if (employerErr && employerErr.code !== "23505") {
      return NextResponse.json({ error: "profile_failed", message: employerErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, needsEmailVerification: false });
}
