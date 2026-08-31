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
    <div className="mt-8 min-w-0 sm:mt-9 lg:mt-10">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-[1.35rem] bg-[radial-gradient(ellipse_at_50%_50%,rgba(99,102,241,0.22),rgba(168,85,247,0.08)_45%,transparent_72%)] blur-md sm:-inset-4"
        />
        <form
          onSubmit={onSubmit}
          className="relative min-w-0 overflow-hidden rounded-2xl border border-white/[0.22] bg-[#121216]/95 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)] ring-1 ring-white/[0.10] backdrop-blur-sm"
        >
          <div className="grid min-h-[3.75rem] min-w-0 items-stretch gap-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_auto]">
            <label className="relative flex min-h-[3.75rem] min-w-0 items-center border-b border-white/[0.08] transition-colors focus-within:bg-white/[0.03] lg:border-b-0 lg:border-r lg:border-white/[0.08]">
              <span className="sr-only">{t("searchQueryPlaceholder")}</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/50"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchQueryPlaceholder")}
                className="h-[3.75rem] min-w-0 rounded-none border-0 bg-transparent pl-11 pr-4 text-base text-white placeholder:text-white/38 shadow-none focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none"
              />
            </label>

            <label className="relative flex min-h-[3.75rem] min-w-0 items-center border-b border-white/[0.08] transition-colors focus-within:bg-white/[0.03] lg:border-b-0 lg:border-r lg:border-white/[0.08]">
              <span className="sr-only">{t("searchLocationPlaceholder")}</span>
              <MapPin
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300/50"
                aria-hidden
              />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("searchLocationPlaceholder")}
                className="h-[3.75rem] min-w-0 rounded-none border-0 bg-transparent pl-11 pr-4 text-base text-white placeholder:text-white/38 shadow-none focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none"
              />
            </label>

            <Button
              type="submit"
              variant="primary"
              className="h-[3.75rem] min-h-[3.75rem] w-full min-w-0 rounded-none px-5 text-pretty text-base font-semibold focus-visible:ring-inset focus-visible:ring-offset-0 lg:h-full lg:min-w-[13rem] xl:min-w-[14.5rem]"
            >
              {t("searchSubmit")}
            </Button>
          </div>
        </form>
      </div>

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
                  "inline-flex min-h-11 max-w-full items-center rounded-full border border-white/[0.08] bg-white/[0.035] px-3.5 py-2",
                  "text-pretty text-[0.9375rem] font-medium leading-snug text-white/68",
                  "transition-[color,background-color,border-color] duration-300 hover:border-white/[0.13] hover:bg-white/[0.055] hover:text-white/92",
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
