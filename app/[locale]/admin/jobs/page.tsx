/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { AdminJobsTable } from "@/components/admin/AdminJobsTable";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parsePaginationParams, paginationRange, buildPaginatedResult } from "@/lib/pagination/serverPagination";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminJobsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const pagination = parsePaginationParams(sp, 30);
  const { from, to } = paginationRange(pagination);
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const db = createSupabaseAdminClient() ?? supabase;

  const { data: jobs, count: totalCount } = await db
    .from("job_posts")
    .select("id,title,status,location,created_at,updated_at,employer_profile_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const employerIds = Array.from(
    new Set((jobs ?? []).map((j) => (j as { employer_profile_id?: string | null }).employer_profile_id).filter(Boolean))
  ) as string[];

  const { data: employers } = employerIds.length
    ? await db.from("employer_profiles").select("id,company_name").in("id", employerIds)
    : { data: [] as { id: string; company_name: string | null }[] };

  const employerNameById = new Map((employers ?? []).map((e) => [e.id, e.company_name ?? "—"]));

  const paginated = buildPaginatedResult([], totalCount ?? 0, pagination);

  return (
    <AdminShell title={t("jobsTitle")} subtitle={t("jobsSubtitle")}>
      <AdminJobsTable
        jobs={(jobs ?? []).map((j) => ({
          ...(j as any),
          employer_name: employerNameById.get((j as any).employer_profile_id) ?? "—",
        }))}
      />
      {paginated.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {paginated.page > 1 ? (
            <a href={`/${locale}/admin/jobs?page=${paginated.page - 1}`} className="text-body hover:text-foreground">← {t("paginationPrev")}</a>
          ) : <span />}
          <span className="text-muted-2 tabular-nums">
            {t("paginationStatus", { page: paginated.page, totalPages: paginated.totalPages, totalCount: paginated.totalCount })}
          </span>
          {paginated.page < paginated.totalPages ? (
            <a href={`/${locale}/admin/jobs?page=${paginated.page + 1}`} className="text-body hover:text-foreground">{t("paginationNext")} →</a>
          ) : <span />}
        </div>
      )}
    </AdminShell>
  );
}
