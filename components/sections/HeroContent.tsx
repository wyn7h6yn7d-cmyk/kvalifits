"use client";

import { useTranslations } from "next-intl";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import { SITE_H1_HERO, SITE_HOME_HERO_INNER } from "@/lib/site/publicPageLayout";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

export function HeroContent({ quickFilters }: { quickFilters: HeroQuickFilterId[] }) {
  const t = useTranslations("hero");

  return (
    <div className={cn("kf-enter-slow min-w-0", SITE_HOME_HERO_INNER)}>
      <div className="max-w-3xl lg:max-w-none">
        <h1 className={cn("text-pretty", SITE_H1_HERO)}>
          {t("headlineLead")}{" "}
          <GradientAccentText wrapClassName="font-bold">{t("headlineAccent")}</GradientAccentText>
        </h1>
      </div>
      <p className={cn("mt-6 max-w-[36rem] text-pretty sm:mt-7 lg:mt-8 lg:max-w-[44rem]", "text-[1.0625rem] leading-[1.72] text-white/82 sm:text-[1.125rem] lg:text-[1.25rem] lg:leading-[1.66]")}>
        {t("subheadline")}
      </p>
      <HeroJobSearch quickFilters={quickFilters} />
    </div>
  );
}
