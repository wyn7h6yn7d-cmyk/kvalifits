"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Building2, CalendarDays, MapPin } from "lucide-react";

import { Container } from "@/components/ui/container";
import {
  SITE_BODY,
  SITE_EYEBROW,
  SITE_H2_SECTION,
  SITE_H3,
  SITE_LABEL,
} from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

type ApplicantId = 0 | 1 | 2;

const DEMO_SCORES: Record<ApplicantId, number> = { 0: 87, 1: 64, 2: 31 };

const RING_R = 58;
const RING_C = 2 * Math.PI * RING_R;
const RING_STROKE = 9;

function PreviewScoreRing({
  score,
  label,
  sampleLabel,
}: {
  score: number;
  label: string;
  sampleLabel: string;
}) {
  const offset = RING_C * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="flex h-full min-h-[12.5rem] w-full flex-col items-center justify-center px-4 py-5">
      <span className={cn(SITE_LABEL, "text-muted")}>{label}</span>
      <div className="relative mt-3 flex h-[148px] w-[148px] items-center justify-center sm:h-[156px] sm:w-[156px]">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 132 132" aria-hidden>
          <circle
            cx="66"
            cy="66"
            r={RING_R}
            fill="none"
            stroke="rgba(15,23,42,0.08)"
            strokeWidth={RING_STROKE}
          />
          <circle
            cx="66"
            cy="66"
            r={RING_R}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={RING_STROKE}
            strokeLinecap="butt"
            strokeDasharray={RING_C}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="relative px-1 text-center">
          <div className="text-[2rem] font-semibold tabular-nums leading-none text-foreground sm:text-[2.125rem]">
            {score}%
          </div>
        </div>
      </div>
      <span className="mt-3 text-[0.8125rem] font-medium text-muted sm:text-[0.875rem]">{sampleLabel}</span>
    </div>
  );
}

function ListScore({ score, sampleLabel }: { score: number; sampleLabel: string }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className="text-[1.25rem] font-semibold tabular-nums leading-none text-primary sm:text-[1.375rem]">
        {score}%
      </span>
      <span className="text-[0.8125rem] font-medium leading-snug text-muted sm:text-[0.875rem]">{sampleLabel}</span>
    </div>
  );
}

export function EmployerProductPreview({ contentClassName }: { contentClassName?: string }) {
  const t = useTranslations("pages.employers");
  const suitabilityLabel = t("previewSuitabilityLabel");
  const sampleLabel = t("previewSampleBadge");
  const [selected, setSelected] = useState<ApplicantId>(0);

  const applicants: { id: ApplicantId; initial: string }[] = [
    { id: 0, initial: "M" },
    { id: 1, initial: "R" },
    { id: 2, initial: "E" },
  ];

  const detailKey = (id: ApplicantId, suffix: string) =>
    `previewDetail${id}${suffix}` as
      | "previewDetail0SeekerBlock"
      | "previewDetail0JobBlock"
      | "previewDetail0FitBullet1"
      | "previewDetail0FitBullet2"
      | "previewDetail0FitBullet3"
      | "previewDetail0FitBullet4"
      | "previewDetail1SeekerBlock"
      | "previewDetail1JobBlock"
      | "previewDetail1FitBullet1"
      | "previewDetail1FitBullet2"
      | "previewDetail1FitBullet3"
      | "previewDetail1FitBullet4"
      | "previewDetail2SeekerBlock"
      | "previewDetail2JobBlock"
      | "previewDetail2FitBullet1"
      | "previewDetail2FitBullet2"
      | "previewDetail2FitBullet3"
      | "previewDetail2FitBullet4";

  const fitBullets = (id: ApplicantId) =>
    [1, 2, 3, 4].map((n) => t(detailKey(id, `FitBullet${n}`)));

  const col = cn("w-full max-w-5xl", contentClassName);

  return (
    <section className="bg-background py-6 sm:py-8 lg:py-10">
      <Container>
        <div className={col}>
          <p className={SITE_EYEBROW}>{t("previewSectionEyebrow")}</p>
          <h2 className={cn("mt-2.5 sm:mt-3", SITE_H2_SECTION, "lg:text-[2.125rem]")}>{t("previewSectionTitle")}</h2>
          <p className={cn("mt-3 max-w-3xl sm:mt-4", SITE_BODY, "text-muted")}>{t("previewSectionLead")}</p>
        </div>

        <div
          className={cn(
            col,
            "mt-8 rounded-2xl border border-white/[0.11] sm:mt-10",
            "bg-[linear-gradient(165deg,rgba(22,22,32,0.98)_0%,rgba(14,14,21,0.96)_100%)]",
            "p-5 shadow-[0_28px_72px_-44px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.08)]",
            "sm:p-7 lg:p-8",
          )}
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[0.875rem] leading-snug text-muted sm:text-[0.9375rem]">
              {t("previewWorkspaceContext")}
            </span>
            <span className="text-[0.875rem] leading-snug text-muted sm:text-[0.9375rem]">{t("previewWorkspaceMeta")}</span>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-b border-white/[0.08] pb-5 sm:mt-6 sm:flex-row sm:items-start sm:justify-between sm:pb-6">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium leading-snug text-muted sm:text-[0.9375rem]">
                  <Briefcase className="h-3.5 w-3.5 text-muted-2" aria-hidden />
                  {t("previewJobLabel")}
                </span>
                <span className="text-[0.875rem] font-medium leading-snug text-muted sm:text-[0.9375rem]">
                  {t("previewDemoJobStatus")}
                </span>
              </div>
              <div>
                <h3 className={cn(SITE_H3, "text-[1.375rem] sm:text-[1.5rem] lg:text-[1.625rem]")}>
                  {t("previewDemoJobTitle")}
                </h3>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.9375rem] leading-snug text-muted sm:text-base">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-2" aria-hidden />
                    {t("previewDemoJobCompany")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-2" aria-hidden />
                    {t("previewDemoJobLocation")}
                  </span>
                  <span>{t("previewDemoJobType")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid min-h-0 gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-h-0">
              <div className={cn("pb-3", SITE_LABEL)}>{t("previewApplicantsTitle")}</div>
              <div
                className="space-y-2"
                role="listbox"
                aria-label={t("previewApplicantsTitle")}
              >
                {applicants.map((a) => {
                  const active = selected === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      aria-label={t(`previewDemoApp${a.id}Name` as "previewDemoApp0Name")}
                      onClick={() => setSelected(a.id)}
                      className={cn(
                        "group relative flex w-full gap-3.5 rounded-xl p-3.5 text-left transition-colors sm:gap-4 sm:p-4",
                        active
                          ? "border border-white/[0.14] bg-white/[0.04]"
                          : "border border-transparent hover:bg-white/[0.03]",
                      )}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.06] text-[14px] font-semibold tabular-nums text-foreground/85 sm:h-11 sm:w-11 sm:text-[15px]"
                        aria-hidden
                      >
                        {a.initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[1rem] font-semibold leading-snug text-foreground sm:text-[1.0625rem]">
                          {t(`previewDemoApp${a.id}Name` as "previewDemoApp0Name")}
                        </div>
                        <div className="mt-0.5 text-[0.9375rem] text-muted sm:text-base">
                          {t(`previewDemoApp${a.id}Role` as "previewDemoApp0Role")}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.875rem] text-muted-2 sm:text-[0.9375rem]">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                            {t(`previewDemoApp${a.id}Meta` as "previewDemoApp0Meta")}
                          </span>
                        </div>
                        <p className="mt-2.5 text-[0.875rem] leading-relaxed text-body sm:text-[0.9375rem]">
                          {t(`previewDemoApp${a.id}Clue` as "previewDemoApp0Clue")}
                        </p>
                      </div>
                      <ListScore score={DEMO_SCORES[a.id]} sampleLabel={sampleLabel} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 lg:border-l lg:border-white/[0.08] lg:pl-8 xl:pl-10">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className={SITE_LABEL}>{t("previewDetailTitle")}</div>
                <span className="hidden text-[0.875rem] text-muted sm:inline sm:text-[0.9375rem]">
                  {t("previewDemoHint")}
                </span>
              </div>

              <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
                <div className={SITE_LABEL}>{t("previewFitSummaryTitle")}</div>
                <ul className="mt-3.5 space-y-2.5">
                  {fitBullets(selected).map((line, i) => (
                    <li key={i} className="flex gap-2.5 text-[0.9375rem] leading-[1.65] text-body sm:text-base sm:leading-[1.68]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-6 border-t border-white/[0.08] pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,15rem)_minmax(0,1fr)] lg:items-stretch lg:gap-6 xl:gap-8">
                <div className="flex min-h-0 flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
                  <div className={SITE_LABEL}>{t("previewSeekerColumnTitle")}</div>
                  <div className="mt-3 flex-1 whitespace-pre-line text-[0.9375rem] leading-[1.68] text-muted sm:text-base sm:leading-[1.7]">
                    {t(detailKey(selected, "SeekerBlock"))}
                  </div>
                </div>

                <PreviewScoreRing
                  score={DEMO_SCORES[selected]}
                  label={suitabilityLabel}
                  sampleLabel={sampleLabel}
                />

                <div className="flex min-h-0 flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
                  <div className={SITE_LABEL}>{t("previewJobColumnTitle")}</div>
                  <div className="mt-3 flex-1 whitespace-pre-line text-[0.9375rem] leading-[1.68] text-muted sm:text-base sm:leading-[1.7]">
                    {t(detailKey(selected, "JobBlock"))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
