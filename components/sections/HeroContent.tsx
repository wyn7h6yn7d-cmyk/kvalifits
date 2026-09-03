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
    <div className="kf-enter-slow relative grid min-w-0 items-center gap-8 lg:grid-cols-12 lg:gap-6 xl:gap-10">
      {/* Copy + search — visually above the photo on all breakpoints */}
      <div className="relative z-[2] min-w-0 lg:col-span-6 xl:col-span-6">
        <h1 className={cn("max-w-[18ch] text-pretty sm:max-w-none", SITE_H1_HERO)}>
          {t("headlineLead")}{" "}
          <GradientAccentText wrapClassName="font-bold">{t("headlineAccent")}</GradientAccentText>
        </h1>
        <p
          className={cn(
            "mt-6 max-w-[36rem] text-pretty sm:mt-7 lg:mt-8",
            "text-[1.0625rem] leading-[1.72] text-white/82 sm:text-[1.125rem] lg:text-[1.25rem] lg:leading-[1.66]",
          )}
        >
          {t("subheadline")}
        </p>
        <HeroJobSearch quickFilters={quickFilters} />
      </div>

      {/*
        Desktop: split right column, soft-masked into the dark canvas.
        Photo stays above hero motion (atmosphere only behind / beside).
      */}
      <div className="relative z-[3] -mx-1 lg:col-span-6 lg:mx-0 xl:col-span-6">
        <HeroPersonPhoto
          alt={t("photoAlt")}
          priority
          className="mx-auto w-full max-w-md sm:max-w-lg lg:ml-auto lg:mr-[-1.5rem] lg:max-w-none xl:mr-[-2rem]"
        />
      </div>
    </div>
  );
}
