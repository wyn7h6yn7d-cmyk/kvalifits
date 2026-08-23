import type { SupabaseClient } from "@supabase/supabase-js";

export type SetJobPostFeaturedInput = {
  jobPostId: string;
  featuredFrom: string;
  featuredUntil: string;
};

/** Admin/service-role only: activate featured window on a published accepting job. */
export async function setJobPostFeatured(
  supabase: SupabaseClient,
  input: SetJobPostFeaturedInput,
): Promise<void> {
  const { error } = await supabase
    .from("job_posts")
    .update({
      is_featured: true,
      featured_from: input.featuredFrom,
      featured_until: input.featuredUntil,
    })
    .eq("id", input.jobPostId);
  if (error) throw error;
}

/** Admin/service-role only: remove featured flag. */
export async function clearJobPostFeatured(supabase: SupabaseClient, jobPostId: string): Promise<void> {
  const { error } = await supabase
    .from("job_posts")
    .update({
      is_featured: false,
      featured_from: null,
      featured_until: null,
    })
    .eq("id", jobPostId);
  if (error) throw error;
}
