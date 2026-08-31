"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Building2, CalendarDays, MapPin } from "lucide-react";

import { Container } from "@/components/ui/container";
import { SITE_BODY, SITE_EYEBROW, SITE_H2_SECTION, SITE_LABEL } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

type ApplicantId = 0 | 1 | 2;

const DEMO_SCORES: Record<ApplicantId, number> = { 0: 87, 1: 64, 2: 31 };

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;
const RING_STROKE = 8;

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
    <div className="flex h-full min-h-[11rem] w-full flex-col items-center justify-center px-4 py-5">
      <span className={cn(SITE_LABEL, "text-muted")}>{label}</span>
      <div className="relative mt-3 flex h-[128px] w-[128px] items-center justify-center">
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
          <div className="text-[26px] font-semibold tabular-nums leading-none text-foreground">
            {score}%
          </div>
        </div>
      </div>
      <span className="mt-3 text-[0.75rem] font-medium text-muted">{sampleLabel}</span>
    </div>
  );
}

function ListScore({ score, sampleLabel }: { score: number; sampleLabel: string }) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className="text-[1.05rem] font-semibold tabular-nums leading-none text-primary">
        {score}%
      </span>
      <span className="text-[0.75rem] font-medium leading-snug text-muted">{sampleLabel}</span>
    </div>
  );
}

export function EmployerProductPreview() {
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

  return (
    <section className="py-10 sm:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className={SITE_EYEBROW}>{t("previewSectionEyebrow")}</p>
          <h2 className={cn("mt-2.5 sm:mt-3", SITE_H2_SECTION)}>{t("previewSectionTitle")}</h2>
          <p className={cn("mt-3 sm:mt-4", SITE_BODY, "text-muted")}>{t("previewSectionLead")}</p>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t border-border pt-8 sm:mt-12">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[0.8125rem] leading-snug text-muted">{t("previewWorkspaceContext")}</span>
            <span className="text-[0.8125rem] leading-snug text-muted">{t("previewWorkspaceMeta")}</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium leading-snug text-muted">
                  <Briefcase className="h-3 w-3 text-muted-2" aria-hidden />
                  {t("previewJobLabel")}
                </span>
                <span className="text-[0.8125rem] font-medium leading-snug text-muted">
                  {t("previewDemoJobStatus")}
                </span>
              </div>
              <div>
                <h3 className={SITE_H2_SECTION}>{t("previewDemoJobTitle")}</h3>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[15px] leading-snug text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden />
                    {t("previewDemoJobCompany")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-2" aria-hidden />
                    {t("previewDemoJobLocation")}
                  </span>
                  <span>{t("previewDemoJobType")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid min-h-0 gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(0,300px)_1fr] lg:items-start lg:gap-10">
            <div className="min-h-0">
              <div className={cn("pb-3", SITE_LABEL)}>{t("previewApplicantsTitle")}</div>
              <div
                className="space-y-1"
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
                        "group relative flex w-full gap-3 rounded-xl p-3 text-left transition-colors sm:p-3.5",
                        active ? "border border-border bg-surface" : "border border-transparent hover:bg-surface",
                      )}
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-white text-[13px] font-semibold tabular-nums text-foreground/80"
                        aria-hidden
                      >
                        {a.initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold leading-snug text-foreground">
                          {t(`previewDemoApp${a.id}Name` as "previewDemoApp0Name")}
                        </div>
                        <div className="mt-0.5 text-sm text-muted">
                          {t(`previewDemoApp${a.id}Role` as "previewDemoApp0Role")}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted-2">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                            {t(`previewDemoApp${a.id}Meta` as "previewDemoApp0Meta")}
                          </span>
                        </div>
                        <p className="mt-2.5 text-[13px] leading-relaxed text-body">
                          {t(`previewDemoApp${a.id}Clue` as "previewDemoApp0Clue")}
                        </p>
                      </div>
                      <ListScore score={DEMO_SCORES[a.id]} sampleLabel={sampleLabel} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 lg:border-l lg:border-border lg:pl-10">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className={SITE_LABEL}>{t("previewDetailTitle")}</div>
                <span className="hidden text-[0.8125rem] text-muted sm:inline">{t("previewDemoHint")}</span>
              </div>

              <div className="mb-6">
                <div className={SITE_LABEL}>{t("previewFitSummaryTitle")}</div>
                <ul className="mt-3.5 space-y-2.5">
                  {fitBullets(selected).map((line, i) => (
                    <li key={i} className="flex gap-2.5 text-base leading-[1.65] text-body">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(12.5rem,14rem)_minmax(0,1fr)] lg:items-stretch lg:gap-8">
                <div className="flex min-h-0 flex-col">
                  <div className={SITE_LABEL}>{t("previewSeekerColumnTitle")}</div>
                  <div className="mt-3 flex-1 whitespace-pre-line text-base leading-[1.65] text-muted">
                    {t(detailKey(selected, "SeekerBlock"))}
                  </div>
                </div>

                <PreviewScoreRing
                  score={DEMO_SCORES[selected]}
                  label={suitabilityLabel}
                  sampleLabel={sampleLabel}
                />

                <div className="flex min-h-0 flex-col">
                  <div className={SITE_LABEL}>{t("previewJobColumnTitle")}</div>
                  <div className="mt-3 flex-1 whitespace-pre-line text-base leading-[1.65] text-muted">
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
