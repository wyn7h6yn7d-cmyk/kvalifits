import { NextResponse } from "next/server";

import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal/acceptanceVersions";
import { clientIpFromHeaders, consumeAuthRateLimit } from "@/lib/auth/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  employerProfilePlaceholderRow,
  resultFromEmployerOwnerInsert,
} from "@/lib/employer/employerOwnerUniqueness";
import { reportMessage } from "@/lib/monitoring/report";
import { emptySeekerProfileCompletenessPersistence } from "@/lib/seeker/profileCompleteness";

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
    if (limit.error === "missing_rate_limit_table") {
      reportMessage("missing_rate_limit_table", { area: "auth", code: "missing_rate_limit_table" });
    }
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
      { error: "auth_failed", code: error.code ?? null },
      { status: 400 }
    );
  }

  const userId = data.user?.id;
  if (!userId) {
    reportMessage("signup_no_user", { area: "auth", code: "signup_no_user" });
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
    reportMessage("profile_failed", { area: "auth", code: "profile_failed" });
    return NextResponse.json(
      { error: "profile_failed" },
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
      ...emptySeekerProfileCompletenessPersistence(),
    });
    if (seekerErr && seekerErr.code !== "23505") {
      reportMessage("profile_failed", { area: "auth", code: "seeker_profile_failed" });
      return NextResponse.json({ error: "profile_failed" }, { status: 500 });
    }
  } else {
    const { error: employerErr } = await supabase
      .from("employer_profiles")
      .insert(employerProfilePlaceholderRow(userId, email));
    const insertResult = resultFromEmployerOwnerInsert(employerErr);
    if (insertResult.kind === "failed") {
      reportMessage("profile_failed", { area: "auth", code: "employer_profile_failed" });
      return NextResponse.json({ error: "profile_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, needsEmailVerification: false });
}
