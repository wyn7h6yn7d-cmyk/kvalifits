"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Slightly denser chip for job cards. */
  compact?: boolean;
};

/**
 * Automatic public badge — only render when employment-rules pre-check passed.
 * Employers cannot toggle this; parent decides visibility via eligibility.
 */
export function YoungSeekerJobBadge({ className, compact }: Props) {
  const t = useTranslations("jobCard");
  const label = t("suitableForYoungSeekerBadge");
  const tip = t("suitableForYoungSeekerTooltip");

  return (
    <span
      className={cn(
        "group/ysb relative inline-flex max-w-full",
        className
      )}
    >
      <span
        tabIndex={0}
        title={tip}
        aria-label={`${label}. ${tip}`}
        className={cn(
          "inline-flex cursor-help rounded-full border border-sky-400/25 bg-sky-500/10 font-medium leading-snug text-sky-200/90 outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40",
          compact
            ? "px-2.5 py-0.5 text-[0.75rem]"
            : "px-3 py-1 text-[0.8125rem]"
        )}
      >
        {label}
      </span>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 max-w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/[0.11] bg-[#14141f] px-3 py-2.5 text-left text-[0.8125rem] font-normal leading-[1.6] text-muted shadow-[0_12px_32px_-16px_rgba(0,0,0,0.55)]",
          "invisible opacity-0 transition-[opacity,visibility] duration-150",
          "group-hover/ysb:visible group-hover/ysb:opacity-100 group-focus-within/ysb:visible group-focus-within/ysb:opacity-100"
        )}
      >
        {tip}
      </span>
    </span>
  );
}
