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

  const counts = new Map<string, number>();
  for (const job of list) {
    const { count, error: cErr } = await supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("job_post_id", job.id);
    if (!cErr) counts.set(job.id, count ?? 0);
  }

  return list.map((j) => ({
    id: j.id,
    title: (j.title ?? "").toString().trim() || "—",
    applicantCount: counts.get(j.id) ?? 0,
  }));
}
