import { NextResponse } from "next/server";

import {
  isJobPostReportReason,
  JOB_POST_REPORT_DETAILS_MAX,
} from "@/lib/jobs/jobPostReport";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  jobPostId?: string;
  reason?: string;
  details?: string;
};

/**
 * Submit a public job listing report for admin review.
 * Response never includes admin_notes.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const jobPostId = (body.jobPostId ?? "").toString().trim();
  const reasonRaw = (body.reason ?? "").toString().trim();
  const detailsRaw = (body.details ?? "").toString().trim().slice(0, JOB_POST_REPORT_DETAILS_MAX);

  if (!jobPostId) {
    return NextResponse.json({ error: "job_post_id_required" }, { status: 400 });
  }
  if (!isJobPostReportReason(reasonRaw)) {
    return NextResponse.json({ error: "invalid_reason" }, { status: 400 });
  }
  if (reasonRaw === "other" && detailsRaw.length < 3) {
    return NextResponse.json({ error: "details_required_for_other" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: job, error: jobErr } = await supabase
    .from("job_posts")
    .select("id,status")
    .eq("id", jobPostId)
    .maybeSingle();

  if (jobErr) {
    return NextResponse.json({ error: "job_lookup_failed" }, { status: 500 });
  }
  if (!job || (job.status as string) !== "published") {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }

  // No .select() — reporters have INSERT-only RLS and must never read admin_notes.
  const { error: insErr } = await supabase.from("job_post_reports").insert({
    job_post_id: jobPostId,
    reporter_user_id: user?.id ?? null,
    reason: reasonRaw,
    details: detailsRaw || null,
    status: "open",
    admin_notes: "",
  });

  if (insErr) {
    const msg = (insErr.message ?? "").toLowerCase();
    if (msg.includes("job_post_reports") || msg.includes("schema cache") || msg.includes("does not exist")) {
      return NextResponse.json({ error: "missing_reports_table" }, { status: 500 });
    }
    return NextResponse.json({ error: "insert_failed", message: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
