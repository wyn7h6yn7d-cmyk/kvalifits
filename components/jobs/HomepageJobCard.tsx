import Image from "next/image";
import { MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import type { Job } from "@/components/jobs/types";
import { Link } from "@/i18n/routing";
import { JOBS_PAGE_CARD_PADDING } from "@/lib/jobs/jobsPageLayout";
import { cn } from "@/lib/utils";

function CompanyLogo({ url, company }: { url?: string | null; company: string }) {
  const letter = (company || "?").trim().charAt(0).toUpperCase() || "?";
  const box =
    "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.10] bg-[#1a1a26] text-[12px] font-semibold text-foreground/85 lg:h-11 lg:w-11";

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

/**
 * Homepage-only job card — server-rendered, no FitScoreExplain / save / alerts.
 */
export async function HomepageJobCard({
  job,
  featured = false,
}: {
  job: Job;
  featured?: boolean;
}) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "jobCard" });
  const href = `/tood/${job.id}`;
  const workLabel = [job.jobType, job.workType].filter((v) => Boolean(v && v !== "—")).join(" · ");
  const hasMatch = typeof job.matchScore === "number";

  return (
    <article
      className={cn(
        JOBS_PAGE_CARD_PADDING,
        "group relative overflow-hidden rounded-xl border border-white/[0.09]",
        "bg-[linear-gradient(165deg,rgba(22,22,32,0.96)_0%,rgba(14,14,21,0.94)_100%)]",
        "shadow-[0_16px_48px_-32px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "transition-[border-color,box-shadow,transform] duration-200 ease-out",
        "hover:-translate-y-px hover:border-violet-400/18 motion-reduce:hover:translate-y-0",
      )}
    >
      <Link
        href={href}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={`${job.title} — ${job.company}`}
      />

      <div className="relative z-[1] flex gap-3">
        <CompanyLogo url={job.companyLogoUrl} company={job.company} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
            <h2 className="min-w-0 flex-1 text-pretty text-[1.0625rem] font-semibold leading-snug text-foreground">
              {job.title}
            </h2>
            {featured ? (
              <span className="shrink-0 rounded-full border border-border bg-white/[0.04] px-2 py-0.5 text-[0.8125rem] font-medium text-muted">
                {t("featuredBadge")}
              </span>
            ) : null}
            {hasMatch ? (
              <span className="shrink-0 text-[0.875rem] font-semibold tabular-nums text-indigo-200/85">
                {Math.round(job.matchScore!)}%
                <span className="ml-1 text-[0.75rem] font-medium text-white/45">{t("matchLabel")}</span>
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.9375rem] text-muted">
            <span className="truncate font-medium text-body">{job.company}</span>
            <span className="text-muted-2" aria-hidden>
              ·
            </span>
            <span className="inline-flex min-w-0 items-center gap-1 text-muted-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{job.location}</span>
            </span>
          </div>

          {job.salary ? (
            <p className="mt-2 text-base font-semibold tabular-nums text-foreground">{job.salary}</p>
          ) : null}

          {workLabel ? (
            <p className="mt-1.5 text-[0.8125rem] text-muted-2">{workLabel}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
