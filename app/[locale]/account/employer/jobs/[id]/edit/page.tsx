import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { EmployerEditJobForm } from "@/components/jobs/EmployerEditJobForm";
import { JOB_POST_CERTIFICATE_REQUIREMENTS_DB_ENABLED } from "@/lib/jobs/jobPostCertificateRequirementsSync";

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

  const { data: job, error } = await supabase
    .from("job_posts")
    .select(
      (JOB_POST_CERTIFICATE_REQUIREMENTS_DB_ENABLED
        ? "id, title, location, work_type, job_type, short_summary, description, requirements, requirement_lines, required_skills, keywords, experience_level_required, certificate_requirements, salary_min, salary_max, salary_currency, application_url, application_type, status, created_by"
        : "id, title, location, work_type, job_type, short_summary, description, requirements, requirement_lines, required_skills, keywords, experience_level_required, salary_min, salary_max, salary_currency, application_url, application_type, status, created_by") as any
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!job) redirect(`/${locale}/account/employer`);
  const row = job as any;
  if (row.created_by !== user.id) redirect(`/${locale}/account/employer`);

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={tJobs("editJob")} subtitle={t("employerAreaSubtitle")} maxWidthClassName="max-w-3xl">
          <EmployerEditJobForm locale={locale} initialJob={row} />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

