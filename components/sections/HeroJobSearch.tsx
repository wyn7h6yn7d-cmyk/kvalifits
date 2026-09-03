"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/routing";
import {
  buildJobSearchUrl,
  type JobSearchUrlParams,
} from "@/lib/jobs/jobSearchUrl";
import {
  heroQuickFilterToSearchParams,
  type HeroQuickFilterId,
} from "@/lib/jobs/heroQuickFilters";
import { SITE_HERO_SEARCH_HEIGHT } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

type Props = {
  quickFilters: HeroQuickFilterId[];
};

const fieldClass = cn(SITE_HERO_SEARCH_HEIGHT, "min-w-0 rounded-none border-0 bg-transparent text-base text-white shadow-none placeholder:text-white/38 focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none lg:text-[1.0625rem]");

export function HeroJobSearch({ quickFilters }: Props) {
  const t = useTranslations("hero");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

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
    <div className="mt-8 min-w-0 sm:mt-9 lg:mt-11">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[1.35rem] bg-[radial-gradient(ellipse_at_50%_50%,rgba(99,102,241,0.10),transparent_70%)] blur-md sm:-inset-3"
        />
        <form
          onSubmit={onSubmit}
          className="relative min-w-0 overflow-hidden rounded-2xl border border-white/[0.16] bg-[#121216]/92 shadow-[0_20px_56px_-40px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-sm lg:rounded-[1.125rem]"
        >
          <div className={cn("grid min-w-0 items-stretch gap-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_auto]", SITE_HERO_SEARCH_HEIGHT)}>
            <label className={cn("relative flex min-w-0 items-center border-b border-white/[0.08] transition-colors focus-within:bg-white/[0.03] lg:border-b-0 lg:border-r lg:border-white/[0.08]", SITE_HERO_SEARCH_HEIGHT)}>
              <span className="sr-only">{t("searchQueryPlaceholder")}</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-300/50 lg:left-5"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchQueryPlaceholder")}
                className={cn(fieldClass, "pl-12 pr-4 lg:pl-14 lg:pr-5")}
              />
            </label>

            <label className={cn("relative flex min-w-0 items-center border-b border-white/[0.08] transition-colors focus-within:bg-white/[0.03] lg:border-b-0 lg:border-r lg:border-white/[0.08]", SITE_HERO_SEARCH_HEIGHT)}>
              <span className="sr-only">{t("searchLocationPlaceholder")}</span>
              <MapPin
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-300/50 lg:left-5"
                aria-hidden
              />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("searchLocationPlaceholder")}
                className={cn(fieldClass, "pl-12 pr-4 lg:pl-14 lg:pr-5")}
              />
            </label>

            <Button
              type="submit"
              variant="primary"
              className={cn(SITE_HERO_SEARCH_HEIGHT, "w-full min-w-0 rounded-none px-6 text-pretty text-base font-semibold focus-visible:ring-inset focus-visible:ring-offset-0 lg:min-w-[15rem] lg:px-7 lg:text-[1.0625rem] xl:min-w-[16rem]")}
            >
              {t("searchSubmit")}
            </Button>
          </div>
        </form>
      </div>

      {quickFilters.length ? (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {quickFilters.map((id) => {
            const params = heroQuickFilterToSearchParams(id);
            const labelKey = {
              remote: "quickRemote",
              full_time: "quickFullTime",
              public_salary: "quickPublicSalary",
              first_job: "quickFirstJob",
            }[id] as "quickRemote" | "quickFullTime" | "quickPublicSalary" | "quickFirstJob";

            return (
              <Link
                key={id}
                href={buildJobSearchUrl(params)}
                className={cn(
                  "inline-flex min-h-11 max-w-full items-center rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5",
                  "text-pretty text-[0.9375rem] font-medium leading-snug text-white/68 lg:min-h-12 lg:px-5 lg:text-base",
                  "transition-[color,background-color,border-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-white/[0.13] hover:bg-white/[0.055] hover:text-white/92 active:translate-y-0 motion-reduce:hover:translate-y-0",
                )}
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
