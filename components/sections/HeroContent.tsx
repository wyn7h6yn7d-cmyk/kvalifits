"use client";

import { useLocale, useTranslations } from "next-intl";

import { HeroJobSearch } from "@/components/sections/HeroJobSearch";
import { HeroMatchMockup } from "@/components/sections/HeroMatchMockup";
import { HomepageScrollHint } from "@/components/sections/HomepageScrollHint";
import { GradientAccentText } from "@/components/site/GradientAccentText";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

export function HeroContent({
  quickFilters,
  publishedJobCount,
  showScrollHint = false,
}: {
  quickFilters: HeroQuickFilterId[];
  publishedJobCount: number;
  showScrollHint?: boolean;
}) {
  const t = useTranslations("hero");
  const locale = useLocale();
  const headlineClamp =
    locale === "ru"
      ? "text-[1.4rem] leading-[1.2] sm:text-[1.65rem] sm:leading-[1.18] lg:text-[clamp(2rem,2.5vw+0.85rem,3rem)] lg:leading-[1.08]"
      : "text-[1.45rem] leading-[1.18] sm:text-[1.75rem] sm:leading-[1.16] lg:text-[clamp(2.25rem,2.8vw+0.95rem,3.25rem)] lg:leading-[1.05]";

  return (
    <div className="grid min-w-0 items-start gap-6 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-16">
      <div className="kf-enter-slow min-w-0 max-w-3xl lg:max-w-[42rem]">
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

        <HeroJobSearch quickFilters={quickFilters} publishedJobCount={publishedJobCount} />
        {showScrollHint ? <HomepageScrollHint /> : null}
      </div>

      <div className="kf-enter-slow kf-enter-d1 relative flex min-w-0 justify-center lg:justify-end">
        <div className="w-full lg:hidden">
          <HeroMatchMockup compact />
        </div>
        <div className="hidden w-full lg:block">
          <HeroMatchMockup />
        </div>
      </div>
    </div>
  );
}
