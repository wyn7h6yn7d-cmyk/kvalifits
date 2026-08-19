import type { SupabaseClient } from "@supabase/supabase-js";

import { isMissingDbObjectError } from "@/lib/companies/publicCompany";
import {
  EMPLOYER_PUBLIC_SELECT,
  EMPLOYER_PUBLIC_SELECT_LEGACY,
} from "@/lib/employer/employerProfileFields";

const PUBLIC_SELECT_FALLBACKS = [EMPLOYER_PUBLIC_SELECT, EMPLOYER_PUBLIC_SELECT_LEGACY];

async function selectByIds(
  supabase: SupabaseClient,
  table: string,
  select: string,
  ids: string[],
): Promise<{ rows: Record<string, unknown>[]; missingObject: boolean; columnError: boolean }> {
  const { data, error } = await supabase.from(table).select(select).in("id", ids);
  if (!error) {
    return { rows: ((data ?? []) as unknown as Record<string, unknown>[]), missingObject: false, columnError: false };
  }
  const message = error.message ?? "";
  if (isMissingDbObjectError(message)) {
    return { rows: [], missingObject: true, columnError: /column/i.test(message) };
  }
  if (/column/i.test(message)) {
    return { rows: [], missingObject: false, columnError: true };
  }
  throw error;
}

/**
 * Load public company card fields for job boards, SEO, and saved-job lists.
 * Never requests owner-private or admin-only employer_profiles columns.
 */
export async function loadEmployerPublicRowsByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  const byId = new Map<string, Record<string, unknown>>();
  if (!unique.length) return byId;

  const ingest = (rows: Record<string, unknown>[]) => {
    for (const row of rows) {
      const id = String(row.id ?? "").trim();
      if (id && !byId.has(id)) byId.set(id, row);
    }
  };

  let remaining = unique;
  const tables = ["employer_public_profiles", "employer_saved_public_profiles", "employer_profiles"] as const;

  for (const table of tables) {
    if (!remaining.length) break;
    for (const select of PUBLIC_SELECT_FALLBACKS) {
      const result = await selectByIds(supabase, table, select, remaining);
      if (result.missingObject) break;
      if (result.columnError) continue;
      ingest(result.rows);
      remaining = remaining.filter((id) => !byId.has(id));
      break;
    }
  }

  return byId;
}

export async function loadEmployerPublicRowById(
  supabase: SupabaseClient,
  id: string,
): Promise<Record<string, unknown> | null> {
  const key = id.trim();
  if (!key) return null;
  const byId = await loadEmployerPublicRowsByIds(supabase, [key]);
  return byId.get(key) ?? null;
}
