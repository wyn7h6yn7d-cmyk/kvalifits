"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";

import type { Job } from "@/components/jobs/types";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildFacetOptions,
  jobMatchesSelections,
  toggleSelection,
  type JobFilterFacet,
  type JobFilterSelection,
} from "@/lib/jobs/jobSearchFacets";
import { JobFiltersBody, selectionKeyOf } from "@/components/jobs/JobFilterPanel";
import { JobCard } from "./JobCard";

const SEARCHABLE: JobFilterFacet[] = ["title", "location", "domain", "skill", "cert"];

export function JobsSearch({ jobs }: { jobs: Job[] }) {
  const t = useTranslations("jobsSearch");
  const tf = useTranslations("jobsFacets");
  const tExp = useTranslations("onboarding.experienceLevelOption");

  const [query, setQuery] = useState("");
  const [selections, setSelections] = useState<JobFilterSelection[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => jobs.filter((j) => jobMatchesSelections(j, selections, deferredQuery)),
    [jobs, selections, deferredQuery],
  );

  const formatLabel = useMemo(() => {
    return (facet: JobFilterFacet, value: string) => {
      if (facet === "experience") {
        const known = [
          "not_required",
          "entry",
          "mid",
          "senior",
          "lead",
          "executive",
        ] as const;
        if ((known as readonly string[]).includes(value)) {
          return tExp(value as (typeof known)[number]);
        }
        return value;
      }
      if (facet === "salary") {
        return t(`salaryBucket.${value}` as Parameters<typeof t>[0]);
      }
      return value;
    };
  }, [t, tExp]);

  const facetOptions = useMemo(() => {
    const facets: JobFilterFacet[] = [
      "title",
      "location",
      "domain",
      "jobType",
      "workType",
      "salary",
      "experience",
      "skill",
      "cert",
      "language",
    ];
    const map = {} as Record<JobFilterFacet, ReturnType<typeof buildFacetOptions>>;
    for (const facet of facets) {
      map[facet] = buildFacetOptions(jobs, selections, facet, deferredQuery);
    }
    return map;
  }, [jobs, selections, deferredQuery]);

  const groups = useMemo(() => {
    const defs: Array<{
      facet: JobFilterFacet;
      title: string;
      defaultOpen?: boolean;
      searchable?: boolean;
      searchPlaceholder?: string;
    }> = [
      {
        facet: "title",
        title: t("facetTitle"),
        searchable: true,
        searchPlaceholder: t("searchTitleFacet"),
      },
      {
        facet: "location",
        title: tf("asukoht"),
        defaultOpen: true,
        searchable: true,
        searchPlaceholder: t("searchLocationFacet"),
      },
      {
        facet: "domain",
        title: tf("valdkond"),
        searchable: true,
        searchPlaceholder: t("searchDomainFacet"),
      },
      {
        facet: "jobType",
        title: t("facetWorkload"),
        defaultOpen: true,
      },
      {
        facet: "workType",
        title: t("facetWorkMode"),
        defaultOpen: true,
      },
      {
        facet: "salary",
        title: t("facetSalary"),
      },
      {
        facet: "experience",
        title: t("facetExperience"),
      },
      {
        facet: "skill",
        title: t("facetSkills"),
        searchable: true,
        searchPlaceholder: t("searchSkillFacet"),
      },
      {
        facet: "cert",
        title: tf("sertifikaat"),
        searchable: true,
        searchPlaceholder: t("searchCertFacet"),
      },
      {
        facet: "language",
        title: tf("keel"),
      },
    ];

    return defs
      .map((d) => ({
        ...d,
        options: facetOptions[d.facet],
        searchable: SEARCHABLE.includes(d.facet) ? d.searchable !== false : false,
        formatLabel: (value: string) => formatLabel(d.facet, value),
      }))
      .filter((g) => g.options.length > 0);
  }, [facetOptions, formatLabel, t, tf]);

  const onToggle = (facet: JobFilterFacet, value: string) => {
    setSelections((prev) => toggleSelection(prev, facet, value));
  };

  const clearAll = () => setSelections([]);

  const foundLabel = t("foundCount", { count: results.length });

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const activeChips = (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-wrap gap-2">
        {selections.map((s) => (
          <Chip
            key={selectionKeyOf(s)}
            label={formatLabel(s.facet, s.value)}
            selected
            onRemove={() => onToggle(s.facet, s.value)}
            className="rounded-lg px-2.5 py-1 text-[12px]"
          />
        ))}
      </div>
      <button
        type="button"
        className="shrink-0 pt-0.5 text-[13px] text-white/50 hover:text-white/75"
        onClick={clearAll}
      >
        {t("clearAll")}
      </button>
    </div>
  );

  return (
    <section className="py-14 sm:py-16">
      <Container className="max-w-[1320px]">
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md sm:p-6 lg:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[15px] font-medium text-white/88">{t("searchTitle")}</div>
              <div className="mt-1.5 text-sm leading-snug text-white/55">{t("searchSubtitle")}</div>
              <p className="mt-2.5 text-sm text-white/58" aria-live="polite">
                <span className="text-white/75">{foundLabel}</span>
              </p>
            </div>
            <div className="relative w-full sm:max-w-md sm:min-w-[min(100%,20rem)] lg:max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-11"
              />
            </div>
          </div>
        </div>

        {/* Mobile filter trigger */}
        <div className="mb-5 lg:hidden">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-between rounded-xl px-4"
            onClick={() => setMobileOpen(true)}
          >
            <span className="inline-flex items-center gap-2 text-[14px]">
              <SlidersHorizontal className="h-4 w-4 opacity-70" aria-hidden />
              {selections.length
                ? t("filtersWithCount", { count: selections.length })
                : t("filters")}
            </span>
            <span className="text-[13px] text-white/50">{foundLabel}</span>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[288px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-2xl border border-white/[0.07] bg-[#141416]/[0.92] p-4 backdrop-blur-md">
              <JobFiltersBody
                groups={groups}
                selections={selections}
                onToggle={onToggle}
                onClear={clearAll}
              />
            </div>
          </aside>

          <div className="min-w-0">
            {selections.length ? <div className="hidden lg:block">{activeChips}</div> : null}
            {selections.length ? <div className="lg:hidden">{activeChips}</div> : null}

            <div className="grid gap-4 lg:grid-cols-1 lg:gap-3.5">
              {results.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {results.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 text-center text-base leading-relaxed text-white/68 backdrop-blur-md lg:mt-4">
                {t("noResults")}
              </div>
            ) : null}
          </div>
        </div>
      </Container>

      {/* Mobile full-screen filter sheet */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label={t("closeFilters")}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl border border-white/[0.10] bg-[#121214] shadow-2xl",
            )}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <div className="text-[15px] font-medium text-white/90">
                {selections.length
                  ? t("filtersWithCount", { count: selections.length })
                  : t("filters")}
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                onClick={() => setMobileOpen(false)}
                aria-label={t("closeFilters")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              <JobFiltersBody
                groups={groups}
                selections={selections}
                onToggle={onToggle}
                onClear={clearAll}
              />
            </div>
            <div className="border-t border-white/[0.08] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="primary"
                className="h-12 w-full rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                {t("viewJobs", { count: results.length })}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
