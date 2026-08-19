import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { EmployerEditJobForm } from "@/components/jobs/EmployerEditJobForm";
import { getEmployerJobIfOwned } from "@/lib/employer/getEmployerJobIfOwned";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FULL_SELECT =
  "id,title,location,work_type,job_type,short_summary,description,duty_lines,benefit_lines,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,languages,industry_id,profession_id,skill_ids,certificate_ids,language_ids,salary_min,salary_max,salary_currency,application_url,application_type,status,created_by,employer_profile_id,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,published_at,application_deadline,expires_at";
const MID_SELECT =
  "id,title,location,work_type,job_type,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,languages,industry_id,profession_id,skill_ids,certificate_ids,language_ids,salary_min,salary_max,salary_currency,application_url,application_type,status,created_by,employer_profile_id,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,published_at,application_deadline,expires_at";
const LEGACY_SELECT =
  "id,title,location,work_type,job_type,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,salary_min,salary_max,salary_currency,application_url,application_type,status,created_by,employer_profile_id,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,published_at,application_deadline,expires_at";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ publish?: string }>;
};

export default async function EmployerEditJobPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const { publish } = await searchParams;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  let job = await getEmployerJobIfOwned(supabase, user.id, id, FULL_SELECT);
  if (!job) {
    job = await getEmployerJobIfOwned(supabase, user.id, id, MID_SELECT);
  }
  if (!job) {
    job = await getEmployerJobIfOwned(supabase, user.id, id, LEGACY_SELECT);
  }
  if (!job) redirect(`/${locale}/account/employer/jobs`);

  return (
    <AuthShell title={tJobs("editJob")} subtitle={t("employerAreaSubtitle")} maxWidthClassName="max-w-3xl">
      <EmployerEditJobForm locale={locale} initialJob={job as never} publishAttempted={publish === "1"} />
    </AuthShell>
  );
}
