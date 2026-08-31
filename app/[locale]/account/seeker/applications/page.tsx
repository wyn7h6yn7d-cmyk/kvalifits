/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { SeekerApplicationsList } from "@/components/account/SeekerApplicationsList";
import { parsePaginationParams, paginationRange, buildPaginatedResult } from "@/lib/pagination/serverPagination";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const dynamic = "force-dynamic";

export default async function SeekerApplicationsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const pagination = parsePaginationParams(sp, 25);
  const { from, to } = paginationRange(pagination);
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "seeker") redirect(`/${locale}/account`);

  const supabase = await createSupabaseServerClient();

  const { data: applications, error, count: totalCount } = await supabase
    .from("job_applications")
    .select("id,job_post_id,created_at,updated_at,status_updated_at,status,shared_profile", { count: "exact" })
    .eq("seeker_user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);
  let applicationRows = applications;
  let applicationErr = error;
  let appCount = totalCount;
  if (applicationErr && /status_updated_at/i.test(applicationErr.message ?? "")) {
    const fallback = await supabase
      .from("job_applications")
      .select("id,job_post_id,created_at,updated_at,status,shared_profile", { count: "exact" })
      .eq("seeker_user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);
    applicationRows = fallback.data as unknown as typeof applications;
    applicationErr = fallback.error;
    appCount = fallback.count;
  }
  if (applicationErr) throw applicationErr;

  const paginated = buildPaginatedResult(applicationRows ?? [], appCount ?? 0, pagination);

  return (
    <AuthShell
          title={tNav("seekerApplications")}
          subtitle={tNav("seekerAreaSubtitle")}
          maxWidthClassName="max-w-3xl"
        >
          <SeekerApplicationsList locale={locale} applications={(paginated.rows) as any[]} />
          {paginated.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              {paginated.page > 1 ? (
                <a href={`/${locale}/account/seeker/applications?page=${paginated.page - 1}`} className="text-body hover:text-foreground">
                  ← {tJobs("paginationPrev")}
                </a>
              ) : <span />}
              <span className="text-muted-2 tabular-nums">
                {tJobs("paginationStatus", { page: paginated.page, totalPages: paginated.totalPages, totalCount: paginated.totalCount })}
              </span>
              {paginated.page < paginated.totalPages ? (
                <a href={`/${locale}/account/seeker/applications?page=${paginated.page + 1}`} className="text-body hover:text-foreground">
                  {tJobs("paginationNext")} →
                </a>
              ) : <span />}
            </div>
          )}
          <div className="mt-8 text-xs text-muted-2">{tJobs("seekerApplicationsPrivacyNote")}</div>
        </AuthShell>
  );
}

