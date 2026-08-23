"use client";

import { memo } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { Job } from "@/components/jobs/types";
import { FitScoreExplain } from "@/components/jobs/FitScoreExplain";
import { JobSaveButton } from "@/components/jobs/JobSaveButton";
import { YoungSeekerJobBadge } from "@/components/jobs/YoungSeekerJobBadge";
import { CompanyVerifiedBadge } from "@/components/employer/CompanyVerificationBadge";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { formatJobDateDdMmYyyy } from "@/lib/jobs/jobLifecycle";

function formatDate(iso: string | undefined | null, locale: string) {
  if (!iso) return null;
  const formatted = formatJobDateDdMmYyyy(iso);
  if (formatted) return formatted;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const tag = locale === "en" ? "en-GB" : locale === "ru" ? "ru-RU" : "et-EE";
  return d.toLocaleDateString(tag, { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatPostedRelative(
  iso: string | undefined | null,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startToday - startThat) / 86_400_000);
  if (days <= 0) return t("postedToday");
  if (days === 1) return t("postedYesterday");
  if (days < 14) return t("postedDaysAgo", { days });
  const formatted = formatJobDateDdMmYyyy(iso);
  return formatted ? t("postedOn", { date: formatted }) : t("postedToday");
}

function CompanyLogo({ url, company }: { url?: string | null; company: string }) {
  const letter = (company || "?").trim().charAt(0).toUpperCase() || "?";
  const box =
    "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.04] text-[12px] font-semibold text-white/70 lg:h-11 lg:w-11";

  if (!url) {
    return (
      <div className={box} aria-hidden>
        {letter}
      </div>
    );
  }

  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={cn(box, "object-contain p-1")} />
    );
  }

  return (
    <Image
      src={url}
      alt=""
      width={48}
      height={48}
      sizes="48px"
      loading="lazy"
      quality={70}
      className={cn(box, "object-contain p-1")}
    />
  );
}

function MatchPanel({ jobId, score }: { jobId: string; score: number }) {
  return (
    <div className="relative min-w-0 lg:w-full lg:text-right">
      <FitScoreExplain score={score} lazySource={{ jobId }} compact showCountsWhenCollapsed />
    </div>
  );
}

function JobCardComponent({
  job,
  saved = false,
  canSave = true,
  featured = false,
}: {
  job: Job;
  saved?: boolean;
  canSave?: boolean;
  featured?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("jobCard");
  const href = `/tood/${job.id}`;
  const posted = formatPostedRelative(
    job.publishedAt ?? job.createdAt,
    t as unknown as (key: string, values?: Record<string, string | number>) => string,
  );
  const deadline = formatDate(job.applicationDeadline, locale);
  const hasMatch = typeof job.matchScore === "number";

  const badges = [job.jobType, job.workType, ...(job.domains ?? []).slice(0, 1)].filter(
    (v): v is string => Boolean(v && v !== "—"),
  );

  const tags = (job.skills?.length ? job.skills : job.tags).filter(Boolean);
  const visibleTags = tags.slice(0, 3);
  const extraTags = Math.max(0, tags.length - visibleTags.length);

  return (
    <article
      className={cn(
        "group relative overflow-visible rounded-2xl border border-white/[0.08] bg-[#16161b] p-3.5 transition-[border-color,background-color] duration-200",
        "hover:border-white/[0.14] hover:bg-[#1a1a20]",
        "sm:p-4",
      )}
    >
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`${job.title} — ${job.company}`}
      />

      <div className="relative z-[1] flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_12.75rem] lg:items-stretch lg:gap-x-6 lg:gap-y-3">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex gap-3">
            <CompanyLogo url={job.companyLogoUrl} company={job.company} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 text-pretty text-[1rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.05rem]">
                  {job.title}
                </h2>
                {featured ? (
                  <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium leading-snug text-white/55">
                    {t("featuredBadge")}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-white/62">
                {job.companySlug ? (
                  <Link
                    href={`/ettevotted/${job.companySlug}`}
                    className="relative z-[2] truncate font-medium text-white/72 hover:text-white hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {job.company}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-white/72">{job.company}</span>
                )}
                {job.companyVerified ? (
                  <CompanyVerifiedBadge label={t("companyVerifiedBadge")} />
                ) : null}
                <span className="text-white/25" aria-hidden>
                  ·
                </span>
                <span className="inline-flex min-w-0 items-center gap-1 text-white/55">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                  <span className="truncate">{job.location}</span>
                </span>
              </div>
            </div>
          </div>

          {job.salary ? (
            <p className="mt-2.5 text-[1rem] font-semibold tabular-nums tracking-tight text-white">
              {job.salary}
            </p>
          ) : null}

          {badges.length || job.openToFirstJob || job.suitableForYoungSeeker ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[12px] text-white/62"
                >
                  {b}
                </span>
              ))}
              {job.openToFirstJob ? (
                <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[12px] text-white/62">
                  {t("openToFirstJobBadge")}
                </span>
              ) : null}
              {job.suitableForYoungSeeker ? <YoungSeekerJobBadge compact /> : null}
            </div>
          ) : null}
        </div>

        {hasMatch ? (
          <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:self-start lg:justify-self-start lg:border-l lg:border-white/[0.06] lg:pl-6 lg:pr-2">
            <MatchPanel jobId={job.id} score={job.matchScore!} />
          </div>
        ) : null}

        {(posted || deadline) && (
          <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-white/45 lg:col-start-1 lg:row-start-2">
            {posted ? <span>{posted}</span> : null}
            {deadline ? (
              <span>
                {t("labelDeadline")} {deadline}
              </span>
            ) : null}
          </p>
        )}

        {job.summary ? (
          <p className="hidden line-clamp-2 max-w-2xl text-[13px] leading-snug text-white/50 lg:col-start-1 lg:row-start-3 lg:block">
            {job.summary}
          </p>
        ) : null}

        {visibleTags.length ? (
          <div className="hidden flex-wrap items-center gap-1.5 lg:col-start-1 lg:row-start-4 lg:flex">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="max-w-[11rem] truncate rounded-md px-1.5 py-0.5 text-[11px] text-white/45"
              >
                {tag}
              </span>
            ))}
            {extraTags > 0 ? (
              <span className="text-[11px] tabular-nums text-white/35">+{extraTags}</span>
            ) : null}
          </div>
        ) : null}

        {canSave ? (
          <div className="flex items-center gap-2 lg:contents">
            <JobSaveButton
              jobId={job.id}
              initialSaved={saved}
              className={cn(
                "relative z-[1] shrink-0 lg:col-start-2 lg:row-start-1 lg:justify-self-end lg:self-start",
                !hasMatch && "lg:border-l lg:border-white/[0.06] lg:pl-6",
              )}
            />
            <Button
              asChild
              variant="outline"
              className={cn(
                "relative z-[1] min-w-0 flex-1 lg:col-start-2 lg:row-start-1 lg:row-end-[-1] lg:w-full lg:flex-none lg:self-end",
                !hasMatch && "lg:border-l lg:border-white/[0.06] lg:pl-6",
              )}
            >
              <Link href={href}>{t("openJob")}</Link>
            </Button>
          </div>
        ) : (
          <Button
            asChild
            variant="outline"
            className="relative z-[1] w-full lg:col-start-2 lg:row-start-1 lg:row-end-[-1] lg:self-end lg:border-l lg:border-white/[0.06] lg:pl-6"
          >
            <Link href={href}>{t("openJob")}</Link>
          </Button>
        )}
      </div>
    </article>
  );
}

export const JobCard = memo(JobCardComponent);
