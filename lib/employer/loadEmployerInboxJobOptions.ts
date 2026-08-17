import type { EmployerSupabase } from "@/lib/employer/getEmployerJobIfOwned";
import type { ApplicantInboxJobOption } from "@/lib/employer/applicantScan";

export async function loadEmployerInboxJobOptions(
  supabase: EmployerSupabase,
  userId: string,
): Promise<ApplicantInboxJobOption[]> {
  const { data: ep, error: epErr } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (epErr) throw epErr;
  if (!ep) return [];

  const { data: jobs, error } = await supabase
    .from("job_posts")
    .select("id,title,created_at")
    .eq("employer_profile_id", ep.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const list = jobs ?? [];
  if (!list.length) return [];

  const ids = list.map((j) => j.id);
  const { data: apps, error: appErr } = await supabase
    .from("job_applications")
    .select("job_post_id")
    .in("job_post_id", ids)
    .limit(2000);
  if (appErr) throw appErr;

  const counts = new Map<string, number>();
  for (const row of apps ?? []) {
    const id = (row.job_post_id ?? "").toString();
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return list.map((j) => ({
    id: j.id,
    title: (j.title ?? "").toString().trim() || "—",
    applicantCount: counts.get(j.id) ?? 0,
  }));
}
