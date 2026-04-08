import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { EmployerProfileForm } from "@/components/account/EmployerProfileForm";
import { EmployerJobsList } from "@/components/account/EmployerJobsList";

type Props = { params: Promise<{ locale: string }> };

export default async function EmployerAccountPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const tEmployer = await getTranslations({ locale, namespace: "employer" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);

  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select(
      "id, company_name, registry_code, contact_email, contact_phone, website, company_description, location, industry"
    )
    .eq("owner_user_id", user.id)
    .maybeSingle();

  const { data: jobs } = await supabase
    .from("job_posts")
    .select("id, title, status, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={t("employerArea")} subtitle={t("employerAreaSubtitle")} maxWidthClassName="max-w-3xl">
          <div className="space-y-10">
            <section className="space-y-4">
              <div>
                <div className="text-sm font-medium text-white/85">{tEmployer("companyProfile")}</div>
                <div className="mt-1 text-sm text-white/60">{tEmployer("companyProfileSubtitle")}</div>
              </div>
              <EmployerProfileForm locale={locale} initial={employer ?? null} />
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-white/85">{tJobs("myJobs")}</div>
                  <div className="mt-1 text-sm text-white/60">{tJobs("myJobsSubtitle")}</div>
                </div>
              </div>
              <EmployerJobsList locale={locale} initialJobs={(jobs ?? []) as any} />
            </section>
          </div>
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

