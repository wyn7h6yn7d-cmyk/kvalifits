/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { AdminEmployersTable } from "@/components/admin/AdminEmployersTable";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parsePaginationParams, paginationRange, buildPaginatedResult } from "@/lib/pagination/serverPagination";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminEmployersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const pagination = parsePaginationParams(sp, 30);
  const { from, to } = paginationRange(pagination);
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const db = createSupabaseAdminClient() ?? supabase;

  const primary = await db
    .from("employer_profiles")
    .select(
      "id,company_name,registry_code,contact_email,company_verified,verification_status,verification_source,verified_at,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  let employers = primary.data;
  let totalCount = primary.count;
  if (primary.error) {
    const fallback = await db
      .from("employer_profiles")
      .select("id,company_name,registry_code,contact_email,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    employers = (fallback.data ?? []).map((e) => ({
      ...e,
      company_verified: false,
      verification_status: "unverified",
      verification_source: null,
      verified_at: null,
    })) as any;
    totalCount = fallback.count;
  }

  const ids = (employers ?? []).map((e) => e.id);
  const jobCountById = new Map<string, number>();
  if (ids.length) {
    const { data: jobRows } = await db.from("job_posts").select("employer_profile_id").in("employer_profile_id", ids);
    for (const row of jobRows ?? []) {
      const id = (row as { employer_profile_id?: string | null }).employer_profile_id;
      if (!id) continue;
      jobCountById.set(id, (jobCountById.get(id) ?? 0) + 1);
    }
  }

  const paginated = buildPaginatedResult([], totalCount ?? 0, pagination);

  return (
    <AdminShell title={t("employersTitle")} subtitle={t("employersSubtitle")} maxWidthClassName="max-w-3xl">
      <AdminEmployersTable
        employers={(employers ?? []).map((e) => ({
          ...(e as any),
          job_count: jobCountById.get(e.id) ?? 0,
        }))}
      />
      {paginated.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {paginated.page > 1 ? (
            <a href={`/${locale}/admin/employers?page=${paginated.page - 1}`} className="text-white/70 hover:text-white">← {t("paginationPrev")}</a>
          ) : <span />}
          <span className="text-white/50 tabular-nums">
            {t("paginationStatus", { page: paginated.page, totalPages: paginated.totalPages, totalCount: paginated.totalCount })}
          </span>
          {paginated.page < paginated.totalPages ? (
            <a href={`/${locale}/admin/employers?page=${paginated.page + 1}`} className="text-white/70 hover:text-white">{t("paginationNext")} →</a>
          ) : <span />}
        </div>
      )}
    </AdminShell>
  );
}
