import type { SupabaseClient } from "@supabase/supabase-js";

import { isE2eOfflineSupabase } from "@/lib/e2e/offlineHarness";
import {
  PUBLIC_COMPANY_SELECT,
  PUBLIC_COMPANY_SELECT_LEGACY,
  foldSearchText,
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

async function fetchPublicCompanyRows(supabase: SupabaseClient): Promise<Record<string, unknown>[]> {
  const fromView = await supabase
    .from("employer_public_profiles")
    .select(PUBLIC_COMPANY_SELECT)
    .order("company_name", { ascending: true })
    .limit(1000);

  if (!fromView.error) return (fromView.data ?? []) as Record<string, unknown>[];
  if (!isMissingDbObjectError(fromView.error.message)) throw fromView.error;

  const fromTable = await supabase
    .from("employer_profiles")
    .select(PUBLIC_COMPANY_SELECT)
    .order("company_name", { ascending: true })
    .limit(1000);

  if (!fromTable.error) return (fromTable.data ?? []) as Record<string, unknown>[];
  if (!isMissingDbObjectError(fromTable.error.message)) throw fromTable.error;

  const legacy = await supabase
    .from("employer_profiles")
    .select(PUBLIC_COMPANY_SELECT_LEGACY)
    .order("company_name", { ascending: true })
    .limit(1000);
  if (legacy.error) throw legacy.error;
  return (legacy.data ?? []) as Record<string, unknown>[];
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

  const rows = await fetchPublicCompanyRows(supabase);
  const all = rows.map(mapPublicCompanyRow).filter((c): c is PublicCompany => Boolean(c));
  const industries = uniqueSorted(all.map((c) => c.industry));
  const locations = uniqueSorted(all.map((c) => c.location));

  const q = foldSearchText(filters.q ?? "");
  const industry = (filters.industry ?? "").trim();
  const location = (filters.location ?? "").trim();

  const filtered = all.filter((c) => {
    if (q && !foldSearchText(c.name).includes(q)) return false;
    if (industry && (c.industry ?? "") !== industry) return false;
    if (location && (c.location ?? "") !== location) return false;
    return true;
  });

  const pageSize = filters.pageSize ?? DEFAULT_COMPANY_PAGE_SIZE;
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);
  const start = (page - 1) * pageSize;
  const companies = filtered.slice(start, start + pageSize);

  return { companies, industries, locations, totalCount, page, totalPages };
}
