/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { EmployerProfileForm, type EmployerProfile } from "@/components/account/EmployerProfileForm";
import { EmployerJobsList } from "@/components/account/EmployerJobsList";
import { employerProfileSelectColumns, EMPLOYER_COMPANY_SIZE_DB_ENABLED } from "@/lib/employer/employerCompanySizeSync";

type Props = { params: Promise<{ locale: string }> };

export default async function EmployerAccountPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const tEmployer = await getTranslations({ locale, namespace: "employer" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  const { data: employerRaw, error: employerSelectErr } = await supabase
    .from("employer_profiles")
    .select(employerProfileSelectColumns())
    .eq("owner_user_id", user.id)
    .maybeSingle();

  let employer = employerRaw as EmployerProfile | null;
  if (employerSelectErr) {
    const fallbackCols = EMPLOYER_COMPANY_SIZE_DB_ENABLED
      ? "id, company_name, registry_code, contact_email, contact_phone, website, company_description, location, industry, logo_url, company_size"
      : "id, company_name, registry_code, contact_email, contact_phone, website, company_description, location, industry, logo_url";
    const fallback = await supabase
      .from("employer_profiles")
      .select(fallbackCols)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    employer = (fallback.data as EmployerProfile | null) ?? null;
  }

  const { data: jobs } = await supabase
    .from("job_posts")
    .select("id, title, status, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <AuthShell title={t("employerArea")} subtitle={t("employerAreaSubtitle")} maxWidthClassName="max-w-3xl">
          <div className="space-y-10">
            <section className="space-y-4">
              <div>
                <div className="text-sm font-medium text-foreground/80">{tEmployer("companyProfile")}</div>
                <div className="mt-1 text-sm text-muted">{tEmployer("companyProfileSubtitle")}</div>
              </div>
              <EmployerProfileForm locale={locale} initial={(employer as EmployerProfile | null) ?? null} />
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground/80">{tJobs("myJobs")}</div>
                  <div className="mt-1 text-sm text-muted">{tJobs("myJobsSubtitle")}</div>
                </div>
              </div>
              <EmployerJobsList locale={locale} initialJobs={(jobs ?? []) as any} />
            </section>
          </div>
        </AuthShell>
  );
}

