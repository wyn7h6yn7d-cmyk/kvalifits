import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string }>;
};

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
      const role = user.user_metadata?.role;
      const email = user.email ?? "";

      if (role === "seeker" || role === "employer") {
        await supabase.from("profiles").upsert({
          id: user.id,
          role,
          email,
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
              completion_percent: 0,
              is_complete: false,
            });
          }
        } else {
          const { data: existing } = await supabase
            .from("employer_profiles")
            .select("id")
            .eq("owner_user_id", user.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from("employer_profiles").insert({
              owner_user_id: user.id,
              company_name: "",
              contact_email: email,
              company_description: "",
              location: "",
            });
          }
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

