import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthShell } from "@/components/auth/AuthShell";
import { EmployerCandidatesSearch } from "@/components/employer/EmployerCandidatesSearch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import type { DiscoverableCandidate } from "@/lib/employer/candidateFilters";
import { loadEmployerInboxJobOptions } from "@/lib/employer/loadEmployerInboxJobOptions";
import { Link } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

function getPublicDisplayName(fullName: string | null) {
  const s = (fullName ?? "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const first = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1] ?? "";
  const initial = last.trim() ? `${last.trim()[0]!.toUpperCase()}.` : "";
  return initial ? `${first} ${initial}` : first;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function asNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function EmployerCandidatesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tOnboarding = await getTranslations({ locale, namespace: "onboarding" });
  const tEmployer = await getTranslations({ locale, namespace: "employer" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (role !== "employer") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  // Privacy-by-default MVP:
  // - only "discoverable" profiles (profile_visible = true)
  // - only profiles with at least one complete-enough certificate row OR explicit B-category license flag
  // - select summary + practical preference fields (no email/phone/uploads, no work-capacity)
  const [certRes, bLicRes] = await Promise.all([
    supabase
      .from("seeker_certificates")
      .select("user_id, certificate_name, certificate_issuer, certificate_valid_from, certificate_valid_until, verification_status, verified_at, verification_source")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("seeker_profiles")
      .select("user_id")
      .eq("profile_visible", true)
      .eq("has_b_category_drivers_license", true)
      .limit(300),
  ]);

  let certRows = certRes.data;
  let certErr = certRes.error;
  if (certErr && /verification_|column/i.test(certErr.message ?? "")) {
    const legacy = await supabase
      .from("seeker_certificates")
      .select("user_id, certificate_name, certificate_issuer, certificate_valid_from, certificate_valid_until")
      .order("created_at", { ascending: false })
      .limit(500);
    certRows = legacy.data as typeof certRows;
    certErr = legacy.error;
  }
  const bLicenseRows = bLicRes.data;
  const bLicErr = bLicRes.error;

  function nonEmpty(v: unknown) {
    return typeof v === "string" && v.trim().length > 0;
  }

  const certByUser = new Map<
    string,
    { count: number; items: DiscoverableCandidate["certificates"] }
  >();
  for (const row of certRows ?? []) {
    const userId = (row as { user_id?: string }).user_id;
    if (!userId) continue;

    const r = row as {
      certificate_name?: string | null;
      certificate_issuer?: string | null;
      certificate_valid_from?: string | null;
      certificate_valid_until?: string | null;
      verification_status?: string | null;
      verified_at?: string | null;
      verification_source?: string | null;
    };

    if (
      !nonEmpty(r.certificate_name) ||
      !nonEmpty(r.certificate_issuer) ||
      !nonEmpty(r.certificate_valid_from) ||
      !nonEmpty(r.certificate_valid_until)
    ) {
      continue;
    }

    const item = {
      name: (r.certificate_name ?? "").trim(),
      validUntil: r.certificate_valid_until ?? null,
      issuer: (r.certificate_issuer ?? "").trim() || null,
      verification_status: r.verification_status ?? null,
      verified_at: r.verified_at ?? null,
      verification_source: r.verification_source ?? null,
    };
    const prev = certByUser.get(userId);
    if (!prev) {
      certByUser.set(userId, { count: 1, items: [item] });
      continue;
    }
    prev.count += 1;
    prev.items.push(item);
  }

  const bLicenseUserIds = new Set<string>();
  for (const row of bLicenseRows ?? []) {
    const uid = (row as { user_id?: string }).user_id;
    if (uid) bLicenseUserIds.add(uid);
  }

  const candidateUserIdSet = new Set<string>(certByUser.keys());
  for (const uid of bLicenseUserIds) candidateUserIdSet.add(uid);
  const candidateUserIds = Array.from(candidateUserIdSet).slice(0, 200);

  const selectCols =
    "id, user_id, full_name, location, experience_level, skills, profile_title, about, profile_visible, updated_at, preferred_locations, preferred_job_types, languages, has_b_category_drivers_license, exp_seeking_first_job, experience_duration_years, pref_full_time, pref_part_time, pref_desired_weekly_hours, pref_min_weekly_hours, pref_max_weekly_hours, pref_day_work, pref_evening_work, pref_shift_work, pref_weekend_work, pref_flexible_hours, pref_remote_work, pref_hybrid_work, pref_on_site_work, discovery_accessible_workplace, discovery_adapted_arrangement, discovery_extra_breaks";

  const { data: seekers, error } = candidateUserIds.length
    ? await supabase
        .from("seeker_profiles")
        .select(selectCols)
        .eq("profile_visible", true)
        .in("user_id", candidateUserIds)
        .not("full_name", "is", null)
        .not("location", "is", null)
        .not("experience_level", "is", null)
        .order("updated_at", { ascending: false })
        .limit(80)
    : { data: [], error: null };

  // Fallback if discovery columns are not migrated yet.
  // Loose row type so primary vs fallback selects stay assignable under strict TS.
  let seekersRows: Record<string, unknown>[] | null =
    (seekers as Record<string, unknown>[] | null) ?? null;
  let fetchError = error;
  if (error && /discovery_accessible|discovery_adapted|discovery_extra|languages|column/i.test(error.message ?? "")) {
    const fallback = await supabase
      .from("seeker_profiles")
      .select(
        "id, user_id, full_name, location, experience_level, skills, profile_title, about, profile_visible, updated_at, preferred_locations, preferred_job_types, has_b_category_drivers_license, exp_seeking_first_job, experience_duration_years, pref_full_time, pref_part_time, pref_desired_weekly_hours, pref_min_weekly_hours, pref_max_weekly_hours, pref_day_work, pref_evening_work, pref_shift_work, pref_weekend_work, pref_flexible_hours, pref_remote_work, pref_hybrid_work, pref_on_site_work"
      )
      .eq("profile_visible", true)
      .in("user_id", candidateUserIds)
      .not("full_name", "is", null)
      .not("location", "is", null)
      .not("experience_level", "is", null)
      .order("updated_at", { ascending: false })
      .limit(80);
    seekersRows = (fallback.data as Record<string, unknown>[] | null) ?? null;
    fetchError = fallback.error;
  }

  const discoverableSeekers = (seekersRows ?? []).filter((s) => {
    const skills = (s.skills as string[] | null | undefined) ?? [];
    const about = (s.about as string | null | undefined) ?? "";
    return Array.isArray(skills) && skills.length >= 1 && nonEmpty(about);
  });

  const candidates: DiscoverableCandidate[] = discoverableSeekers.map((row) => {
    const userId = String(row.user_id ?? "");
    const certInfo = certByUser.get(userId);

    return {
      id: String(row.id ?? ""),
      userId,
      displayName: getPublicDisplayName((row.full_name as string | null) ?? null),
      location: (row.location as string | null) ?? null,
      preferredLocations: asStringArray(row.preferred_locations),
      experienceLevel: (row.experience_level as string | null) ?? null,
      profileTitle: (row.profile_title as string | null) ?? null,
      skills: asStringArray(row.skills),
      languages: asStringArray(row.languages),
      preferredJobTypes: asStringArray(row.preferred_job_types),
      seekingFirstJob: Boolean(row.exp_seeking_first_job),
      experienceDurationYears: asNumberOrNull(row.experience_duration_years),
      prefFullTime: Boolean(row.pref_full_time),
      prefPartTime: Boolean(row.pref_part_time),
      prefDesiredWeeklyHours: asNumberOrNull(row.pref_desired_weekly_hours),
      prefMinWeeklyHours: asNumberOrNull(row.pref_min_weekly_hours),
      prefMaxWeeklyHours: asNumberOrNull(row.pref_max_weekly_hours),
      prefDayWork: Boolean(row.pref_day_work),
      prefEveningWork: Boolean(row.pref_evening_work),
      prefShiftWork: Boolean(row.pref_shift_work),
      prefWeekendWork: Boolean(row.pref_weekend_work),
      prefFlexibleHours: Boolean(row.pref_flexible_hours),
      prefRemoteWork: Boolean(row.pref_remote_work),
      prefHybridWork: Boolean(row.pref_hybrid_work),
      prefOnSiteWork: Boolean(row.pref_on_site_work),
      discoveryAccessibleWorkplace: Boolean(row.discovery_accessible_workplace),
      discoveryAdaptedArrangement: Boolean(row.discovery_adapted_arrangement),
      discoveryExtraBreaks: Boolean(row.discovery_extra_breaks),
      certificates: certInfo?.items ?? [],
      hasBLicense: bLicenseUserIds.has(userId) || Boolean(row.has_b_category_drivers_license),
    };
  });

  const schemaHint =
    error && /discovery_accessible|discovery_adapted|discovery_extra|languages|column|schema cache/i.test(error.message ?? "")
      ? tEmployer("candidateFiltersFixHint")
      : null;

  const inboxJobs = await loadEmployerInboxJobOptions(supabase, user.id);
  const inboxJob =
    [...inboxJobs].sort((a, b) => b.applicantCount - a.applicantCount)[0] ?? null;

  return (
    <AuthShell title={t("candidates")} subtitle={t("candidatesSubtitle")} maxWidthClassName="max-w-6xl">
          {inboxJob ? (
            <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/70">
              <Link
                href={`/account/employer/jobs/${inboxJob.id}/applicants`}
                className="font-medium text-white/85 underline-offset-4 hover:text-white hover:underline"
              >
                {tJobs("inboxOpenFromDiscovery")}
              </Link>
              <span className="mt-1 block text-xs text-white/45">
                {tJobs("inboxJobOption", { title: inboxJob.title, count: inboxJob.applicantCount })}
              </span>
            </div>
          ) : null}
          {certErr || bLicErr || fetchError ? (
            <div className="mb-6 whitespace-pre-wrap rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
              {tOnboarding("unknownError")}
              {schemaHint ? `\n\n${schemaHint}` : null}
            </div>
          ) : null}

          <EmployerCandidatesSearch
            candidates={candidates}
            certificateLabel={tEmployer("certificate")}
            validUntilLabel={tEmployer("validUntil")}
          />
        </AuthShell>
  );
}
