"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Building2, CalendarDays, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type ApplicantId = 0 | 1 | 2;

function PreviewScoreRing({ score, label }: { score: number; label: string }) {
  const w = Math.min(100, Math.max(0, score));
  return (
    <div className="relative flex flex-col items-center justify-center rounded-3xl border border-white/[0.14] bg-gradient-to-b from-white/[0.10] to-black/40 px-6 py-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset] sm:px-8 sm:py-8">
      <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">
        {label}
      </span>
      <span className="mt-2 tabular-nums text-[2.75rem] font-semibold leading-none tracking-tight text-white sm:text-[3.25rem]">
        {score}
        <span className="ml-0.5 text-2xl font-semibold text-white/75">%</span>
      </span>
      <div className="mt-4 h-1.5 w-full max-w-[10rem] overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400/90 to-fuchsia-400/80"
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}

function ListScore({ score, shortLabel }: { score: number; shortLabel: string }) {
  return (
    <div className="flex shrink-0 flex-col items-end rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.08] to-black/35 px-3 py-2 text-right shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
      <span className="text-[10px] font-medium uppercase tracking-wide text-white/48">
        {shortLabel}
      </span>
      <span className="mt-0.5 tabular-nums text-xl font-semibold text-white">
        {score}
        <span className="text-sm font-semibold text-white/70">%</span>
      </span>
    </div>
  );
}

export function EmployerProductPreview() {
  const t = useTranslations("pages.employers");
  const suitabilityLabel = t("previewSuitabilityLabel");
  const suitabilityShort = t("previewSuitabilityShort");
  const [selected, setSelected] = useState<ApplicantId>(0);

  const applicants: { id: ApplicantId; score: number; initial: string }[] = [
    { id: 0, score: 82, initial: "M" },
    { id: 1, score: 61, initial: "R" },
    { id: 2, score: 18, initial: "E" },
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
    <section className="border-t border-white/[0.06] pt-16 pb-14 sm:pt-20 sm:pb-20 lg:pt-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/42 sm:text-xs sm:tracking-wide">
            {t("previewSectionEyebrow")}
          </p>
          <h2 className="mt-2.5 text-balance text-xl font-semibold leading-snug tracking-tight text-white sm:mt-3 sm:text-2xl sm:leading-snug">
            {t("previewSectionTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/52 sm:mt-4 sm:text-[15px] sm:leading-relaxed sm:text-white/55">
            {t("previewSectionLead")}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-6xl sm:mt-14">
          <div className="overflow-hidden rounded-[28px] border border-white/[0.12] bg-gradient-to-b from-white/[0.06] via-black/35 to-black/65 shadow-[0_32px_100px_-48px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="flex flex-col gap-0.5 border-b border-white/[0.07] bg-black/[0.28] px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-3">
              <span className="text-[12px] leading-snug text-white/50">{t("previewWorkspaceContext")}</span>
              <span className="text-[12px] leading-snug tabular-nums text-white/42">{t("previewWorkspaceMeta")}</span>
            </div>
            <div className="flex flex-col gap-4 border-b border-white/[0.08] bg-white/[0.03] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7 sm:py-6">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-black/30 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-white/55">
                    <Briefcase className="h-3 w-3 text-white/45" aria-hidden />
                    {t("previewJobLabel")}
                  </span>
                  <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-200/90">
                    {t("previewDemoJobStatus")}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {t("previewDemoJobTitle")}
                  </h3>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[15px] leading-snug text-white/65">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                      {t("previewDemoJobCompany")}
                    </span>
                    <span className="hidden h-1 w-1 rounded-full bg-white/25 sm:inline-block" aria-hidden />
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                      {t("previewDemoJobLocation")}
                    </span>
                    <span className="hidden h-1 w-1 rounded-full bg-white/25 sm:inline-block" aria-hidden />
                    <span>{t("previewDemoJobType")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid min-h-0 lg:grid-cols-[minmax(0,300px)_1fr] lg:items-stretch">
              <div className="flex min-h-0 flex-col border-b border-white/[0.08] lg:h-full lg:border-b-0 lg:border-r lg:border-white/[0.08]">
                <div className="sticky top-20 space-y-1 p-4 sm:p-5 lg:static lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col">
                  <div className="px-1 pb-3 text-[12px] font-medium uppercase tracking-wide text-white/52">
                    {t("previewApplicantsTitle")}
                  </div>
                  <div
                    className="space-y-2.5 lg:flex-1"
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
                            "group relative flex w-full gap-3 rounded-2xl border p-3.5 text-left transition-[border-color,background-color,box-shadow] sm:p-4",
                            active
                              ? "border-violet-400/35 bg-white/[0.07] shadow-[0_0_0_1px_rgba(168,85,247,0.12)_inset]"
                              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.045]",
                          )}
                        >
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.06] text-[13px] font-semibold tabular-nums text-white/80"
                            aria-hidden
                          >
                            {a.initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold leading-snug text-white/95">
                              {t(`previewDemoApp${a.id}Name` as "previewDemoApp0Name")}
                            </div>
                            <div className="mt-0.5 text-sm text-white/65">
                              {t(`previewDemoApp${a.id}Role` as "previewDemoApp0Role")}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-white/52">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                                {t(`previewDemoApp${a.id}Meta` as "previewDemoApp0Meta")}
                              </span>
                            </div>
                            <p className="mt-2.5 border-l-2 border-violet-400/30 pl-3 text-[13px] leading-relaxed text-white/58">
                              {t(`previewDemoApp${a.id}Clue` as "previewDemoApp0Clue")}
                            </p>
                          </div>
                          <ListScore score={a.score} shortLabel={suitabilityShort} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-col p-4 sm:p-6 lg:h-full lg:min-h-0 lg:p-7">
                <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                  <div className="text-[12px] font-medium uppercase tracking-wide text-white/52">
                    {t("previewDetailTitle")}
                  </div>
                  <span className="hidden text-[12px] text-white/42 sm:inline">{t("previewDemoHint")}</span>
                </div>

                <div className="mb-6 rounded-2xl border border-white/[0.10] bg-white/[0.03] p-4 sm:p-5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-white/52">
                    {t("previewFitSummaryTitle")}
                  </div>
                  <ul className="mt-3.5 space-y-2.5">
                    {fitBullets(selected).map((line, i) => (
                      <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-white/72">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400/70" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,11rem)_1fr] lg:items-stretch lg:gap-5 xl:gap-8">
                  <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/[0.10] bg-black/25 p-4 sm:p-5">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-white/52">
                      {t("previewSeekerColumnTitle")}
                    </div>
                    <div className="mt-3 flex-1 whitespace-pre-line text-[15px] leading-relaxed text-white/74">
                      {t(detailKey(selected, "SeekerBlock"))}
                    </div>
                  </div>

                  <div className="flex h-full min-h-0 justify-center lg:items-center">
                    <PreviewScoreRing
                      score={applicants.find((x) => x.id === selected)!.score}
                      label={suitabilityLabel}
                    />
                  </div>

                  <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/[0.10] bg-black/25 p-4 sm:p-5">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-white/52">
                      {t("previewJobColumnTitle")}
                    </div>
                    <div className="mt-3 flex-1 whitespace-pre-line text-[15px] leading-relaxed text-white/74">
                      {t(detailKey(selected, "JobBlock"))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="primary" size="lg" className="h-12 rounded-2xl px-8">
              <Link href="/auth/register?role=employer">{t("previewCtaRegister")}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
