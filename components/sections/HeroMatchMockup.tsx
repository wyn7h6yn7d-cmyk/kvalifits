"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Circle } from "lucide-react";

import { CertificateVerificationBadge } from "@/components/seeker/CertificateVerificationBadge";
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
    <span className="inline-block max-w-full break-words rounded-md border border-border bg-[#f8fafc] px-2 py-0.5 text-[0.75rem] leading-snug text-muted">
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
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-white p-3 sm:p-3.5 md:p-4">
      <div className="text-[0.8125rem] font-medium leading-snug text-muted">{eyebrow}</div>
      <div
        className={cn(
          "mt-1.5 text-pretty font-semibold leading-snug text-foreground break-words",
          dense ? "text-[0.875rem] sm:text-[0.9375rem]" : "text-[0.9375rem] sm:text-base",
        )}
      >
        {title}
      </div>
      <div className="mt-1 text-pretty text-[0.8125rem] leading-snug text-muted break-words">
        {subtitle}
      </div>
      <div className="mt-0.5 text-pretty text-[0.8125rem] text-muted-2 break-words">{location}</div>
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
          className="pointer-events-none absolute inset-[-4%] hidden rounded-full bg-[radial-gradient(circle_closest-side,rgba(37,99,235,0.08)_0%,transparent_72%)] lg:block"
        />
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
            stroke={`url(#${gradId})`}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={offset}
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
        </svg>
        <div className="relative px-1 text-center">
          <div className="text-[26px] font-semibold tabular-nums leading-none text-foreground sm:text-[28px]">
            {DEMO_SCORE}%
          </div>
          <div className="mt-1.5 text-[0.8125rem] font-medium leading-snug text-muted">
            {t("fitLabel")}
          </div>
        </div>
      </div>
      <p className="mt-2 max-w-[10rem] text-pretty text-center text-[0.8125rem] leading-snug text-muted sm:max-w-[11rem]">
        {t("reqsFilledShort")}
      </p>
    </div>
  );
}

export function HeroMatchMockup({ compact = false }: { compact?: boolean }) {
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
      <div className="relative min-w-0 overflow-hidden rounded-[24px] border border-border bg-white p-px shadow-[0_12px_40px_-20px_rgba(15,23,42,0.14)] sm:rounded-[28px] md:rounded-[32px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(37,99,235,0.08),transparent_55%)]" />

        <div
          {...(locale === "ru" ? { "data-hero-mock-locale": "ru" } : {})}
          className={cn(
            "relative flex min-w-0 flex-col overflow-hidden p-3.5 sm:p-4 md:p-5 lg:p-6",
            compact ? "gap-3 sm:gap-4" : "gap-3.5 sm:gap-5",
          )}
        >
          <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
            <span className="min-w-0 text-pretty text-[0.8125rem] font-medium leading-snug text-muted">
              {t("matching")}
            </span>
            <span className="shrink-0 rounded-full border border-border bg-[#f8fafc] px-2 py-0.5 text-[0.75rem] text-muted">
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
              <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-[#f8fafc] p-3 sm:p-3.5 md:p-4">
                <div className="text-pretty text-[0.9375rem] font-medium text-foreground">{t("whyTitle")}</div>
                <ul className="mt-3 grid min-w-0 gap-2 md:grid-cols-2 md:gap-x-5 md:gap-y-2">
                  {reasons.map((r, i) => (
                    <li
                      key={r.text}
                      className={cn(
                        "flex min-w-0 items-start gap-2 text-[0.8125rem] leading-snug text-body sm:text-[0.875rem]",
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
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-primary/80">
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
                    <span className="min-w-0 text-pretty text-[0.9375rem] font-medium text-foreground">
                      {t("reqsFilledTitle")}
                    </span>
                    <span className="shrink-0 text-[0.8125rem] tabular-nums text-muted">
                      {DEMO_FILLED}/{DEMO_TOTAL}
                    </span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#f8fafc]">
                    <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6]" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.8125rem] leading-snug text-muted">
                    <span className="min-w-0 text-pretty">{t("reqsMandatory")}</span>
                    <span className="min-w-0 text-pretty">{t("reqsOptional")}</span>
                  </div>
                </div>

                <div className="relative inline-flex min-w-0 max-w-full flex-col gap-1.5 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-2.5">
                  <span className="self-start rounded-full border border-border bg-[#f8fafc] px-2 py-0.5 text-[0.75rem] text-muted">
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
