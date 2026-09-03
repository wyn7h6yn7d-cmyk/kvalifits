"use client";

import { useTranslations } from "next-intl";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { HeroWorkspacePanel } from "@/components/sections/HeroWorkspacePanel";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import { Link } from "@/i18n/routing";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { SITE_EYEBROW } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

/**
 * Search-first hero — search and live workspace as two separate blocks.
 */
export function HeroContent({ quickFilters }: { quickFilters: HeroQuickFilterId[] }) {
  const t = useTranslations("hero");

  return (
    <div className="relative mx-auto min-w-0 w-full max-w-5xl lg:max-w-6xl">
      <div className="kf-enter-slow max-w-3xl">
        <p className={cn(SITE_EYEBROW, "text-white/45")}>{t("eyebrow")}</p>

        <h1
          className={cn(
            "type-hero-title mt-2.5 text-balance font-bold tracking-[-0.042em] text-white sm:mt-3",
            "text-[2rem] leading-[1.12] sm:text-[2.625rem] sm:leading-[1.08]",
            "lg:text-[clamp(2.75rem,3.2vw+0.75rem,3.75rem)] lg:leading-[1.06]",
          )}
        >
          {t("headlineLead")}{" "}
          <GradientAccentText wrapClassName="font-bold">{t("headlineAccent")}</GradientAccentText>{" "}
          {t("headlineTail")}
        </h1>

        <p
          className={cn(
            "mt-3 max-w-[36rem] text-pretty sm:mt-3.5",
            "text-[1.0625rem] leading-[1.65] text-white/82 sm:text-[1.125rem] sm:leading-[1.65]",
          )}
        >
          {t("subheadline")}
        </p>
      </div>

      <div className="kf-enter kf-enter-d1 mt-6 sm:mt-7 lg:mt-8">
        <HeroJobSearch quickFilters={quickFilters} />
      </div>

      <div className="kf-enter mt-4 sm:mt-5 lg:mt-6" style={{ animationDelay: "0.14s" }}>
        <HeroWorkspacePanel className="rounded-2xl border border-white/[0.11] bg-[#0c0c14]/95 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.85)]" />
      </div>

      <div className="kf-enter mt-4 sm:mt-5" style={{ animationDelay: "0.22s" }}>
        <Link
          href="/tooandjatele"
          className={cn(
            "inline-flex w-fit max-w-full items-center text-[0.9375rem] font-medium leading-snug text-white/55",
            "transition-colors duration-200 hover:text-white/88",
            "focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c]",
            "sm:text-base",
          )}
        >
          {t("employerLink")}
        </Link>
      </div>
    </div>
  );
}
