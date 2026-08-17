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

function formatPosted(iso: string | undefined | null, locale: string) {
  if (!iso) return null;
  const formatted = formatJobDateDdMmYyyy(iso);
  if (formatted) return formatted;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const tag = locale === "en" ? "en-GB" : locale === "ru" ? "ru-RU" : "et-EE";
  return d.toLocaleDateString(tag, { year: "numeric", month: "2-digit", day: "2-digit" });
}

function CompanyLogo({ url, company }: { url?: string | null; company: string }) {
  const letter = (company || "?").trim().charAt(0).toUpperCase() || "?";
  const box =
    "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.04] text-[13px] font-semibold text-white/70 lg:h-12 lg:w-12";

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

function MatchPanel({
  score,
  explanation,
  compact,
}: {
  score: number;
  explanation: Job["matchExplanation"];
  compact?: boolean;
}) {
  return (
    <div className={cn("relative min-w-0", compact ? "" : "w-full text-right")}>
      <FitScoreExplain score={score} explanation={explanation} compact={compact} />
    </div>
  );
}

function JobCardComponent({
  job,
  saved = false,
  canSave = true,
}: {
  job: Job;
  saved?: boolean;
  canSave?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("jobCard");
  const href = `/tood/${job.id}`;
  const posted = formatPosted(job.publishedAt ?? job.createdAt, locale);
  const deadline = formatPosted(job.applicationDeadline, locale);
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
        "group relative overflow-visible rounded-2xl border border-white/[0.08] bg-[#16161b] p-4 transition-[border-color,background-color] duration-200",
        "hover:border-white/[0.14] hover:bg-[#1a1a20]",
        "sm:p-5",
      )}
    >
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`${job.title} — ${job.company}`}
      />

      <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex gap-3 sm:gap-3.5">
            <CompanyLogo url={job.companyLogoUrl} company={job.company} />
            <div className="min-w-0 flex-1">
              <h2 className="text-pretty text-[1.05rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.125rem]">
                {job.title}
              </h2>
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

            {canSave ? (
              <div className="flex shrink-0 items-start lg:hidden">
                <JobSaveButton jobId={job.id} initialSaved={saved} />
              </div>
            ) : null}
          </div>

          {hasMatch ? (
            <div className="mt-3 lg:hidden">
              <MatchPanel score={job.matchScore!} explanation={job.matchExplanation} compact />
            </div>
          ) : null}

          {badges.length || job.openToFirstJob || job.suitableForYoungSeeker ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
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

          {job.salary ? (
            <p className="mt-3 text-[1.05rem] font-semibold tabular-nums tracking-tight text-white">
              {job.salary}
            </p>
          ) : null}

          {(posted || deadline) && (
            <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-white/45">
              {posted ? (
                <span>
                  {t("labelPosted")} {posted}
                </span>
              ) : null}
              {deadline ? (
                <span>
                  {t("labelDeadline")} {deadline}
                </span>
              ) : null}
            </p>
          )}

          {job.summary ? (
            <p className="mt-2.5 line-clamp-2 max-w-2xl text-[13px] leading-snug text-white/50">
              {job.summary}
            </p>
          ) : null}

          {visibleTags.length ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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

          <div className="mt-3 lg:hidden">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="relative z-[1] h-11 w-full rounded-xl px-3.5 text-[14px]"
            >
              <Link href={href}>{t("openJob")}</Link>
            </Button>
          </div>
        </div>

        <div className="hidden w-[12.75rem] shrink-0 flex-col items-end justify-between gap-4 border-l border-white/[0.06] pl-6 lg:flex">
          <div className="flex w-full items-start justify-between gap-2">
            {hasMatch ? (
              <MatchPanel score={job.matchScore!} explanation={job.matchExplanation} compact />
            ) : (
              <span />
            )}
            {canSave ? <JobSaveButton jobId={job.id} initialSaved={saved} /> : null}
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="relative z-[1] h-9 w-full rounded-xl text-[13px]"
          >
            <Link href={href}>{t("openJob")}</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export const JobCard = memo(JobCardComponent);
