import { cache } from "react";

import { isE2eOfflineSupabase } from "@/lib/e2e/offlineHarness";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getPublishedJobCountForHomepage = cache(async (): Promise<number> => {
  if (isE2eOfflineSupabase()) return 0;

  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("job_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (error) return 0;
  return count ?? 0;
});
