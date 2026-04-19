"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { AmbientBackground } from "@/components/site/AmbientBackground";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import { PortalBackground } from "@/components/site/portal-background";
import { heroPortal } from "@/lib/site-portal-config";
import { cn } from "@/lib/utils";

const heroPrimaryCta =
  "relative h-14 min-w-[200px] rounded-2xl px-9 text-[15px] font-medium tracking-tight shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_22px_56px_-14px_rgba(168,85,247,0.55),0_8px_24px_-8px_rgba(227,31,141,0.25)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.14)_inset,0_28px_72px_-12px_rgba(168,85,247,0.62),0_12px_32px_-6px_rgba(227,31,141,0.3)] active:translate-y-0";

const heroSecondaryCta =
  "h-14 min-w-[180px] rounded-2xl border-white/[0.22] bg-white/[0.04] px-8 text-[15px] font-medium tracking-tight text-white backdrop-blur-md transition-all duration-300 hover:border-white/[0.32] hover:bg-white/[0.09] hover:shadow-[0_0_40px_-12px_rgba(255,255,255,0.12)]";

function HeroMatchMockup() {
  const locale = useLocale();
  const t = useTranslations("heroMockup");
  const explainId = useId();
  const [active, setActive] = useState<"seeker" | "fit" | "employer" | "verified" | "requirements">("fit");

  const explain = {
    seeker: { title: t("explainSeekerTitle"), text: t("explainSeekerText") },
    fit: { title: t("explainFitTitle"), text: t("explainFitText") },
    employer: { title: t("explainEmployerTitle"), text: t("explainEmployerText") },
    verified: { title: t("explainVerifiedTitle"), text: t("explainVerifiedText") },
    requirements: { title: t("explainRequirementsTitle"), text: t("explainRequirementsText") },
  } as const;

  const activeTopBlock =
    "border-white/[0.18] bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_18px_60px_-34px_rgba(0,0,0,0.75)]";
  const inactiveTopBlock =
    "border-white/[0.10] bg-white/[0.05] hover:border-white/[0.14] hover:bg-white/[0.06]";

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[min(100%,780px)] lg:ml-auto lg:mr-0">
      <div className="relative min-w-0 overflow-hidden rounded-[28px] border border-white/[0.14] bg-gradient-to-b from-white/[0.09] via-black/40 to-black/70 p-px shadow-[0_32px_120px_-40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-2xl sm:rounded-[32px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(168,85,247,0.2),transparent_55%)]" />

        <div
          {...(locale === "ru" ? { "data-hero-mock-locale": "ru" } : {})}
          className={cn(
            "relative flex min-w-0 flex-col gap-5 p-5 sm:gap-6 sm:p-7 md:p-8",
            locale === "ru" && "gap-4 sm:gap-5 sm:p-6",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-white/55">
                {t("matching")}
              </span>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[12px] font-medium uppercase tracking-wide text-emerald-300/90">
                {t("live")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-white/55">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-emerald-400/50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              {t("fresh")}
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-stretch gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(2.75rem,3.25rem)_minmax(0,1fr)] sm:items-center sm:gap-3 md:gap-5">
            <motion.button
              type="button"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              aria-pressed={active === "seeker"}
              aria-controls={explainId}
              onMouseEnter={() => setActive("seeker")}
              onFocus={() => setActive("seeker")}
              onClick={() => setActive("seeker")}
              className={cn(
                "flex min-h-[96px] min-w-0 items-center rounded-2xl border px-3 py-3 text-left transition-colors sm:min-h-[104px] sm:px-3.5 sm:py-3.5 md:min-h-[108px]",
                active === "seeker" ? activeTopBlock : inactiveTopBlock
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium uppercase leading-snug tracking-[0.08em] text-white/52 sm:text-[11.5px] sm:whitespace-nowrap">
                  {t("seeker")}
                </div>
                <div className="mt-1 min-w-0 max-w-full text-pretty text-[13px] font-semibold leading-snug text-white/92 break-words sm:text-[14px] md:text-[15px]">
                  {t("roleSample")}
                </div>
                <div className="mt-1.5 min-w-0 text-pretty text-[12px] leading-relaxed text-white/58 break-words sm:text-[12.5px]">
                  {t("seekerHint")}
                </div>
              </div>
            </motion.button>

            <button
              type="button"
              aria-pressed={active === "fit"}
              aria-controls={explainId}
              onMouseEnter={() => setActive("fit")}
              onFocus={() => setActive("fit")}
              onClick={() => setActive("fit")}
              className={cn(
                "group flex shrink-0 flex-col items-center gap-1 rounded-2xl px-0.5 text-center outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(168,85,247,0.75)] focus-visible:outline-offset-2 sm:px-1",
                active === "fit" ? "text-white" : "text-white"
              )}
            >
              <div className="relative hidden h-px w-full min-w-[2.5rem] bg-gradient-to-r from-transparent via-white/35 to-transparent sm:block" />
              <div
                className={cn(
                  "relative -mt-0 flex h-11 w-11 items-center justify-center rounded-2xl border bg-gradient-to-b shadow-[0_0_24px_-4px_rgba(168,85,247,0.45)] sm:-mt-[13px] transition-colors",
                  active === "fit"
                    ? "border-white/[0.18] from-violet-500/28 to-black/55"
                    : "border-white/[0.14] from-violet-500/25 to-black/60"
                )}
              >
                <span className="text-lg font-semibold tabular-nums text-white">
                  87<span className="text-sm text-white/45">%</span>
                </span>
              </div>
              <span className="text-[11px] font-medium tracking-wide text-white/50">
                {t("fit")}
              </span>
            </button>

            <motion.button
              type="button"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              aria-pressed={active === "employer"}
              aria-controls={explainId}
              onMouseEnter={() => setActive("employer")}
              onFocus={() => setActive("employer")}
              onClick={() => setActive("employer")}
              className={cn(
                "flex min-h-[96px] min-w-0 items-center rounded-2xl border px-3 py-3 text-left transition-colors sm:min-h-[104px] sm:px-3.5 sm:py-3.5 md:min-h-[108px]",
                active === "employer" ? activeTopBlock : inactiveTopBlock
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium uppercase leading-snug tracking-[0.08em] text-white/52 sm:text-[11.5px] sm:whitespace-nowrap">
                  {t("employer")}
                </div>
                <div className="mt-1 min-w-0 max-w-full text-pretty text-[13px] font-semibold leading-snug text-white/90 break-words sm:text-[14px] md:text-[15px]">
                  {t("positionSample")}
                </div>
                <div className="mt-1.5 min-w-0 text-pretty text-[12px] leading-relaxed text-white/58 break-words sm:text-[12.5px]">
                  {t("employerHint")}
                </div>
              </div>
            </motion.button>
          </div>

          <div
            id={explainId}
            className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.03] px-3.5 py-3 shadow-[0_14px_60px_-34px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:px-4 sm:py-3.5"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                transition={{ duration: 0.22 }}
                className="min-h-[3.75rem]"
              >
                <div className="text-[12px] font-medium uppercase tracking-wide text-white/62">
                  {explain[active].title}
                </div>
                <div className="mt-1.5 min-w-0 text-pretty text-[13px] leading-relaxed text-white/74 break-words sm:text-[13.5px]">
                  {explain[active].text}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              aria-pressed={active === "verified"}
              aria-controls={explainId}
              onMouseEnter={() => setActive("verified")}
              onFocus={() => setActive("verified")}
              onClick={() => setActive("verified")}
              className={cn(
                "w-full rounded-2xl border border-transparent p-0 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(168,85,247,0.75)] focus-visible:outline-offset-2",
                active === "verified" ? "bg-white/[0.02]" : "hover:bg-white/[0.02]"
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5 text-[15px] text-white/68">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400/85" />
                <span className={cn("min-w-0 break-words", active === "verified" ? "text-white/88" : "")}>
                  {t("verified")}
                </span>
              </div>
              <p className="mt-2.5 min-w-0 text-pretty text-[12.5px] leading-relaxed text-white/52 break-words">
                {t("verifiedHint")}
              </p>
            </button>

            <button
              type="button"
              aria-pressed={active === "requirements"}
              aria-controls={explainId}
              onMouseEnter={() => setActive("requirements")}
              onFocus={() => setActive("requirements")}
              onClick={() => setActive("requirements")}
              className={cn(
                "w-full rounded-2xl border border-transparent p-0 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(168,85,247,0.75)] focus-visible:outline-offset-2",
                active === "requirements" ? "bg-white/[0.02]" : "hover:bg-white/[0.02]"
              )}
            >
              <div>
                <div className="flex items-center justify-between text-[12.5px] text-white/50">
                  <span className={cn(active === "requirements" ? "text-white/70" : "")}>{t("requirements")}</span>
                  <span className="tabular-nums text-white/58">8/10</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "80%" }}
                    transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500/80 via-fuchsia-500/70 to-[rgba(227,31,141,0.75)]"
                  />
                </div>
              </div>
              <p className="mt-2.5 min-w-0 text-pretty text-[12.5px] leading-relaxed text-white/52 break-words">
                {t("requirementsHint")}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const headlineClamp =
    locale === "ru"
      ? "text-[clamp(1.62rem,4.2vw+0.55rem,3.55rem)] sm:leading-[1.05] md:text-[clamp(1.9rem,3.45vw+0.85rem,3.35rem)] lg:text-[clamp(2.25rem,2.75vw+0.95rem,3.55rem)]"
      : "text-[clamp(1.85rem,5.2vw+0.65rem,4.35rem)] sm:leading-[1.03] md:text-[clamp(2.25rem,4vw+1rem,4rem)] lg:text-[clamp(2.65rem,3.4vw+1.1rem,4.35rem)]";

  return (
    <section
      id="avaleht"
      className="relative min-h-[min(96vh,940px)] overflow-hidden scroll-mt-[var(--site-header-offset)]"
    >
      <AmbientBackground intensity={heroPortal.ambientIntensity} />
      <div className="absolute inset-0 z-0">
        <PortalBackground variant={heroPortal.variant} intensity={heroPortal.intensity} />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_-15%,rgba(168,85,247,0.32),transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)] opacity-70" />
      </div>

      {/* Tumedam ülariba: loetav navbar + vähem hero “bleed” läbi klaasi */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-36 bg-gradient-to-b from-[#050508]/92 via-[#050508]/45 to-transparent sm:h-40"
      />

      <Container className="relative z-10">
        <div
          className="flex flex-col justify-start pb-20 sm:pb-24 lg:pb-32"
          style={{ paddingTop: "var(--site-hero-content-top)" }}
        >
          <div className="grid min-w-0 items-center gap-12 sm:gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 xl:gap-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0 max-w-[40rem] xl:max-w-[44rem]"
            >
              <h1
                className={cn(
                  "mt-6 text-balance font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:mt-8",
                  headlineClamp,
                )}
              >
                {t("headlineBefore")}{" "}
                <GradientAccentText wrapClassName="font-semibold">{t("headlineAccent")}</GradientAccentText>
                {t("headlineAfter").trim() ? (
                  <>
                    <br className="hidden sm:block" />
                    <span className="text-white/[0.96]">{t("headlineAfter")}</span>
                  </>
                ) : null}
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/62 sm:mt-8 sm:text-lg sm:leading-relaxed lg:mt-9 lg:text-[1.3rem] lg:leading-[1.62]">
                {t("subheadline")}
              </p>

              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <Button asChild variant="primary" size="lg" className={cn(heroPrimaryCta)}>
                  <Link href="#toootsijatele">{t("ctaSeeker")}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className={cn(heroSecondaryCta)}>
                  <Link href="/tooandjatele">{t("ctaEmployer")}</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex min-w-0 justify-center lg:justify-end"
            >
              <HeroMatchMockup />
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
