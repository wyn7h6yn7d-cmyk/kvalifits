"use client";

import { useTranslations } from "next-intl";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { HeroPersonPhoto } from "@/components/sections/HeroPersonPhoto";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import { Link } from "@/i18n/routing";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

/**
 * Mega hero content — Human Premium.
 * Left: headline, short lead, large search, employer secondary link.
 * Right: real workplace photo + one small match overlay.
 */
export function HeroContent({ quickFilters }: { quickFilters: HeroQuickFilterId[] }) {
  const t = useTranslations("hero");

  return (
    <div className="relative grid min-w-0 w-full items-center gap-9 sm:gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-12 2xl:gap-14">
      {/* LEFT — value + search */}
      <div className="relative z-[2] min-w-0 lg:col-span-6 xl:col-span-6">
        <div className="kf-enter-slow">
          <h1
            className={cn(
              "type-hero-title max-w-[14ch] text-balance font-bold tracking-[-0.042em] text-white",
              "text-[2.375rem] leading-[1.08] sm:max-w-[16ch] sm:text-[3rem] sm:leading-[1.06]",
              "lg:max-w-[15ch] lg:text-[clamp(3.25rem,4.4vw+0.5rem,4.5rem)] lg:leading-[1.04]",
              "xl:text-[clamp(3.5rem,3.8vw+1rem,4.75rem)]",
            )}
          >
            {t("headlineLead")}{" "}
            <GradientAccentText wrapClassName="font-bold">{t("headlineAccent")}</GradientAccentText>{" "}
            {t("headlineTail")}
          </h1>

          <p
            className={cn(
              "mt-5 max-w-[36rem] text-pretty sm:mt-6",
              "text-[1.0625rem] leading-[1.7] text-white/84 sm:text-[1.125rem] sm:leading-[1.68]",
              "lg:mt-7 lg:text-[1.1875rem] lg:leading-[1.65]",
            )}
          >
            {t("subheadline")}
          </p>
        </div>

        <div className="kf-enter kf-enter-d1">
          <HeroJobSearch quickFilters={quickFilters} layout="split" />
        </div>

        <div className="kf-enter mt-5 flex flex-col gap-3 sm:mt-6 sm:gap-3.5" style={{ animationDelay: "0.2s" }}>
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
          <p className="text-[0.8125rem] leading-snug text-white/38 sm:text-[0.875rem]">{t("trustLine")}</p>
        </div>
      </div>

      {/* RIGHT — human photo + match proof */}
      <div className="relative z-[1] min-w-0 lg:col-span-6">
        <HeroPersonPhoto
          alt={t("photoAlt")}
          priority
          matchScore={t("matchScore")}
          matchLabel={t("matchLabel")}
          matchReqs={t("matchReqs")}
          className="mx-auto w-full max-w-[22rem] sm:max-w-md lg:ml-auto lg:mr-[-0.5rem] lg:max-w-none xl:mr-[-1rem]"
        />
      </div>
    </div>
  );
}
