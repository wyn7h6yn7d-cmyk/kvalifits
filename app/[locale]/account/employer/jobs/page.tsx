/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { EmployerJobsList } from "@/components/account/EmployerJobsList";

type Props = { params: Promise<{ locale: string }> };

export default async function EmployerJobsPage({ params }: Props) {
  const { locale } = await params;
  const tJobs = await getTranslations({ locale, namespace: "jobs" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  const { data: jobs } = await supabase
    .from("job_posts")
    .select("id, title, status, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <AuthShell title={tJobs("myJobs")} subtitle={tJobs("myJobsSubtitle")} maxWidthClassName="max-w-3xl">
          <EmployerJobsList locale={locale} initialJobs={(jobs ?? []) as any} />
        </AuthShell>
  );
}

