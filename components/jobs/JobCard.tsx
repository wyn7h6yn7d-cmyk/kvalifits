"use client";

import { memo } from "react";
import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { Job } from "@/components/jobs/types";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { YoungSeekerJobBadge } from "@/components/jobs/YoungSeekerJobBadge";

function formatDate(iso: string | undefined, locale: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const tag = locale === "en" ? "en-GB" : locale === "ru" ? "ru-RU" : "et-EE";
  return d.toLocaleDateString(tag, { year: "numeric", month: "2-digit", day: "2-digit" });
}

function JobCardComponent({ job }: { job: Job }) {
  const locale = useLocale();
  const t = useTranslations("jobCard");
  const posted = formatDate(job.createdAt, locale);

  const badges = [
    job.workType,
    job.jobType,
    ...(job.domains ?? []).slice(0, 1),
  ].filter((v): v is string => Boolean(v && v !== "—"));

  const logo = job.companyLogoUrl ? (
    job.companyLogoUrl.startsWith("data:") || job.companyLogoUrl.startsWith("blob:") ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={job.companyLogoUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-lg border border-white/[0.10] bg-white/[0.04] object-contain lg:h-9 lg:w-9"
      />
    ) : (
      <Image
        src={job.companyLogoUrl}
        alt=""
        width={36}
        height={36}
        sizes="36px"
        loading="lazy"
        className="h-8 w-8 shrink-0 rounded-lg border border-white/[0.10] bg-white/[0.04] object-contain lg:h-9 lg:w-9"
      />
    )
  ) : null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-b from-white/[0.06] to-white/[0.028] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-colors hover:border-white/[0.12] hover:from-white/[0.065] hover:to-white/[0.034]",
        "lg:rounded-2xl lg:border-white/[0.07] lg:bg-[#161618]/[0.85] lg:from-transparent lg:to-transparent lg:p-6 lg:shadow-none lg:hover:border-white/[0.11] lg:hover:bg-[#18181b]/[0.95]",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.05),transparent_58%)]",
          "lg:bg-[radial-gradient(circle_at_0%_50%,rgba(217,70,239,0.06),transparent_42%)]",
        )}
      />

      {/* ——— Mobile: vertical card (unchanged structure) ——— */}
      <div className="relative space-y-4 lg:hidden">
        <div className="space-y-1.5">
          <Link
            href={`/tood/${job.id}`}
            className="block text-pretty text-lg font-semibold tracking-tight text-white/92 hover:underline"
          >
            {job.title}
          </Link>
          {job.openToFirstJob ? (
            <div className="pt-1">
              <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-100/90">
                {t("openToFirstJobBadge")}
              </span>
            </div>
          ) : null}
          {job.suitableForYoungSeeker ? (
            <div className={job.openToFirstJob ? "pt-1.5" : "pt-1"}>
              <YoungSeekerJobBadge compact />
            </div>
          ) : null}
          <div className="flex items-center gap-2.5">
            {logo}
            <div className="text-[14px] text-white/68">
              {job.company}
              {job.companyVerified ? (
                <span className="ml-2 inline-flex align-middle rounded-full border border-emerald-400/30 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-100/90">
                  {t("companyVerifiedBadge")}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.09em] text-white/55">
              {t("labelLocation")}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[15px] font-medium leading-snug text-white/78">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden />
              <span>{job.location}</span>
            </div>
          </div>

          {badges.length || (job.type && job.type !== "—") ? (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.09em] text-white/55">
                {t("labelArrangement")}
              </div>
              <div className="mt-1.5 text-[15px] font-medium leading-snug text-white/78">
                {badges.length
                  ? badges.join(`${"\u00a0"}·${"\u00a0"}`)
                  : job.type}
              </div>
            </div>
          ) : null}

          {job.salary ? (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.09em] text-white/55">
                {t("labelSalary")}
              </div>
              <div className="mt-1.5 text-[15px] font-semibold tabular-nums leading-snug text-white/85">
                {job.salary}
              </div>
            </div>
          ) : null}

          {posted ? (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.09em] text-white/55">
                {t("labelPosted")}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[14px] leading-snug text-white/62">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/45" aria-hidden />
                {posted}
              </div>
            </div>
          ) : null}
        </div>

        {job.summary ? (
          <p className="text-pretty text-[15px] leading-relaxed text-white/62 sm:text-base">
            {job.summary}
          </p>
        ) : null}

        {job.tags.length ? (
          <div className="space-y-2.5 pt-0.5">
            <div className="text-[11px] font-medium uppercase tracking-[0.09em] text-white/55">
              {t("labelSignals")}
            </div>
            <div className="flex flex-wrap gap-2">
              {job.tags.slice(0, 6).map((tag, idx) => (
                <span
                  key={tag}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[13px] leading-tight",
                    idx === 1
                      ? "border-white/[0.12] bg-[rgba(227,31,141,0.10)] text-white/85"
                      : "border-white/[0.10] bg-white/[0.03] text-white/70",
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-1">
          <Button asChild variant="outline" size="sm" className="h-9 rounded-xl px-3.5 text-sm">
            <Link href={`/tood/${job.id}`}>{t("openJob")}</Link>
          </Button>
        </div>
      </div>

      {/* ——— Desktop: wide horizontal card ——— */}
      <div className="relative hidden lg:flex lg:items-stretch lg:gap-8">
        <div className="min-w-0 flex-1 space-y-3.5">
          <div>
            <Link
              href={`/tood/${job.id}`}
              className="block text-pretty text-[1.125rem] font-semibold leading-snug tracking-tight text-white/93 hover:text-white"
            >
              {job.title}
            </Link>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <div className="flex min-w-0 items-center gap-2.5">
                {logo}
                <span className="truncate text-[14px] text-white/70">{job.company}</span>
                {job.companyVerified ? (
                  <span className="inline-flex shrink-0 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-100/85">
                    {t("companyVerifiedBadge")}
                  </span>
                ) : null}
              </div>
              <span className="hidden text-white/25 sm:inline" aria-hidden>
                ·
              </span>
              <div className="flex items-center gap-1.5 text-[13px] text-white/55">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden />
                <span className="truncate">{job.location}</span>
              </div>
            </div>
          </div>

          {(badges.length > 0 ||
            job.openToFirstJob ||
            job.suitableForYoungSeeker) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[12px] text-white/68"
                >
                  {b}
                </span>
              ))}
              {job.openToFirstJob ? (
                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[12px] text-emerald-100/85">
                  {t("openToFirstJobBadge")}
                </span>
              ) : null}
              {job.suitableForYoungSeeker ? <YoungSeekerJobBadge compact /> : null}
            </div>
          )}

          {job.summary ? (
            <p className="line-clamp-2 max-w-3xl text-[14px] leading-relaxed text-white/55">
              {job.summary}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-0.5">
            {job.salary ? (
              <div className="text-[14px] font-semibold tabular-nums text-white/88">
                <span className="mr-1.5 text-[12px] font-medium text-white/45">
                  {t("labelSalary")}
                </span>
                {job.salary}
              </div>
            ) : null}
            {posted ? (
              <div className="flex items-center gap-1.5 text-[13px] text-white/48">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                <span>
                  {t("labelPosted")} {posted}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex w-[11.5rem] shrink-0 flex-col items-stretch justify-center gap-3 border-l border-white/[0.06] pl-8">
          {/* Match % reserved for when listing scores are wired; no fake values. */}
          <Button asChild variant="primary" size="sm" className="h-10 w-full rounded-xl text-[13px]">
            <Link href={`/tood/${job.id}`}>{t("openJob")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const JobCard = memo(JobCardComponent);
