"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import {
  buildJobSearchUrl,
  type JobSearchUrlParams,
} from "@/lib/jobs/jobSearchUrl";
import type { HeroQuickFilterId } from "@/lib/jobs/heroQuickFilters";
import { cn } from "@/lib/utils";

type Props = {
  quickFilters: HeroQuickFilterId[];
  /** `split` = left hero column — large search that stacks on mobile. */
  layout?: "full" | "split";
};

/** Tall, clickable hero search — primary CTA on the homepage. */
const SEARCH_H = "min-h-[3.75rem] sm:min-h-[4rem] lg:min-h-[4.5rem]";

const fieldClass = cn(
  SEARCH_H,
  "min-w-0 rounded-none border-0 bg-transparent text-base text-white shadow-none",
  "placeholder:text-white/40 focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none",
  "lg:text-[1.0625rem]",
);

/**
 * Hero job search only — no mini-card chrome, no feature clutter.
 * Desktop split: one wide horizontal control. Mobile: stacked fields + full-width CTA.
 */
export function HeroJobSearch({ quickFilters: _quickFilters, layout = "full" }: Props) {
  const t = useTranslations("hero");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const split = layout === "split";

  // Keep prop for API compatibility; mega-hero keeps focus on the search itself.
  void _quickFilters;

  function submit(extra?: Partial<JobSearchUrlParams>) {
    router.push(
      buildJobSearchUrl({
        query,
        location,
        ...extra,
      }),
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <div className={cn("min-w-0", split ? "mt-7 sm:mt-8 lg:mt-9" : "mt-8 sm:mt-9 lg:mt-11")}>
      <form
        onSubmit={onSubmit}
        className={cn(
          "relative min-w-0 overflow-hidden rounded-2xl border border-white/[0.16]",
          "bg-[#101016]/94 shadow-[0_24px_64px_-40px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.09)]",
          "backdrop-blur-md lg:rounded-[1.125rem]",
        )}
      >
        <div
          className={cn(
            "grid min-w-0 items-stretch gap-0",
            /* Mobile / tablet in split: vertical. Desktop lg+: horizontal in left column. */
            split
              ? "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
              : "lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_auto]",
          )}
        >
          <label
            className={cn(
              "relative flex min-w-0 items-center border-b border-white/[0.09] transition-colors focus-within:bg-white/[0.035]",
              SEARCH_H,
              "lg:border-b-0 lg:border-r lg:border-white/[0.09]",
            )}
          >
            <span className="sr-only">{t("searchQueryLabel")}</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-300/55 lg:left-5"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchQueryPlaceholder")}
              autoComplete="off"
              className={cn(fieldClass, "pl-12 pr-4 lg:pl-14 lg:pr-5")}
            />
          </label>

          <label
            className={cn(
              "relative flex min-w-0 items-center border-b border-white/[0.09] transition-colors focus-within:bg-white/[0.035]",
              SEARCH_H,
              "lg:border-b-0 lg:border-r lg:border-white/[0.09]",
            )}
          >
            <span className="sr-only">{t("searchLocationLabel")}</span>
            <MapPin
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-300/55 lg:left-5"
              aria-hidden
            />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("searchLocationPlaceholder")}
              autoComplete="address-level2"
              className={cn(fieldClass, "pl-12 pr-4 lg:pl-14 lg:pr-5")}
            />
          </label>

          <Button
            type="submit"
            variant="primary"
            className={cn(
              SEARCH_H,
              "w-full min-w-0 rounded-none px-5 text-pretty text-base font-semibold",
              "transition-[filter,transform] duration-200 ease-out hover:brightness-110 active:scale-[0.99]",
              "focus-visible:ring-inset focus-visible:ring-offset-0 motion-reduce:active:scale-100",
              "sm:px-6 lg:min-w-[13.5rem] lg:px-7 lg:text-[1.0625rem] xl:min-w-[15rem]",
            )}
          >
            {t("searchSubmit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
