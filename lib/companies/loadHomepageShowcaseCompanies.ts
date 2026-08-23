import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isHomepageShowcaseColumnMissing,
  mapHomepageShowcaseRow,
  type HomepageShowcaseCompany,
} from "@/lib/companies/homepageShowcase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELECT = "id,public_slug,company_name,logo_url,carousel_logo_path,use_logo_plate,website";

async function queryShowcaseRows(supabase: SupabaseClient): Promise<HomepageShowcaseCompany[]> {
  const { data, error } = await supabase
    .from("employer_show_on_homepage_profiles")
    .select(SELECT)
    .order("company_name", { ascending: true });

  if (error) {
    if (isHomepageShowcaseColumnMissing(error.message)) return [];
    throw error;
  }

  const companies: HomepageShowcaseCompany[] = [];
  for (const row of data ?? []) {
    const mapped = mapHomepageShowcaseRow(row as Record<string, unknown>);
    if (mapped) companies.push(mapped);
  }
  return companies;
}

export const getHomepageShowcaseCompanies = cache(async (): Promise<HomepageShowcaseCompany[]> => {
  const supabase = await createSupabaseServerClient();
  return queryShowcaseRows(supabase);
});
