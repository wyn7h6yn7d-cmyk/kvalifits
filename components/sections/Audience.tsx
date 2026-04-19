"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Layers,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function Audience() {
  const t = useTranslations("audience");

  const seekerSteps = [
    { n: "01", title: t("step1Title"), line: t("step1Line") },
    { n: "02", title: t("step2Title"), line: t("step2Line") },
    { n: "03", title: t("step3Title"), line: t("step3Line") },
  ] as const;

  return (
    <section className="relative py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent"
      />

      <Container>
        <div className="max-w-xl">
          <div className="text-[13px] font-medium uppercase tracking-wide text-white/52 sm:text-sm">
            {t("eyebrow")}
          </div>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.65rem]">
            {t("title")}
            <span className="block text-white/48"> {t("titleMuted")}</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/58 sm:text-lg sm:leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="mt-16 grid gap-14 lg:mt-20 lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-12">
          <motion.div
            id="toootsijatele"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="scroll-mt-28 lg:col-span-7 lg:pr-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent-pink/25 bg-accent-pink/10">
                <UserRound className="h-5 w-5 text-white/90" />
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-accent-pink/90">
                  {t("seekerLabel")}
                </div>
                <p className="text-[15px] font-medium leading-snug text-white/52">{t("seekerSublabel")}</p>
              </div>
            </div>

            <h3 className="mt-6 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {t("seekerTitle")}
              <span className="block text-white/55"> {t("seekerTitleMuted")}</span>
            </h3>

            <div className="relative mt-10 border-l border-white/[0.1] pl-7 sm:pl-8">
              <div
                aria-hidden="true"
                className="absolute left-0 top-2 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-accent-pink/50 via-violet-400/30 to-transparent"
              />

              <ol className="space-y-10">
                {seekerSteps.map((s, i) => (
                  <motion.li
                    key={s.n}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: 0.06 * i }}
                    className="relative"
                  >
                    <span
                      className={cn(
                        "absolute -left-7 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border text-[11px] font-mono font-medium sm:-left-8 sm:h-8 sm:w-8 sm:text-xs",
                        i === 0
                          ? "border-accent-pink/40 bg-black/50 text-accent-pink/95"
                          : "border-white/[0.12] bg-black/40 text-white/55",
                      )}
                    >
                      {s.n}
                    </span>
                    <div className="text-[12px] font-medium uppercase tracking-wide text-white/45">
                      {s.title}
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-white/68 sm:text-base">
                      {s.line}
                    </p>
                  </motion.li>
                ))}
              </ol>
            </div>

            <div className="mt-12">
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

          <motion.div
            id="tooandjatele"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="scroll-mt-28 lg:col-span-5 lg:mt-16 xl:mt-20"
          >
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-4 rounded-[36px] bg-[radial-gradient(ellipse_at_70%_0%,rgba(168,85,247,0.2),transparent_55%)] blur-2xl"
              />

              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.11] bg-gradient-to-b from-white/[0.07] to-black/55 p-1 shadow-[0_32px_100px_-40px_rgba(0,0,0,0.9)]">
                <div className="rounded-[26px] border border-white/[0.06] bg-black/35 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.05]">
                        <Briefcase className="h-4 w-4 text-white/80" />
                      </div>
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-wide text-violet-300/90">
                          {t("employerLabel")}
                        </div>
                        <p className="text-[13px] leading-snug text-white/52">{t("employerSublabel")}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/48">
                      {t("preview")}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl">
                    {t("employerTitle")}
                  </h3>

                  <div className="mt-6 space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3 text-[14px]">
                      <span className="flex items-center gap-2 text-white/60">
                        <ClipboardList className="h-4 w-4 shrink-0 text-white/45" aria-hidden />
                        {t("activeReq")}
                      </span>
                      <span className="font-mono text-sm tabular-nums text-white/80">3</span>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    <div className="flex items-center justify-between gap-3 text-[14px]">
                      <span className="flex items-center gap-2 text-white/60">
                        <Users className="h-4 w-4 shrink-0 text-white/45" aria-hidden />
                        {t("matchingCandidates")}
                      </span>
                      <div className="flex -space-x-2">
                        {[0, 1, 2].map((k) => (
                          <span
                            key={k}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-black/60 bg-gradient-to-br from-white/15 to-white/5 text-[10px] font-medium text-white/72"
                          >
                            {k + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    <div>
                      <div className="flex items-center justify-between text-[12.5px] text-white/48">
                        <span className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 shrink-0 text-white/40" aria-hidden />
                          {t("bestOverlap")}
                        </span>
                        <span className="font-mono tabular-nums text-white/68">8/10</span>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full",
                              i < 8
                                ? "bg-gradient-to-r from-violet-500/70 to-fuchsia-500/50"
                                : "bg-white/[0.08]",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    className="relative mt-6 overflow-hidden rounded-2xl"
                    role="region"
                    aria-label={t("employerPricingKicker")}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[conic-gradient(from_125deg_at_50%_0%,rgba(168,85,247,0.35),transparent_42%,rgba(227,31,141,0.18),transparent_72%)] opacity-80"
                    />
                    <div className="relative rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.09] via-black/45 to-black/70 p-[1px] shadow-[0_20px_60px_-28px_rgba(168,85,247,0.45)]">
                      <div className="rounded-[15px] bg-black/55 px-4 py-4 backdrop-blur-md sm:px-5 sm:py-5">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-violet-200/88">
                          {t("employerPricingKicker")}
                        </div>

                        <div className="mt-4 flex flex-col gap-3">
                          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                              <Briefcase className="h-4 w-4 text-violet-200/80" />
                            </div>
                            <span className="text-[14px] font-medium leading-snug text-white/90">
                              {t("employerPricingPostings")}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                              <CalendarDays className="h-4 w-4 text-fuchsia-200/75" />
                            </div>
                            <span className="text-[14px] font-medium leading-snug text-white/90">
                              {t("employerPricingDuration")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/[0.08] pt-4">
                          <p className="max-w-[14rem] text-[12.5px] leading-relaxed text-white/52">
                            {t("employerPricingHint")}
                          </p>
                          <div className="shrink-0 bg-gradient-to-br from-white to-violet-100/90 bg-clip-text text-right text-3xl font-semibold tracking-tight text-transparent tabular-nums sm:text-[2rem]">
                            {t("employerPricingPrice")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-[15px] leading-relaxed text-white/58 sm:text-base">{t("employerTagline")}</p>

                  <div className="mt-6">
                    <Button
                      asChild
                      variant="outline"
                      className="h-12 w-full rounded-2xl border-white/[0.18] bg-white/[0.03] hover:bg-white/[0.08]"
                    >
                      <Link href="/tooandjatele">
                        {t("employerCta")}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute -right-3 top-1/4 hidden h-24 w-24 rounded-full border border-white/[0.05] xl:block" />
              <Sparkles
                className="pointer-events-none absolute -left-2 top-8 h-5 w-5 text-violet-400/30"
                aria-hidden
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
