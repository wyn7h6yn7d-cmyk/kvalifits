import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { EmployerCandidatesSearch } from "@/components/employer/EmployerCandidatesSearch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { parseCandidateDiscoveryParams } from "@/lib/employer/candidateDiscoveryUrl";
import { loadDiscoverableCandidates } from "@/lib/employer/loadDiscoverableCandidates";
import { loadEmployerInboxJobOptions } from "@/lib/employer/loadEmployerInboxJobOptions";
import { Link } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmployerCandidatesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tOnboarding = await getTranslations({ locale, namespace: "onboarding" });
  const tEmployer = await getTranslations({ locale, namespace: "employer" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  const { filters, page } = parseCandidateDiscoveryParams(sp);
  const discovery = await loadDiscoverableCandidates(supabase, {
    filters,
    page,
    caller: { isAuthenticated: true, isEmployer: true },
  });

  const schemaHint = discovery.schemaMissing ? tEmployer("candidateFiltersFixHint") : null;

  const inboxJobs = await loadEmployerInboxJobOptions(supabase, user.id);
  const inboxJob =
    [...inboxJobs].sort((a, b) => b.applicantCount - a.applicantCount)[0] ?? null;

  return (
    <AuthShell title={t("candidates")} subtitle={t("candidatesSubtitle")} maxWidthClassName="max-w-6xl">
      {inboxJob ? (
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/70">
          <Link
            href={`/account/employer/jobs/${inboxJob.id}/applicants`}
            className="font-medium text-white/85 underline-offset-4 hover:text-white hover:underline"
          >
            {tJobs("inboxOpenFromDiscovery")}
          </Link>
          <span className="mt-1 block text-xs text-white/45">
            {tJobs("inboxJobOption", { title: inboxJob.title, count: inboxJob.applicantCount })}
          </span>
        </div>
      ) : null}
      {discovery.errorMessage || discovery.schemaMissing ? (
        <div className="mb-6 whitespace-pre-wrap rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {tOnboarding("unknownError")}
          {schemaHint ? `\n\n${schemaHint}` : null}
        </div>
      ) : null}

      <Suspense fallback={null}>
        <EmployerCandidatesSearch
          candidates={discovery.candidates}
          totalCount={discovery.totalCount}
          currentPage={discovery.currentPage}
          totalPages={discovery.totalPages}
          pageSize={discovery.pageSize}
          facets={discovery.facets}
          certificateLabel={tEmployer("certificate")}
          validUntilLabel={tEmployer("validUntil")}
        />
      </Suspense>
    </AuthShell>
  );
}
