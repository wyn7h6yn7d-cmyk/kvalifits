"use client";

import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type FacetOption,
  type JobFilterFacet,
  type JobFilterSelection,
  selectionKey,
} from "@/lib/jobs/jobSearchFacets";

const INITIAL_VISIBLE = 6;

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
        "group/opt flex cursor-pointer items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors duration-150",
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
        className="flex w-full items-center justify-between gap-2 py-3 text-left"
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
  selections,
  onToggle,
  defaultOpen = false,
  searchable = false,
  searchPlaceholder,
  formatLabel,
}: {
  facet: JobFilterFacet;
  title: string;
  options: FacetOption[];
  selections: readonly JobFilterSelection[];
  onToggle: (facet: JobFilterFacet, value: string) => void;
  defaultOpen?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  formatLabel?: (value: string) => string;
}) {
  const t = useTranslations("jobsSearch");
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const selectedForFacet = useMemo(
    () => new Set(selections.filter((s) => s.facet === facet).map((s) => s.value)),
    [selections, facet],
  );

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const label = (formatLabel?.(o.value) ?? o.value).toLowerCase();
      return label.includes(q) || o.value.toLowerCase().includes(q);
    });
  }, [options, deferredSearch, formatLabel]);

  const visible = useMemo(() => {
    if (searchable && deferredSearch.trim()) {
      return filtered.slice(0, 40);
    }
    if (expanded) return filtered;

    const top = filtered.slice(0, INITIAL_VISIBLE);
    const topValues = new Set(top.map((o) => o.value));
    const extras = filtered.filter(
      (o) => selectedForFacet.has(o.value) && !topValues.has(o.value),
    );
    return [...top, ...extras];
  }, [filtered, expanded, searchable, deferredSearch, selectedForFacet]);

  const canToggleMore = !deferredSearch.trim() && filtered.length > INITIAL_VISIBLE;

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
            className="h-9 rounded-lg border-white/[0.08] bg-white/[0.03] pl-8 text-[13px]"
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

      <div className="max-h-56 space-y-0.5 overflow-y-auto pr-0.5">
        {visible.map((o) => (
          <FilterCheckboxOption
            key={`${facet}:${o.value}`}
            label={formatLabel?.(o.value) ?? o.value}
            count={o.count}
            checked={selectedForFacet.has(o.value)}
            onToggle={() => onToggle(facet, o.value)}
          />
        ))}
        {!visible.length ? (
          <p className="px-1 py-1 text-[12px] text-white/40">{t("facetNoMatches")}</p>
        ) : null}
      </div>

      {canToggleMore ? (
        <button
          type="button"
          className="mt-2 px-1 text-[12px] font-medium text-fuchsia-300/80 transition-colors hover:text-fuchsia-200"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? t("showLess") : t("showMore")}
        </button>
      ) : null}
    </FilterGroupShell>
  );
}

export function JobFiltersBody({
  groups,
  selections,
  onToggle,
  onClear,
}: {
  groups: Array<{
    facet: JobFilterFacet;
    title: string;
    options: FacetOption[];
    defaultOpen?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    formatLabel?: (value: string) => string;
  }>;
  selections: readonly JobFilterSelection[];
  onToggle: (facet: JobFilterFacet, value: string) => void;
  onClear: () => void;
}) {
  const t = useTranslations("jobsSearch");

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 px-1 pb-2">
        <div className="text-[13px] font-medium text-white/80">{t("filters")}</div>
        {selections.length ? (
          <button
            type="button"
            className="text-[12px] text-white/45 transition-colors hover:text-white/75"
            onClick={onClear}
          >
            {t("clearAll")}
          </button>
        ) : null}
      </div>

      {groups.map((g) => (
        <FacetFilterGroup
          key={g.facet}
          facet={g.facet}
          title={g.title}
          options={g.options}
          selections={selections}
          onToggle={onToggle}
          defaultOpen={g.defaultOpen}
          searchable={g.searchable}
          searchPlaceholder={g.searchPlaceholder}
          formatLabel={g.formatLabel}
        />
      ))}
    </div>
  );
}

export function selectionKeyOf(s: JobFilterSelection) {
  return selectionKey(s);
}
