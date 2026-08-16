"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import type { Job } from "@/components/jobs/types";
import { chipMatchesJob } from "@/components/jobs/job-filters-config";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { JobCard } from "./JobCard";

const CERT_HIGHLIGHT = new Set([
  "A-pädevus",
  "B-pädevus",
  "Kutsetunnistus",
  "Kutse tase 4",
  "Tõstukiluba",
  "Tööohutus",
]);

function chipTone(label: string): "pink" | "violet" | "default" {
  if (CERT_HIGHLIGHT.has(label)) return "pink";
  return "default";
}

function buildFacetGroups(jobs: Job[]) {
  const uniq = (arr: string[]) => Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
  const certs: string[] = [];
  const domains: string[] = [];
  const langs: string[] = [];
  const locs: string[] = [];
  const workForms: string[] = [];
  const employmentTypes: string[] = [];

  for (const j of jobs) {
    certs.push(...(j.requiredCerts ?? []));
    domains.push(...(j.domains ?? []));
    langs.push(...(j.languages ?? []));
    if (j.workType) workForms.push(j.workType);
    if (j.jobType) employmentTypes.push(j.jobType);

    const raw = (j.location ?? "").toString();
    const parts = raw
      .split(/[/,|]/)
      .map((p) => p.trim())
      .filter(Boolean);
    locs.push(...parts);
    if (raw.trim()) locs.push(raw.trim());
  }

  return [
    { id: "sertifikaat" as const, values: uniq(certs).slice(0, 30) },
    { id: "valdkond" as const, values: uniq(domains).slice(0, 30) },
    { id: "keel" as const, values: uniq(langs).slice(0, 30) },
    { id: "asukoht" as const, values: uniq(locs).slice(0, 30) },
    { id: "tooVorm" as const, values: uniq(workForms).slice(0, 12) },
    { id: "tooLiik" as const, values: uniq(employmentTypes).slice(0, 12) },
  ].filter((g) => g.values.length);
}

function buildQuickFilters(jobs: Job[]) {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").replace(/[\u2011\u2010\u2212]/g, "-");

  const keywordCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();

  for (const j of jobs) {
    for (const raw of j.tags ?? []) {
      const v = norm(raw);
      if (!v) continue;
      keywordCounts.set(v, (keywordCounts.get(v) ?? 0) + 1);
    }

    const rawLoc = (j.location ?? "").toString();
    const parts = rawLoc
      .split(/[/,|]/)
      .map((p) => norm(p))
      .filter(Boolean);
    for (const v of parts.length ? parts : rawLoc.trim() ? [norm(rawLoc)] : []) {
      if (!v) continue;
      locationCounts.set(v, (locationCounts.get(v) ?? 0) + 1);
    }
  }

  const top = (m: Map<string, number>, n: number) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k)
      .slice(0, n);

  return {
    keywords: top(keywordCounts, 10),
    locations: top(locationCounts, 8),
  };
}

function matchesJob(job: Job, q: string, selected: Set<string>) {
  const hay = [
    job.title,
    job.company,
    job.location,
    job.tags.join(" "),
    job.requiredCerts.join(" "),
    (job.domains ?? []).join(" "),
    (job.languages ?? []).join(" "),
    (job.summary ?? ""),
  ]
    .join(" ")
    .toLowerCase();
  const queryOk = q.trim().length === 0 || hay.includes(q.trim().toLowerCase());

  if (!queryOk) return false;
  if (selected.size === 0) return true;

  for (const s of selected) {
    if (!chipMatchesJob(job, s)) return false;
  }
  return true;
}

function toggleChip(setSelected: Dispatch<SetStateAction<Set<string>>>, c: string) {
  setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    return next;
  });
}

function FilterGroup({
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

function CheckboxOption({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-1.5 hover:bg-white/[0.03]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/25 bg-transparent text-fuchsia-500 accent-fuchsia-500 focus:ring-0 focus:ring-offset-0"
      />
      <span className="text-[13px] leading-snug text-white/68">{label}</span>
    </label>
  );
}

export function JobsSearch({ jobs }: { jobs: Job[] }) {
  const t = useTranslations("jobsSearch");
  const tf = useTranslations("jobsFacets");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const deferredQuery = useDeferredValue(query);

  const facetGroups = useMemo(() => buildFacetGroups(jobs), [jobs]);
  const quick = useMemo(() => buildQuickFilters(jobs), [jobs]);

  const results = useMemo(() => {
    return jobs.filter((j) => matchesJob(j, deferredQuery, selected)).slice();
  }, [jobs, deferredQuery, selected]);

  const selectedArr = Array.from(selected);
  const foundLabel = t("foundCount", { count: results.length });

  const facetById = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const g of facetGroups) m.set(g.id, g.values);
    return m;
  }, [facetGroups]);

  const keywordOptions = quick.keywords;
  const locationOptions = useMemo(() => {
    const fromFacet = facetById.get("asukoht") ?? [];
    const merged = Array.from(new Set([...quick.locations, ...fromFacet]));
    return merged.slice(0, 16);
  }, [facetById, quick.locations]);

  const removeSelected = (s: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(s);
      return next;
    });
  };

  return (
    <section className="py-14 sm:py-16">
      <Container className="max-w-[1320px]">
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md sm:p-6 lg:mb-8">
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

        {/* ——— Mobile filters (unchanged chip layout) ——— */}
        <div className="mb-8 lg:hidden">
          <div className="rounded-2xl border border-white/[0.11] bg-gradient-to-b from-violet-950/[0.38] via-black/[0.46] to-black/[0.30] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-violet-400/20 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.10] pb-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/44">
                {t("filters")}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/36">
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                {t("quality")}
              </div>
            </div>

            <div className="mt-5 space-y-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">
                  {t("quick")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quick.keywords.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={selected.has(c)}
                      onClick={() => toggleChip(setSelected, c)}
                      tone={chipTone(c)}
                    />
                  ))}
                </div>
                {!quick.keywords.length && jobs.length > 0 ? (
                  <p className="mt-2 text-sm text-white/48">{t("quickKeywordsEmpty")}</p>
                ) : null}
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">
                  {t("quickLocations")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quick.locations.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={selected.has(c)}
                      onClick={() => toggleChip(setSelected, c)}
                      tone={chipTone(c)}
                    />
                  ))}
                </div>
                {!quick.locations.length && jobs.length > 0 ? (
                  <p className="mt-2 text-sm text-white/48">{t("quickLocationsEmpty")}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 space-y-7 border-t border-white/[0.10] pt-8">
              {facetGroups.map((f) => (
                <div key={f.id} className="rounded-xl border border-white/[0.06] bg-black/[0.22] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">
                    {tf(f.id)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {f.values.map((v) => (
                      <Chip
                        key={v}
                        label={v}
                        selected={selected.has(v)}
                        onClick={() => toggleChip(setSelected, v)}
                        tone={chipTone(v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selected.size ? (
              <div className="mt-8 border-t border-white/[0.10] pt-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/36">
                  {t("active")}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedArr.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      selected
                      onRemove={() => removeSelected(s)}
                      tone={chipTone(s)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 text-sm text-white/55 hover:text-white/80"
                  onClick={() => setSelected(new Set())}
                >
                  {t("clearAll")}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[288px_minmax(0,1fr)] lg:items-start lg:gap-8">
          {/* ——— Desktop sidebar ——— */}
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="rounded-2xl border border-white/[0.07] bg-[#141416]/[0.92] p-4 backdrop-blur-md">
              <div className="mb-1 flex items-center justify-between gap-2 px-1 pb-2">
                <div className="text-[13px] font-medium text-white/80">{t("filters")}</div>
                <SlidersHorizontal className="h-3.5 w-3.5 text-fuchsia-400/70" aria-hidden />
              </div>

              <FilterGroup title={t("quick")} defaultOpen>
                {keywordOptions.length ? (
                  <div className="max-h-44 space-y-0.5 overflow-y-auto pr-1">
                    {keywordOptions.map((c) => (
                      <CheckboxOption
                        key={c}
                        label={c}
                        checked={selected.has(c)}
                        onToggle={() => toggleChip(setSelected, c)}
                      />
                    ))}
                  </div>
                ) : jobs.length > 0 ? (
                  <p className="px-1 text-[12px] leading-relaxed text-white/45">
                    {t("quickKeywordsEmpty")}
                  </p>
                ) : null}
              </FilterGroup>

              <FilterGroup title={tf("asukoht")} defaultOpen>
                {locationOptions.length ? (
                  <div className="max-h-44 space-y-0.5 overflow-y-auto pr-1">
                    {locationOptions.map((c) => (
                      <CheckboxOption
                        key={c}
                        label={c}
                        checked={selected.has(c)}
                        onToggle={() => toggleChip(setSelected, c)}
                      />
                    ))}
                  </div>
                ) : jobs.length > 0 ? (
                  <p className="px-1 text-[12px] leading-relaxed text-white/45">
                    {t("quickLocationsEmpty")}
                  </p>
                ) : null}
              </FilterGroup>

              {(facetById.get("valdkond") ?? []).length ? (
                <FilterGroup title={tf("valdkond")}>
                  <div className="max-h-40 space-y-0.5 overflow-y-auto pr-1">
                    {(facetById.get("valdkond") ?? []).map((v) => (
                      <CheckboxOption
                        key={v}
                        label={v}
                        checked={selected.has(v)}
                        onToggle={() => toggleChip(setSelected, v)}
                      />
                    ))}
                  </div>
                </FilterGroup>
              ) : null}

              {(facetById.get("tooLiik") ?? []).length ? (
                <FilterGroup title={tf("tooLiik")} defaultOpen>
                  <div className="space-y-0.5">
                    {(facetById.get("tooLiik") ?? []).map((v) => (
                      <CheckboxOption
                        key={v}
                        label={v}
                        checked={selected.has(v)}
                        onToggle={() => toggleChip(setSelected, v)}
                      />
                    ))}
                  </div>
                </FilterGroup>
              ) : null}

              {(facetById.get("tooVorm") ?? []).length ? (
                <FilterGroup title={tf("tooVorm")} defaultOpen>
                  <div className="space-y-0.5">
                    {(facetById.get("tooVorm") ?? []).map((v) => (
                      <CheckboxOption
                        key={v}
                        label={v}
                        checked={selected.has(v)}
                        onToggle={() => toggleChip(setSelected, v)}
                      />
                    ))}
                  </div>
                </FilterGroup>
              ) : null}

              {(facetById.get("sertifikaat") ?? []).length ? (
                <FilterGroup title={tf("sertifikaat")}>
                  <div className="max-h-40 space-y-0.5 overflow-y-auto pr-1">
                    {(facetById.get("sertifikaat") ?? []).map((v) => (
                      <CheckboxOption
                        key={v}
                        label={v}
                        checked={selected.has(v)}
                        onToggle={() => toggleChip(setSelected, v)}
                      />
                    ))}
                  </div>
                </FilterGroup>
              ) : null}

              {(facetById.get("keel") ?? []).length ? (
                <FilterGroup title={tf("keel")}>
                  <div className="max-h-36 space-y-0.5 overflow-y-auto pr-1">
                    {(facetById.get("keel") ?? []).map((v) => (
                      <CheckboxOption
                        key={v}
                        label={v}
                        checked={selected.has(v)}
                        onToggle={() => toggleChip(setSelected, v)}
                      />
                    ))}
                  </div>
                </FilterGroup>
              ) : null}

              {selected.size ? (
                <div className="mt-3 px-1 pt-2">
                  <button
                    type="button"
                    className="text-[13px] text-white/50 transition-colors hover:text-white/75"
                    onClick={() => setSelected(new Set())}
                  >
                    {t("clearAll")}
                  </button>
                </div>
              ) : null}
            </div>
          </aside>

          {/* ——— Results ——— */}
          <div className="min-w-0">
            {selected.size ? (
              <div className="mb-5 hidden items-start justify-between gap-4 lg:flex">
                <div className="flex min-w-0 flex-wrap gap-2">
                  {selectedArr.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      selected
                      onRemove={() => removeSelected(s)}
                      tone={chipTone(s)}
                      className="rounded-lg px-2.5 py-1 text-[12px]"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="shrink-0 pt-0.5 text-[13px] text-white/50 hover:text-white/75"
                  onClick={() => setSelected(new Set())}
                >
                  {t("clearAll")}
                </button>
              </div>
            ) : null}

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
    </section>
  );
}
