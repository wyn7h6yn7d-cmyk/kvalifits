"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Circle, ShieldCheck } from "lucide-react";

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

const DEMO_SCORE = 87;
const DEMO_FILLED = 8;
const DEMO_TOTAL = 10;
const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] leading-tight text-white/65">
      {children}
    </span>
  );
}

function SideCard({
  eyebrow,
  title,
  subtitle,
  location,
  tags,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  location: string;
  tags: string[];
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border border-white/[0.10] bg-[#141418]/[0.85] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-5",
        align === "right" && "lg:text-right",
      )}
    >
      <div
        className={cn(
          "text-[11px] font-medium tracking-wide text-white/45",
          align === "right" && "lg:text-right",
        )}
      >
        {eyebrow}
      </div>
      <div
        className={cn(
          "mt-2 text-[15px] font-semibold leading-snug tracking-tight text-white/92 sm:text-[16px]",
        )}
      >
        {title}
      </div>
      <div className={cn("mt-1 text-[13px] text-white/62")}>{subtitle}</div>
      <div className={cn("mt-0.5 text-[12px] text-white/45")}>{location}</div>
      <div
        className={cn(
          "mt-3 flex flex-wrap gap-1.5",
          align === "right" && "lg:justify-end",
        )}
      >
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </div>
  );
}

function ConnectionLine({ reverse = false }: { reverse?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div
      className={cn(
        "relative hidden h-px flex-1 overflow-hidden lg:block",
        reverse && "scale-x-[-1]",
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.06] via-violet-400/35 to-fuchsia-400/40" />
      {!reduce ? (
        <motion.div
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent"
          animate={{ left: ["-35%", "110%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
        />
      ) : null}
    </div>
  );
}

function MatchScoreRing({ active }: { active: boolean }) {
  const t = useTranslations("heroMockup");
  const reduce = useReducedMotion();
  const [score, setScore] = useState(reduce ? DEMO_SCORE : 0);

  useEffect(() => {
    if (!active || reduce) {
      setScore(DEMO_SCORE);
      return;
    }
    setScore(0);
    let raf = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(DEMO_SCORE * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduce]);

  const offset = RING_C * (1 - score / 100);

  return (
    <div className="relative z-[1] flex flex-col items-center">
      <div className="relative flex h-[132px] w-[132px] items-center justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-10%] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.22),transparent_68%)] blur-md"
        />
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 132 132" aria-hidden>
          <circle
            cx="66"
            cy="66"
            r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="7"
          />
          <circle
            cx="66"
            cy="66"
            r={RING_R}
            fill="none"
            stroke="url(#heroMatchGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-75 ease-out"
            style={{
              filter: "drop-shadow(0 0 8px rgba(168,85,247,0.45))",
            }}
          />
          <defs>
            <linearGradient id="heroMatchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(139,92,246)" />
              <stop offset="55%" stopColor="rgb(217,70,239)" />
              <stop offset="100%" stopColor="rgba(227,31,141,0.95)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="relative text-center">
          <div className="text-[28px] font-semibold tabular-nums leading-none tracking-tight text-white">
            {score}%
          </div>
          <div className="mt-1.5 text-[11px] font-medium tracking-wide text-white/50">
            {t("fitLabel")}
          </div>
        </div>
      </div>
      <p className="mt-2.5 text-center text-[12px] text-white/55">{t("reqsFilledShort")}</p>
    </div>
  );
}

function HeroMatchMockup() {
  const locale = useLocale();
  const t = useTranslations("heroMockup");
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: "-80px" });
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    if (inView) setBarReady(true);
  }, [inView]);

  const seekerTags = [t("seekerTag1"), t("seekerTag2"), t("seekerTag3")];
  const jobTags = [t("jobTag1"), t("jobTag2"), t("jobTag3")];

  const reasons: { status: "match" | "partial"; text: string }[] = [
    { status: "match", text: t("reason1") },
    { status: "match", text: t("reason2") },
    { status: "match", text: t("reason3") },
    { status: "match", text: t("reason4") },
    { status: "match", text: t("reason5") },
    { status: "partial", text: t("reason6") },
  ];

  return (
    <div
      ref={rootRef}
      className="relative mx-auto w-full min-w-0 max-w-[min(100%,780px)] lg:ml-auto lg:mr-0"
    >
      <div className="relative min-w-0 overflow-hidden rounded-[28px] border border-white/[0.11] bg-gradient-to-b from-white/[0.07] via-[#101014]/80 to-[#09090D]/95 p-px shadow-[0_28px_100px_-40px_rgba(9,9,13,0.8),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl sm:rounded-[32px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(168,85,247,0.16),transparent_55%)]" />

        <div
          {...(locale === "ru" ? { "data-hero-mock-locale": "ru" } : {})}
          className={cn(
            "relative flex min-w-0 flex-col gap-5 p-5 sm:gap-5 sm:p-6 md:p-7",
            locale === "ru" && "gap-4 sm:p-5",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-medium tracking-wide text-white/55">
              {t("matching")}
            </span>
            <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">
              {t("sampleBadge")}
            </span>
          </div>

          {/* Candidate | score | job */}
          <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:gap-0">
            <div className="min-w-0 flex-1">
              <SideCard
                eyebrow={t("seeker")}
                title={t("roleSample")}
                subtitle={t("seekerName")}
                location={t("seekerLocation")}
                tags={seekerTags}
              />
            </div>

            <div className="flex items-center justify-center gap-2 px-1 lg:w-[min(100%,220px)] lg:shrink-0 lg:px-2">
              <ConnectionLine />
              <MatchScoreRing active={inView} />
              <ConnectionLine reverse />
            </div>

            <div className="min-w-0 flex-1">
              <SideCard
                eyebrow={t("employer")}
                title={t("positionSample")}
                subtitle={t("jobCompany")}
                location={t("jobLocation")}
                tags={jobTags}
                align="right"
              />
            </div>
          </div>

          {/* Why score */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
            <div className="text-[13px] font-medium text-white/80">{t("whyTitle")}</div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-2">
              {reasons.map((r, i) => (
                <motion.li
                  key={r.text}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={inView ? { opacity: 1, y: 0 } : undefined}
                  transition={{ delay: 0.35 + i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-start gap-2 text-[13px] leading-snug text-white/70"
                >
                  {r.status === "match" ? (
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                    </span>
                  ) : (
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-violet-300/80">
                      <Circle className="h-3 w-3" strokeWidth={2} aria-hidden />
                    </span>
                  )}
                  <span>{r.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Requirements + verification */}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-white/78">{t("reqsFilledTitle")}</span>
                <span className="text-[12px] tabular-nums text-white/50">
                  {DEMO_FILLED}/{DEMO_TOTAL}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: barReady ? "80%" : 0 }}
                  transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500/85 via-fuchsia-500/75 to-[rgba(227,31,141,0.8)]"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/45">
                <span>{t("reqsMandatory")}</span>
                <span>{t("reqsOptional")}</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-emerald-100/90">{t("verifiedCert")}</div>
                <div className="text-[11px] text-emerald-200/65">{t("verifiedStatus")}</div>
              </div>
            </div>
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
      className="relative min-h-[min(96vh,940px)] overflow-hidden scroll-mt-[var(--site-header-offset)] bg-surface-deep"
    >
      <AmbientBackground intensity={heroPortal.ambientIntensity} />
      <div className="absolute inset-0 z-0">
        <PortalBackground variant={heroPortal.variant} intensity={heroPortal.intensity} />
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_-15%,rgba(168,85,247,0.28),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090D]/35 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,9,13,0.28)_100%)] opacity-70" />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-b from-transparent via-[#0F0F16]/55 to-[#0F0F16] sm:h-40"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-36 bg-gradient-to-b from-[#09090D]/95 via-[#09090D]/50 to-transparent sm:h-40"
      />

      <Container className="relative z-10">
        <div
          className="flex flex-col justify-start pb-24 sm:pb-28 lg:pb-36"
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

              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-body sm:mt-8 sm:text-lg sm:leading-relaxed lg:mt-9 lg:text-[1.3rem] lg:leading-[1.62]">
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
