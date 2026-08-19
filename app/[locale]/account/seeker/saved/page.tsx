/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { SeekerSavedJobsList, type SavedJobListItem } from "@/components/account/SeekerSavedJobsList";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import { loadEmployerPublicRowsByIds } from "@/lib/companies/loadPublicEmployerFields";
import { parsePaginationParams, paginationRange, buildPaginatedResult } from "@/lib/pagination/serverPagination";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const dynamic = "force-dynamic";

export default async function SeekerSavedPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const pagination = parsePaginationParams(sp, 25);
  const { from, to } = paginationRange(pagination);
  const t = await getTranslations({ locale, namespace: "savedJobs" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "seeker") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  const { data: savedRows, error, count: totalCount } = await supabase
    .from("saved_jobs")
    .select(
      "id,created_at,job_post_id,job_posts(id,title,location,status,published_at,application_deadline,expires_at,employer_profile_id)",
      { count: "exact" },
    )
    .eq("seeker_user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const employerIds = Array.from(
    new Set(
      (savedRows ?? [])
        .map((row: any) => {
          const job = Array.isArray(row.job_posts) ? row.job_posts[0] : row.job_posts;
          return (job?.employer_profile_id ?? "").toString().trim();
        })
        .filter(Boolean),
    ),
  );

  const employerById = new Map<string, string>();
  if (employerIds.length) {
    const employers = await loadEmployerPublicRowsByIds(supabase, employerIds);
    for (const [id, emp] of employers) {
      employerById.set(id, (emp.company_name ?? "").toString().trim() || "—");
    }
  }

  const items: SavedJobListItem[] = (savedRows ?? [])
    .map((row: any) => {
      const job = Array.isArray(row.job_posts) ? row.job_posts[0] : row.job_posts;
      if (!job?.id) return null;
      const active = jobAcceptsApplications({
        status: job.status,
        published_at: job.published_at ?? null,
        application_deadline: job.application_deadline ?? null,
        expires_at: job.expires_at ?? null,
      });
      return {
        id: row.id as string,
        jobPostId: job.id as string,
        title: (job.title ?? "").toString().trim() || "—",
        company: employerById.get((job.employer_profile_id ?? "").toString()) ?? "—",
        location: (job.location ?? "").toString().trim(),
        applicationDeadline: (job.application_deadline ?? null) as string | null,
        active,
      } satisfies SavedJobListItem;
    })
    .filter((row): row is SavedJobListItem => Boolean(row))
    .sort((a, b) => Number(b.active) - Number(a.active));

  const paginated = buildPaginatedResult(items, totalCount ?? 0, pagination);

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")} maxWidthClassName="max-w-3xl">
          <SeekerSavedJobsList items={items} />
          {paginated.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              {paginated.page > 1 ? (
                <a href={`/${locale}/account/seeker/saved?page=${paginated.page - 1}`} className="text-white/70 hover:text-white">
                  ← {t("paginationPrev")}
                </a>
              ) : <span />}
              <span className="text-white/50 tabular-nums">
                {t("paginationStatus", { page: paginated.page, totalPages: paginated.totalPages, totalCount: paginated.totalCount })}
              </span>
              {paginated.page < paginated.totalPages ? (
                <a href={`/${locale}/account/seeker/saved?page=${paginated.page + 1}`} className="text-white/70 hover:text-white">
                  {t("paginationNext")} →
                </a>
              ) : <span />}
            </div>
          )}
        </AuthShell>
  );
}
