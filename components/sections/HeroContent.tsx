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
    <div className="kf-enter-slow relative mx-auto min-w-0 max-w-3xl lg:mx-0 lg:max-w-2xl xl:max-w-3xl">
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
  );
}
