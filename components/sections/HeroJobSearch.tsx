"use client";

import type { FormEvent, ReactNode } from "react";
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
  /** Optional live workspace rendered as one continuous product surface under the fields. */
  workspace?: ReactNode;
};

const SEARCH_H = "min-h-[3.75rem] sm:min-h-[4.25rem] lg:min-h-[4.75rem]";

const fieldClass = cn(
  SEARCH_H,
  "min-w-0 rounded-none border-0 bg-transparent shadow-none",
  "text-[1.0625rem] text-white placeholder:text-white/45",
  "focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none",
  "sm:text-[1.125rem]",
);

/**
 * Hero search — the primary instrument.
 * When `workspace` is passed, form + match UI share one product shell.
 */
export function HeroJobSearch({ quickFilters: _quickFilters, workspace }: Props) {
  const t = useTranslations("hero");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

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
    <div
      className={cn(
        "relative min-w-0 w-full overflow-hidden",
        "rounded-2xl border border-white/[0.16]",
        "bg-[#101018]",
        "shadow-[0_28px_60px_-36px_rgba(0,0,0,0.95),0_0_0_1px_rgba(99,102,241,0.07)]",
      )}
    >
      <form onSubmit={onSubmit} className="relative min-w-0 w-full">
        <div className="grid min-w-0 w-full items-stretch gap-0 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_auto]">
          <label
            className={cn(
              "relative flex min-w-0 items-center border-b border-white/[0.10]",
              "transition-colors duration-200 focus-within:bg-white/[0.035]",
              SEARCH_H,
              "lg:border-b-0 lg:border-r lg:border-white/[0.10]",
            )}
          >
            <span className="sr-only">{t("searchQueryLabel")}</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 sm:left-5 sm:h-[1.3rem] sm:w-[1.3rem]"
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
              "transition-colors duration-200 focus-within:bg-white/[0.035]",
              SEARCH_H,
              "lg:border-b-0 lg:border-r lg:border-white/[0.10]",
            )}
          >
            <span className="sr-only">{t("searchLocationLabel")}</span>
            <MapPin
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 sm:left-5 sm:h-[1.3rem] sm:w-[1.3rem]"
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
              "lg:w-auto lg:min-w-[14.5rem] lg:px-8 xl:min-w-[16rem]",
            )}
          >
            {t("searchSubmit")}
          </Button>
        </div>
      </form>

      {workspace ? (
        <div className="border-t border-white/[0.09] bg-[#0b0b12]/95">{workspace}</div>
      ) : null}
    </div>
  );
}
