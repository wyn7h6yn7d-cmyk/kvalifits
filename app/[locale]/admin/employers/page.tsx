/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { AdminEmployersTable } from "@/components/admin/AdminEmployersTable";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parsePaginationParams, paginationRange, buildPaginatedResult } from "@/lib/pagination/serverPagination";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

type AdminEmployerRow = {
  id: string;
  owner_user_id: string;
  company_name: string | null;
  registry_code: string | null;
  contact_email: string | null;
  company_verified: boolean | null;
  verification_status: string | null;
  verification_source: string | null;
  verified_at: string | null;
  created_at: string;
  logo_url: string | null;
  show_on_homepage?: boolean | null;
  homepage_logo_approved?: boolean | null;
  carousel_logo_path?: string | null;
  use_logo_plate?: boolean | null;
};

export default async function AdminEmployersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const pagination = parsePaginationParams(sp, 30);
  const { from, to } = paginationRange(pagination);
  const { supabase } = await requireAdmin(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const db = createSupabaseAdminClient() ?? supabase;

  const selectWithShowcase =
    "id,owner_user_id,company_name,registry_code,contact_email,company_verified,verification_status,verification_source,verified_at,created_at,logo_url,show_on_homepage,homepage_logo_approved,carousel_logo_path,use_logo_plate";
  const selectWithoutShowcase =
    "id,owner_user_id,company_name,registry_code,contact_email,company_verified,verification_status,verification_source,verified_at,created_at,logo_url";

  let showOnHomepageAvailable = true;
  const withShowcase = await db
    .from("employer_profiles")
    .select(selectWithShowcase, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  let employers: AdminEmployerRow[] | null = withShowcase.data;
  let totalCount = withShowcase.count;
  let queryError = withShowcase.error;

  if (
    queryError &&
    /show_on_homepage|homepage_logo_approved|carousel_logo_path|use_logo_plate|column/i.test(queryError.message ?? "")
  ) {
    showOnHomepageAvailable = false;
    const withoutShowcase = await db
      .from("employer_profiles")
      .select(selectWithoutShowcase, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    employers = withoutShowcase.data;
    totalCount = withoutShowcase.count;
    queryError = withoutShowcase.error;
  }

  if (queryError) {
    const fallback = await db
      .from("employer_profiles")
      .select("id,owner_user_id,company_name,registry_code,contact_email,created_at,logo_url", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    showOnHomepageAvailable = false;
    employers = (fallback.data ?? []).map((e) => ({
      ...e,
      company_verified: false,
      verification_status: "unverified",
      verification_source: null,
      verified_at: null,
      show_on_homepage: null,
      homepage_logo_approved: null,
      carousel_logo_path: null,
      use_logo_plate: null,
    })) as any;
    totalCount = fallback.count;
  } else if (!showOnHomepageAvailable) {
    employers = (employers ?? []).map((e) => ({
      ...e,
      show_on_homepage: null,
      homepage_logo_approved: null,
      carousel_logo_path: null,
      use_logo_plate: null,
    })) as any;
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
        showOnHomepageAvailable={showOnHomepageAvailable}
        employers={(employers ?? []).map((e) => ({
          ...(e as any),
          job_count: jobCountById.get(e.id) ?? 0,
        }))}
      />
      {paginated.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {paginated.page > 1 ? (
            <a href={`/${locale}/admin/employers?page=${paginated.page - 1}`} className="text-body hover:text-foreground">← {t("paginationPrev")}</a>
          ) : <span />}
          <span className="text-muted-2 tabular-nums">
            {t("paginationStatus", { page: paginated.page, totalPages: paginated.totalPages, totalCount: paginated.totalCount })}
          </span>
          {paginated.page < paginated.totalPages ? (
            <a href={`/${locale}/admin/employers?page=${paginated.page + 1}`} className="text-body hover:text-foreground">{t("paginationNext")} →</a>
          ) : <span />}
        </div>
      )}
    </AdminShell>
  );
}
