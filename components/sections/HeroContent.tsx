"use client";

import { useTranslations } from "next-intl";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import { SITE_H1_HERO } from "@/lib/site/publicPageLayout";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

export function HeroContent({ quickFilters }: { quickFilters: HeroQuickFilterId[] }) {
  const t = useTranslations("hero");

  return (
    <div className="kf-enter-slow relative min-w-0 w-full">
      <h1 className={cn("max-w-[20ch] text-pretty sm:max-w-[22ch] lg:max-w-[24ch]", SITE_H1_HERO)}>
        {t("headlineLead")}{" "}
        <GradientAccentText wrapClassName="font-bold">{t("headlineAccent")}</GradientAccentText>
      </h1>
      <p
        className={cn(
          "mt-5 max-w-[40rem] text-pretty sm:mt-6 lg:mt-7",
          "text-[1.0625rem] leading-[1.72] text-white/82 sm:text-[1.125rem] lg:text-[1.25rem] lg:leading-[1.66]",
        )}
      >
        {t("subheadline")}
      </p>
      <HeroJobSearch quickFilters={quickFilters} />
    </div>
  );
}
