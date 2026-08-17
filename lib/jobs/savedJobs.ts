import type { SupabaseClient } from "@supabase/supabase-js";

function isMissingSavedJobsRelation(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  return m.includes("saved_jobs") && (m.includes("does not exist") || m.includes("schema cache"));
}

/** Job post ids the current seeker has saved. Empty when unauthenticated or table missing. */
export async function fetchSavedJobIdsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("job_post_id")
    .eq("seeker_user_id", userId);

  if (error) {
    if (isMissingSavedJobsRelation(error.message)) return [];
    throw error;
  }

  return (data ?? [])
    .map((row) => (row.job_post_id ?? "").toString().trim())
    .filter(Boolean);
}

export async function fetchSavedJobIdSetForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  return new Set(await fetchSavedJobIdsForUser(supabase, userId));
}
