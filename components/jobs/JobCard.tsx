"use client";

import { memo } from "react";
import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { Job } from "@/components/jobs/types";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

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
  const arrangement = [job.workType, job.jobType].filter(Boolean).join(`${"\u00a0"}·${"\u00a0"}`);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 backdrop-blur-md transition-colors hover:bg-white/[0.04]">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          "bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_55%)]"
        )}
      />

      <div className="relative space-y-4">
        <div className="space-y-1.5">
          <Link
            href={`/tood/${job.id}`}
            className="block text-pretty text-lg font-semibold tracking-tight text-white/92 hover:underline"
          >
            {job.title}
          </Link>
          <div className="flex items-center gap-2.5">
            {job.companyLogoUrl ? (
              job.companyLogoUrl.startsWith("data:") || job.companyLogoUrl.startsWith("blob:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.companyLogoUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-lg border border-white/[0.10] bg-white/[0.04] object-contain"
                />
              ) : (
                <Image
                  src={job.companyLogoUrl}
                  alt=""
                  width={32}
                  height={32}
                  sizes="32px"
                  loading="lazy"
                  className="h-8 w-8 shrink-0 rounded-lg border border-white/[0.10] bg-white/[0.04] object-contain"
                />
              )
            ) : null}
            <div className="text-[15px] text-white/65">{job.company}</div>
          </div>
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/48">
              {t("labelLocation")}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-sm leading-snug text-white/72">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden />
              <span>{job.location}</span>
            </div>
          </div>

          {arrangement ? (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/48">
                {t("labelArrangement")}
              </div>
              <div className="mt-1.5 text-sm leading-snug text-white/72">{arrangement}</div>
            </div>
          ) : job.type && job.type !== "—" ? (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/48">
                {t("labelArrangement")}
              </div>
              <div className="mt-1.5 text-sm leading-snug text-white/72">{job.type}</div>
            </div>
          ) : null}

          {job.salary ? (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/48">{t("labelSalary")}</div>
              <div className="mt-1.5 text-sm font-medium tabular-nums leading-snug text-white/82">{job.salary}</div>
            </div>
          ) : null}

          {posted ? (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/48">{t("labelPosted")}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm leading-snug text-white/58">
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
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/48">{t("labelSignals")}</div>
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
    </div>
  );
}

export const JobCard = memo(JobCardComponent);

