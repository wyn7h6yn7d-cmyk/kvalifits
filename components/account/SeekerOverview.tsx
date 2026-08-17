import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { Job } from "@/components/jobs/types";
import type { ProfileGapKey } from "@/lib/seeker/profileCompleteness";
import { seekerApplicationStatusLabelKey } from "@/lib/applications/seekerFacingStatus";

export type OverviewApplication = {
  id: string;
  status: string | null;
  updatedAt: string | null;
  jobTitle: string;
  employerName: string;
  jobId: string;
};

export type OverviewCertWarning = {
  id: string;
  name: string;
  kind: "expired" | "today" | "soon";
  days: number | null;
};

export type OverviewDeadline = {
  id: string;
  jobPostId: string;
  title: string;
  company: string;
  dateLabel: string;
  days: number;
};

const GAP_HREF: Record<ProfileGapKey, string> = {
  avatar: "/account/seeker/profile",
  name: "/account/seeker/profile",
  title: "/account/seeker/profile",
  phone: "/account/seeker/profile",
  location: "/account/seeker/profile",
  about: "/account/seeker/profile",
  skills: "/account/seeker/profile",
  experience: "/account/seeker/profile",
  jobTypes: "/account/seeker/profile",
  locations: "/account/seeker/profile",
  dob: "/account/seeker/profile",
  certificate: "/account/seeker/certificates",
};

function surfaceClass() {
  return "rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5";
}

function fmtDate(locale: string, iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

export async function SeekerOverview({
  locale,
  firstName,
  percent,
  gaps,
  matches,
  matchSortAvailable,
  applications,
  certWarnings,
  deadlines,
}: {
  locale: string;
  firstName: string;
  percent: number;
  gaps: ProfileGapKey[];
  matches: Job[];
  matchSortAvailable: boolean;
  applications: OverviewApplication[];
  certWarnings: OverviewCertWarning[];
  deadlines: OverviewDeadline[];
}) {
  const t = await getTranslations({ locale, namespace: "seekerDashboard" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const shownGaps = gaps.slice(0, 3);

  return (
    <div className="space-y-4">
      <section className={surfaceClass()}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {firstName ? (
              <p className="text-xs text-white/45">{t("greeting", { name: firstName })}</p>
            ) : null}
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-white/92">
              {t("profileReady", { percent })}
            </h2>
          </div>
          <Link
            href="/account/seeker/profile"
            className="shrink-0 text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            {t("profileCta")}
          </Link>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden>
          <div className="h-full rounded-full bg-white/45" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
        {shownGaps.length ? (
          <ul className="mt-4 space-y-2">
            {shownGaps.map((gap) => (
              <li key={gap}>
                <Link
                  href={GAP_HREF[gap]}
                  className="text-sm leading-relaxed text-white/62 underline-offset-4 hover:text-white/85 hover:underline"
                >
                  {t(`gap.${gap}`)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-white/55">{t("profileComplete")}</p>
        )}
      </section>

      <section className={surfaceClass()}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-white/90">{t("matchesTitle")}</h2>
          <Link
            href="/account/seeker/matches"
            className="text-sm font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            {t("matchesAll")}
          </Link>
        </div>
        {!matchSortAvailable ? (
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            {t("matchesEmptyProfile")}{" "}
            <Link href="/account/seeker/profile" className="font-medium text-white/75 underline-offset-4 hover:underline">
              {t("profileCta")}
            </Link>
          </p>
        ) : !matches.length ? (
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            {t("matchesEmpty")}{" "}
            <Link href="/account/seeker/profile" className="font-medium text-white/75 underline-offset-4 hover:underline">
              {t("profileCta")}
            </Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {matches.map((job) => (
              <li key={job.id}>
                <Link href={`/tood/${job.id}`} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-0">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white/88">{job.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-white/45">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </span>
                  </span>
                  {typeof job.matchScore === "number" ? (
                    <span className="shrink-0 tabular-nums text-sm font-medium text-white/70">{job.matchScore}%</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={surfaceClass()}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-white/90">{t("applicationsTitle")}</h2>
          <Link
            href="/account/seeker/applications"
            className="text-sm font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            {t("applicationsAll")}
          </Link>
        </div>
        {!applications.length ? (
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            {t("applicationsEmpty")}{" "}
            <Link href="/account/seeker/matches" className="font-medium text-white/75 underline-offset-4 hover:underline">
              {t("viewMatchingJobs")}
            </Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {applications.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.jobId ? `/tood/${row.jobId}` : "/account/seeker/applications"}
                  className="flex items-start justify-between gap-3 py-3 first:pt-1 last:pb-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white/88">{row.jobTitle}</span>
                    <span className="mt-0.5 block truncate text-xs text-white/45">{row.employerName}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-medium text-white/70">
                      {tJobs(seekerApplicationStatusLabelKey(row.status))}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-white/40">{fmtDate(locale, row.updatedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {certWarnings.length ? (
        <section className={cn(surfaceClass(), "border-amber-500/20 bg-amber-500/[0.04]")}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-white/90">{t("certsTitle")}</h2>
            <Link
              href="/account/seeker/certificates"
              className="text-sm font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
            >
              {t("certsCta")}
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {certWarnings.map((c) => (
              <li key={c.id} className="text-sm leading-relaxed text-white/70">
                {c.kind === "expired"
                  ? t("certExpired", { name: c.name })
                  : c.kind === "today"
                    ? t("certExpiresToday", { name: c.name })
                    : t("certExpiring", { name: c.name, days: c.days ?? 0 })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {deadlines.length ? (
        <section className={surfaceClass()}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-white/90">{t("deadlinesTitle")}</h2>
            <Link
              href="/account/seeker/saved"
              className="text-sm font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
            >
              {t("deadlinesAll")}
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {deadlines.map((row) => (
              <li key={row.id}>
                <Link href={`/tood/${row.jobPostId}`} className="flex items-start justify-between gap-3 py-3 first:pt-1 last:pb-0">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white/88">{row.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-white/45">{row.company}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs font-medium text-white/70">
                    {row.days === 0 ? t("deadlineToday") : t("deadlineDays", { days: row.days })}
                    <span className="mt-0.5 block font-normal text-[11px] text-white/40">{row.dateLabel}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
