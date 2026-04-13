"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal } from "lucide-react";

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
    { id: "sertifikaat", values: uniq(certs).slice(0, 30) },
    { id: "valdkond", values: uniq(domains).slice(0, 30) },
    { id: "keel", values: uniq(langs).slice(0, 30) },
    { id: "asukoht", values: uniq(locs).slice(0, 30) },
    { id: "tooVorm", values: uniq(workForms).slice(0, 12) },
    { id: "tooLiik", values: uniq(employmentTypes).slice(0, 12) },
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

  const keywords = top(keywordCounts, 10);
  const locations = top(locationCounts, 8);

  return {
    keywords,
    locations,
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

export function JobsSearch({ jobs }: { jobs: Job[] }) {
  const t = useTranslations("jobsSearch");
  const tf = useTranslations("jobsFacets");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const facetGroups = useMemo(() => buildFacetGroups(jobs), [jobs]);
  const quick = useMemo(() => buildQuickFilters(jobs), [jobs]);

  const results = useMemo(() => {
    return jobs
      .filter((j) => matchesJob(j, query, selected))
      .slice();
  }, [jobs, query, selected]);

  const selectedArr = Array.from(selected);
  const foundLabel = t("foundCount", { count: results.length });

  return (
    <section className="py-14 sm:py-16">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* Sidebar filters */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white/85">{t("filters")}</div>
                <div className="flex items-center gap-2 text-xs text-white/45">
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("quality")}
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
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
                    <p className="mt-2 text-xs text-white/40">{t("quickKeywordsEmpty")}</p>
                  ) : null}
                </div>

                <div>
                  <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
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
                    <p className="mt-2 text-xs text-white/40">{t("quickLocationsEmpty")}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-7 space-y-6">
                {facetGroups.map((f) => (
                  <div key={f.id}>
                    <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                      {tf(
                        f.id as
                          | "sertifikaat"
                          | "valdkond"
                          | "keel"
                          | "asukoht"
                          | "tooVorm"
                          | "tooLiik",
                      )}
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
                <div className="mt-7 border-t border-white/[0.08] pt-5">
                  <div className="text-xs font-medium tracking-[0.22em] uppercase text-white/55">
                    {t("active")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedArr.map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        selected
                        onRemove={() => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            next.delete(s);
                            return next;
                          });
                        }}
                        tone={chipTone(s)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-4 text-xs text-white/50 hover:text-white/75"
                    onClick={() => setSelected(new Set())}
                  >
                    {t("clearAll")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Results */}
          <div>
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-white/85">{t("searchTitle")}</div>
                  <div className="mt-1 text-xs text-white/50">{t("searchSubtitle")}</div>
                </div>
                <div className="relative w-full sm:max-w-md">
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

            <div className="mt-6 flex items-center justify-between text-xs text-white/50">
              <div className="text-white/55">
                <span className="text-white/70">{foundLabel}</span>
              </div>
              <div className={cn("hidden sm:block", results.length ? "" : "opacity-0")} />
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {results.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {results.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-white/[0.10] bg-white/[0.03] p-10 text-center text-white/65">
                {t("noResults")}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
