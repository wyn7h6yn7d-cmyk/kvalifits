"use client";

import { useTranslations } from "next-intl";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { HeroMatchPanel } from "@/components/sections/HeroMatchPanel";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import { Link } from "@/i18n/routing";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { SITE_EYEBROW } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

/**
 * Homepage hero — conversion-first.
 * Desktop lg+: 70/30. Below lg: stacked mobile order
 * H1 → lead → search → employer link → match card → visual.
 */
export function HeroContent({ quickFilters }: { quickFilters: HeroQuickFilterId[] }) {
  const t = useTranslations("hero");

  const reasons = [
    { status: "match" as const, text: t("matchReason1") },
    { status: "match" as const, text: t("matchReason2") },
    { status: "match" as const, text: t("matchReason3") },
    { status: "match" as const, text: t("matchReason4") },
    { status: "partial" as const, text: t("matchReason5") },
  ] as const;

  return (
    <div className="relative grid min-w-0 w-full gap-7 sm:gap-8 lg:grid-cols-10 lg:items-center lg:gap-8 xl:gap-10">
      {/* LEFT — copy + search (items 1–4 on mobile) */}
      <div className="relative z-[2] min-w-0 lg:col-span-7">
        <div className="kf-enter-slow">
          <p className={cn(SITE_EYEBROW, "text-white/45")}>{t("eyebrow")}</p>

          <h1
            className={cn(
              "type-hero-title mt-2.5 max-w-[16ch] text-balance font-bold tracking-[-0.042em] text-white sm:mt-3",
              "text-[2.125rem] leading-[1.1] sm:max-w-[18ch] sm:text-[2.75rem] sm:leading-[1.06]",
              "lg:max-w-[18ch] lg:text-[clamp(3rem,3.6vw+0.6rem,4.25rem)] lg:leading-[1.05]",
              "xl:text-[clamp(3.25rem,3.2vw+0.85rem,4.5rem)]",
            )}
          >
            {t("headlineLead")}{" "}
            <GradientAccentText wrapClassName="font-bold">{t("headlineAccent")}</GradientAccentText>{" "}
            {t("headlineTail")}
          </h1>

          <p
            className={cn(
              "mt-3.5 max-w-[40rem] text-pretty sm:mt-4",
              "text-[1.0625rem] leading-[1.68] text-white/84 sm:text-[1.125rem] sm:leading-[1.68]",
              "lg:mt-5 lg:text-[1.125rem] lg:leading-[1.66] xl:text-[1.1875rem]",
            )}
          >
            {t("subheadline")}
          </p>
        </div>

        <div className="kf-enter kf-enter-d1">
          <HeroJobSearch quickFilters={quickFilters} layout="primary" />
        </div>

        <div className="kf-enter mt-4 flex flex-col gap-2 sm:mt-5 sm:gap-2.5" style={{ animationDelay: "0.18s" }}>
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
          <p className="text-[0.875rem] leading-snug text-white/40 sm:text-[0.9375rem]">{t("trustLine")}</p>
        </div>
      </div>

      {/* RIGHT — match card then visual on mobile; soft visual column on desktop */}
      <div className="relative z-[1] min-w-0 w-full lg:col-span-3">
        <HeroMatchPanel
          photoAlt={t("photoAlt")}
          priority
          score={t("matchScore")}
          scoreLabel={t("matchLabel")}
          reqsFilled={t("matchReqs")}
          whyTitle={t("matchWhyTitle")}
          reasons={reasons}
          className="w-full lg:ml-auto lg:max-w-[20rem] xl:max-w-none"
        />
      </div>
    </div>
  );
}
