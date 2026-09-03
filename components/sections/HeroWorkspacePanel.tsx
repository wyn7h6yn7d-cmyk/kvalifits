"use client";

import { useEffect, useState } from "react";
import { Check, Circle } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const MATCH_SCORE = 87;
const VERIFIED_COUNT = 3;
const PROGRESS_PCT = 80;

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

function useCountUp(target: number, start: boolean, animate: boolean, durationMs = 1100) {
  const [value, setValue] = useState(() => (animate ? 0 : target));

  useEffect(() => {
    let cancelled = false;
    let frame = 0;

    if (!animate) {
      frame = window.requestAnimationFrame(() => {
        if (!cancelled) setValue(target);
      });
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frame);
      };
    }

    if (!start) {
      frame = window.requestAnimationFrame(() => {
        if (!cancelled) setValue(0);
      });
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frame);
      };
    }

    const t0 = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [target, start, animate, durationMs]);

  return value;
}

/**
 * Live match strip — sits under hero search as one product surface.
 * Dense, readable, not a side dashboard.
 */
export function HeroWorkspacePanel({ className }: { className?: string }) {
  const t = useTranslations("heroMockup");
  const reduce = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const score = useCountUp(MATCH_SCORE, ready, !reduce, 1200);
  const verified = useCountUp(VERIFIED_COUNT, ready, !reduce, 900);

  useEffect(() => {
    if (reduce) {
      const id = window.requestAnimationFrame(() => {
        setReady(true);
        setProgress(PROGRESS_PCT);
      });
      return () => window.cancelAnimationFrame(id);
    }
    const enter = window.setTimeout(() => setReady(true), 100);
    const bar = window.setTimeout(() => setProgress(PROGRESS_PCT), 480);
    return () => {
      window.clearTimeout(enter);
      window.clearTimeout(bar);
    };
  }, [reduce]);

  const reasons = [
    { ok: true, text: t("reasonLocation") },
    { ok: true, text: t("reasonSkills") },
    { ok: true, text: t("reasonFullTime") },
    { ok: false, text: t("reasonExperience") },
  ] as const;

  return (
    <div
      className={cn("kf-workspace-enter relative isolate overflow-hidden", className)}
      aria-label={t("panelAria")}
    >
      {!reduce ? (
        <>
          <div aria-hidden className="kf-workspace-scan pointer-events-none absolute inset-0 opacity-80" />
          <div aria-hidden className="kf-workspace-line pointer-events-none absolute inset-x-0 top-1/2" />
        </>
      ) : null}

      {/* Chrome */}
      <div className="relative z-[1] flex items-center justify-between gap-3 px-4 pt-3.5 sm:px-5 sm:pt-4">
        <p className="truncate text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/48">
          {t("title")}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={cn("absolute inset-0 rounded-full bg-emerald-400/50", !reduce && "kf-live-ping")}
              aria-hidden
            />
            <span
              className={cn("relative h-2 w-2 rounded-full bg-emerald-400", !reduce && "kf-live-dot")}
              aria-hidden
            />
          </span>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-emerald-300/90">
            {t("live")}
          </span>
        </div>
      </div>

      {/* Dense product grid — score | job+reasons */}
      <div className="relative z-[1] grid gap-4 px-4 py-3.5 sm:gap-5 sm:px-5 sm:py-4 lg:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)] lg:items-stretch lg:gap-6">
        {/* Match signal */}
        <div
          className={cn(
            "flex flex-row items-end gap-5 border-b border-white/[0.07] pb-3.5 lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:border-r lg:border-white/[0.07] lg:pb-0 lg:pr-5",
            ready && !reduce && "kf-workspace-stagger",
          )}
          style={ready && !reduce ? { animationDelay: "0.1s" } : undefined}
        >
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-white/38">
              {t("fitLabel")}
            </p>
            <p className="mt-1 flex items-baseline gap-0.5 text-[2rem] font-semibold tabular-nums leading-none tracking-[-0.045em] text-white sm:text-[2.25rem]">
              <span>{score}</span>
              <span className="text-[1.125rem] font-semibold text-white/55">%</span>
            </p>
            <p className="mt-1.5 text-[0.8125rem] text-indigo-200/75">{t("scoreLevel")}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-white/38">
              {t("verifiedLabel")}
            </p>
            <p className="mt-1 text-[1.5rem] font-semibold tabular-nums leading-none tracking-[-0.03em] text-white">
              {verified}
            </p>
            <p className="mt-1.5 max-w-[11rem] text-[0.8125rem] leading-snug text-white/50">
              {t("verifiedDetail")}
            </p>
          </div>
        </div>

        {/* Active match */}
        <div
          className={cn(
            "min-w-0",
            ready && !reduce && "kf-workspace-stagger",
          )}
          style={ready && !reduce ? { animationDelay: "0.2s" } : undefined}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-white/38">
                {t("activeJob")}
              </p>
              <p className="mt-1 text-[1.125rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.1875rem]">
                {t("jobTitle")}
              </p>
            </div>
            <div className="text-right text-[0.8125rem] leading-snug">
              <p className="text-white/55">{t("jobLocation")}</p>
              <p className="font-medium tabular-nums text-white/78">{t("jobSalary")}</p>
            </div>
          </div>

          <p className="mt-3 text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-white/35">
            {t("whyTitle")}
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {reasons.map((reason, i) => (
              <li
                key={reason.text}
                className={cn(
                  "flex min-w-0 items-start gap-2 text-[0.8125rem] leading-snug",
                  reason.ok ? "text-white/78" : "text-white/45",
                  ready && !reduce && "kf-workspace-stagger",
                )}
                style={
                  ready && !reduce ? { animationDelay: `${0.28 + i * 0.07}s` } : undefined
                }
              >
                {reason.ok ? (
                  <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-emerald-400/90">
                    <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                  </span>
                ) : (
                  <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-white/28">
                    <Circle className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                  </span>
                )}
                <span className="min-w-0 text-pretty">{reason.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[0.75rem] font-medium text-white/48">{t("reqsFilled")}</p>
              <p className="text-[0.75rem] tabular-nums text-indigo-200/80">8/10</p>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={cn(
                  "relative h-full overflow-hidden rounded-full",
                  "bg-gradient-to-r from-indigo-400/85 via-violet-400/80 to-[var(--accent-pink)]/65",
                  !reduce && "transition-[width] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                )}
                style={{ width: `${progress}%` }}
              >
                {!reduce ? (
                  <span className="kf-workspace-bar-sheen absolute inset-y-0 w-1/3" aria-hidden />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
