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
import { cn } from "@/lib/utils";

type Props = {
  quickFilters: HeroQuickFilterId[];
  publishedJobCount: number;
};

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
    <div className="mt-6 min-w-0 sm:mt-7 lg:mt-8">
      <form
        onSubmit={onSubmit}
        className="min-w-0 overflow-hidden rounded-xl border border-border bg-white"
      >
        <div className="grid min-h-14 min-w-0 items-stretch gap-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
          <label className="relative flex min-h-14 min-w-0 items-center border-b border-border transition-colors focus-within:bg-[#f8fafc] lg:border-b-0 lg:border-r lg:border-border">
            <span className="sr-only">{t("searchQueryPlaceholder")}</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchQueryPlaceholder")}
              className="h-14 min-w-0 rounded-none border-0 bg-transparent pl-11 pr-4 text-base leading-snug shadow-none focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none"
            />
          </label>

          <label className="relative flex min-h-14 min-w-0 items-center border-b border-border transition-colors focus-within:bg-[#f8fafc] lg:border-b-0 lg:border-r lg:border-border">
            <span className="sr-only">{t("searchLocationPlaceholder")}</span>
            <MapPin
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2"
              aria-hidden
            />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("searchLocationPlaceholder")}
              className="h-14 min-w-0 rounded-none border-0 bg-transparent pl-11 pr-4 text-base leading-snug shadow-none focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none"
            />
          </label>

          <Button
            type="submit"
            variant="primary"
            className="h-14 min-h-14 w-full rounded-none px-4 text-pretty text-center text-base shadow-none focus-visible:ring-inset focus-visible:ring-offset-0 sm:px-6 lg:h-full lg:min-w-[11.5rem] xl:min-w-[13rem]"
          >
            {t("searchSubmit")}
          </Button>
        </div>
      </form>

      {quickFilters.length ? (
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
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
                  "inline-flex min-h-11 max-w-full items-center rounded-[10px] border border-border bg-white px-3 py-2 sm:px-3.5",
                  "text-pretty text-[0.9375rem] font-medium leading-snug text-body",
                  "transition-colors hover:border-[rgba(37,99,235,0.24)] hover:bg-[#f5f7fb] hover:text-foreground",
                )}
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </div>
      ) : null}

      <p className="mt-4 flex flex-wrap items-center gap-x-1 text-[0.9375rem] leading-[1.6] text-muted sm:mt-5">
        <span className="text-pretty">{t("employerHint")}</span>
        <Link
          href="/tooandjatele"
          className="inline-flex min-h-11 items-center font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("ctaEmployer")}
        </Link>
      </p>
    </div>
  );
}
