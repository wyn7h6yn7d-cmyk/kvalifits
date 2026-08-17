"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import type { Job } from "@/components/jobs/types";
import { JobSearchAlertsButton } from "@/components/jobs/JobSearchAlertsButton";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isSearchableFacet,
  limitFacetCatalog,
  toggleSelection,
  type FacetOption,
  type JobFilterFacet,
  type JobFilterSelection,
} from "@/lib/jobs/jobSearchFacets";
import { buildJobSearchUrl, parseJobSearchParams } from "@/lib/jobs/jobSearchUrl";
import {
  buildSearchUrlState,
  selectionsFromSearchParams,
  sortFromParams,
} from "@/lib/jobs/jobSearchState";
import { type JobSearchSort } from "@/lib/jobs/jobSearchSort";
import { taxonomyFacetLabel } from "@/lib/taxonomy/facetLabel";
import { useTaxonomyCatalog } from "@/lib/taxonomy/useTaxonomyCatalog";
import { useRouter, Link } from "@/i18n/routing";
import { JobFiltersBody, selectionKeyOf } from "@/components/jobs/JobFilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { JobCard } from "./JobCard";

const PRIMARY_FACETS: JobFilterFacet[] = [
  "location",
  "domain",
  "title",
  "jobType",
  "workType",
  "salary",
  "experience",
  "skill",
];

const MORE_FACETS: JobFilterFacet[] = ["cert", "language"];

type Props = {
  jobs: Job[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  facetOptions: Record<JobFilterFacet, FacetOption[]>;
  pageTitle: string;
  matchSortAvailable: boolean;
  savedJobIds?: string[];
  canSaveJobs?: boolean;
};

export function JobsSearch({
  jobs,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  facetOptions,
  pageTitle,
  matchSortAvailable,
  savedJobIds = [],
  canSaveJobs = true,
}: Props) {
  const t = useTranslations("jobsSearch");
  const tf = useTranslations("jobsFacets");
  const tExp = useTranslations("onboarding.experienceLevelOption");
  const tJobs = useTranslations("jobs");
  const locale = useLocale();
  const { catalog } = useTaxonomyCatalog();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramsKey = searchParams.toString();

  const [query, setQuery] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selections, setSelections] = useState<JobFilterSelection[]>([]);
  const [requirePublicSalary, setRequirePublicSalary] = useState(false);
  const [sort, setSort] = useState<JobSearchSort>("newest");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const parsed = parseJobSearchParams(searchParams);
    setQuery(parsed.query ?? "");
    setLocationInput(parsed.location ?? "");
    setSelections(selectionsFromSearchParams(parsed, tJobs));
    setRequirePublicSalary(Boolean(parsed.hasSalary));
    setSort(sortFromParams(parsed, matchSortAvailable));
  }, [paramsKey, tJobs, matchSortAvailable, searchParams]);

  const replaceUrl = (next: {
    query?: string;
    locationInput?: string;
    selections?: JobFilterSelection[];
    requirePublicSalary?: boolean;
    sort?: JobSearchSort;
    page?: number;
  }) => {
    const url = buildJobSearchUrl(
      buildSearchUrlState({
        query: next.query ?? query,
        locationInput: next.locationInput ?? locationInput,
        selections: next.selections ?? selections,
        requirePublicSalary: next.requirePublicSalary ?? requirePublicSalary,
        sort: next.sort ?? sort,
        page: next.page,
      }),
    );
    router.replace(url, { scroll: false });
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      const parsed = parseJobSearchParams(searchParams);
      if ((parsed.query ?? "") === query) return;
      replaceUrl({ query });
    }, 180);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce query into the URL for server search
  }, [query, paramsKey]);

  const formatLabel = useMemo(() => {
    return (facet: JobFilterFacet, value: string) => {
      if (facet === "experience") {
        const known = ["not_required", "entry", "mid", "senior", "lead", "executive"] as const;
        if ((known as readonly string[]).includes(value)) {
          return tExp(value as (typeof known)[number]);
        }
        return value;
      }
      if (facet === "salary") {
        return t(`salaryBucket.${value}` as Parameters<typeof t>[0]);
      }
      if (facet === "language") {
        const labeled = taxonomyFacetLabel(catalog, facet, value, locale, (id) => {
          try {
            return tJobs(`matchLangName.${id}` as Parameters<typeof tJobs>[0]);
          } catch {
            return id;
          }
        });
        return labeled;
      }
      return taxonomyFacetLabel(catalog, facet, value, locale);
    };
  }, [t, tExp, catalog, tJobs, locale]);

  const results = jobs;
  const savedSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);

  const buildGroups = useCallback(
    (facets: JobFilterFacet[]) => {
    const meta: Record<
      JobFilterFacet,
      {
        title: string;
        defaultOpen?: boolean;
        searchable?: boolean;
        searchPlaceholder?: string;
      }
    > = {
      title: { title: t("facetTitle"), searchable: true, searchPlaceholder: t("searchTitleFacet") },
      location: {
        title: tf("asukoht"),
        defaultOpen: true,
        searchable: true,
        searchPlaceholder: t("searchLocationFacet"),
      },
      domain: {
        title: tf("valdkond"),
        searchable: true,
        searchPlaceholder: t("searchDomainFacet"),
      },
      jobType: { title: t("facetWorkload"), defaultOpen: true },
      workType: { title: t("facetWorkMode"), defaultOpen: true },
      salary: { title: t("facetSalary") },
      experience: { title: t("facetExperience") },
      skill: {
        title: t("facetSkills"),
        searchable: true,
        searchPlaceholder: t("searchSkillFacet"),
      },
      cert: {
        title: tf("sertifikaat"),
        searchable: true,
        searchPlaceholder: t("searchCertFacet"),
      },
      language: { title: tf("keel") },
    };

    return facets
      .map((facet) => {
        const all = facetOptions[facet];
        const selectedValues = selections.filter((s) => s.facet === facet).map((s) => s.value);
        const searchable = isSearchableFacet(facet) && (meta[facet].searchable ?? true);
        return {
          facet,
          ...meta[facet],
          options: searchable ? limitFacetCatalog(all, selectedValues) : all,
          optionTotal: all.length,
          searchable,
          formatLabel: (value: string) => formatLabel(facet, value),
        };
      })
      .filter((g) => g.options.length > 0 || g.optionTotal > 0);
    },
    [facetOptions, formatLabel, selections, t, tf],
  );

  const primaryGroups = useMemo(() => buildGroups(PRIMARY_FACETS), [buildGroups]);
  const moreGroups = useMemo(() => buildGroups(MORE_FACETS), [buildGroups]);

  const activeFilterCount = selections.length + (requirePublicSalary ? 1 : 0);

  const onToggle = (facet: JobFilterFacet, value: string) => {
    const next = toggleSelection(selections, facet, value);
    replaceUrl({ selections: next });
  };

  const clearAll = () => {
    replaceUrl({
      query: "",
      locationInput: "",
      selections: [],
      requirePublicSalary: false,
    });
  };

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const loc = locationInput.trim();
    let nextSelections = selections.filter((s) => s.facet !== "location");
    if (loc) nextSelections = [...nextSelections, { facet: "location", value: loc }];
    replaceUrl({ query, locationInput: loc, selections: nextSelections });
  };

  const onSortChange = (value: JobSearchSort) => {
    const next = value === "match" && !matchSortAvailable ? "newest" : value;
    setSort(next);
    replaceUrl({ sort: next });
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const resultsLabel = t("resultsCount", { count: totalCount });
  const searchSnapshot = useMemo(
    () => ({
      query,
      requirePublicSalary,
      filters: selections,
    }),
    [query, requirePublicSalary, selections],
  );
  const sortOptions: { value: JobSearchSort; label: string; disabled?: boolean }[] = [
    { value: "match", label: t("sortMatch"), disabled: !matchSortAvailable },
    { value: "newest", label: t("sortNewest") },
    { value: "salary", label: t("sortSalary") },
    { value: "deadline", label: t("sortDeadline") },
  ];

  const activeChips =
    activeFilterCount > 0 ? (
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {requirePublicSalary ? (
            <Chip
              label={t("publicSalaryChip")}
              selected
              onRemove={() => replaceUrl({ requirePublicSalary: false })}
              className="shrink-0 max-w-[16rem] truncate rounded-full"
            />
          ) : null}
          {selections.map((s) => (
            <Chip
              key={selectionKeyOf(s)}
              label={formatLabel(s.facet, s.value)}
              selected
              onRemove={() => onToggle(s.facet, s.value)}
              className="shrink-0 max-w-[16rem] truncate rounded-full"
            />
          ))}
        </div>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center px-1 text-[13px] font-medium text-white/50 hover:text-white/78 lg:h-auto"
          onClick={clearAll}
        >
          {t("clearAll")}
        </button>
      </div>
    ) : null;

  return (
    <section className="pb-16 sm:pb-20">
      <Container className="max-w-[1240px]">
        <div className="border-b border-white/[0.08] pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
                {pageTitle}
              </h1>
              <p className="mt-1.5 text-sm text-white/55" aria-live="polite">
                {resultsLabel}
              </p>
            </div>
          </div>

          <form
            onSubmit={onSearchSubmit}
            className="mt-5 overflow-hidden rounded-2xl border border-white/[0.10] bg-[#141418]"
          >
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_auto]">
              <label className="relative block border-b border-white/[0.08] lg:border-b-0 lg:border-r">
                <span className="sr-only">{t("searchPlaceholder")}</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
                <Input
                  id="job-search-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  enterKeyHint="search"
                  autoComplete="off"
                  className="h-12 rounded-none border-0 bg-transparent pl-11 shadow-none focus-visible:ring-0 lg:h-[52px]"
                />
              </label>
              <label className="relative block border-b border-white/[0.08] lg:border-b-0 lg:border-r">
                <span className="sr-only">{t("locationPlaceholder")}</span>
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder={t("locationPlaceholder")}
                  enterKeyHint="search"
                  autoComplete="off"
                  className="h-12 rounded-none border-0 bg-transparent pl-11 shadow-none focus-visible:ring-0 lg:h-[52px]"
                />
              </label>
              <Button
                type="submit"
                variant="primary"
                className="h-12 w-full rounded-none px-6 text-[14px] font-medium lg:h-[52px] lg:min-w-[132px]"
              >
                {t("searchSubmit")}
              </Button>
            </div>
          </form>
        </div>

        <div className="sticky top-[var(--site-header-offset)] z-30 -mx-4 mb-3 space-y-2 border-b border-white/[0.08] bg-[#0f0f16] px-4 py-2.5 sm:-mx-6 sm:px-6 md:-mx-10 md:px-10 lg:hidden">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-w-0 flex-1 justify-between rounded-xl px-4"
              onClick={() => setMobileOpen(true)}
            >
              <span className="inline-flex min-w-0 items-center gap-2 text-[14px]">
                <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">
                  {activeFilterCount
                    ? t("filtersWithCount", { count: activeFilterCount })
                    : t("filters")}
                </span>
              </span>
            </Button>
            <JobSearchAlertsButton
              snapshot={searchSnapshot}
              matchSortAvailable={matchSortAvailable}
              canSave={canSaveJobs}
              className="h-11 shrink-0"
            />
          </div>
          <label className="flex items-center gap-2">
            <span className="shrink-0 text-[12px] text-white/45">{t("sortLabel")}</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as JobSearchSort)}
              className="h-11 min-w-0 flex-1 rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 text-base text-white/85 outline-none focus:border-white/[0.18] lg:text-[13px]"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-6 lg:mt-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-7">
          <aside className="hidden lg:sticky lg:top-[calc(var(--site-header-offset)+0.75rem)] lg:block lg:self-start">
            <div className="max-h-[calc(100vh-var(--site-header-offset)-1.5rem)] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#141416] p-4">
              <JobFiltersBody
                groups={primaryGroups}
                moreGroups={moreGroups}
                selections={selections}
                onToggle={onToggle}
                onClear={clearAll}
                keywordQuery={query}
                listSearchParams={paramsKey}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 hidden border-b border-white/[0.06] pb-4 lg:flex lg:items-center lg:justify-between">
              <p className="text-[15px] font-medium text-white/88" aria-live="polite">
                {resultsLabel}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <label className="inline-flex items-center gap-2">
                  <span className="text-[12px] text-white/45">{t("sortLabel")}</span>
                  <select
                    value={sort}
                    onChange={(e) => onSortChange(e.target.value as JobSearchSort)}
                    className="h-10 min-w-[10.5rem] rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 text-[13px] text-white/85 outline-none focus:border-white/[0.18]"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <JobSearchAlertsButton
                  snapshot={searchSnapshot}
                  matchSortAvailable={matchSortAvailable}
                  canSave={canSaveJobs}
                />
              </div>
            </div>

            {activeChips}

            <div className="grid gap-4 lg:gap-3.5">
              {results.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  saved={savedSet.has(job.id)}
                  canSave={canSaveJobs}
                />
              ))}
            </div>

            {results.length === 0 ? (
              <JobSearchEmptyState
                t={t}
                catalogEmpty={totalCount === 0 && !Boolean(
                  query.trim() || locationInput.trim() || selections.length || requirePublicSalary,
                )}
                hasConstraints={Boolean(
                  query.trim() || locationInput.trim() || selections.length || requirePublicSalary,
                )}
                onClearFilters={clearAll}
                onChangeSearch={() => {
                  const el = document.getElementById("job-search-query");
                  el?.focus();
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                alertButton={
                  canSaveJobs ? (
                    <JobSearchAlertsButton
                      snapshot={searchSnapshot}
                      matchSortAvailable={matchSortAvailable}
                      canSave
                      alwaysShow
                      label={t("emptyCreateAlert")}
                      variant="primary"
                    />
                  ) : null
                }
              />
            ) : null}

            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-between gap-3">
                {currentPage > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={buildJobSearchUrl(
                        buildSearchUrlState({
                          query,
                          locationInput,
                          selections,
                          requirePublicSalary,
                          sort,
                          page: currentPage - 1,
                        }),
                      )}
                    >
                      {t("pagePrev")}
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                <p className="text-[13px] text-white/50">
                  {t("pageStatus", { page: currentPage, pages: totalPages, size: pageSize })}
                </p>
                {currentPage < totalPages ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={buildJobSearchUrl(
                        buildSearchUrlState({
                          query,
                          locationInput,
                          selections,
                          requirePublicSalary,
                          sort,
                          page: currentPage + 1,
                        }),
                      )}
                    >
                      {t("pageNext")}
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Container>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/70 lg:hidden" />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-0 z-[90] lg:hidden",
              "flex h-dvh flex-col bg-[#121214]",
            )}
          >
            <DialogPrimitive.Title className="sr-only">{t("filters")}</DialogPrimitive.Title>

            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="text-[15px] font-medium text-white/90">
                {activeFilterCount
                  ? t("filtersWithCount", { count: activeFilterCount })
                  : t("filters")}
              </div>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white/50 hover:bg-white/[0.05] hover:text-white/80"
                  aria-label={t("closeFilters")}
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogPrimitive.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              <JobFiltersBody
                groups={primaryGroups}
                moreGroups={moreGroups}
                selections={selections}
                onToggle={onToggle}
                onClear={clearAll}
                showHeader={false}
                keywordQuery={query}
                listSearchParams={paramsKey}
              />
            </div>

            <div className="border-t border-white/[0.08] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="primary"
                className="h-12 w-full rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                {t("showJobs", { count: totalCount })}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </section>
  );
}

function JobSearchEmptyState({
  t,
  catalogEmpty,
  hasConstraints,
  onClearFilters,
  onChangeSearch,
  alertButton,
}: {
  t: ReturnType<typeof useTranslations>;
  catalogEmpty: boolean;
  hasConstraints: boolean;
  onClearFilters: () => void;
  onChangeSearch: () => void;
  alertButton: ReactNode;
}) {
  return (
    <EmptyState
      className="mt-4"
      icon={Search}
      title={catalogEmpty && !hasConstraints ? t("emptyCatalog") : t("noResults")}
      actions={
        <>
          {hasConstraints ? (
            <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
              {t("emptyClearFilters")}
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onChangeSearch}>
            {t("emptyChangeSearch")}
          </Button>
          {alertButton}
        </>
      }
    />
  );
}
