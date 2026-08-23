/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { EmployerJobsList } from "@/components/account/EmployerJobsList";
import { isFeaturedColumnMissing } from "@/lib/jobs/jobFeatured";

type Props = { params: Promise<{ locale: string }> };

type EmployerJobRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  is_featured?: boolean | null;
  featured_from?: string | null;
  featured_until?: string | null;
};

const JOBS_SELECT_WITH_FEATURED =
  "id, title, status, created_at, is_featured, featured_from, featured_until";
const JOBS_SELECT_BASE = "id, title, status, created_at";

export default async function EmployerJobsPage({ params }: Props) {
  const { locale } = await params;
  const tJobs = await getTranslations({ locale, namespace: "jobs" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  let jobs: EmployerJobRow[] | null = null;
  let error = null;

  const featuredRes = await supabase
    .from("job_posts")
    .select(JOBS_SELECT_WITH_FEATURED)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });
  jobs = featuredRes.data;
  error = featuredRes.error;

  if (error && isFeaturedColumnMissing(error.message)) {
    const res = await supabase
      .from("job_posts")
      .select(JOBS_SELECT_BASE)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    jobs = res.data;
  }

  return (
    <AuthShell title={tJobs("myJobs")} subtitle={tJobs("myJobsSubtitle")} maxWidthClassName="max-w-3xl">
          <EmployerJobsList locale={locale} initialJobs={(jobs ?? []) as any} />
        </AuthShell>
  );
}

