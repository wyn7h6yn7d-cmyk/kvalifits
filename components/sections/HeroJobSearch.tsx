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
  /**
   * `primary` — wide left column (~70%): horizontal search from lg up.
   * `split` — narrower column (stacks longer).
   * `full` — full-width hero (no photo).
   */
  layout?: "full" | "split" | "primary";
};

/** Large hero search — strongest UI in the left column. */
const SEARCH_H = "min-h-[4.25rem] sm:min-h-[4.5rem] lg:min-h-[5rem]";

const fieldClass = cn(
  SEARCH_H,
  "min-w-0 rounded-none border-0 bg-transparent shadow-none",
  "text-[1.0625rem] text-white placeholder:text-white/45",
  "focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none",
  "sm:text-[1.125rem] lg:text-[1.125rem]",
);

/**
 * Hero job search — clean job-portal control, not a glass card.
 * Desktop: wide horizontal. Mobile: stacked + full-width CTA.
 */
export function HeroJobSearch({ quickFilters: _quickFilters, layout = "full" }: Props) {
  const t = useTranslations("hero");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const primary = layout === "primary" || layout === "full";

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
    <div className="mt-6 min-w-0 w-full sm:mt-7 lg:mt-9">
      <form
        onSubmit={onSubmit}
        className={cn(
          "relative min-w-0 w-full overflow-hidden rounded-xl border border-white/[0.18]",
          "bg-[#14141c]",
          "lg:rounded-2xl",
        )}
      >
        <div
          className={cn(
            "grid min-w-0 w-full items-stretch gap-0",
            /* Stack below lg (covers 390–768). Horizontal from 1024. */
            primary
              ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]"
              : "xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto]",
          )}
        >
          <label
            className={cn(
              "relative flex min-w-0 items-center border-b border-white/[0.10]",
              "transition-colors focus-within:bg-white/[0.04]",
              SEARCH_H,
              primary
                ? "lg:border-b-0 lg:border-r lg:border-white/[0.10]"
                : "xl:border-b-0 xl:border-r xl:border-white/[0.10]",
            )}
          >
            <span className="sr-only">{t("searchQueryLabel")}</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 sm:left-5 sm:h-[1.35rem] sm:w-[1.35rem]"
              aria-hidden
              strokeWidth={2}
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchQueryPlaceholder")}
              autoComplete="off"
              className={cn(fieldClass, "pl-12 pr-4 sm:pl-14 sm:pr-5")}
            />
          </label>

          <label
            className={cn(
              "relative flex min-w-0 items-center border-b border-white/[0.10]",
              "transition-colors focus-within:bg-white/[0.04]",
              SEARCH_H,
              primary
                ? "lg:border-b-0 lg:border-r lg:border-white/[0.10]"
                : "xl:border-b-0 xl:border-r xl:border-white/[0.10]",
            )}
          >
            <span className="sr-only">{t("searchLocationLabel")}</span>
            <MapPin
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 sm:left-5 sm:h-[1.35rem] sm:w-[1.35rem]"
              aria-hidden
              strokeWidth={2}
            />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("searchLocationPlaceholder")}
              autoComplete="address-level2"
              className={cn(fieldClass, "pl-12 pr-4 sm:pl-14 sm:pr-5")}
            />
          </label>

          <Button
            type="submit"
            variant="primary"
            className={cn(
              SEARCH_H,
              "w-full min-w-0 rounded-none px-6 text-pretty text-[1.0625rem] font-semibold",
              "shadow-none",
              "transition-[filter,background-color] duration-200 ease-out hover:brightness-110",
              "focus-visible:ring-inset focus-visible:ring-offset-0",
              "sm:px-7 sm:text-[1.125rem]",
              "lg:w-auto lg:min-w-[15.5rem] lg:px-8 xl:min-w-[17rem]",
            )}
          >
            {t("searchSubmit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
