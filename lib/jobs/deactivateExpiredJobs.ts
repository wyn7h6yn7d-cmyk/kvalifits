import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Mark published jobs with past expires_at as archived (inactive).
 * Does not delete rows. Safe no-op without service role.
 * Throttled per isolate so listing pages do not issue an admin UPDATE on every request.
 */
let lastDeactivateAt = 0;
const DEACTIVATE_THROTTLE_MS = 60_000;

export async function deactivateExpiredJobPosts(): Promise<number> {
  const now = Date.now();
  if (now - lastDeactivateAt < DEACTIVATE_THROTTLE_MS) return 0;
  lastDeactivateAt = now;

  const admin = createSupabaseAdminClient();
  if (!admin) return 0;

  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("job_posts")
    .update({ status: "archived" })
    .eq("status", "published")
    .not("expires_at", "is", null)
    .lt("expires_at", nowIso)
    .select("id");

  if (error) {
    // Column may be missing before migration — ignore quietly.
    if (/expires_at|column/i.test(error.message ?? "")) return 0;
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * If this job is past expires_at, archive it and return true when it became inactive.
 */
export async function deactivateJobIfExpired(job: {
  id: string;
  status?: string | null;
  expires_at?: string | null;
}): Promise<boolean> {
  if ((job.status ?? "") !== "published") return false;
  const exp = (job.expires_at ?? "").toString().trim();
  if (!exp) return false;
  const end = new Date(exp);
  if (Number.isNaN(end.getTime()) || end.getTime() >= Date.now()) return false;

  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const { error } = await admin
    .from("job_posts")
    .update({ status: "archived" })
    .eq("id", job.id)
    .eq("status", "published");

  return !error;
}
