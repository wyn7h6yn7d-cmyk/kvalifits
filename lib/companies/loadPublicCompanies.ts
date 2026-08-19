import type { SupabaseClient } from "@supabase/supabase-js";

import { isE2eOfflineSupabase } from "@/lib/e2e/offlineHarness";
import {
  PUBLIC_COMPANY_SELECT,
  PUBLIC_COMPANY_SELECT_LEGACY,
  isMissingDbObjectError,
  mapPublicCompanyRow,
  uniqueSorted,
  type PublicCompany,
} from "@/lib/companies/publicCompany";

export type PublicCompanyFilters = {
  q?: string;
  industry?: string;
  location?: string;
  page?: number;
  pageSize?: number;
};

const DEFAULT_COMPANY_PAGE_SIZE = 30;
const FACET_SCAN_LIMIT = 2000;

function sanitizeIlike(raw: string): string {
  return raw.trim().slice(0, 120).replace(/[%_\\]/g, " ");
}

async function queryCompanyPage(
  supabase: SupabaseClient,
  tableOrView: "employer_public_profiles" | "employer_profiles",
  select: string,
  filters: PublicCompanyFilters,
  page: number,
  pageSize: number,
): Promise<{ rows: Record<string, unknown>[]; totalCount: number } | null> {
  const q = sanitizeIlike(filters.q ?? "");
  const industry = (filters.industry ?? "").trim();
  const location = (filters.location ?? "").trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from(tableOrView).select(select, { count: "exact" });
  if (industry) query = query.eq("industry", industry);
  if (location) query = query.eq("location", location);
  if (q) query = query.ilike("company_name", `%${q}%`);

  const { data, error, count } = await query.order("company_name", { ascending: true }).range(from, to);
  if (error) return null;
  return { rows: (data ?? []) as unknown as Record<string, unknown>[], totalCount: count ?? 0 };
}

async function fetchFacetValues(supabase: SupabaseClient): Promise<{ industries: string[]; locations: string[] }> {
  const fromView = await supabase
    .from("employer_public_profiles")
    .select("industry,location")
    .order("company_name", { ascending: true })
    .limit(FACET_SCAN_LIMIT);

  if (!fromView.error && fromView.data) {
    const rows = fromView.data as { industry?: string | null; location?: string | null }[];
    return {
      industries: uniqueSorted(rows.map((r) => r.industry)),
      locations: uniqueSorted(rows.map((r) => r.location)),
    };
  }

  if (!isMissingDbObjectError(fromView.error?.message ?? "")) {
    throw fromView.error;
  }

  const fromTable = await supabase
    .from("employer_profiles")
    .select("industry,location")
    .order("company_name", { ascending: true })
    .limit(FACET_SCAN_LIMIT);
  if (fromTable.error) throw fromTable.error;
  const rows = (fromTable.data ?? []) as { industry?: string | null; location?: string | null }[];
  return {
    industries: uniqueSorted(rows.map((r) => r.industry)),
    locations: uniqueSorted(rows.map((r) => r.location)),
  };
}

export async function loadPublicCompanies(
  supabase: SupabaseClient,
  filters: PublicCompanyFilters = {},
): Promise<{
  companies: PublicCompany[];
  industries: string[];
  locations: string[];
  totalCount: number;
  page: number;
  totalPages: number;
}> {
  if (isE2eOfflineSupabase()) {
    return { companies: [], industries: [], locations: [], totalCount: 0, page: 1, totalPages: 1 };
  }

  const pageSize = filters.pageSize ?? DEFAULT_COMPANY_PAGE_SIZE;
  const requestedPage = Math.max(1, filters.page ?? 1);

  let pageResult =
    (await queryCompanyPage(supabase, "employer_public_profiles", PUBLIC_COMPANY_SELECT, filters, requestedPage, pageSize)) ??
    (await queryCompanyPage(supabase, "employer_profiles", PUBLIC_COMPANY_SELECT, filters, requestedPage, pageSize));

  if (!pageResult) {
    pageResult = await queryCompanyPage(
      supabase,
      "employer_profiles",
      PUBLIC_COMPANY_SELECT_LEGACY,
      filters,
      requestedPage,
      pageSize,
    );
  }

  if (!pageResult) {
    throw new Error("public_companies_query_failed");
  }

  const totalCount = pageResult.totalCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const companies = pageResult.rows.map(mapPublicCompanyRow).filter((c): c is PublicCompany => Boolean(c));
  const { industries, locations } = await fetchFacetValues(supabase);

  return {
    companies,
    industries,
    locations,
    totalCount,
    page,
    totalPages,
  };
}
