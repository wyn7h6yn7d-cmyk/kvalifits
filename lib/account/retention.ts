import { createHash } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ACCOUNT_RETENTION_DEFAULT_DAYS,
  type AccountRetentionCategory,
} from "@/lib/account/privacyCategories";

/** Opaque retention subject key — never store raw user id in retention tables. */
export function retentionSubjectKey(userId: string): string {
  return createHash("sha256").update(`kvalifits:account:${userId}`).digest("hex");
}

export function retainUntilFor(category: AccountRetentionCategory, from = new Date()): string | null {
  const days = ACCOUNT_RETENTION_DEFAULT_DAYS[category];
  if (days == null) return null;
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export type RetentionInsert = {
  category: AccountRetentionCategory;
  payload: Record<string, unknown>;
};

export async function insertLegalRetentionRecords(
  admin: SupabaseClient,
  subjectKey: string,
  records: RetentionInsert[],
  deletedAt: Date
): Promise<void> {
  if (!records.length) return;
  const rows = records.map((r) => ({
    retention_subject_key: subjectKey,
    category: r.category,
    payload: r.payload,
    retain_until: retainUntilFor(r.category, deletedAt),
    source_account_deleted_at: deletedAt.toISOString(),
  }));
  const { error } = await admin.from("legal_retention_records").insert(rows);
  if (error) throw error;
}
