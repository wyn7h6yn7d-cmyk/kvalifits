import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isHomepageShowcaseColumnMissing,
  mapHomepageShowcaseRow,
  type HomepageShowcaseCompany,
} from "@/lib/companies/homepageShowcase";
import { isE2eOfflineSupabase } from "@/lib/e2e/offlineHarness";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELECT =
  "id,public_slug,company_name,logo_url,carousel_logo_path,use_logo_plate,website";

/**
 * Admin-approved homepage logos only (`employer_show_on_homepage_profiles`
 * requires show_on_homepage + homepage_logo_approved).
 */
async function queryShowcaseRows(supabase: SupabaseClient): Promise<HomepageShowcaseCompany[]> {
  const { data, error } = await supabase
    .from("employer_show_on_homepage_profiles")
    .select(SELECT)
    .order("company_name", { ascending: true });

  if (error) {
    if (isHomepageShowcaseColumnMissing(error.message)) return [];
    // Fail soft on the homepage — never block marketing SSR on showcase fetch issues.
    return [];
  }

  const companies: HomepageShowcaseCompany[] = [];
  for (const row of data ?? []) {
    const mapped = mapHomepageShowcaseRow(row as Record<string, unknown>);
    if (mapped) companies.push(mapped);
  }
  return companies;
}

export const getHomepageShowcaseCompanies = cache(async (): Promise<HomepageShowcaseCompany[]> => {
  if (isE2eOfflineSupabase()) return [];

  try {
    const supabase = await createSupabaseServerClient();
    return await queryShowcaseRows(supabase);
  } catch {
    return [];
  }
});
