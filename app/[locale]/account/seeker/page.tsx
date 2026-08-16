import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { SeekerProfileForm } from "@/components/account/SeekerProfileForm";
import { workplaceNeedsFromDb } from "@/lib/seeker/workplaceNeeds";
import { workCapacityFromDb } from "@/lib/seeker/workCapacity";

type Props = { params: Promise<{ locale: string }> };

export default async function SeekerAccountPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);

  if (role !== "seeker") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const { data: seeker } = await supabase
    .from("seeker_profiles")
    .select(
      "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,profile_visible,salary_expectation,work_authorization_notes,cv_url,has_b_category_drivers_license,date_of_birth,learning_obligation_status,is_minor,legal_representative_consent_status,pref_full_time,pref_part_time,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,pref_day_work,pref_evening_work,pref_night_work,pref_shift_work,pref_weekend_work,pref_flexible_hours,pref_remote_work,pref_hybrid_work,pref_on_site_work,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  let { data: certs, error: certsErr } = await supabase
    .from("seeker_certificates")
    .select(
      "id,certificate_name,certificate_number,certificate_issuer,certificate_valid_from,certificate_valid_until,certificate_image_url,verification_status,verified_at,verification_source,verified_by"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (certsErr && /verification_|column/i.test(certsErr.message ?? "")) {
    const fallback = await supabase
      .from("seeker_certificates")
      .select(
        "id,certificate_name,certificate_number,certificate_issuer,certificate_valid_from,certificate_valid_until,certificate_image_url"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    certs = fallback.data;
  }

  const { data: workplaceNeedsRow } = await supabase
    .from("seeker_workplace_needs")
    .select(
      "accessible_workplace,flexible_hours,extra_breaks,adapted_tools,adapted_arrangement,remote_option,other_need,other_note,shared_with_employer,share_practical_needs_with_employer"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: workCapacityRow } = await supabase
    .from("seeker_work_capacity")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("seekerArea")} subtitle={t("seekerAreaSubtitle")} maxWidthClassName="max-w-3xl">
          <SeekerProfileForm
            locale={locale}
            initial={{
              email: user.email ?? "",
              avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
              linkedin_url: (user.user_metadata?.linkedin_url as string | undefined) ?? null,
              seeker: seeker ?? null,
              certificates: certs ?? [],
              workplaceNeeds: workplaceNeedsFromDb(workplaceNeedsRow ?? null),
              workCapacity: workCapacityFromDb(workCapacityRow ?? null),
            }}
          />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}
