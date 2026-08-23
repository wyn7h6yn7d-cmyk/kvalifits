"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

const DEMO_SCORE = 87;
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;
const RING_STROKE = 10;

export function HeroMatchDemoCard() {
  const t = useTranslations("heroMockup");
  const gradId = `heroMatchGrad-${useId().replace(/:/g, "")}`;
  const offset = RING_C * (1 - DEMO_SCORE / 100);

  return (
    <div className="mx-auto w-full min-w-0 max-w-sm rounded-2xl border border-white/[0.08] bg-[#141418] p-5 sm:p-6 lg:max-w-none">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium tracking-wide text-white/50">{t("fitLabel")}</span>
        <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">
          {t("sampleBadge")}
        </span>
      </div>

      <div className="relative mx-auto mt-4 flex h-[128px] w-[128px] items-center justify-center">
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
        <div className="relative text-center">
          <div className="text-[26px] font-semibold tabular-nums leading-none tracking-tight text-white sm:text-[28px]">
            {DEMO_SCORE}%
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[13px] leading-snug text-white/62">{t("reqsFilledShort")}</p>
    </div>
  );
}
