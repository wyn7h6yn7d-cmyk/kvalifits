"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Bone } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  FACET_INITIAL_VISIBLE,
  FACET_SEARCH_MIN_CHARS,
  isSearchableFacet,
  visibleFacetOptions,
  type FacetOption,
  type JobFilterFacet,
  type JobFilterSelection,
  selectionKey,
} from "@/lib/jobs/jobSearchFacets";

export type FilterGroupConfig = {
  facet: JobFilterFacet;
  title: string;
  options: FacetOption[];
  optionTotal: number;
  defaultOpen?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  formatLabel?: (value: string) => string;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function useRemoteFacetSearch(
  facet: JobFilterFacet,
  query: string,
  keywordQuery: string,
  listSearchParams: string,
  enabled: boolean,
) {
  const debounced = useDebouncedValue(query.trim(), 280);
  const [options, setOptions] = useState<FacetOption[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || debounced.length < FACET_SEARCH_MIN_CHARS) {
      setOptions(null);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    const params = new URLSearchParams(listSearchParams);
    params.set("facet", facet);
    params.set("q", debounced);
    if (keywordQuery.trim()) params.set("query", keywordQuery.trim());
    else params.delete("query");
    params.delete("page");

    void fetch(`/api/jobs/facets?${params.toString()}`, { signal: ac.signal })
      .then((res) => (res.ok ? res.json() : { options: [] }))
      .then((data: { options?: FacetOption[] }) => {
        setOptions(Array.isArray(data.options) ? data.options : []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setOptions([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, [enabled, facet, debounced, keywordQuery, listSearchParams]);

  return { options, loading, debouncedQuery: debounced };
}

export function FilterCheckboxOption({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "group/opt flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1.5 py-2.5 transition-colors duration-150 lg:min-h-0 lg:py-1.5",
        "hover:bg-white/[0.04]",
        checked ? "bg-white/[0.03]" : "bg-transparent",
      )}
    >
      <span className="relative inline-flex h-[20px] w-[20px] shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none opacity-0"
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none flex h-[20px] w-[20px] items-center justify-center rounded-[6px] border transition-all duration-150",
            "bg-white/[0.04]",
            checked
              ? "border-transparent bg-gradient-to-br from-violet-500 to-[rgba(227,31,141,0.92)] shadow-[0_0_0_1px_rgba(168,85,247,0.18),0_0_12px_rgba(168,85,247,0.18)]"
              : "border-white/[0.14] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] group-hover/opt:border-violet-400/45 group-hover/opt:shadow-[0_0_10px_rgba(168,85,247,0.12)]",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet-400/70",
          )}
        >
          <Check
            className={cn(
              "h-3 w-3 text-white transition-opacity duration-150",
              checked ? "opacity-100" : "opacity-0",
            )}
            strokeWidth={2.75}
          />
        </span>
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 text-[13px] leading-snug transition-colors duration-150",
          checked ? "text-zinc-100" : "text-zinc-400 group-hover/opt:text-zinc-300",
        )}
      >
        {label}
      </span>
      {typeof count === "number" ? (
        <span className="shrink-0 tabular-nums text-[12px] text-zinc-500">{count}</span>
      ) : null}
    </label>
  );
}

function FilterGroupShell({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-2 py-3 text-left lg:min-h-0"
        aria-expanded={open}
      >
        <span className="text-[13px] font-medium text-white/78">{title}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? <div className="pb-3.5">{children}</div> : null}
    </div>
  );
}

export function FacetFilterGroup({
  facet,
  title,
  options,
  optionTotal,
  selections,
  onToggle,
  defaultOpen = false,
  searchable = false,
  searchPlaceholder,
  formatLabel,
  keywordQuery = "",
  listSearchParams = "",
}: FilterGroupConfig & {
  selections: readonly JobFilterSelection[];
  onToggle: (facet: JobFilterFacet, value: string) => void;
  keywordQuery?: string;
  listSearchParams?: string;
}) {
  const t = useTranslations("jobsSearch");
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const remoteEnabled = searchable && isSearchableFacet(facet);
  const { options: remoteOptions, loading: remoteLoading } = useRemoteFacetSearch(
    facet,
    search,
    keywordQuery,
    listSearchParams,
    remoteEnabled,
  );

  const selectedForFacet = useMemo(
    () => new Set(selections.filter((s) => s.facet === facet).map((s) => s.value)),
    [selections, facet],
  );

  const visible = useMemo(
    () =>
      visibleFacetOptions({
        catalog: options,
        selectedValues: selectedForFacet,
        searchQuery: search,
        remoteOptions,
        expanded,
        searchable,
        formatLabel,
      }),
    [options, selectedForFacet, search, remoteOptions, expanded, searchable, formatLabel],
  );

  const unselectedCount = options.filter((o) => !selectedForFacet.has(o.value) && o.count > 0).length;
  const canShowMore = !search.trim() && !expanded && unselectedCount > FACET_INITIAL_VISIBLE;
  const remainingHint =
    searchable && !search.trim() && expanded && optionTotal > visible.length;

  if (!options.length && !selectedForFacet.size) return null;

  return (
    <FilterGroupShell title={title} defaultOpen={defaultOpen}>
      {searchable ? (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpanded(false);
            }}
            placeholder={searchPlaceholder ?? t("facetSearchPlaceholder")}
            className="h-11 rounded-lg border-white/[0.08] bg-white/[0.03] pl-8 text-base lg:h-9 lg:text-[13px]"
          />
          {search ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/40 hover:text-white/70"
              onClick={() => setSearch("")}
              aria-label={t("clearFacetSearch")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-0.5 pr-0.5">
        {visible.map((o) => (
          <FilterCheckboxOption
            key={`${facet}:${o.value}`}
            label={formatLabel?.(o.value) ?? o.value}
            count={o.count}
            checked={selectedForFacet.has(o.value)}
            onToggle={() => onToggle(facet, o.value)}
          />
        ))}
        {!visible.length && !remoteLoading ? (
          <p className="px-1 py-1 text-[12px] text-white/40">{t("facetNoMatches")}</p>
        ) : null}
        {remoteLoading ? (
          <div className="space-y-1.5 px-1 py-1" aria-busy="true">
            <Bone className="h-7 w-full rounded-md" />
            <Bone className="h-7 w-[86%] rounded-md" />
            <Bone className="h-7 w-[70%] rounded-md" />
          </div>
        ) : null}
      </div>

      {canShowMore ? (
        <button
          type="button"
          className="mt-2 px-1 text-[12px] font-medium text-fuchsia-300/80 transition-colors hover:text-fuchsia-200"
          onClick={() => setExpanded(true)}
        >
          {t("showMore")}
        </button>
      ) : null}

      {remainingHint ? (
        <p className="mt-2 px-1 text-[12px] leading-snug text-white/40">{t("facetSearchToFindMore")}</p>
      ) : null}
    </FilterGroupShell>
  );
}

export function JobFiltersBody({
  groups,
  moreGroups = [],
  selections,
  onToggle,
  onClear,
  showHeader = true,
  keywordQuery = "",
  listSearchParams = "",
}: {
  groups: FilterGroupConfig[];
  moreGroups?: FilterGroupConfig[];
  selections: readonly JobFilterSelection[];
  onToggle: (facet: JobFilterFacet, value: string) => void;
  onClear: () => void;
  showHeader?: boolean;
  keywordQuery?: string;
  listSearchParams?: string;
}) {
  const t = useTranslations("jobsSearch");
  const activeCount = selections.length;

  return (
    <div>
      {showHeader ? (
        <div className="mb-1 flex items-center justify-between gap-2 px-1 pb-2">
          <div className="text-[13px] font-medium text-white/80">{t("filters")}</div>
          {activeCount ? (
            <button
              type="button"
              className="text-[12px] text-white/45 transition-colors hover:text-white/75"
              onClick={onClear}
            >
              {t("clearAll")}
            </button>
          ) : null}
        </div>
      ) : null}

      {groups.map((g) => (
        <FacetFilterGroup
          key={g.facet}
          {...g}
          selections={selections}
          onToggle={onToggle}
          keywordQuery={keywordQuery}
          listSearchParams={listSearchParams}
        />
      ))}

      {moreGroups.length ? (
        <div className="border-t border-white/[0.06] pt-1">
          <div className="px-1 py-2 text-[11px] font-medium uppercase tracking-wide text-white/42">
            {t("moreFilters")}
          </div>
          {moreGroups.map((g) => (
            <FacetFilterGroup
              key={`more-${g.facet}`}
              {...g}
              selections={selections}
              onToggle={onToggle}
              keywordQuery={keywordQuery}
              listSearchParams={listSearchParams}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function selectionKeyOf(s: JobFilterSelection) {
  return selectionKey(s);
}
