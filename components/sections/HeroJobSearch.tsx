"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
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
    <div className="mt-7 sm:mt-8">
      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-2xl border border-white/[0.22] bg-[#121216] shadow-[0_20px_60px_-32px_rgba(0,0,0,0.75),inset_0_1px_0_0_rgba(255,255,255,0.08)] ring-1 ring-white/[0.08] lg:bg-[#121216]"
      >
        <div className="grid min-h-14 items-stretch gap-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
          <label className="relative flex min-h-14 items-center border-b border-white/[0.08] lg:border-b-0 lg:border-r">
            <span className="sr-only">{t("searchQueryPlaceholder")}</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchQueryPlaceholder")}
              className="h-14 rounded-none border-0 bg-transparent pl-11 pr-4 text-[15px] shadow-none focus-visible:ring-0"
            />
          </label>

          <label className="relative flex min-h-14 items-center border-b border-white/[0.08] lg:border-b-0 lg:border-r">
            <span className="sr-only">{t("searchLocationPlaceholder")}</span>
            <MapPin
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              aria-hidden
            />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("searchLocationPlaceholder")}
              className="h-14 rounded-none border-0 bg-transparent pl-11 pr-4 text-[15px] shadow-none focus-visible:ring-0"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-14 w-full items-center justify-center bg-gradient-to-r from-violet-500/90 via-fuchsia-500/80 to-[rgba(227,31,141,0.70)] px-6 text-[15px] font-medium text-white transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-inset lg:h-full lg:min-w-[148px]"
          >
            {t("searchSubmit")}
          </button>
        </div>
      </form>

      {quickFilters.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
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
                  "inline-flex min-h-11 items-center rounded-full border border-white/[0.10] bg-white/[0.04] px-3.5 py-2",
                  "text-[13px] font-medium text-white/72 transition-colors hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white",
                )}
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </div>
      ) : null}

      <p className="mt-4 text-[13px] text-white/45">
        {t("employerHint")}{" "}
        <Link href="/tooandjatele" className="font-medium text-white/68 underline-offset-4 hover:text-white hover:underline">
          {t("ctaEmployer")}
        </Link>
      </p>
    </div>
  );
}
