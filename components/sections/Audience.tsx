import { getTranslations } from "next-intl/server";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Layers,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { SITE_BODY, SITE_BODY_SM, SITE_EYEBROW, SITE_H3, SITE_LABEL } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export async function Audience() {
  const t = await getTranslations("audience");

  const seekerSteps = [
    { n: "01", title: t("step1Title"), line: t("step1Line") },
    { n: "02", title: t("step2Title"), line: t("step2Line") },
    { n: "03", title: t("step3Title"), line: t("step3Line") },
  ] as const;

  return (
    <section className="relative overflow-hidden bg-surface py-10 sm:py-14 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_85%_20%,rgba(37,99,235,0.05),transparent_55%)]"
      />

      <Container className="relative z-10">
        <div className="max-w-xl">
          <div className={SITE_EYEBROW}>
            {t("eyebrow")}
          </div>
          <h2 className="mt-3 text-balance text-[1.5rem] font-semibold leading-snug text-foreground sm:mt-4 sm:text-[1.75rem] lg:text-[2rem]">
            {t("title")}
            <span className="block font-medium text-muted"> {t("titleMuted")}</span>
          </h2>
          <p className="mt-4 text-pretty text-base leading-[1.65] text-body sm:mt-5">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:mt-12 lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-16">
          <div id="toootsijatele" className="kf-enter scroll-mt-28 lg:col-span-6">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-primary/85" strokeWidth={1.6} />
              <div className={cn(SITE_LABEL, "text-primary")}>
                {t("seekerLabel")}
              </div>
            </div>
            <p className={cn("mt-2", SITE_BODY_SM, "text-muted")}>
              {t("seekerSublabel")}
            </p>

            <h3 className={cn("mt-5 sm:mt-6 sm:text-[1.25rem]", SITE_H3)}>
              {t("seekerTitle")}
              <span className="block text-muted-2"> {t("seekerTitleMuted")}</span>
            </h3>

            <ol className="mt-5 space-y-5 sm:mt-6 sm:space-y-6 lg:space-y-8">
              {seekerSteps.map((s, i) => (
                <li
                  key={s.n}
                  className="kf-enter flex gap-5 sm:gap-6"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <span className="mt-0.5 shrink-0 text-[13px] font-medium tabular-nums text-muted-2">
                    {s.n}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[0.9375rem] font-semibold leading-snug text-foreground">
                      {s.title}
                    </div>
                    <p className={cn("mt-2 text-pretty", SITE_BODY)}>
                      {s.line}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 sm:mt-8 lg:mt-10">
              <Button
                asChild
                variant="primary"
                className="h-12 w-full text-pretty sm:w-auto sm:min-w-[220px]"
              >
                <Link href="/toootsijatele">
                  {t("seekerCta")}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div id="tooandjatele" className="kf-enter scroll-mt-28 lg:col-span-6 lg:mt-4">
            <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Briefcase className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.6} />
                    <div className={cn(SITE_LABEL, "text-primary")}>
                      {t("employerLabel")}
                    </div>
                  </div>
                  <span className={cn("shrink-0", SITE_EYEBROW)}>
                    {t("preview")}
                  </span>
                </div>
                <p className={cn("mt-1 text-pretty", SITE_BODY_SM, "text-muted")}>{t("employerSublabel")}</p>

                <h3 className={cn("mt-5 sm:mt-6 sm:text-[1.25rem]", SITE_H3)}>
                  {t("employerTitle")}
                </h3>

                <div className="mt-6 space-y-4 sm:mt-8">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-base">
                    <span className="flex min-w-0 items-center gap-2 text-pretty text-body">
                      <ClipboardList className="h-4 w-4 shrink-0 text-muted-2" aria-hidden />
                      {t("activeReq")}
                    </span>
                    <span className={cn("shrink-0", SITE_EYEBROW)}>
                      {t("preview")}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-base">
                    <span className="flex min-w-0 items-center gap-2 text-pretty text-body">
                      <Users className="h-4 w-4 shrink-0 text-muted-2" aria-hidden />
                      {t("matchingCandidates")}
                    </span>
                    <span className={cn("shrink-0", SITE_EYEBROW)}>
                      {t("preview")}
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[0.9375rem] text-muted">
                      <span className="flex min-w-0 items-center gap-1.5 text-pretty">
                        <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {t("bestOverlap")}
                      </span>
                      <span className={cn("shrink-0", SITE_EYEBROW)}>
                        {t("preview")}
                      </span>
                    </div>
                    <div className="mt-2.5 flex gap-1" aria-hidden>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-full",
                            i < 6
                              ? "bg-primary/40"
                              : "bg-white/[0.08]",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
                  <div className={SITE_LABEL}>
                    {t("employerPricingKicker")}
                  </div>
                  <div className="space-y-3">
                    <div className="flex min-w-0 items-center gap-3 text-pretty text-base font-medium text-foreground">
                      <Briefcase className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.6} />
                      {t("employerPricingPostings")}
                    </div>
                    <div className="flex min-w-0 items-center gap-3 text-pretty text-base font-medium text-foreground">
                      <CalendarDays className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.6} />
                      {t("employerPricingDuration")}
                    </div>
                  </div>
                  <p className={cn("text-pretty", SITE_BODY_SM)}>
                    {t("employerPricingHint")}
                  </p>
                </div>

                <p className={cn("mt-5 text-pretty sm:mt-6", SITE_BODY)}>{t("employerTagline")}</p>

                <div className="mt-6 sm:mt-7">
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full text-pretty"
                  >
                    <Link href="/tooandjatele">
                      {t("employerCta")}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
