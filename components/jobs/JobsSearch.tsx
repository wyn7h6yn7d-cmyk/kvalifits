"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { KF_DIALOG_FULLSCREEN, KF_RADIX_OVERLAY } from "@/lib/site/microMotion";
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
import { JobCard } from "./JobCard";
import {
  JOBS_PAGE_CONTAINER,
  JOBS_PAGE_CONTROL_HEIGHT,
  JOBS_PAGE_EMPTY_STATE,
  JOBS_PAGE_LIST_GAP,
  JOBS_PAGE_MAIN_GRID,
  JOBS_PAGE_SEARCH_BAR,
  JOBS_PAGE_SEARCH_FIELD_FOCUS,
  JOBS_PAGE_SECTION_GAP,
  JOBS_PAGE_SIDEBAR_PADDING,
  JOBS_PAGE_SIDEBAR_SURFACE,
  JOBS_PAGE_TOP,
} from "@/lib/jobs/jobsPageLayout";
import { SITE_H1_UTILITY } from "@/lib/site/publicPageLayout";

const JOB_SEARCH_EMPTY_ACTION_CLASS =
  "h-11 w-full min-w-0 sm:w-auto sm:min-w-[10.75rem]";

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
    const mq = window.matchMedia("(min-width: 1024px)");
    if (mq.matches && !searchParams.get("q")?.trim()) {
      document.getElementById("job-search-query")?.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus search once on desktop entry
  }, []);

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

  const facetTitle = useCallback(
    (facet: JobFilterFacet) => {
      switch (facet) {
        case "title":
          return t("facetTitle");
        case "location":
          return tf("asukoht");
        case "domain":
          return tf("valdkond");
        case "jobType":
          return t("facetWorkload");
        case "workType":
          return t("facetWorkMode");
        case "salary":
          return t("facetSalary");
        case "experience":
          return t("facetExperience");
        case "skill":
          return t("facetSkills");
        case "cert":
          return tf("sertifikaat");
        case "language":
          return tf("keel");
        default:
          return facet;
      }
    },
    [t, tf],
  );

  const chipLabel = useCallback(
    (facet: JobFilterFacet, value: string) =>
      `${facetTitle(facet)}: ${formatLabel(facet, value)}`,
    [facetTitle, formatLabel],
  );

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
              label={chipLabel(s.facet, s.value)}
              selected
              onRemove={() => onToggle(s.facet, s.value)}
              className="shrink-0 max-w-[18rem] truncate rounded-full"
            />
          ))}
        </div>
        <button
          type="button"
          className="inline-flex h-11 shrink-0 items-center px-1 text-[13px] font-medium text-muted-2 hover:text-foreground/78 lg:h-auto"
          onClick={clearAll}
        >
          {t("clearAll")}
        </button>
      </div>
    ) : null;

  return (
    <section className={cn(JOBS_PAGE_TOP, "bg-background pb-8 sm:pb-10 lg:pb-11")}>
      <Container className={JOBS_PAGE_CONTAINER}>
        <header className="border-b border-white/[0.08] pb-4 md:pb-5 lg:pb-6">
          <h1 className={cn(SITE_H1_UTILITY, "text-[1.625rem] sm:text-[1.75rem] lg:text-[2rem]")}>
            {pageTitle}
          </h1>

          <form
            onSubmit={onSearchSubmit}
            className={cn("mt-4", JOBS_PAGE_SEARCH_BAR)}
          >
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_auto]">
              <label
                className={cn(
                  "relative block border-b border-white/[0.08] lg:border-b-0 lg:border-r lg:border-white/[0.08]",
                  JOBS_PAGE_SEARCH_FIELD_FOCUS,
                )}
              >
                <span className="sr-only">{t("searchPlaceholder")}</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
                <Input
                  id="job-search-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  enterKeyHint="search"
                  autoComplete="off"
                  className={cn(
                    JOBS_PAGE_CONTROL_HEIGHT,
                    "rounded-none border-0 bg-transparent pl-11 shadow-none focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none",
                  )}
                />
              </label>
              <label
                className={cn(
                  "relative block border-b border-white/[0.08] lg:border-b-0 lg:border-r lg:border-white/[0.08]",
                  JOBS_PAGE_SEARCH_FIELD_FOCUS,
                )}
              >
                <span className="sr-only">{t("locationPlaceholder")}</span>
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder={t("locationPlaceholder")}
                  enterKeyHint="search"
                  autoComplete="off"
                  className={cn(
                    JOBS_PAGE_CONTROL_HEIGHT,
                    "rounded-none border-0 bg-transparent pl-11 shadow-none focus:bg-transparent focus-visible:rounded-none focus-visible:outline-none",
                  )}
                />
              </label>
              <Button
                type="submit"
                variant="primary"
                className={cn(
                  JOBS_PAGE_CONTROL_HEIGHT,
                  "w-full rounded-none px-6 lg:min-w-[8.5rem]",
                )}
              >
                {t("searchSubmit")}
              </Button>
            </div>
          </form>

          <p
            className="mt-4 text-[15px] font-medium text-foreground lg:hidden"
            aria-live="polite"
          >
            {resultsLabel}
          </p>
        </header>

        <div
          className={cn(
            JOBS_PAGE_SECTION_GAP,
            "sticky top-[var(--site-header-offset)] z-30 space-y-3 border-b border-white/[0.08] bg-background py-3 lg:hidden",
          )}
        >
          <Button
            type="button"
            variant="outline"
            className={cn(JOBS_PAGE_CONTROL_HEIGHT, "w-full min-w-0 justify-start gap-2 px-3")}
            onClick={() => setMobileOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            <span className="truncate text-left">
              {activeFilterCount
                ? t("filtersWithCount", { count: activeFilterCount })
                : t("filters")}
            </span>
          </Button>
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-white/[0.11] bg-[#14141f] px-3 sm:h-12">
              <span className="shrink-0 text-[0.9375rem] font-medium text-muted">{t("sortLabel")}</span>
              <Select
                value={sort}
                onChange={(e) => onSortChange(e.target.value as JobSearchSort)}
                className="min-h-0 min-w-0 flex-1 border-0 bg-transparent px-0 pr-8 shadow-none focus-visible:ring-0"
                aria-label={t("sortLabel")}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </label>
            <JobSearchAlertsButton
              snapshot={searchSnapshot}
              matchSortAvailable={matchSortAvailable}
              canSave={canSaveJobs}
              className={cn(JOBS_PAGE_CONTROL_HEIGHT, "w-full min-w-0 shrink-0 sm:w-auto sm:max-w-full")}
            />
          </div>
        </div>

        <div className={JOBS_PAGE_SECTION_GAP}>
          <div className={JOBS_PAGE_MAIN_GRID}>
            <div className="hidden h-11 items-center text-[0.9375rem] font-medium leading-none text-foreground/85 sm:h-12 lg:flex">
              {t("filters")}
            </div>
            <div className="hidden h-11 min-w-0 items-center justify-between gap-4 sm:h-12 lg:flex">
              <p
                className="min-w-0 truncate pr-2 text-[0.9375rem] font-medium text-foreground sm:text-base"
                aria-live="polite"
              >
                {resultsLabel}
              </p>
              <div className="flex shrink-0 items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <span className="shrink-0 text-[0.9375rem] font-medium text-muted">{t("sortLabel")}</span>
                  <Select
                    value={sort}
                    onChange={(e) => onSortChange(e.target.value as JobSearchSort)}
                    className={cn(JOBS_PAGE_CONTROL_HEIGHT, "w-auto min-w-[10.5rem] max-w-[12rem] shrink-0")}
                    aria-label={t("sortLabel")}
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </label>
                <JobSearchAlertsButton
                  snapshot={searchSnapshot}
                  matchSortAvailable={matchSortAvailable}
                  canSave={canSaveJobs}
                  className={cn(JOBS_PAGE_CONTROL_HEIGHT, "shrink-0")}
                />
              </div>
            </div>

            <aside className="hidden lg:sticky lg:top-[calc(var(--site-header-offset)+0.75rem)] lg:block lg:self-start">
              <div
                className={cn(
                  JOBS_PAGE_SIDEBAR_PADDING,
                  JOBS_PAGE_SIDEBAR_SURFACE,
                  "max-h-[calc(100vh-var(--site-header-offset)-1.5rem)] overflow-y-auto",
                )}
              >
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
            </aside>

            <div className="min-w-0">
              {activeChips}

              <div className={JOBS_PAGE_LIST_GAP}>
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
                <div className="py-3 sm:py-4">
                  <JobSearchEmptyState
                    t={t}
                    catalogEmpty={totalCount === 0 && !Boolean(
                      query.trim() || locationInput.trim() || selections.length || requirePublicSalary,
                    )}
                    hasConstraints={Boolean(
                      query.trim() || locationInput.trim() || selections.length || requirePublicSalary,
                    )}
                    hasFacetFilters={Boolean(selections.length || requirePublicSalary)}
                    onClearFilters={clearAll}
                    onAdjustFilters={() => setMobileOpen(true)}
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
                          className={JOB_SEARCH_EMPTY_ACTION_CLASS}
                        />
                      ) : null
                    }
                  />
                </div>
              ) : null}

              {totalPages > 1 ? (
                <div className="mt-6 flex items-center justify-between gap-3">
                  {currentPage > 1 ? (
                    <Button asChild variant="outline">
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
                  <p className="text-[13px] text-muted-2">
                    {t("pageStatus", { page: currentPage, pages: totalPages, size: pageSize })}
                  </p>
                  {currentPage < totalPages ? (
                    <Button asChild variant="outline">
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
        </div>
      </Container>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className={cn("fixed inset-0 z-[80] bg-black/70 lg:hidden", KF_RADIX_OVERLAY)} />
          <DialogPrimitive.Content
            className={cn(
              KF_DIALOG_FULLSCREEN,
              "fixed inset-0 z-[90] lg:hidden",
              "flex h-dvh flex-col bg-[#14141f]",
            )}
          >
            <DialogPrimitive.Title className="sr-only">{t("filters")}</DialogPrimitive.Title>

            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="text-[15px] font-medium text-foreground">
                {activeFilterCount
                  ? t("filtersWithCount", { count: activeFilterCount })
                  : t("filters")}
              </div>
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="ghost" size="icon" aria-label={t("closeFilters")}>
                  <X aria-hidden />
                </Button>
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

            <div className="space-y-2 border-t border-white/[0.08] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {activeFilterCount ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={clearAll}
                >
                  {t("clearAll")}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="primary"
                className="w-full"
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
  hasFacetFilters,
  onClearFilters,
  onAdjustFilters,
  onChangeSearch,
  alertButton,
}: {
  t: ReturnType<typeof useTranslations>;
  catalogEmpty: boolean;
  hasConstraints: boolean;
  hasFacetFilters: boolean;
  onClearFilters: () => void;
  onAdjustFilters: () => void;
  onChangeSearch: () => void;
  alertButton: ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const showAdjustFilters = hasFacetFilters && isMobile;
  const showChangeSearch = !showAdjustFilters;

  return (
    <div className={JOBS_PAGE_EMPTY_STATE}>
      <div
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-muted"
        aria-hidden
      >
        <Search className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <p className="mx-auto max-w-md text-base font-medium leading-snug text-foreground sm:text-[1.0625rem]">
        {catalogEmpty && !hasConstraints ? t("emptyCatalog") : t("noResults")}
      </p>
      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        {hasConstraints ? (
          <Button
            type="button"
            variant="outline"
            className={JOB_SEARCH_EMPTY_ACTION_CLASS}
            onClick={onClearFilters}
          >
            {t("emptyClearFilters")}
          </Button>
        ) : null}
        {showAdjustFilters ? (
          <Button
            type="button"
            variant="outline"
            className={JOB_SEARCH_EMPTY_ACTION_CLASS}
            onClick={onAdjustFilters}
          >
            {t("emptyAdjustFilters")}
          </Button>
        ) : null}
        {showChangeSearch ? (
          <Button
            type="button"
            variant="outline"
            className={JOB_SEARCH_EMPTY_ACTION_CLASS}
            onClick={onChangeSearch}
          >
            {t("emptyChangeSearch")}
          </Button>
        ) : null}
        {alertButton}
      </div>
    </div>
  );
}
