"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Layers,
  UserRound,
  Users,
} from "lucide-react";

import { GradientAccentText } from "@/components/site/GradientAccentText";
import { AmbientBackground } from "@/components/site/AmbientBackground";
import { PortalBackground } from "@/components/site/portal-background";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { matchingSectionPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

export function Audience() {
  const t = useTranslations("audience");

  const seekerSteps = [
    { n: "01", title: t("step1Title"), line: t("step1Line") },
    { n: "02", title: t("step2Title"), line: t("step2Line") },
    { n: "03", title: t("step3Title"), line: t("step3Line") },
  ] as const;

  return (
    <section className="relative overflow-hidden bg-surface-elevated py-28 sm:py-36 lg:py-40">
      {/* Matching beat — soft connection lines + glow (lighter than hero) */}
      {matchingSectionPortal.enabled ? (
        <>
          <AmbientBackground
            intensity={matchingSectionPortal.ambientIntensity}
            className="opacity-80"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ opacity: matchingSectionPortal.opacity }}
            aria-hidden="true"
          >
            <PortalBackground
              variant={matchingSectionPortal.variant}
              intensity={matchingSectionPortal.intensity}
            />
          </div>
        </>
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_85%_20%,rgba(168,85,247,0.10),transparent_55%)]"
      />
      {/* Readability veil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#15151F]/55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0F0F16]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#09090D]/75 sm:h-32"
      />

      <Container className="relative z-10">
        <div className="max-w-xl">
          <div className="text-[13px] font-medium uppercase tracking-wide text-muted-2 sm:text-sm">
            {t("eyebrow")}
          </div>
          <h2 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem]">
            {t("title")}
            <span className="block text-muted-2"> {t("titleMuted")}</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-body sm:text-lg sm:leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-20 grid gap-20 lg:mt-28 lg:grid-cols-12 lg:items-start lg:gap-16 xl:gap-20">
          {/* Open editorial side — seeker */}
          <motion.div
            id="toootsijatele"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="scroll-mt-28 lg:col-span-6"
          >
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-accent-pink/85" strokeWidth={1.6} />
              <div className="text-[11px] font-medium uppercase tracking-wide text-accent-pink/90">
                {t("seekerLabel")}
              </div>
            </div>
            <p className="mt-2 text-[15px] font-medium leading-snug text-muted-2">
              {t("seekerSublabel")}
            </p>

            <h3 className="mt-8 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {t("seekerTitle")}
              <span className="block text-muted-2"> {t("seekerTitleMuted")}</span>
            </h3>

            <ol className="mt-12 space-y-11">
              {seekerSteps.map((s, i) => (
                <motion.li
                  key={s.n}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="flex gap-5 sm:gap-6"
                >
                  <span className="mt-0.5 shrink-0 text-[13px] font-medium tabular-nums text-muted-2">
                    {s.n}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium uppercase tracking-wide text-muted-2">
                      {s.title}
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-body sm:text-base">
                      {s.line}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>

            <div className="mt-14">
              <Button
                asChild
                variant="primary"
                className="h-12 w-full rounded-2xl sm:w-auto sm:min-w-[220px]"
              >
                <Link href="/toootsijatele">
                  {t("seekerCta")}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Single meaningful card — employer */}
          <motion.div
            id="tooandjatele"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="scroll-mt-28 lg:col-span-6 lg:mt-4"
          >
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#0F0F16]/55 px-6 py-7 sm:px-8 sm:py-9">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.12),transparent_70%)] blur-2xl"
              />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="h-4 w-4 text-muted" strokeWidth={1.6} />
                    <div className="text-[11px] font-medium uppercase tracking-wide text-violet-300/85">
                      {t("employerLabel")}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-2">
                    {t("preview")}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-snug text-muted-2">{t("employerSublabel")}</p>

                <h3 className="mt-6 text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
                  {t("employerTitle")}
                </h3>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between gap-3 text-[14px]">
                    <span className="flex items-center gap-2 text-body">
                      <ClipboardList className="h-4 w-4 shrink-0 text-muted-2" aria-hidden />
                      {t("activeReq")}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-2">
                      {t("preview")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[14px]">
                    <span className="flex items-center gap-2 text-body">
                      <Users className="h-4 w-4 shrink-0 text-muted-2" aria-hidden />
                      {t("matchingCandidates")}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-2">
                      {t("preview")}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[12.5px] text-muted-2">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {t("bestOverlap")}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide">
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
                              ? "bg-gradient-to-r from-violet-500/45 to-fuchsia-500/30"
                              : "bg-white/[0.07]",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/[0.07] pt-6">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-2">
                    {t("employerPricingKicker")}
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-[14px] font-medium text-foreground/90">
                      <Briefcase className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.6} />
                      {t("employerPricingPostings")}
                    </div>
                    <div className="flex items-center gap-3 text-[14px] font-medium text-foreground/90">
                      <CalendarDays className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.6} />
                      {t("employerPricingDuration")}
                    </div>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <p className="max-w-[14rem] text-[12.5px] leading-relaxed text-body">
                      {t("employerPricingHint")}
                    </p>
                    <GradientAccentText
                      variant="price"
                      wrapClassName="shrink-0 text-right text-3xl font-semibold tracking-tight tabular-nums sm:text-[2rem]"
                    >
                      {t("employerPricingPrice")}
                    </GradientAccentText>
                  </div>
                </div>

                <p className="mt-6 text-[15px] leading-relaxed text-body">{t("employerTagline")}</p>

                <div className="mt-7">
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full rounded-2xl border-white/[0.14] bg-transparent hover:bg-white/[0.05]"
                  >
                    <Link href="/tooandjatele">
                      {t("employerCta")}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
