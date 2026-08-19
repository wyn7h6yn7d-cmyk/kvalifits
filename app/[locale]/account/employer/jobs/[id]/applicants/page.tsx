import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AccountCalmShell } from "@/components/account/AccountCalmShell";
import { EmployerApplicantList } from "@/components/employer/EmployerApplicantList";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { getEmployerJobIfOwned } from "@/lib/employer/getEmployerJobIfOwned";
import { loadEmployerInboxJobOptions } from "@/lib/employer/loadEmployerInboxJobOptions";
import type { ApplicantApplicationRow } from "@/lib/employer/applicantScan";
import { firstCvStorageRef } from "@/lib/seeker/cvStorage";
import { parsePaginationParams, paginationRange, buildPaginatedResult } from "@/lib/pagination/serverPagination";

type Props = { params: Promise<{ locale: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const dynamic = "force-dynamic";

export default async function EmployerJobApplicantsPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const sp = await searchParams;
  const pagination = parsePaginationParams(sp, 25);
  const t = await getTranslations({ locale, namespace: "jobs" });

  const { user, role, nextPath } = await getRoleAndNextPath(locale);
  if (!user) redirect(nextPath);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  const supabase = await createSupabaseServerClient();

  const job = await getEmployerJobIfOwned(supabase, user.id, id);
  if (!job) redirect(`/${locale}/account/employer`);

  const jobs = await loadEmployerInboxJobOptions(supabase, user.id);

  const { from, to } = paginationRange(pagination);

  let { data: applications, error: appErr, count: totalCount } = await supabase
    .from("job_applications")
    .select(
      "id,seeker_user_id,created_at,status,status_updated_at,cover_letter,match_score,match_breakdown,shared_profile,application_answers",
      { count: "exact" },
    )
    .eq("job_post_id", id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (appErr && /status_updated_at/i.test(appErr.message ?? "")) {
    const fallback = await supabase
      .from("job_applications")
      .select(
        "id,seeker_user_id,created_at,status,cover_letter,match_score,match_breakdown,shared_profile,application_answers",
        { count: "exact" },
      )
      .eq("job_post_id", id)
      .order("created_at", { ascending: false })
      .range(from, to);
    applications = fallback.data as typeof applications;
    appErr = fallback.error;
    totalCount = fallback.count;
  }

  if (appErr && /application_answers|cover_letter|column/i.test(appErr.message ?? "")) {
    const fallback = await supabase
      .from("job_applications")
      .select("id,seeker_user_id,created_at,status,match_score,match_breakdown,shared_profile", { count: "exact" })
      .eq("job_post_id", id)
      .order("created_at", { ascending: false })
      .range(from, to);
    applications = fallback.data as typeof applications;
    appErr = fallback.error;
    totalCount = fallback.count;
  }
  if (appErr) throw appErr;

  const paginatedMeta = buildPaginatedResult([], totalCount ?? 0, pagination);

  const apps = applications ?? [];
  const seekerIds = [...new Set(apps.map((a) => a.seeker_user_id).filter(Boolean))] as string[];
  const liveBySeeker = new Map<
    string,
    { cvUrl: string | null; languages: string[]; experienceDurationYears: number | null; seekingFirstJob: boolean }
  >();
  if (seekerIds.length) {
    const { data: profiles } = await supabase
      .from("seeker_profiles")
      .select("user_id,cv_url,languages,experience_duration_years,exp_seeking_first_job")
      .in("user_id", seekerIds);
    for (const p of profiles ?? []) {
      const row = p as {
        user_id: string;
        cv_url?: string | null;
        languages?: string[] | null;
        experience_duration_years?: number | null;
        exp_seeking_first_job?: boolean | null;
      };
      const langs = Array.isArray(row.languages)
        ? row.languages.map((x) => String(x).trim()).filter(Boolean)
        : [];
      const years =
        row.experience_duration_years === null || row.experience_duration_years === undefined
          ? null
          : Number(row.experience_duration_years);
      liveBySeeker.set(row.user_id, {
        cvUrl: firstCvStorageRef(row.cv_url),
        languages: langs,
        experienceDurationYears: years !== null && Number.isFinite(years) ? years : null,
        seekingFirstJob: Boolean(row.exp_seeking_first_job),
      });
    }
  }

  const enriched: ApplicantApplicationRow[] = apps.map((a) => {
    const seeker = (a.shared_profile as { seeker?: Record<string, unknown> } | null)?.seeker ?? {};
    const fromSnap = firstCvStorageRef(typeof seeker.cv_url === "string" ? seeker.cv_url : null);
    const live = a.seeker_user_id ? liveBySeeker.get(a.seeker_user_id) : undefined;
    return {
      id: String(a.id),
      created_at: (a.created_at ?? null) as string | null,
      status: (a.status ?? null) as string | null,
      status_updated_at: ((a as { status_updated_at?: string | null }).status_updated_at ?? null) as string | null,
      cover_letter: ((a as { cover_letter?: string | null }).cover_letter ?? null) as string | null,
      match_score: (a.match_score as number | null) ?? null,
      match_breakdown: a.match_breakdown,
      shared_profile: a.shared_profile,
      application_answers: (a as { application_answers?: unknown }).application_answers,
      resolved_cv_url: fromSnap ?? live?.cvUrl ?? null,
      live: live
        ? {
            languages: live.languages,
            experienceDurationYears: live.experienceDurationYears,
            seekingFirstJob: live.seekingFirstJob,
          }
        : null,
    };
  });

  return (
    <AccountCalmShell title={t("applicantsTitle")} subtitle={t("inboxSubtitle")} maxWidthClassName="max-w-7xl">
          <EmployerApplicantList locale={locale} jobPostId={id} applications={enriched} jobs={jobs} />
          {paginatedMeta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              {paginatedMeta.page > 1 ? (
                <a
                  href={`/${locale}/account/employer/jobs/${id}/applicants?page=${paginatedMeta.page - 1}`}
                  className="text-white/70 hover:text-white"
                >
                  ← {t("paginationPrev")}
                </a>
              ) : <span />}
              <span className="text-white/50 tabular-nums">
                {t("paginationStatus", { page: paginatedMeta.page, totalPages: paginatedMeta.totalPages, totalCount: paginatedMeta.totalCount })}
              </span>
              {paginatedMeta.page < paginatedMeta.totalPages ? (
                <a
                  href={`/${locale}/account/employer/jobs/${id}/applicants?page=${paginatedMeta.page + 1}`}
                  className="text-white/70 hover:text-white"
                >
                  {t("paginationNext")} →
                </a>
              ) : <span />}
            </div>
          )}
        </AccountCalmShell>
  );
}
