"use client";

import { useTranslations } from "next-intl";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { SITE_BODY, SITE_H1_HERO } from "@/lib/site/publicPageLayout";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

export function HeroContent({
  quickFilters,
  publishedJobCount,
}: {
  quickFilters: HeroQuickFilterId[];
  publishedJobCount: number;
}) {
  const t = useTranslations("hero");

  return (
    <div className="mx-auto min-w-0 max-w-3xl">
      <h1 className={cn("text-pretty", SITE_H1_HERO)}>{t("headline")}</h1>
      <p className={cn("mt-4 max-w-2xl text-pretty sm:mt-5", SITE_BODY, "text-muted")}>
        {t("subheadline")}
      </p>
      <HeroJobSearch quickFilters={quickFilters} publishedJobCount={publishedJobCount} />
    </div>
  );
}
