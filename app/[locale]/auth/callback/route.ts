import { NextResponse } from "next/server";

import { loginSessionAllowed } from "@/lib/auth/accountBlocked";
import { loadProfileSecurity } from "@/lib/auth/profileSecurity";
import { revokeUserSessions, signOutAuthSession } from "@/lib/auth/revokeUserSessions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal/acceptanceVersions";
import {
  employerProfilePlaceholderRow,
  resultFromEmployerOwnerInsert,
} from "@/lib/employer/employerOwnerUniqueness";
import { emptySeekerProfileCompletenessPersistence } from "@/lib/seeker/profileCompleteness";

type Props = {
  params: Promise<{ locale: string }>;
};

function metaString(meta: Record<string, unknown> | undefined, key: string): string | null {
  const v = meta?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function GET(request: Request, { params }: Props) {
  const { locale } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? `/${locale}/onboarding`;

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const db = createSupabaseAdminClient() ?? supabase;
      const security = await loadProfileSecurity(db, user.id);
      if (security.lookupFailed) {
        await signOutAuthSession(supabase);
        return NextResponse.redirect(new URL(`/${locale}/auth/login`, url.origin));
      }
      if (!loginSessionAllowed(security)) {
        await signOutAuthSession(supabase);
        await revokeUserSessions(user.id);
        return NextResponse.redirect(new URL(`/${locale}/blocked`, url.origin));
      }

      const role = user.user_metadata?.role;
      const email = user.email ?? "";
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const termsAcceptedAt = metaString(meta, "terms_accepted_at") ?? new Date().toISOString();
      const termsVersion = metaString(meta, "terms_version") ?? CURRENT_TERMS_VERSION;
      const privacyVersion = metaString(meta, "privacy_version") ?? CURRENT_PRIVACY_VERSION;

      if (role === "seeker" || role === "employer") {
        await supabase.from("profiles").upsert({
          id: user.id,
          role,
          email,
          terms_accepted_at: termsAcceptedAt,
          terms_version: termsVersion,
          privacy_version: privacyVersion,
        });

        if (role === "seeker") {
          const { data: existing } = await supabase
            .from("seeker_profiles")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from("seeker_profiles").insert({
              user_id: user.id,
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
          }
        } else {
          const { error: employerErr } = await supabase
            .from("employer_profiles")
            .insert(employerProfilePlaceholderRow(user.id, email));
          void resultFromEmployerOwnerInsert(employerErr);
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
