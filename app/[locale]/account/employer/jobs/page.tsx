import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { EmployerJobsList } from "@/components/account/EmployerJobsList";

type Props = { params: Promise<{ locale: string }> };

export default async function EmployerJobsPage({ params }: Props) {
  const { locale } = await params;
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

  const { data: jobs } = await supabase
    .from("job_posts")
    .select("id, title, status, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <AuthShell title={tJobs("myJobs")} subtitle={tJobs("myJobsSubtitle")} maxWidthClassName="max-w-3xl">
          <EmployerJobsList locale={locale} initialJobs={(jobs ?? []) as any} />
        </AuthShell>
      </main>
      <Footer />
    </div>
  );
}

