"use client";

import { useLocale, useTranslations } from "next-intl";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

export function HeroContent({ quickFilters }: { quickFilters: HeroQuickFilterId[] }) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const headlineClamp =
    locale === "ru"
      ? "text-[1.4rem] leading-[1.2] sm:text-[1.65rem] sm:leading-[1.18] lg:text-[clamp(2rem,2.5vw+0.85rem,3rem)] lg:leading-[1.08]"
      : "text-[1.45rem] leading-[1.18] sm:text-[1.75rem] sm:leading-[1.16] lg:text-[clamp(2.25rem,2.8vw+0.95rem,3.25rem)] lg:leading-[1.05]";

  return (
    <div className="kf-enter-slow mx-auto min-w-0 max-w-3xl lg:mx-0 lg:max-w-[42rem]">
      <h1
        className={cn(
          "text-balance font-semibold tracking-[-0.035em] text-white break-words",
          headlineClamp,
        )}
      >
        {t("headlineBefore")}{" "}
        <GradientAccentText wrapClassName="font-semibold">{t("headlineAccent")}</GradientAccentText>
        {t("headlineAfter").trim() ? (
          <>
            <br className="hidden lg:block" />
            <span className="text-white/[0.96]">{t("headlineAfter")}</span>
          </>
        ) : null}
      </h1>

      <p className="mt-3 max-w-xl text-pretty text-[14px] leading-relaxed text-body sm:mt-4 sm:text-[15px] lg:mt-5 lg:text-lg">
        {t("subheadline")}
      </p>

      <HeroJobSearch quickFilters={quickFilters} />
    </div>
  );
}
