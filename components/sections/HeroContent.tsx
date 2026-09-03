"use client";

import { useTranslations } from "next-intl";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { HeroPersonPhoto } from "@/components/sections/HeroPersonPhoto";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import { SITE_H1_HERO } from "@/lib/site/publicPageLayout";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

export function HeroContent({ quickFilters }: { quickFilters: HeroQuickFilterId[] }) {
  const t = useTranslations("hero");

  return (
    <div className="kf-enter-slow relative grid min-w-0 w-full items-center gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-10">
      {/* Copy + search — full size in its half, nothing clipped */}
      <div className="relative z-[2] min-w-0 lg:col-span-6">
        <h1
          className={cn(
            "max-w-[18ch] text-pretty sm:max-w-[20ch]",
            SITE_H1_HERO,
            "lg:text-[clamp(2.5rem,3.2vw+0.75rem,3.75rem)] lg:leading-[1.06]",
          )}
        >
          {t("headlineLead")}{" "}
          <GradientAccentText wrapClassName="font-bold">{t("headlineAccent")}</GradientAccentText>
        </h1>
        <p
          className={cn(
            "mt-5 max-w-[34rem] text-pretty sm:mt-6",
            "text-[1.0625rem] leading-[1.72] text-white/82 sm:text-[1.125rem] lg:text-[1.125rem] lg:leading-[1.68] xl:text-[1.1875rem]",
          )}
        >
          {t("subheadline")}
        </p>
        <HeroJobSearch quickFilters={quickFilters} layout="split" />
      </div>

      {/* Hero visual — right half on desktop, below on mobile */}
      <div className="relative z-[1] min-w-0 lg:col-span-6">
        <HeroPersonPhoto
          alt={t("photoAlt")}
          priority
          className="mx-auto w-full max-w-md sm:max-w-lg lg:ml-auto lg:mr-0 lg:max-w-none"
        />
      </div>
    </div>
  );
}
