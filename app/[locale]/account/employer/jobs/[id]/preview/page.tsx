import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmployerJobPreviewActions } from "@/components/jobs/EmployerJobPreviewActions";
import { JobListingDetailView } from "@/components/jobs/JobListingDetailView";
import { getEmployerJobIfOwned } from "@/lib/employer/getEmployerJobIfOwned";
import { loadEmployerPublicRowById } from "@/lib/companies/loadPublicEmployerFields";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { NOINDEX_ROBOTS } from "@/lib/seo/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PREVIEW_SELECT =
  "id,title,location,job_type,work_type,short_summary,description,duty_lines,benefit_lines,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,employer_profile_id,status,created_at,published_at,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,salary_min,salary_max,salary_currency,salary_tax,salary_period,salary_mode,start_date,application_deadline,expires_at,profession_id";
const PREVIEW_SELECT_LEGACY =
  "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,employer_profile_id,status,created_at,published_at,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,salary_min,salary_max,salary_currency,salary_tax,salary_period,salary_mode,start_date,application_deadline,expires_at,profession_id";

type Props = { params: Promise<{ locale: string; id: string }> };

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default async function EmployerJobPreviewPage({ params }: Props) {
  const { locale, id } = await params;
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  let job = await getEmployerJobIfOwned(supabase, user.id, id, PREVIEW_SELECT);
  if (!job) {
    job = await getEmployerJobIfOwned(supabase, user.id, id, PREVIEW_SELECT_LEGACY);
  }
  if (!job) redirect(`/${locale}/account/employer/jobs`);

  const employer = job.employer_profile_id
    ? await loadEmployerPublicRowById(supabase, String(job.employer_profile_id))
    : null;
  const row = job as typeof job & Record<string, unknown>;

  return (
    <JobListingDetailView
      locale={locale}
      preview
      job={row}
      employer={
        employer
          ? {
              company_name: (employer.company_name ?? null) as string | null,
              logo_url: (employer.logo_url ?? null) as string | null,
              website: (employer.website ?? null) as string | null,
              public_slug: ((employer as { public_slug?: string | null }).public_slug ?? null) as string | null,
              company_description: ((employer as { company_description?: string | null }).company_description ??
                null) as string | null,
              company_verified: (employer as { company_verified?: boolean | null }).company_verified ?? null,
              verification_status: (employer as { verification_status?: string | null }).verification_status ?? null,
            }
          : null
      }
      toolbar={
        <EmployerJobPreviewActions
          locale={locale}
          jobId={job.id}
          status={String(row.status ?? "")}
          job={row}
        />
      }
      mobileLead={
        <EmployerJobPreviewActions
          locale={locale}
          jobId={job.id}
          status={String(row.status ?? "")}
          job={row}
        />
      }
      sidebar={
        <div className="rounded-3xl border border-border bg-[#f8fafc] p-5">
          <div className="text-sm font-medium text-foreground/80">{tJobs("previewBanner")}</div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{tJobs("previewBannerBody")}</p>
          <div className="mt-4">
            <EmployerJobPreviewActions
              locale={locale}
              jobId={job.id}
              status={String(row.status ?? "")}
              job={row}
            />
          </div>
        </div>
      }
    />
  );
}
