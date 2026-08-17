/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AccountCalmShell } from "@/components/account/AccountCalmShell";
import {
  SeekerOverview,
  type OverviewApplication,
  type OverviewCertWarning,
  type OverviewDeadline,
} from "@/components/account/SeekerOverview";
import { DashboardSummarySkeleton } from "@/components/skeletons/DashboardSummarySkeleton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRoleAndNextPath } from "@/lib/onboarding/flow";
import { loadRankedJobsForSeeker } from "@/lib/jobs/loadRankedJobsForSeeker";
import { jobAcceptsApplications, daysUntilCalendarDate, formatJobDateDdMmYyyy } from "@/lib/jobs/jobLifecycle";
import {
  computeSeekerProfileCompleteness,
  firstNameFromFullName,
} from "@/lib/seeker/profileCompleteness";
import {
  daysUntilCertificateExpiry,
  isCertificateExpired,
  isCertificateExpiringSoon,
} from "@/lib/seeker/certificateVerification";
import { jobMetaFromSharedProfile } from "@/lib/applications/seekerFacingStatus";

type Props = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

const OVERVIEW_MATCHES = 5;
const OVERVIEW_APPLICATIONS = 5;
const OVERVIEW_DEADLINES = 5;
const OVERVIEW_CERTS = 3;

export default async function SeekerOverviewPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { role, nextPath } = await getRoleAndNextPath(locale);
  if (role !== "seeker") redirect(`/${locale}/account`);
  if (nextPath.includes("/onboarding/")) redirect(nextPath);

  return (
    <AccountCalmShell title={t("seekerOverview")} subtitle={t("seekerOverviewSubtitle")}>
      <Suspense fallback={<DashboardSummarySkeleton />}>
        <SeekerOverviewBody
          locale={locale}
          userId={user.id}
          avatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? null}
        />
      </Suspense>
    </AccountCalmShell>
  );
}

async function SeekerOverviewBody({
  locale,
  userId,
  avatarUrl,
}: {
  locale: string;
  userId: string;
  avatarUrl: string | null;
}) {
  const tDash = await getTranslations({ locale, namespace: "seekerDashboard" });
  const supabase = await createSupabaseServerClient();

  const [seekerRes, certsRes, ranked, applicationsRes, savedResult] = await Promise.all([
    supabase
      .from("seeker_profiles")
      .select(
        "full_name,profile_title,phone,location,about,skills,experience_level,preferred_job_types,preferred_locations,has_b_category_drivers_license,date_of_birth,learning_obligation_status",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("seeker_certificates")
      .select("id,certificate_name,certificate_valid_until")
      .eq("user_id", userId),
    loadRankedJobsForSeeker(supabase, userId),
    supabase
      .from("job_applications")
      .select("id,job_post_id,created_at,updated_at,status_updated_at,status,shared_profile")
      .eq("seeker_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("saved_jobs")
      .select(
        "id,job_post_id,job_posts(id,title,location,status,published_at,application_deadline,expires_at,employer_profile_id)",
      )
      .eq("seeker_user_id", userId)
      .limit(80),
  ]);

  let applications = applicationsRes.data;
  if (applicationsRes.error && /status_updated_at/i.test(applicationsRes.error.message ?? "")) {
    const fallback = await supabase
      .from("job_applications")
      .select("id,job_post_id,created_at,updated_at,status,shared_profile")
      .eq("seeker_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (fallback.error) throw fallback.error;
    applications = fallback.data as unknown as typeof applications;
  } else if (applicationsRes.error) {
    throw applicationsRes.error;
  }

  const seeker = seekerRes.data;
  const certs = certsRes.data;

  const namedCertificateCount = (certs ?? []).filter((c) => (c.certificate_name ?? "").toString().trim()).length;
  const completeness = computeSeekerProfileCompleteness({
    avatarUrl,
    fullName: seeker?.full_name ?? null,
    profileTitle: seeker?.profile_title ?? null,
    phone: seeker?.phone ?? null,
    location: seeker?.location ?? null,
    about: seeker?.about ?? null,
    skills: (seeker?.skills as string[] | null) ?? null,
    experienceLevel: seeker?.experience_level ?? null,
    preferredJobTypes: (seeker?.preferred_job_types as string[] | null) ?? null,
    preferredLocations: (seeker?.preferred_locations as string[] | null) ?? null,
    dateOfBirth: seeker?.date_of_birth ?? null,
    learningObligationStatus: seeker?.learning_obligation_status ?? null,
    hasBCategoryDriversLicense: seeker?.has_b_category_drivers_license ?? null,
    namedCertificateCount,
  });

  const certWarnings: OverviewCertWarning[] = (certs ?? [])
    .map((c) => {
      const name = (c.certificate_name ?? "").toString().trim() || tDash("unnamedCertificate");
      const until = c.certificate_valid_until ?? null;
      if (isCertificateExpired(until)) {
        return { id: String(c.id), name, kind: "expired" as const, days: daysUntilCertificateExpiry(until) };
      }
      if (isCertificateExpiringSoon(until)) {
        const days = daysUntilCertificateExpiry(until);
        return {
          id: String(c.id),
          name,
          kind: days === 0 ? ("today" as const) : ("soon" as const),
          days,
        };
      }
      return null;
    })
    .filter((row): row is OverviewCertWarning => Boolean(row))
    .sort((a, b) => (a.days ?? -999) - (b.days ?? -999))
    .slice(0, OVERVIEW_CERTS);

  const applicationRows: OverviewApplication[] = (applications ?? [])
    .map((row) => {
      const meta = jobMetaFromSharedProfile(row.shared_profile);
      return {
        id: row.id as string,
        status: (row.status ?? null) as string | null,
        updatedAt: ((row as { status_updated_at?: string | null }).status_updated_at ??
          row.updated_at ??
          row.created_at ??
          null) as string | null,
        jobTitle: meta.jobTitle,
        employerName: meta.employerName,
        jobId: meta.jobId || (row.job_post_id as string) || "",
      };
    })
    .slice(0, OVERVIEW_APPLICATIONS);

  const savedRows = (() => {
    const err = savedResult.error;
    if (!err) return savedResult.data ?? [];
    const m = (err.message ?? "").toLowerCase();
    if (m.includes("saved_jobs") && (m.includes("does not exist") || m.includes("schema cache"))) return [];
    throw err;
  })();
  const employerIds = Array.from(
    new Set(
      savedRows
        .map((row: any) => {
          const job = Array.isArray(row.job_posts) ? row.job_posts[0] : row.job_posts;
          return (job?.employer_profile_id ?? "").toString().trim();
        })
        .filter(Boolean),
    ),
  );
  const employerById = new Map<string, string>();
  if (employerIds.length) {
    const { data: employers } = await supabase.from("employer_profiles").select("id,company_name").in("id", employerIds);
    for (const emp of employers ?? []) {
      employerById.set(emp.id, (emp.company_name ?? "").toString().trim() || "—");
    }
  }

  const deadlines: OverviewDeadline[] = savedRows
    .map((row: any) => {
      const job = Array.isArray(row.job_posts) ? row.job_posts[0] : row.job_posts;
      if (!job?.id) return null;
      const active = jobAcceptsApplications({
        status: job.status,
        published_at: job.published_at ?? null,
        application_deadline: job.application_deadline ?? null,
        expires_at: job.expires_at ?? null,
      });
      if (!active) return null;
      const days = daysUntilCalendarDate(job.application_deadline ?? null);
      if (days === null || days < 0) return null;
      const dateLabel = formatJobDateDdMmYyyy(job.application_deadline) ?? "";
      return {
        id: row.id as string,
        jobPostId: job.id as string,
        title: (job.title ?? "").toString().trim() || "—",
        company: employerById.get((job.employer_profile_id ?? "").toString()) ?? "—",
        dateLabel,
        days,
      } satisfies OverviewDeadline;
    })
    .filter((row): row is OverviewDeadline => Boolean(row))
    .sort((a, b) => a.days - b.days)
    .slice(0, OVERVIEW_DEADLINES);

  return (
    <SeekerOverview
      locale={locale}
      firstName={firstNameFromFullName(seeker?.full_name ?? null)}
      percent={completeness.percent}
      gaps={completeness.gaps}
      matches={ranked.jobs.slice(0, OVERVIEW_MATCHES)}
      matchSortAvailable={ranked.matchSortAvailable}
      applications={applicationRows}
      certWarnings={certWarnings}
      deadlines={deadlines}
    />
  );
}
