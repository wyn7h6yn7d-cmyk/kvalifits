import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { EmployerEditJobForm } from "@/components/jobs/EmployerEditJobForm";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EmployerEditJobPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const fullSelect =
    "id,title,location,work_type,job_type,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,languages,industry_id,profession_id,skill_ids,certificate_ids,language_ids,salary_min,salary_max,salary_currency,application_url,application_type,status,created_by,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,published_at,application_deadline,expires_at";
  const legacySelect =
    "id,title,location,work_type,job_type,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,salary_min,salary_max,salary_currency,application_url,application_type,status,created_by,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,published_at,application_deadline,expires_at";

  const full = await supabase.from("job_posts").select(fullSelect).eq("id", id).maybeSingle();
  let job = full.data;
  let error = full.error;
  if (error && /column|schema cache/i.test(error.message ?? "")) {
    const fallback = await supabase.from("job_posts").select(legacySelect).eq("id", id).maybeSingle();
    job = fallback.data as typeof job;
    error = fallback.error;
  }
  if (error) throw error;
  if (!job) redirect(`/${locale}/account/employer`);
  if (job.created_by !== user.id) redirect(`/${locale}/account/employer`);

  return (
    <AuthShell title={tJobs("editJob")} subtitle={t("employerAreaSubtitle")} maxWidthClassName="max-w-3xl">
          <EmployerEditJobForm locale={locale} initialJob={job} />
        </AuthShell>
  );
}

