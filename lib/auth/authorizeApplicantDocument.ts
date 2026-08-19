import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ApplicantDocumentAccess =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Owner, admin, or employer with a non-withdrawn consented application to this seeker.
 * Used for private certificate and CV files.
 */
export async function authorizeApplicantDocumentAccess(args: {
  viewerId: string;
  ownerUserId: string;
  role: string | null;
}): Promise<ApplicantDocumentAccess> {
  const { viewerId, ownerUserId, role } = args;

  if (viewerId === ownerUserId) return { ok: true };
  if (role === "admin") return { ok: true };

  if (role !== "employer") {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const db: SupabaseClient = createSupabaseAdminClient() ?? (await createSupabaseServerClient());

  const { data: apps, error: appsErr } = await db
    .from("job_applications")
    .select("job_post_id")
    .eq("seeker_user_id", ownerUserId)
    .eq("consent_to_share", true)
    .neq("status", "withdrawn")
    .limit(50);

  if (appsErr) {
    return { ok: false, status: 500, error: "access_check_failed" };
  }
  const jobIds = (apps ?? []).map((a) => a.job_post_id as string).filter(Boolean);
  if (!jobIds.length) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const { data: posts, error: postsErr } = await db
    .from("job_posts")
    .select("id, employer_profile_id")
    .in("id", jobIds);

  if (postsErr) {
    return { ok: false, status: 500, error: "access_check_failed" };
  }
  const employerProfileIds = [
    ...new Set((posts ?? []).map((p) => p.employer_profile_id as string).filter(Boolean)),
  ];
  if (!employerProfileIds.length) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const { data: owned, error: epErr } = await db
    .from("employer_profiles")
    .select("id")
    .in("id", employerProfileIds)
    .eq("owner_user_id", viewerId)
    .limit(1);

  if (epErr) {
    return { ok: false, status: 500, error: "access_check_failed" };
  }
  if (!owned?.length) {
    return { ok: false, status: 403, error: "forbidden" };
  }
  return { ok: true };
}
