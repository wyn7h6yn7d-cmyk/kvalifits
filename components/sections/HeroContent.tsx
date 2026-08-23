"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Circle } from "lucide-react";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { CertificateVerificationBadge } from "@/components/seeker/CertificateVerificationBadge";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

const DEMO_SCORE = 87;
const DEMO_FILLED = 8;
const DEMO_TOTAL = 10;
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;
const RING_STROKE = 10;

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

function useInViewOnce(ref: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "-80px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block max-w-full break-words rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] leading-snug text-white/65">
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
  dense = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  location: string;
  tags: string[];
  dense?: boolean;
}) {
  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.10] bg-[#141418] p-3 sm:p-3.5 md:p-4">
      <div className="text-[11px] font-medium tracking-wide text-white/45">{eyebrow}</div>
      <div
        className={cn(
          "mt-1.5 text-pretty font-semibold leading-snug tracking-tight text-white/92 break-words",
          dense ? "text-[13px] sm:text-[14px]" : "text-[14px] sm:text-[15px]",
        )}
      >
        {title}
      </div>
      <div className="mt-1 text-pretty text-[12px] leading-snug text-white/62 sm:text-[12.5px] break-words">
        {subtitle}
      </div>
      <div className="mt-0.5 text-pretty text-[12px] text-white/45 break-words">{location}</div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </div>
  );
}

function MatchScoreRing() {
  const t = useTranslations("heroMockup");
  const gradId = `heroMatchGrad-${useId().replace(/:/g, "")}`;
  const offset = RING_C * (1 - DEMO_SCORE / 100);

  return (
    <div className="relative z-[1] mx-auto flex w-full max-w-[10rem] flex-col items-center">
      <div className="relative flex h-[128px] w-[128px] items-center justify-center sm:h-[136px] sm:w-[136px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-6%] hidden rounded-full bg-[radial-gradient(circle_closest-side,rgba(168,85,247,0.32)_0%,rgba(217,70,239,0.14)_42%,transparent_72%)] lg:block"
        />
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 132 132" aria-hidden>
          <circle
            cx="66"
            cy="66"
            r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={RING_STROKE}
          />
          <circle
            cx="66"
            cy="66"
            r={RING_R}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(139,92,246)" />
              <stop offset="55%" stopColor="rgb(217,70,239)" />
              <stop offset="100%" stopColor="rgba(227,31,141,0.95)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="relative px-1 text-center">
          <div className="text-[26px] font-semibold tabular-nums leading-none tracking-tight text-white sm:text-[28px]">
            {DEMO_SCORE}%
          </div>
          <div className="mt-1.5 text-[11px] font-medium tracking-wide text-white/50">
            {t("fitLabel")}
          </div>
        </div>
      </div>
      <p className="mt-2 max-w-[10rem] text-pretty text-center text-[11px] leading-snug text-white/55 sm:max-w-[11rem] sm:text-[12px]">
        {t("reqsFilledShort")}
      </p>
    </div>
  );
}

function HeroMatchMockup({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("heroMockup");
  const reduce = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInViewOnce(rootRef);

  const seekerTags = [t("seekerTag1"), t("seekerTag2"), t("seekerTag3")];
  const jobTags = [t("jobTag1"), t("jobTag2"), t("jobTag3")];

  const reasons: { status: "match" | "partial"; text: string }[] = [
    { status: "match", text: t("reason1") },
    { status: "match", text: t("reason2") },
    { status: "match", text: t("reason3") },
    { status: "partial", text: t("reason4") },
  ];

  const denseCards = locale === "ru";

  return (
    <div
      ref={rootRef}
      className="relative mx-auto w-full min-w-0 max-w-[min(100%,780px)] lg:ml-auto lg:mr-0"
    >
      <div className="relative min-w-0 overflow-hidden rounded-[24px] border border-white/[0.11] bg-[#101014] p-px sm:rounded-[28px] md:rounded-[32px] lg:bg-gradient-to-b lg:from-white/[0.07] lg:via-[#101014]/80 lg:to-[#09090D]/95 lg:shadow-[0_28px_100px_-40px_rgba(9,9,13,0.8),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(168,85,247,0.16),transparent_55%)]" />

        <div
          {...(locale === "ru" ? { "data-hero-mock-locale": "ru" } : {})}
          className={cn(
            "relative flex min-w-0 flex-col overflow-hidden p-3.5 sm:p-4 md:p-5 lg:p-6",
            compact ? "gap-3 sm:gap-4" : "gap-3.5 sm:gap-5",
          )}
        >
          <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
            <span className="min-w-0 text-pretty text-[12px] font-medium tracking-wide text-white/55">
              {t("matching")}
            </span>
            <span className="shrink-0 rounded-full border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">
              {t("sampleBadge")}
            </span>
          </div>

          {compact ? (
            <div className="flex min-w-0 flex-col gap-3">
              <SideCard
                dense={denseCards}
                eyebrow={t("seeker")}
                title={t("roleSample")}
                subtitle={t("seekerName")}
                location={t("seekerLocation")}
                tags={seekerTags}
              />
              <div className="relative flex min-w-0 justify-center py-0.5">
                <MatchScoreRing />
              </div>
              <SideCard
                dense={denseCards}
                eyebrow={t("employer")}
                title={t("positionSample")}
                subtitle={t("jobCompany")}
                location={t("jobLocation")}
                tags={jobTags}
              />
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 xl:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1fr)] xl:items-center xl:gap-4">
              <div className="order-2 min-w-0 sm:order-1 xl:order-1">
                <SideCard
                  dense={denseCards}
                  eyebrow={t("seeker")}
                  title={t("roleSample")}
                  subtitle={t("seekerName")}
                  location={t("seekerLocation")}
                  tags={seekerTags}
                />
              </div>

              <div className="relative order-1 flex min-w-0 justify-center py-1 sm:col-span-2 sm:order-first xl:col-span-1 xl:order-2 xl:py-0">
                <MatchScoreRing />
              </div>

              <div className="order-3 min-w-0 sm:order-2 xl:order-3">
                <SideCard
                  dense={denseCards}
                  eyebrow={t("employer")}
                  title={t("positionSample")}
                  subtitle={t("jobCompany")}
                  location={t("jobLocation")}
                  tags={jobTags}
                />
              </div>
            </div>
          )}

          {!compact ? (
            <>
              <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 sm:p-3.5 md:p-4">
                <div className="text-pretty text-[13px] font-medium text-white/80">{t("whyTitle")}</div>
                <ul className="mt-3 grid min-w-0 gap-2 md:grid-cols-2 md:gap-x-5 md:gap-y-2">
                  {reasons.map((r, i) => (
                    <li
                      key={r.text}
                      className={cn(
                        "flex min-w-0 items-start gap-2 text-[12.5px] leading-snug text-white/70 sm:text-[13px]",
                        inView && !reduce && "kf-enter",
                      )}
                      style={
                        inView && !reduce
                          ? { animationDelay: `${0.35 + i * 0.07}s` }
                          : undefined
                      }
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
                      <span className="min-w-0 text-pretty break-words">{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start xl:gap-4">
                <div className="min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0 text-pretty text-[13px] font-medium text-white/78">
                      {t("reqsFilledTitle")}
                    </span>
                    <span className="shrink-0 text-[12px] tabular-nums text-white/50">
                      {DEMO_FILLED}/{DEMO_TOTAL}
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full w-4/5 rounded-full bg-gradient-to-r from-violet-500/85 via-fuchsia-500/75 to-[rgba(227,31,141,0.8)]"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-snug text-white/45">
                    <span className="min-w-0 text-pretty">{t("reqsMandatory")}</span>
                    <span className="min-w-0 text-pretty">{t("reqsOptional")}</span>
                  </div>
                </div>

                <div className="relative inline-flex min-w-0 max-w-full flex-col gap-1.5 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-2.5">
                  <span className="self-start rounded-full border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">
                    {t("sampleBadge")}
                  </span>
                  <CertificateVerificationBadge
                    name={t("verifiedCert")}
                    status="verified"
                    statusLabel={t("verifiedStatus")}
                    sourceLine={t("verifiedSource")}
                    validUntilLine={t("verifiedUntil")}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function HeroContent({ quickFilters }: { quickFilters: HeroQuickFilterId[] }) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const headlineClamp =
    locale === "ru"
      ? "text-[1.4rem] leading-[1.2] sm:text-[1.65rem] sm:leading-[1.18] lg:text-[clamp(2.25rem,2.75vw+0.95rem,3.55rem)] lg:leading-[1.05]"
      : "text-[1.45rem] leading-[1.18] sm:text-[1.75rem] sm:leading-[1.16] lg:text-[clamp(2.65rem,3.4vw+1.1rem,4.35rem)] lg:leading-[1.03]";

  return (
    <div className="grid min-w-0 items-start gap-6 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-16">
      <div className="kf-enter-slow min-w-0 max-w-[42rem]">
        <h1
          className={cn(
            "text-balance font-semibold tracking-[-0.035em] text-white break-words",
            headlineClamp,
          )}
        >
          {t("headlineBefore")}{" "}
          <GradientAccentText wrapClassName="font-semibold">{t("headlineAccent")}</GradientAccentText>
          {t("headlineAfter").trim() ? (
            <>
              <br className="hidden lg:block" />
              <span className="text-white/[0.96]">{t("headlineAfter")}</span>
            </>
          ) : null}
        </h1>

        <p className="mt-3 max-w-xl text-pretty text-[14px] leading-relaxed text-body sm:mt-4 sm:text-[15px] lg:mt-5 lg:text-lg">
          {t("subheadline")}
        </p>

        <HeroJobSearch quickFilters={quickFilters} />
      </div>

      <div className="kf-enter-slow kf-enter-d1 relative flex min-w-0 justify-center lg:justify-end">
        <div className="w-full lg:hidden">
          <HeroMatchMockup compact />
        </div>
        <div className="hidden w-full lg:block">
          <HeroMatchMockup />
        </div>
      </div>
    </div>
  );
}
