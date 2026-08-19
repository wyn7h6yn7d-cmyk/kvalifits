import { NextResponse } from "next/server";

import { authGateJson, requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { getEmployerJobIfOwned } from "@/lib/employer/getEmployerJobIfOwned";
import { parseMatchBreakdown } from "@/lib/employer/parseMatchBreakdown";
import { getJobMatchesForSeeker } from "@/lib/matching/getJobMatchesForSeeker";
import {
  MATCH_EXPLANATION_CRITERIA_CAP,
  buildMatchExplanationFromSharedProfile,
} from "@/lib/matching/matchExplanation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/**
 * Live seeker explanation for one job, or frozen employer application snapshot.
 * Never HTTP-cached — matching is user-specific and must not go stale.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = (url.searchParams.get("jobId") ?? "").trim();
  const applicationId = (url.searchParams.get("applicationId") ?? "").trim();

  if (jobId && applicationId) {
    return json({ error: "invalid_query" }, 400);
  }
  if (jobId) {
    if (!UUID_RE.test(jobId)) return json({ error: "invalid_id" }, 400);
    return seekerJobExplanation(jobId);
  }
  if (applicationId) {
    if (!UUID_RE.test(applicationId)) return json({ error: "invalid_id" }, 400);
    return employerApplicationExplanation(applicationId);
  }
  return json({ error: "missing_id" }, 400);
}

async function seekerJobExplanation(jobId: string) {
  const gate = await requireAuthenticatedUser();
  if (!gate.ok) return authGateJson(gate, { unauthenticatedError: "unauthorized" });
  if (gate.role !== "seeker") return json({ error: "forbidden" }, 403);

  const { supabase, user } = gate;
  const result = await getJobMatchesForSeeker({
    supabase,
    userId: user.id,
    jobIds: [jobId],
    includeExplanation: true,
    maxCriteria: MATCH_EXPLANATION_CRITERIA_CAP,
  });
  const match = result.byId.get(jobId);
  if (!match?.explanation) return json({ error: "not_found" }, 404);

  return json({
    jobId,
    matchScore: match.matchScore,
    explanation: match.explanation,
  });
}

async function employerApplicationExplanation(applicationId: string) {
  const gate = await requireAuthenticatedUser();
  if (!gate.ok) return authGateJson(gate, { unauthenticatedError: "unauthorized" });
  if (gate.role !== "employer") return json({ error: "forbidden" }, 403);

  const { supabase, user } = gate;
  const { data: app, error } = await supabase
    .from("job_applications")
    .select("id,job_post_id,match_score,match_breakdown,shared_profile,application_answers")
    .eq("id", applicationId)
    .maybeSingle();
  if (error || !app?.job_post_id) return json({ error: "not_found" }, 404);

  const owned = await getEmployerJobIfOwned(supabase, user.id, String(app.job_post_id));
  if (!owned) return json({ error: "forbidden" }, 403);

  const explanation = buildMatchExplanationFromSharedProfile({
    breakdown: parseMatchBreakdown(app.match_breakdown),
    sharedProfile: app.shared_profile,
    applicationAnswers: app.application_answers,
  });

  return json({
    applicationId,
    matchScore: typeof app.match_score === "number" ? app.match_score : null,
    explanation,
  });
}
