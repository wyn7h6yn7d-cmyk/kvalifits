import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Link } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { loadRankedJobsForSeeker } from "@/lib/jobs/loadRankedJobsForSeeker";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export default async function SeekerMatchesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "seeker") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  const { jobs, matchSortAvailable, savedJobIds } = await loadRankedJobsForSeeker(supabase, user.id);
  const ranked = jobs.slice(0, 40);
  const savedSet = new Set(savedJobIds);

  return (
    <AuthShell title={t("seekerMatches")} subtitle={t("seekerMatchesSubtitle")}>
          {!matchSortAvailable || !ranked.length ? (
            <EmptyState
              icon={Sparkles}
              title={t("seekerMatchesEmptyProfile")}
              actions={
                <Button asChild variant="primary" size="sm">
                  <Link href="/account/seeker/profile">{t("seekerMatchesEmptyCta")}</Link>
                </Button>
              }
            />
          ) : (
            <ul className="list-none space-y-3 p-0">
              {ranked.map((job) => (
                <li key={job.id}>
                  <JobCard job={job} saved={savedSet.has(job.id)} />
                </li>
              ))}
            </ul>
          )}
        </AuthShell>
  );
}
